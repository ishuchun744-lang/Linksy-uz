import { corsHeaders } from 'npm:@supabase/supabase-js@^2/cors'
import { createClient, type User } from 'npm:@supabase/supabase-js@^2'

type Action = 'login' | 'register' | 'link_oauth'

interface AuthRequest {
  action: Action
  username?: string
  password?: string
}

interface PublicKeys {
  default?: string
}

const response = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: corsHeaders })

const normalizeUsername = (value: unknown) =>
  typeof value === 'string' ? value.trim().replace(/^@/, '').toLowerCase() : ''

const isValidUsername = (value: string) =>
  /^[a-z0-9._-]{3,30}$/.test(value) && value !== 'all' && value !== 'system'

const authEmail = (username: string) => `${username}@id.linksy.invalid`

const hashRateKey = async (value: string) => {
  if (!serviceRoleKey) throw new Error('Supabase server-side key is not configured.')
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(serviceRoleKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(value))
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const consumeRateLimit = async (rateKey: string, limit: number, windowSeconds: number) => {
  if (!adminClient) throw new Error('Supabase admin client is not configured.')
  const { data, error } = await adminClient.rpc('linksy_consume_auth_rate_limit', {
    p_rate_key: rateKey,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })
  if (error) throw error
  return data === true
}

const getDefaultKey = (name: string): string | undefined => {
  const value = Deno.env.get(name)
  if (!value) return undefined

  try {
    return (JSON.parse(value) as PublicKeys).default
  } catch (error) {
    console.error(`Invalid ${name} configuration`, error)
    return undefined
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const publicKey =
  Deno.env.get('SUPABASE_ANON_KEY') ??
  getDefaultKey('SUPABASE_PUBLISHABLE_KEYS')
const serviceRoleKey =
  Deno.env.get('LINKSY_SUPABASE_SERVICE_ROLE_KEY') ??
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  getDefaultKey('SUPABASE_SECRET_KEYS')

const configError =
  !supabaseUrl || !publicKey || !serviceRoleKey
    ? 'Supabase URL, public key, and server-side service key must be configured.'
    : null

const publicClient = supabaseUrl && publicKey
  ? createClient(supabaseUrl, publicKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
  : null

const adminClient = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
  : null

const linkUsername = async (user: User, requestedUsername?: string) => {
  if (!adminClient) throw new Error('Supabase admin client is not configured.')

  const { data: existing, error: existingError } = await adminClient
    .from('linksy_usernames')
    .select('username')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing) return existing.username as string

  const emailUsername = user.email?.split('@')[0] ?? ''
  const baseUsername = normalizeUsername(
    requestedUsername ?? user.user_metadata?.username ?? emailUsername
  )
  const baseIsValid = isValidUsername(baseUsername)
  const candidate = baseIsValid
    ? baseUsername
    : `user-${user.id.replace(/-/g, '').slice(0, 12)}`

  const { data: nameOwner, error: ownerError } = await adminClient
    .from('linksy_usernames')
    .select('user_id')
    .eq('username', candidate)
    .maybeSingle()
  if (ownerError) throw ownerError

  const { data: legacyOwner, error: legacyError } = await adminClient
    .from('messages')
    .select('id')
    .eq('sender_id', candidate)
    .eq('receiver_id', 'system')
    .like('content', `USER_REG|${candidate}|%`)
    .limit(1)
  if (legacyError) throw legacyError

  const resolvedUsername =
    (nameOwner && nameOwner.user_id !== user.id) || legacyOwner?.length
      ? `${candidate.slice(0, 20)}-${user.id.replace(/-/g, '').slice(0, 8)}`
      : candidate

  const { error: insertError } = await adminClient
    .from('linksy_usernames')
    .insert({ user_id: user.id, username: resolvedUsername })
  if (insertError) throw insertError

  const { error: metadataError } = await adminClient.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      username: resolvedUsername,
    },
  })
  if (metadataError) throw metadataError

  return resolvedUsername
}

const createAuthenticatedUser = async (username: string, password: string) => {
  if (!adminClient || !publicClient) throw new Error('Supabase clients are not configured.')

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: authEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username },
  })
  if (createError) throw createError

  const { error: mapError } = await adminClient
    .from('linksy_usernames')
    .insert({ user_id: created.user.id, username })
  if (mapError) {
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(created.user.id)
    if (rollbackError) console.error('Failed to remove orphaned auth user', rollbackError)
    throw mapError
  }

  const { data: signedIn, error: signInError } = await publicClient.auth.signInWithPassword({
    email: authEmail(username),
    password,
  })
  if (signInError || !signedIn.session) {
    if (signInError) console.error('New account sign-in failed', signInError)
    throw new Error('The account was created but a session could not be issued.')
  }

  return signedIn.session
}

const migrateLegacyAccount = async (username: string, password: string, rateKey: string) => {
  if (!adminClient) throw new Error('Supabase admin client is not configured.')

  if (!(await consumeRateLimit(rateKey, 5, 15 * 60))) {
    return response({ error: 'too_many_attempts' }, 429)
  }

  const { data: registrations, error: legacyError } = await adminClient
    .from('messages')
    .select('content')
    .eq('sender_id', username)
    .eq('receiver_id', 'system')
    .like('content', `USER_REG|${username}|%`)
    .order('created_at', { ascending: false })
    .limit(1)
  if (legacyError) throw legacyError

  const expectedContent = `USER_REG|${username}|${password}`
  if (!registrations?.some((registration) => registration.content === expectedContent)) {
    return response({ error: 'invalid_credentials' }, 401)
  }

  const session = await createAuthenticatedUser(username, password)

  const { error: removeLegacyError } = await adminClient
    .from('messages')
    .delete()
    .eq('sender_id', username)
    .eq('receiver_id', 'system')
    .like('content', `USER_REG|${username}|%`)
  if (removeLegacyError) {
    console.error('Legacy password record cleanup failed', removeLegacyError)
    return response({ error: 'migration_cleanup_failed' }, 500)
  }

  const { error: clearAttemptsError } = await adminClient
    .from('linksy_auth_rate_limits')
    .delete()
    .eq('rate_key', rateKey)
  if (clearAttemptsError) console.error('Legacy migration rate-limit cleanup failed', clearAttemptsError)

  return response({ username, session })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405)
  if (configError || !adminClient || !publicClient) {
    console.error(configError)
    return response({ error: 'server_not_configured' }, 500)
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 4096) return response({ error: 'request_too_large' }, 413)

  let body: AuthRequest
  try {
    body = await request.json() as AuthRequest
  } catch {
    return response({ error: 'invalid_request' }, 400)
  }

  if (body.action === 'link_oauth') {
    const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!bearerToken) return response({ error: 'authentication_required' }, 401)

    const { data: authData, error: authError } = await adminClient.auth.getUser(bearerToken)
    if (authError || !authData.user) return response({ error: 'authentication_required' }, 401)

    try {
      const username = await linkUsername(authData.user)
      return response({ username })
    } catch (error) {
      console.error('OAuth username linking failed', error)
      return response({ error: 'username_link_failed' }, 500)
    }
  }

  if (body.action !== 'login' && body.action !== 'register') {
    return response({ error: 'invalid_action' }, 400)
  }

  const username = normalizeUsername(body.username)
  const password = body.password
  if (!isValidUsername(username) || typeof password !== 'string' || password.length > 1024) {
    return response({ error: 'invalid_credentials' }, 400)
  }
  if (body.action === 'register' && (password.length < 8 || password.length > 128)) {
    return response({ error: 'password_too_short' }, 400)
  }

  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  let ipHash: string
  try {
    ipHash = await hashRateKey(forwardedIp)
  } catch (error) {
    console.error('Unable to prepare auth rate limit', error)
    return response({ error: 'server_not_configured' }, 500)
  }

  if (body.action === 'register') {
    try {
      if (!(await consumeRateLimit(`signup:${ipHash}`, 5, 60 * 60))) {
        return response({ error: 'too_many_attempts' }, 429)
      }
    } catch (error) {
      console.error('Signup rate-limit check failed', error)
      return response({ error: 'registration_failed' }, 500)
    }

    const { data: existingUser, error: lookupError } = await adminClient
      .from('linksy_usernames')
      .select('user_id')
      .eq('username', username)
      .maybeSingle()
    if (lookupError) {
      console.error('Username lookup failed', lookupError)
      return response({ error: 'registration_failed' }, 500)
    }
    if (existingUser) return response({ error: 'username_taken' }, 409)

    const { data: legacyAccount, error: legacyLookupError } = await adminClient
      .from('messages')
      .select('id')
      .eq('sender_id', username)
      .eq('receiver_id', 'system')
      .like('content', `USER_REG|${username}|%`)
      .limit(1)
    if (legacyLookupError) {
      console.error('Legacy username lookup failed', legacyLookupError)
      return response({ error: 'registration_failed' }, 500)
    }
    if (legacyAccount?.length) return response({ error: 'legacy_account_use_login' }, 409)

    try {
      const session = await createAuthenticatedUser(username, password)
      return response({ username, session })
    } catch (error) {
      console.error('Username registration failed', error)
      return response({ error: 'registration_failed' }, 409)
    }
  }

  const { data: account, error: accountError } = await adminClient
    .from('linksy_usernames')
    .select('user_id')
    .eq('username', username)
    .maybeSingle()
  if (accountError) {
    console.error('Username lookup failed', accountError)
    return response({ error: 'login_failed' }, 500)
  }

  if (!account) {
    try {
      return await migrateLegacyAccount(username, password, `legacy:${username}:${ipHash}`)
    } catch (error) {
      console.error('Legacy account migration failed', error)
      return response({ error: 'login_failed' }, 500)
    }
  }

  const { data: signedIn, error: signInError } = await publicClient.auth.signInWithPassword({
    email: authEmail(username),
    password,
  })
  if (signInError || !signedIn.session) {
    return response({ error: 'invalid_credentials' }, 401)
  }

  return response({ username, session: signedIn.session })
})
