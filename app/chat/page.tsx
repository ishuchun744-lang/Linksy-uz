'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import Image from 'next/image'
import {
  Send,
  Crown,
  Menu,
  X,
  MessageCircle,
  Gift,
  User,
  Users,
  UserPlus,
  CalendarHeart,
  LogOut,
  Trash2,
  Mail,
  Image as ImageIcon,
  PhoneCall,
  Video,
  VideoOff,
  PhoneOff,
  Mic,
  MicOff,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Check,
  Search,
  Pin,
  Smile,
  Camera,
  VolumeX,
} from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const productionAppUrl = 'https://linksy-uz.vercel.app'
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY sozlanishi kerak.')
}
const supabaseClientCache = globalThis as typeof globalThis & {
  linksySupabaseClient?: SupabaseClient
}
const supabase = supabaseClientCache.linksySupabaseClient ?? createClient(supabaseUrl, supabaseAnonKey)
if (process.env.NODE_ENV !== 'production') {
  supabaseClientCache.linksySupabaseClient = supabase
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

interface ContactItem {
  id: string
  owner_id?: string
  username: string
  name: string
  avatar: string
  status: string
  isMuted?: boolean
  isPinned?: boolean
}

interface ContactRow {
  id: string
  owner_id: string
  contact_username: string
  contact_name: string
  avatar: string | null
  status: string | null
}

interface UsernameAuthResponse {
  username: string
  session: {
    access_token: string
    refresh_token: string
  }
}

interface UsernameLinkResponse {
  username: string
}

type AppTab = 'chat' | 'contacts' | 'gifts' | 'couple' | 'profile' | 'letters' | 'gallery'
type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

const getDefaultAvatar = (username: string) =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4,c0aede,f472b6`

const quotePostgrestValue = (value: string) =>
  `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

const getFunctionErrorCode = async (error: unknown): Promise<string | null> => {
  if (typeof error !== 'object' || error === null || !('context' in error)) return null
  const context = error.context
  if (!(context instanceof Response)) return null

  try {
    const body: unknown = await context.clone().json()
    if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
      return body.error
    }
  } catch (parseError) {
    console.error('Auth server error response could not be parsed:', parseError)
  }
  return null
}

const ALL_GIFTS = [
  { id: 'castle', emoji: '🏰', name: 'Sehrli Qasr' },
  { id: 'dragon', emoji: '🐉', name: 'Olovli Ajdar' },
  { id: 'ship', emoji: '⛵', name: 'Muhabbat Kemasi' },
  { id: 'diamond', emoji: '💎', name: '3D Olmos' },
  { id: 'ferrari', emoji: '🏎️', name: 'Sport Avtomobil' },
  { id: 'rocket', emoji: '🚀', name: 'Kosmik Raketa' },
  { id: 'crown', emoji: '👑', name: 'Qirol Toji' },
  { id: 'rose', emoji: '🌹', name: 'Atirgul' },
]

const EMOJI_LIST = ['❤️', '💖', '💘', '💝', '💞', '💕', '💌', '😍', '🥰', '😘', '😻', '💋', '💍', '👑', '🌹', '✨', '🔥', '⭐', '🧸', '🍫', '🥂', '🍾', '🤗', '🥺', '😭', '😎', '🎉', '🚀', '🐱', '🦄']

const LOVE_STICKERS = [
  { id: 'st1', label: '😍 Cheksiz Muhabbat', content: '💖✨ [STIKER: SENI SEVAMAN] ✨💖' },
  { id: 'st2', label: '🧸 Sog‘indim', content: '🥺🧸 [STIKER: JUDA SOG‘INDIM] 🧸🥺' },
  { id: 'st3', label: '💍 Nikoh Va’dasi', content: '💍👑 [STIKER: ABADIY BIRGA] 👑💍' },
  { id: 'st4', label: '🔥 Yonmoqdaman', content: '🔥❤️ [STIKER: QALBIM YONMOQDA] ❤️🔥' },
]

export default function ChatPage() {
  const [isAppLoaded, setIsAppLoaded] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register')
  const [inputUsername, setInputUsername] = useState('')
  const [inputPassword, setInputPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [activeTab, setActiveTab] = useState<AppTab>('chat')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatSearchQuery, setChatSearchQuery] = useState('')

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<string>('')
  const [profileName, setProfileName] = useState('Shahzoda')
  const [profileBio, setProfileBio] = useState('Sevgi va sadoqat ila yashaymiz ✨💖')
  const [profileAvatar, setProfileAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60')
  const [bubbleTheme, setBubbleTheme] = useState<'purple' | 'pink' | 'gold'>('purple')

  const [userProfiles, setUserProfiles] = useState<Record<string, { avatar?: string; bio?: string }>>({})
  const [registeredUsers, setRegisteredUsers] = useState<string[]>([])

  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null)
  const [newContactUsername, setNewContactUsername] = useState('')
  const [newContactName, setNewContactName] = useState('')
  const [contactFeedback, setContactFeedback] = useState('')
  const [isSavingContact, setIsSavingContact] = useState(false)

  const [viewingUserProfile, setViewingUserProfile] = useState<ContactItem | null>(null)
  const [copiedId, setCopiedId] = useState(false)
  const [quickSaveName, setQuickSaveName] = useState('')
  const [quickSaveSuccess, setQuickSaveSuccess] = useState('')

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [zoomedAvatarUrl, setZoomedAvatarUrl] = useState('')

  const [messagePermission, setMessagePermission] = useState<'all' | 'contacts' | 'nobody'>('all')
  const [callPermission, setCallPermission] = useState<'all' | 'contacts' | 'nobody'>('all')

  const [messages, setMessages] = useState<Message[]>([])
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting')
  const [messageSyncError, setMessageSyncError] = useState('')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [mutedChats, setMutedChats] = useState<Record<string, boolean>>({})
  const [pinnedChats, setPinnedChats] = useState<Record<string, boolean>>({})

  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)

  const [activeCall, setActiveCall] = useState<'audio' | 'video' | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const [activeAnimationGift, setActiveAnimationGift] = useState<{ emoji: string; name: string; is3D?: boolean } | null>(null)
  const [relationshipStarted, setRelationshipStarted] = useState<boolean>(true)
  const [secondsTogether, setSecondsTogether] = useState<number>(0)

  const [letterText, setLetterText] = useState('')
  const [openedLetterId, setOpenedLetterId] = useState<string | null>(null)
  const [memories, setMemories] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUserRef = useRef('')
  const selectedContactRef = useRef<ContactItem | null>(null)
  const relationshipStartedAtRef = useRef<number | null>(null)
  const secondsTogetherRef = useRef(secondsTogether)
  const activeTabRef = useRef(activeTab)
  const isChatOpenRef = useRef(isChatOpen)

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  useEffect(() => {
    selectedContactRef.current = selectedContact
  }, [selectedContact])

  useEffect(() => {
    activeTabRef.current = activeTab
    isChatOpenRef.current = isChatOpen
  }, [activeTab, isChatOpen])

  const getUserAvatar = (username: string, fallbackAvatar?: string) => {
    const clean = username.toLowerCase()
    if (clean === currentUser) return profileAvatar
    if (userProfiles[clean]?.avatar) return userProfiles[clean].avatar!
    if (fallbackAvatar) return fallbackAvatar
    return getDefaultAvatar(clean)
  }

  const getUserBio = (username: string) => {
    const clean = username.toLowerCase()
    if (clean === currentUser) return profileBio
    return userProfiles[clean]?.bio || 'Sevgi va sadoqat ila yashaymiz ✨💖'
  }

  const fetchContacts = async (userId: string) => {
    if (!userId) return
    const cleanOwner = userId.toLowerCase()
    let localList: ContactItem[] = []
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`linksy_contacts_${cleanOwner}`)
      if (saved) {
        try {
          const parsed: unknown = JSON.parse(saved)
          if (Array.isArray(parsed)) localList = parsed as ContactItem[]
        } catch (error) {
          console.error('Mahalliy kontaktlarni o‘qib bo‘lmadi:', error)
        }
      }
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('owner_id', cleanOwner)
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) {
      const mapped: ContactItem[] = data.map((row: ContactRow) => ({
        id: row.id,
        owner_id: row.owner_id,
        username: row.contact_username,
        name: row.contact_name,
        avatar: row.avatar || getDefaultAvatar(row.contact_username),
        status: row.status || 'Online ✨',
      }))
      setContacts(mapped)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`linksy_contacts_${cleanOwner}`, JSON.stringify(mapped))
      }
    } else {
      if (error) console.error('Kontaktlarni yuklashda xatolik:', error.message)
      setContacts(localList)
    }
  }

  const fetchMessages = useCallback(async (loggedUser: string) => {
    const activeUser = loggedUser.toLowerCase()
    if (!activeUser) return

    const userFilter = quotePostgrestValue(activeUser)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userFilter},receiver_id.eq.${userFilter},sender_id.eq.all,receiver_id.eq.all`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Xabarlarni yuklashda xatolik:', error.message)
      setMessageSyncError('Xabarlarni yuklab bo‘lmadi. Internet yoki Supabase sozlamalarini tekshiring.')
      return
    }

    if (data && currentUserRef.current === activeUser) {
      setMessageSyncError('')
      const profilesMap: Record<string, { avatar?: string; bio?: string }> = {}
      const regSet = new Set<string>()

      data.forEach((m: Message) => {
        const sId = (m.sender_id || '').toLowerCase()
        if (sId && sId !== 'system') regSet.add(sId)

        if (m.content.startsWith('PROFILE_AVATAR|')) {
          profilesMap[sId] = { ...profilesMap[sId], avatar: m.content.replace('PROFILE_AVATAR|', '') }
        } else if (m.content.startsWith('PROFILE_BIO|')) {
          profilesMap[sId] = { ...profilesMap[sId], bio: m.content.replace('PROFILE_BIO|', '') }
        } else if (m.content.startsWith('USER_REG|')) {
          const parts = m.content.split('|')
          if (parts[1]) regSet.add(parts[1].toLowerCase())
        }
      })

      setUserProfiles((previous) => {
        const previousKeys = Object.keys(previous)
        const nextKeys = Object.keys(profilesMap)
        if (
          previousKeys.length === nextKeys.length &&
          nextKeys.every(
            (key) =>
              previous[key]?.avatar === profilesMap[key]?.avatar &&
              previous[key]?.bio === profilesMap[key]?.bio
          )
        ) {
          return previous
        }
        return profilesMap
      })
      const nextRegisteredUsers = Array.from(regSet)
      setRegisteredUsers((previous) =>
        previous.length === nextRegisteredUsers.length &&
        previous.every((username) => regSet.has(username))
          ? previous
          : nextRegisteredUsers
      )

      if (profilesMap[activeUser]?.avatar) setProfileAvatar(profilesMap[activeUser].avatar)
      if (profilesMap[activeUser]?.bio) setProfileBio(profilesMap[activeUser].bio)

      const filteredMessages = data.filter(
        (m) =>
          !m.content.startsWith('PROFILE_AVATAR|') &&
          !m.content.startsWith('PROFILE_BIO|') &&
          !m.content.startsWith('USER_REG|')
      )
      setMessages((previous) => {
        const merged = new Map(previous.map((message) => [message.id, message]))
        filteredMessages.forEach((message) => merged.set(message.id, message))
        if (merged.size === previous.length) return previous
        return Array.from(merged.values()).sort(
          (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
        )
      })

      if (filteredMessages.length > 0) setRelationshipStarted(true)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoaded(true), 50)

    let isMounted = true
    void supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!isMounted) return
      if (error) console.error('Sessiyani tekshirishda xatolik:', error.message)

      if (session?.user) {
        let username = session.user.user_metadata?.username
        if (typeof username !== 'string' || !username) {
          const { data, error: linkError } = await supabase.functions.invoke<UsernameLinkResponse>(
            'username-auth',
            { body: { action: 'link_oauth' } }
          )
          if (linkError) throw linkError
          if (!data?.username) throw new Error('Google hisobiga foydalanuvchi ID biriktirilmadi.')
          username = data.username
        }

        const cleanUsername = username.toLowerCase()
        currentUserRef.current = cleanUsername
        setCurrentUser(cleanUsername)
        setProfileName(session.user.user_metadata?.full_name || cleanUsername)
        if (session.user.user_metadata?.avatar_url) {
          setProfileAvatar(session.user.user_metadata.avatar_url)
        }
        setIsAuthenticated(true)
        void fetchMessages(cleanUsername)
        void fetchContacts(cleanUsername)

        if (window.location.hash || window.location.search) {
          window.history.replaceState(null, '', window.location.pathname)
        }
        return
      }

      localStorage.removeItem('linksy_current_user')
    }).catch((error: unknown) => {
      if (!isMounted) return
      console.error('Sessiyani tekshirishda kutilmagan xatolik:', error)
      setAuthError('Hisobni yuklashda xatolik. Aloqa yoki Supabase sozlamalarini tekshiring.')
    })

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const incoming = payload.new as Message
          const senderClean = (incoming.sender_id || '').toLowerCase()
          const receiverClean = (incoming.receiver_id || '').toLowerCase()

          if (incoming.content.startsWith('PROFILE_AVATAR|')) {
            const avatarUrl = incoming.content.replace('PROFILE_AVATAR|', '')
            setUserProfiles((prev) => ({
              ...prev,
              [senderClean]: { ...prev[senderClean], avatar: avatarUrl },
            }))
            return
          }

          if (incoming.content.startsWith('PROFILE_BIO|')) {
            const bioText = incoming.content.replace('PROFILE_BIO|', '')
            setUserProfiles((prev) => ({
              ...prev,
              [senderClean]: { ...prev[senderClean], bio: bioText },
            }))
            return
          }

          if (incoming.content.startsWith('USER_REG|')) {
            const parts = incoming.content.split('|')
            if (parts[1]) {
              setRegisteredUsers((prev) => Array.from(new Set([...prev, parts[1].toLowerCase()])))
            }
            return
          }

          const activeUser = currentUserRef.current
          if (!activeUser || (senderClean !== activeUser && receiverClean !== activeUser && receiverClean !== 'all')) {
            return
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev
            return [...prev, incoming]
          })

          if (senderClean && senderClean !== activeUser) {
            const conversationId = receiverClean === 'all' ? 'all' : senderClean
            const openConversation = selectedContactRef.current?.username.toLowerCase()
            const isConversationOpen =
              activeTabRef.current === 'chat' && isChatOpenRef.current && openConversation === conversationId

            if (!isConversationOpen) {
              setUnreadCounts((prev) => ({
                ...prev,
                [conversationId]: (prev[conversationId] || 0) + 1,
              }))
            }
          }

          setRelationshipStarted(true)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
          const activeUser = currentUserRef.current
          if (activeUser) void fetchMessages(activeUser)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('error')
        } else if (status === 'CLOSED') {
          setRealtimeStatus('disconnected')
        }
      })

    return () => {
      isMounted = false
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [fetchMessages])

  useEffect(() => {
    if (!relationshipStarted || !isAuthenticated) {
      relationshipStartedAtRef.current = null
      secondsTogetherRef.current = 0
      return
    }

    if (relationshipStartedAtRef.current === null) {
      relationshipStartedAtRef.current = Date.now() - secondsTogetherRef.current * 1000
    }
    if (activeTab !== 'couple') return

    const updateElapsedTime = () => {
      const startedAt = relationshipStartedAtRef.current
      if (startedAt !== null) {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000)
        secondsTogetherRef.current = elapsed
        setSecondsTogether(elapsed)
      }
    }
    const interval = window.setInterval(updateElapsedTime, 1000)
    return () => window.clearInterval(interval)
  }, [relationshipStarted, isAuthenticated, activeTab])

  useEffect(() => {
    if (activeTab === 'chat' && isChatOpen && isAuthenticated) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab, isChatOpen, isAuthenticated, selectedContact])

  useEffect(() => {
    if (!currentUser) return

    const syncMessages = () => {
      if (document.visibilityState === 'visible') void fetchMessages(currentUser)
    }

    const interval = window.setInterval(syncMessages, 15000)
    return () => window.clearInterval(interval)
  }, [currentUser, fetchMessages])

  const openUserProfileModal = (username: string) => {
    const cleanId = username.replace(/^@/, '').toLowerCase()
    if (!cleanId) return

    const existingContact = contacts.find((c) => c.username.toLowerCase() === cleanId)
    const item: ContactItem = existingContact || {
      id: cleanId,
      username: cleanId,
      name: cleanId === currentUser ? profileName : cleanId,
      avatar: getUserAvatar(cleanId),
      status: 'Online ✨',
    }
    setViewingUserProfile(item)
    setQuickSaveName(existingContact ? existingContact.name : cleanId)
    setCopiedId(false)
    setQuickSaveSuccess('')
  }

  const handleCopyUserId = (username: string) => {
    const clean = username.replace(/^@/, '')
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`@${clean}`)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2500)
    }
  }

  const saveContactUniversal = async (targetUsername: string, displayName: string) => {
    const cleanId = targetUsername.replace(/^@/, '').toLowerCase()
    const finalName = displayName.trim() || cleanId
    const avatarUrl = getUserAvatar(cleanId)

    const newItem: ContactItem = {
      id: Date.now().toString(),
      owner_id: currentUser,
      username: cleanId,
      name: finalName,
      avatar: avatarUrl,
      status: 'Online ✨',
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert([
        {
          owner_id: currentUser,
          contact_username: cleanId,
          contact_name: finalName,
          avatar: avatarUrl,
          status: 'Online ✨',
        },
      ])
      .select()

    if (error) {
      console.error('Kontaktni saqlashda xatolik:', error.message)
      throw error
    }

    if (data && data.length > 0) {
      newItem.id = data[0].id
    }

    const updated = [newItem, ...contacts.filter((c) => c.username.toLowerCase() !== cleanId)]
    setContacts(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`linksy_contacts_${currentUser}`, JSON.stringify(updated))
    }
    return newItem
  }

  const handleQuickSaveContact = async () => {
    if (!viewingUserProfile) return
    const cleanId = viewingUserProfile.username.toLowerCase()
    if (cleanId === currentUser) return

    setIsSavingContact(true)
    try {
      const savedItem = await saveContactUniversal(cleanId, quickSaveName)
      setViewingUserProfile(savedItem)
      if (selectedContact?.username.toLowerCase() === cleanId) {
        setSelectedContact(savedItem)
      }
      setQuickSaveSuccess('✅ Kontaktlarga muvaffaqiyatli saqlandi!')
    } catch {
      setQuickSaveSuccess('Kontaktni saqlab bo‘lmadi. Internet aloqasini tekshiring.')
    } finally {
      setIsSavingContact(false)
    }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactFeedback('')

    const rawInput = newContactUsername.trim().replace(/^@/, '').toLowerCase()
    const cleanId = rawInput.includes('@') ? rawInput.split('@')[0] : rawInput

    if (!/^[a-z0-9._-]{3,30}$/.test(cleanId) || cleanId === 'system' || cleanId === 'all') {
      setContactFeedback('To‘g‘ri foydalanuvchi ID kiriting (3–30 belgi, lotin harflari, raqam, . _ -).')
      return
    }

    if (cleanId === currentUser) {
      setContactFeedback('O‘zingizni kontaktga qo‘sha olmaysiz!')
      return
    }

    if (contacts.some((c) => c.username.toLowerCase() === cleanId)) {
      setContactFeedback('Bu kontakt allaqachon ro‘yxatingizda bor!')
      return
    }

    setIsSavingContact(true)
    try {
      const savedItem = await saveContactUniversal(cleanId, newContactName)
      setSelectedContact(savedItem)
      setNewContactUsername('')
      setNewContactName('')
      setContactFeedback('✅ Kontakt muvaffaqiyatli saqlandi!')
      setTimeout(() => setContactFeedback(''), 3000)
    } catch {
      setContactFeedback('Kontaktni saqlab bo‘lmadi. Internet aloqasini tekshiring.')
    } finally {
      setIsSavingContact(false)
    }
  }

  const handleSelectContactForChat = (contact: ContactItem) => {
    selectedContactRef.current = contact
    setSelectedContact(contact)
    setNewMessage(drafts[contact.username.toLowerCase()] || '')
    setUnreadCounts((prev) => ({ ...prev, [contact.username.toLowerCase()]: 0 }))
    setActiveTab('chat')
    setIsChatOpen(true)
  }

  const toggleChatPreference = (username: string, preference: 'muted' | 'pinned') => {
    const cleanUsername = username.toLowerCase()
    if (preference === 'muted') {
      setMutedChats((previous) => ({
        ...previous,
        [cleanUsername]: !previous[cleanUsername],
      }))
      return
    }

    setPinnedChats((previous) => ({
      ...previous,
      [cleanUsername]: !previous[cleanUsername],
    }))
  }

  const handleDeleteContact = async (id: string) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) {
      console.error('Kontaktni o‘chirishda xatolik:', error.message)
      setContactFeedback('Kontaktni o‘chirib bo‘lmadi. Internet aloqasini tekshiring.')
      return
    }

    const updated = contacts.filter((c) => c.id !== id)
    setContacts(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`linksy_contacts_${currentUser}`, JSON.stringify(updated))
    }
    if (selectedContact?.id === id) {
      setSelectedContact(null)
      setIsChatOpen(false)
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NODE_ENV === 'production' ? productionAppUrl : window.location.origin}/chat`,
      },
    })
    if (error) {
      setAuthError('Google orqali kirishda xatolik: ' + error.message)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthError('Hisobdan chiqishda xatolik: ' + error.message)
      return
    }

    localStorage.removeItem('linksy_current_user')
    currentUserRef.current = ''
    selectedContactRef.current = null
    relationshipStartedAtRef.current = null
    setCurrentUser('')
    setSelectedContact(null)
    setContacts([])
    setMessages([])
    setNewMessage('')
    setIsChatOpen(false)
    setIsAuthenticated(false)
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')

    if (!inputUsername.trim() || !inputPassword.trim()) {
      setAuthError('Iltimos, ID va parolni kiriting!')
      return
    }

    const cleanUsername = inputUsername.trim().replace(/^@/, '').toLowerCase()
    if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername) || cleanUsername === 'system' || cleanUsername === 'all') {
      setAuthError('ID 3–30 belgidan iborat bo‘lsin; lotin harflari, raqam, nuqta, _ yoki - ishlating.')
      return
    }
    if (authMode === 'register' && inputPassword.length < 8) {
      setAuthError('Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak.')
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke<UsernameAuthResponse>('username-auth', {
        body: {
          action: authMode,
          username: cleanUsername,
          password: inputPassword,
        },
      })
      if (error) throw error
      if (!data?.username || !data.session?.access_token || !data.session.refresh_token) {
        throw new Error('Serverdan yaroqli autentifikatsiya javobi kelmadi.')
      }

      const { error: sessionError } = await supabase.auth.setSession(data.session)
      if (sessionError) throw sessionError

      currentUserRef.current = data.username
      setCurrentUser(data.username)
      setProfileName(data.username)
      setInputPassword('')
      setIsAuthenticated(true)
      void fetchMessages(data.username)
      void fetchContacts(data.username)
    } catch (error) {
      console.error('Hisobga kirishda xatolik:', error)
      const errorCode = await getFunctionErrorCode(error)
      const messages: Record<string, string> = {
        invalid_credentials: 'ID yoki parol noto‘g‘ri.',
        username_taken: 'Bu ID allaqachon band.',
        legacy_account_use_login: 'Bu eski hisob. Kirish rejimida eski ID/parolingizni kiriting — hisob xavfsiz ko‘chiriladi.',
        password_too_short: 'Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak.',
        too_many_attempts: 'Urinishlar limiti tugadi. Biroz kutib qayta urinib ko‘ring.',
        server_not_configured: 'Supabase auth server sozlanmagan. Administrator bilan bog‘laning.',
      }
      setAuthError(
        (errorCode && messages[errorCode]) ||
          (authMode === 'login'
            ? 'Hisobga kirib bo‘lmadi. ID/parol yoki Supabase ulanishini tekshiring.'
            : 'Ro‘yxatdan o‘tib bo‘lmadi. Supabase auth xizmatini tekshiring.')
      )
    }
  }

  const sendRawMessage = async (text: string): Promise<boolean> => {
    const isSavedRecipient =
      selectedContact?.username.toLowerCase() !== 'all' &&
      contacts.some((contact) => contact.username.toLowerCase() === selectedContact?.username.toLowerCase())
    if (
      messagePermission === 'nobody' ||
      (messagePermission === 'contacts' && !isSavedRecipient)
    ) {
      alert('Sizning maxfiylik sozlamangiz bo\'yicha xabar yuborish taqiqlangan!')
      return false
    }

    if (!text.trim()) return false

    const receiverId = selectedContact ? selectedContact.username.toLowerCase() : 'all'

    const { data, error } = await supabase.from('messages').insert([
      {
        content: text,
        sender_id: currentUser,
        receiver_id: receiverId,
      },
    ]).select()

    if (error) {
      console.error('Xabar yuborishda xatolik:', error.message)
      setMessageSyncError('Xabar yuborilmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.')
      return false
    }

    setMessageSyncError('')
    if (data && data.length > 0 && !text.startsWith('PROFILE_AVATAR|') && !text.startsWith('PROFILE_BIO|') && !text.startsWith('USER_REG|')) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data[0].id)) return prev
        return [...prev, data[0]]
      })
      if (selectedContact) {
        setDrafts((prev) => ({ ...prev, [selectedContact.username.toLowerCase()]: '' }))
      }
    }
    setRelationshipStarted(true)
    return true
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    const text = newMessage
    setShowEmojiPicker(false)
    setShowStickerPicker(false)
    const sent = await sendRawMessage(text)
    if (sent) setNewMessage('')
  }

  const addEmojiToInput = (emoji: string) => {
    setNewMessage((prev) => {
      const updated = prev + emoji
      if (selectedContact) {
        setDrafts((d) => ({ ...d, [selectedContact.username.toLowerCase()]: updated }))
      }
      return updated
    })
  }

  const handleInputChange = (val: string) => {
    setNewMessage(val)
    if (selectedContact) {
      setDrafts((d) => ({ ...d, [selectedContact.username.toLowerCase()]: val }))
    }
  }

  const sendSticker = async (stickerContent: string) => {
    setShowStickerPicker(false)
    await sendRawMessage(stickerContent)
  }

  const startCall = async (type: 'audio' | 'video') => {
    const isSavedRecipient =
      selectedContact?.username.toLowerCase() !== 'all' &&
      contacts.some((contact) => contact.username.toLowerCase() === selectedContact?.username.toLowerCase())
    if (
      callPermission === 'nobody' ||
      (callPermission === 'contacts' && !isSavedRecipient)
    ) {
      alert('Sizning maxfiylik sozlamangiz bo\'yicha qo\'ng\'iroq qilish taqiqlangan!')
      return
    }

    setActiveCall(type)
    const callText = type === 'video' ? '📹 Video qo\'ng\'iroq amalga oshirildi' : '📞 Audio qo\'ng\'iroq amalga oshirildi'
    await sendRawMessage(callText)

    try {
      const constraints = { audio: true, video: type === 'video' }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStreamRef.current = stream
      if (type === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch {
      alert('Kamera yoki mikrofonni yoqib bo\'lmadi!')
      setActiveCall(null)
    }
  }

  const endCall = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    setActiveCall(null)
    setIsMuted(false)
    setIsVideoOff(false)
  }

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(!isVideoOff)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = async () => {
          const base64Audio = reader.result as string
          await sendRawMessage(`VOICE_NOTE|${base64Audio}`)
        }
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch {
      alert('Mikrofondan foydalanishga ruxsat berilmadi!')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const triggerBigoAnimation = (emoji: string, name: string, is3D = false) => {
    setActiveAnimationGift({ emoji, name, is3D })
    setTimeout(() => setActiveAnimationGift(null), 4000)
  }

  const sendGift = async (emoji: string, name: string) => {
    const is3D = name === '3D Olmos'
    const sent = await sendRawMessage(`GIFT_ANIMATION|${emoji}|${name}`)
    if (!sent) return
    triggerBigoAnimation(emoji, name, is3D)
    setActiveTab('chat')
    setIsChatOpen(true)
  }

  const sendLoveLetter = async () => {
    if (!letterText.trim()) return
    const sent = await sendRawMessage(`LETTER_CONTENT|${letterText}`)
    if (!sent) return
    setLetterText('')
    setActiveTab('chat')
    setIsChatOpen(true)
  }

  const handleMemoryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && !file.type.startsWith('image/')) {
      setMessageSyncError('Faqat rasm faylini yuklash mumkin.')
    } else if (file && file.size > 5 * 1024 * 1024) {
      setMessageSyncError('Rasm 5 MB dan kichik bo‘lishi kerak.')
    } else if (file) {
      setMessageSyncError('')
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setMemories((prev) => [reader.result as string, ...prev])
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && !file.type.startsWith('image/')) {
      setMessageSyncError('Faqat rasm faylini yuklash mumkin.')
    } else if (file && file.size > 5 * 1024 * 1024) {
      setMessageSyncError('Rasm 5 MB dan kichik bo‘lishi kerak.')
    } else if (file) {
      setMessageSyncError('')
      const reader = new FileReader()
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          const base64Avatar = reader.result
          setProfileAvatar(base64Avatar)
          setUserProfiles((prev) => ({
            ...prev,
            [currentUser]: { ...prev[currentUser], avatar: base64Avatar },
          }))
          await sendRawMessage(`PROFILE_AVATAR|${base64Avatar}`)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBioChange = async (newBio: string) => {
    setProfileBio(newBio)
    setUserProfiles((prev) => ({
      ...prev,
      [currentUser]: { ...prev[currentUser], bio: newBio },
    }))
    await sendRawMessage(`PROFILE_BIO|${newBio}`)
  }

  const clearChat = async () => {
    if (!selectedContact) return

    let query = supabase.from('messages').delete()
    if (selectedContact.username.toLowerCase() === 'all') {
      query = query.eq('receiver_id', 'all')
    } else {
      const target = quotePostgrestValue(selectedContact.username.toLowerCase())
      const user = quotePostgrestValue(currentUser)
      query = query.or(
        `and(sender_id.eq.${user},receiver_id.eq.${target}),and(sender_id.eq.${target},receiver_id.eq.${user})`
      )
    }

    const { error } = await query
    if (error) {
      console.error('Suhbatni tozalashda xatolik:', error.message)
      setMessageSyncError('Suhbatni tozalab bo‘lmadi. Qayta urinib ko‘ring.')
      return
    }

    const targetId = selectedContact.username.toLowerCase()
    const remainingMessages = messages.filter((message) => {
      const sender = (message.sender_id || '').toLowerCase()
      const receiver = (message.receiver_id || '').toLowerCase()
      if (targetId === 'all') return sender !== 'all' && receiver !== 'all'
      return !(
        (sender === currentUser && receiver === targetId) ||
        (sender === targetId && receiver === currentUser)
      )
    })
    setMessages(remainingMessages)
    setRelationshipStarted(remainingMessages.length > 0)
    if (remainingMessages.length === 0) {
      relationshipStartedAtRef.current = null
      secondsTogetherRef.current = 0
      setSecondsTogether(0)
    }
    setIsDrawerOpen(false)
  }

  const allChatPartners: ContactItem[] = (() => {
    const map = new Map<string, ContactItem>()

    contacts.forEach((c) => {
      const key = c.username.toLowerCase()
      if (key && key !== currentUser) {
        map.set(key, {
          ...c,
          avatar: getUserAvatar(key, c.avatar),
          isMuted: mutedChats[key] || false,
          isPinned: pinnedChats[key] || false,
        })
      }
    })

    messages.forEach((m) => {
      const sId = (m.sender_id || '').toLowerCase()
      const rId = (m.receiver_id || '').toLowerCase()

      if (sId && sId !== currentUser && sId !== 'system' && sId !== 'all') {
        if (!map.has(sId)) {
          map.set(sId, {
            id: sId,
            username: sId,
            name: sId,
            avatar: getUserAvatar(sId),
            status: 'Yangi xabar ✨',
            isMuted: mutedChats[sId] || false,
            isPinned: pinnedChats[sId] || false,
          })
        }
      }

      if (rId && rId !== currentUser && rId !== 'system' && rId !== 'all') {
        if (!map.has(rId)) {
          map.set(rId, {
            id: rId,
            username: rId,
            name: rId,
            avatar: getUserAvatar(rId),
            status: 'Online ✨',
            isMuted: mutedChats[rId] || false,
            isPinned: pinnedChats[rId] || false,
          })
        }
      }
    })

    registeredUsers.forEach((u) => {
      const cleanU = u.toLowerCase()
      if (cleanU && cleanU !== currentUser && cleanU !== 'system' && !map.has(cleanU)) {
        map.set(cleanU, {
          id: cleanU,
          username: cleanU,
          name: cleanU,
          avatar: getUserAvatar(cleanU),
          status: 'Linksy foydalanuvchisi ✨',
          isMuted: mutedChats[cleanU] || false,
          isPinned: pinnedChats[cleanU] || false,
        })
      }
    })

    if (!map.has('all')) {
      map.set('all', {
        id: 'all',
        username: 'all',
        name: '💖 Umumiy Sevgi Suhbatxonasi',
        avatar: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&auto=format&fit=crop&q=60',
        status: 'Barcha xabarlar ✨',
      })
    }

    const partners = Array.from(map.values()).filter(
      (item) =>
        item.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
        item.username.toLowerCase().includes(chatSearchQuery.toLowerCase())
    )

    return partners.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      const lastA = getLastMessageTimestamp(a.username)
      const lastB = getLastMessageTimestamp(b.username)
      return lastB - lastA
    })
  })()

  const displayedMessages = (() => {
    if (!selectedContact) return []

    const target = selectedContact.username.toLowerCase()

    if (target === 'all') {
      return messages.filter((m) => {
        const s = (m.sender_id || '').toLowerCase()
        const r = (m.receiver_id || '').toLowerCase()
        return s === 'all' || r === 'all'
      })
    }

    return messages.filter((m) => {
      const s = (m.sender_id || '').toLowerCase()
      const r = (m.receiver_id || '').toLowerCase()
      return (
        (s === currentUser && r === target) ||
        (s === target && r === currentUser)
      )
    })
  })()

  const days = Math.floor(secondsTogether / 86400)
  const hours = Math.floor((secondsTogether % 86400) / 3600)
  const minutes = Math.floor((secondsTogether % 3600) / 60)
  const seconds = secondsTogether % 60

  function getLastMessageTimestamp(partnerUsername: string) {
    const cleanPartner = partnerUsername.toLowerCase()
    const userMsgs =
      cleanPartner === 'all'
        ? messages.filter((m) =>
            (m.sender_id || '').toLowerCase() === 'all' ||
            (m.receiver_id || '').toLowerCase() === 'all'
          )
        : messages.filter((m) => {
            const s = (m.sender_id || '').toLowerCase()
            const r = (m.receiver_id || '').toLowerCase()
            return (
              (s === currentUser && r === cleanPartner) ||
              (s === cleanPartner && r === currentUser)
            )
          })
    if (userMsgs.length === 0) return 0
    return new Date(userMsgs[userMsgs.length - 1].created_at).getTime()
  }

  function getLastMessageWithUser(partnerUsername: string) {
    const cleanPartner = partnerUsername.toLowerCase()
    const userMsgs =
      cleanPartner === 'all'
        ? messages.filter((m) =>
            (m.sender_id || '').toLowerCase() === 'all' ||
            (m.receiver_id || '').toLowerCase() === 'all'
          )
        : messages.filter((m) => {
            const s = (m.sender_id || '').toLowerCase()
            const r = (m.receiver_id || '').toLowerCase()
            return (
              (s === currentUser && r === cleanPartner) ||
              (s === cleanPartner && r === currentUser)
            )
          })

    const draftText = drafts[cleanPartner]
    if (draftText) {
      return { preview: `Qoralama: ${draftText}`, time: 'Hozir', isMine: false, hasDraft: true }
    }

    if (userMsgs.length === 0) {
      return { preview: 'Suhbatni boshlash uchun bosing 💖', time: '', isMine: false, hasDraft: false }
    }

    const last = userMsgs[userMsgs.length - 1]
    let preview = last.content
    if (preview.startsWith('GIFT_ANIMATION|')) {
      const parts = preview.split('|')
      preview = `${parts[1] || '🎁'} Sovg'a: ${parts[2] || ''}`
    } else if (preview.startsWith('VOICE_NOTE|')) {
      preview = '🎤 Ovozli xabar'
    } else if (preview.startsWith('LETTER_CONTENT|')) {
      preview = '💌 Maxfiy sevgi maktubi'
    }

    const time = new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return { preview, time, isMine: last.sender_id.toLowerCase() === currentUser, hasDraft: false }
  }

  const getThemeColors = (isMine: boolean) => {
    if (!isMine) {
      return {
        bg: 'linear-gradient(135deg, rgba(39,39,42,0.95), rgba(24,24,27,0.98))',
        border: '1px solid rgba(168, 85, 247, 0.4)',
      }
    }
    if (bubbleTheme === 'pink') {
      return {
        bg: 'linear-gradient(135deg, rgba(219,39,119,0.45), rgba(157,23,77,0.35))',
        border: '1px solid rgba(244, 114, 182, 0.7)',
      }
    }
    if (bubbleTheme === 'gold') {
      return {
        bg: 'linear-gradient(135deg, rgba(202,138,4,0.4), rgba(161,98,7,0.3))',
        border: '1px solid rgba(250, 204, 21, 0.7)',
      }
    }
    return {
      bg: 'linear-gradient(135deg, rgba(147,51,234,0.45), rgba(79,70,229,0.35))',
      border: '1px solid rgba(168, 85, 247, 0.7)',
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="app-viewport" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', backgroundColor: '#050508', color: '#fff', fontFamily: 'sans-serif', padding: '16px', boxSizing: 'border-box', overflowY: 'auto' }}>
        <style>{`
          html, body { margin: 0; padding: 0; background-color: #050508; overscroll-behavior: none; }
          .app-viewport { height: 100vh; height: 100dvh; }
        `}</style>
        <div style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px', backgroundColor: '#0c0a14', border: '1px solid rgba(168, 85, 247, 0.4)', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#f472b6', marginBottom: '8px' }}>Linksy 👑</div>
          <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>Sevishganlar uchun xavfsiz va shaxsiy makon 💖</div>

          <button onClick={handleGoogleLogin} style={{ width: '100%', padding: '12px', borderRadius: '14px', backgroundColor: '#ffffff', color: '#000000', fontWeight: 700, fontSize: '14px', cursor: 'pointer', border: 'none', marginBottom: '16px' }}>Google orqali kirish</button>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
            <input type="text" value={inputUsername} onChange={(e) => setInputUsername(e.target.value)} placeholder="Unikal ID (masalan: shahzoda)" style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: '#18181b', border: '1px solid rgba(168,85,247,0.4)', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            <input type="password" value={inputPassword} onChange={(e) => setInputPassword(e.target.value)} placeholder="Parol" style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: '#18181b', border: '1px solid rgba(168,85,247,0.4)', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            {authError && <div style={{ fontSize: '12px', color: '#ef4444' }}>{authError}</div>}
            <button type="submit" style={{ width: '100%', padding: '13px', borderRadius: '14px', border: 'none', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{authMode === 'register' ? 'Ro‘yxatdan o‘tish' : 'Kirish'}</button>
          </form>
          <button
            type="button"
            onClick={() => {
              setAuthMode((mode) => mode === 'register' ? 'login' : 'register')
              setAuthError('')
            }}
            style={{ marginTop: '14px', padding: '8px', border: 'none', background: 'transparent', color: '#d8b4fe', cursor: 'pointer', fontSize: '13px' }}
          >
            {authMode === 'register' ? 'Hisobingiz bormi? Kirish' : 'Yangi hisob ochish'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="app-viewport"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        backgroundColor: '#050508',
        color: '#ffffff',
        overflow: 'hidden',
        fontFamily: 'sans-serif',
        opacity: isAppLoaded ? 1 : 0,
        transform: isAppLoaded ? 'scale(1)' : 'scale(0.99)',
        transition: 'opacity 0.4s ease-out',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <style>{`
        html, body { margin: 0; padding: 0; background-color: #050508; overscroll-behavior: none; }
        .app-viewport { height: 100vh; height: 100dvh; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 10px rgba(236, 72, 153, 0.6); }
          50% { box-shadow: 0 0 25px rgba(244, 114, 182, 0.9); }
          100% { box-shadow: 0 0 10px rgba(236, 72, 153, 0.6); }
        }
        .animated-avatar-ring {
          animation: pulseGlow 3s infinite ease-in-out;
          border: 2px solid #ec4899;
        }
        .chat-list-row:hover {
          background-color: rgba(147, 51, 234, 0.18) !important;
        }
      `}</style>

      {/* RASMNI KATTA QILIB KO'RISH MODALI */}
      {isAvatarModalOpen && (
        <div onClick={() => setIsAvatarModalOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 999999, backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', cursor: 'zoom-out' }}>
          <div style={{ position: 'relative', maxWidth: '92vw', maxHeight: '85vh', borderRadius: '24px', overflow: 'hidden', border: '3px solid #ec4899' }}>
            <Image src={zoomedAvatarUrl || profileAvatar} alt="Katta profil rasmi" width={800} height={800} unoptimized style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '80vh' }} />
          </div>
        </div>
      )}

      {/* SUHBATDOSH PROFILINI KO'RISH VA ID NUSXALASH MODALI */}
      {viewingUserProfile && (
        <div onClick={() => setViewingUserProfile(null)} style={{ position: 'fixed', inset: 0, zIndex: 99998, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '390px', backgroundColor: '#0c0a14', borderRadius: '24px', border: '1px solid rgba(236, 72, 153, 0.6)', padding: '22px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setViewingUserProfile(null)} style={{ position: 'absolute', top: '14px', right: '14px', background: '#18181b', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>

            <div onClick={() => { setZoomedAvatarUrl(getUserAvatar(viewingUserProfile.username, viewingUserProfile.avatar)); setIsAvatarModalOpen(true); }} className="animated-avatar-ring" style={{ width: '94px', height: '94px', borderRadius: '50%', overflow: 'hidden', cursor: 'zoom-in', marginBottom: '12px', backgroundColor: '#18181b' }}>
              <Image src={getUserAvatar(viewingUserProfile.username, viewingUserProfile.avatar)} alt={viewingUserProfile.name} width={188} height={188} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>{viewingUserProfile.name}</div>
            <div style={{ fontSize: '12px', color: '#34d399', marginBottom: '8px' }}>{viewingUserProfile.status}</div>
            <div style={{ fontSize: '13px', color: '#d8b4fe', fontStyle: 'italic', marginBottom: '14px' }}>&quot;{getUserBio(viewingUserProfile.username)}&quot;</div>

            <div style={{ width: '100%', padding: '10px 12px', borderRadius: '14px', backgroundColor: '#18181b', border: '1px solid rgba(34, 211, 238, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', boxSizing: 'border-box' }}>
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>Foydalanuvchi ID:</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#22d3ee' }}>@{viewingUserProfile.username}</div>
              </div>
              <button onClick={() => handleCopyUserId(viewingUserProfile.username)} style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', backgroundColor: copiedId ? 'rgba(52, 211, 153, 0.25)' : 'rgba(34, 211, 238, 0.2)', color: copiedId ? '#34d399' : '#22d3ee', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {copiedId ? <Check size={15} /> : <Copy size={15} />} {copiedId ? 'Nusxalandi!' : 'ID Copy'}
              </button>
            </div>

            {viewingUserProfile.username.toLowerCase() !== currentUser && viewingUserProfile.username !== 'all' && (
              <div style={{ width: '100%', marginBottom: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#18181b', padding: '12px', borderRadius: '14px', border: '1px solid rgba(168, 85, 247, 0.35)' }}>
                  <div style={{ fontSize: '11px', color: '#f472b6', fontWeight: 700, textAlign: 'left' }}>Kontaktga saqlash / Ismni o&apos;zgartirish:</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" value={quickSaveName} onChange={(e) => setQuickSaveName(e.target.value)} placeholder="Ism..." style={{ flex: 1, padding: '9px', borderRadius: '10px', backgroundColor: '#09090b', border: '1px solid rgba(168,85,247,0.4)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                    <button onClick={handleQuickSaveContact} disabled={isSavingContact} style={{ padding: '9px 14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Saqlash</button>
                  </div>
                  {quickSaveSuccess && <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600 }}>{quickSaveSuccess}</div>}
                </div>
              </div>
            )}

            <button onClick={() => { handleSelectContactForChat(viewingUserProfile); setViewingUserProfile(null); }} style={{ width: '100%', padding: '11px', borderRadius: '12px', border: 'none', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Suhbatga kirish</button>
          </div>
        </div>
      )}

      {/* AUDIO/VIDEO CALL MODAL */}
      {activeCall && (
        <div className="app-viewport" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#05050bf8', backdropFilter: 'blur(24px)', padding: '30px 16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px auto' }}>
              <Image src={selectedContact ? getUserAvatar(selectedContact.username, selectedContact.avatar) : profileAvatar} alt="Suhbatdosh" width={180} height={180} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{selectedContact ? selectedContact.name : profileName}</div>
            <div style={{ fontSize: '13px', color: '#22d3ee', marginTop: '6px' }}>{activeCall === 'video' ? '📹 Video qo\'ng\'iroq...' : '📞 Audio qo\'ng\'iroq...'}</div>
          </div>
          {activeCall === 'video' && (
            <div style={{ width: '100%', maxWidth: '800px', flex: 1, backgroundColor: '#121019', borderRadius: '20px', overflow: 'hidden', margin: '14px 0' }}>
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={toggleMute} style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: isMuted ? '#ef4444' : '#27272a', border: 'none', color: '#fff', cursor: 'pointer' }}>{isMuted ? <MicOff size={22} /> : <Mic size={22} />}</button>
            {activeCall === 'video' && (
              <button onClick={toggleVideo} aria-label={isVideoOff ? 'Videoni yoqish' : 'Videoni o‘chirish'} style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: isVideoOff ? '#ef4444' : '#27272a', border: 'none', color: '#fff', cursor: 'pointer' }}>
                {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>
            )}
            <button onClick={endCall} style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dc2626', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><PhoneOff size={28} /></button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1200px', height: '100%', margin: '0 auto', backgroundColor: '#09090b', position: 'relative', boxSizing: 'border-box' }}>

        {/* GIFTS 3D ANIMATION MODAL */}
        {activeAnimationGift && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', padding: '20px' }}>
            {activeAnimationGift.is3D ? (
              <div className="gift-diamond" aria-label="Olmos sovg‘asi">💎</div>
            ) : (
              <div style={{ fontSize: '80px' }}>{activeAnimationGift.emoji}</div>
            )}
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f472b6', marginTop: '16px', textTransform: 'uppercase' }}>✨ {activeAnimationGift.name} ✨</div>
          </div>
        )}

        {/* YON MENYU */}
        {isDrawerOpen && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex' }}>
            <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
            <div style={{ position: 'relative', zIndex: 70, width: '290px', maxWidth: '82vw', backgroundColor: '#0c0a14', borderRight: '1px solid rgba(168, 85, 247, 0.35)', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid rgba(147, 51, 234, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '20px', color: '#f472b6' }}>
                    Linksy <Crown size={18} color="#facc15" />
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                  {[
                    { id: 'chat', label: 'Barcha Chatlar Ro\'yxati', icon: <MessageCircle size={18} color="#22d3ee" /> },
                    { id: 'contacts', label: `Kontaktlar (${contacts.length})`, icon: <Users size={18} color="#38bdf8" /> },
                    { id: 'gifts', label: "Sovg'alar do'koni", icon: <Gift size={18} color="#f472b6" /> },
                    { id: 'letters', label: 'Maxfiy Maktublar', icon: <Mail size={18} color="#c084fc" /> },
                    { id: 'gallery', label: 'Xotiralar Galereyasi', icon: <ImageIcon size={18} color="#34d399" /> },
                    { id: 'couple', label: 'Juftlik tarixi & Premium', icon: <CalendarHeart size={18} color="#c084fc" /> },
                    { id: 'profile', label: 'Profil va Maxfiylik', icon: <User size={18} color="#facc15" /> },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as AppTab)
                        if (item.id === 'chat') setIsChatOpen(false)
                        setIsDrawerOpen(false)
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 13px', borderRadius: '12px', border: activeTab === item.id ? '1px solid rgba(168,85,247,0.5)' : '1px solid transparent', backgroundColor: activeTab === item.id ? 'rgba(147,51,234,0.25)' : 'transparent', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                <button onClick={clearChat} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#fbbf24', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}><Trash2 size={16} /> Xabarlarni tozalash</button>
                <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left' }}><LogOut size={16} /> Hisobdan chiqish</button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header className="mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(147, 51, 234, 0.3)', backgroundColor: '#0c0a14', flexShrink: 0, gap: '10px', boxSizing: 'border-box' }}>
          {activeTab === 'chat' && !isChatOpen ? (
            /* CHATLAR RO'YXATI HEADERI */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setIsDrawerOpen(true)} style={{ padding: '8px', borderRadius: '11px', backgroundColor: '#18181b', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#d8b4fe', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Menu size={19} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 900, fontSize: '20px', color: '#f472b6', letterSpacing: '0.5px' }}>Linksy Chatlar</span>
                  <Crown size={18} color="#facc15" />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  onClick={() => openUserProfileModal(currentUser)}
                  style={{ fontSize: '12px', color: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.35)', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}
                  title="Mening profilim va ID manzilim"
                >
                  @{currentUser}
                </div>
                <button
                  onClick={() => setActiveTab('contacts')}
                  style={{ padding: '8px 12px', borderRadius: '10px', background: 'linear-gradient(to right, #ec4899, #9333ea)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700 }}
                >
                  <UserPlus size={15} /> Kontakt
                </button>
              </div>
            </>
          ) : (
            /* SUHBAT XONASI HEADERI */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                {activeTab === 'chat' && isChatOpen ? (
                  <button
                    onClick={() => setIsChatOpen(false)}
                    style={{ padding: '8px 12px', borderRadius: '11px', backgroundColor: 'rgba(34, 211, 238, 0.15)', border: '1px solid rgba(34, 211, 238, 0.45)', color: '#22d3ee', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}
                  >
                    <ArrowLeft size={17} /> Chatlar
                  </button>
                ) : (
                  <button onClick={() => setIsDrawerOpen(true)} style={{ padding: '8px', borderRadius: '11px', backgroundColor: '#18181b', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#d8b4fe', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Menu size={19} />
                  </button>
                )}

                <div
                  onClick={() => {
                    if (activeTab === 'chat' && isChatOpen && selectedContact) {
                      openUserProfileModal(selectedContact.username)
                    } else {
                      setActiveTab('profile')
                    }
                  }}
                  className="animated-avatar-ring"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', flexShrink: 0, cursor: 'pointer' }}
                  title="Profilni ko'rish uchun bosing"
                >
                  <Image
                    src={activeTab === 'chat' && isChatOpen && selectedContact ? getUserAvatar(selectedContact.username, selectedContact.avatar) : profileAvatar}
                    alt="Avatar"
                    width={100}
                    height={100}
                    unoptimized
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div
                  onClick={() => {
                    if (activeTab === 'chat' && isChatOpen && selectedContact) {
                      openUserProfileModal(selectedContact.username)
                    }
                  }}
                  style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#f472b6', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeTab === 'chat' && isChatOpen && selectedContact ? selectedContact.name : profileName}
                    </span>
                    <CheckCircle2 size={15} style={{ fill: 'url(#gradient-check)', color: '#fff', flexShrink: 0 }} />
                    <svg width="0" height="0">
                      <linearGradient id="gradient-check" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop stopColor="#ec4899" offset="0%" />
                        <stop stopColor="#9333ea" offset="100%" />
                      </linearGradient>
                    </svg>
                  </div>
                  <div style={{ fontSize: '11px', color: '#22d3ee', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeTab === 'chat' && isChatOpen && selectedContact
                      ? `@${selectedContact.username} • Profilni ko'rish uchun bosing`
                      : `ID: @${currentUser} • ${realtimeStatus === 'connected' ? 'Real-time ulangan' : realtimeStatus === 'connecting' ? 'Ulanmoqda…' : 'Aloqa uzildi'}`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => startCall('audio')} style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(34, 211, 238, 0.15)', border: '1px solid rgba(34, 211, 238, 0.4)', color: '#22d3ee', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Audio qo'ng'iroq">
                  <PhoneCall size={17} />
                </button>
                <button onClick={() => startCall('video')} style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.4)', color: '#f472b6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Video qo'ng'iroq">
                  <Video size={17} />
                </button>
              </div>
            </>
          )}
        </header>

        {/* ASOSIY QISM */}
        <div className="mobile-scroll-area" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 20px', boxSizing: 'border-box', WebkitOverflowScrolling: 'touch' }}>
          {messageSyncError && (
            <div className="sync-error" role="alert">
              <span>{messageSyncError}</span>
              <button type="button" onClick={() => currentUser && void fetchMessages(currentUser)}>Qayta urinish</button>
            </div>
          )}

          {/* TO'LIQ TELEGRAM USLUBIDAGI CHATLAR RO'YXATI */}
          {activeTab === 'chat' && !isChatOpen && (
            <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Qidiruv qatori */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#14121d', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '16px', padding: '11px 16px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                <Search size={18} color="#f472b6" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Chatlar, ismlar yoki @ID bo'yicha qidirish..."
                  style={{ width: '100%', background: 'none', border: 'none', color: '#fff', fontSize: '15px', outline: 'none' }}
                />
              </div>

              {/* Chatlar ro'yxati */}
              {allChatPartners.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', borderRadius: '20px', backgroundColor: '#12101b', border: '1px solid rgba(168, 85, 247, 0.25)', marginTop: '10px' }}>
                  <div style={{ fontSize: '42px', marginBottom: '10px' }}>💬</div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#f472b6', marginBottom: '6px' }}>
                    Hozircha chatlar ro&apos;yxati bo&apos;sh
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '18px', maxWidth: '340px', margin: '0 auto 18px auto' }}>
                    Yaqiningizning ID manzilini Kontaktlar bo&apos;limidan qo&apos;shing yoki xabar yozishni boshlang!
                  </div>
                  <button
                    onClick={() => setActiveTab('contacts')}
                    style={{ padding: '12px 24px', borderRadius: '14px', border: 'none', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 0 20px rgba(236,72,153,0.4)' }}
                  >
                    Kontakt qo&apos;shish ✨
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '22px', backgroundColor: '#0c0a14', border: '1px solid rgba(168, 85, 247, 0.35)', overflow: 'hidden', boxShadow: '0 10px 35px rgba(0,0,0,0.5)' }}>
                  {allChatPartners.map((partner, idx) => {
                    const lastInfo = getLastMessageWithUser(partner.username)
                    const unread = unreadCounts[partner.username.toLowerCase()] || 0
                    const isSaved = contacts.some((c) => c.username.toLowerCase() === partner.username.toLowerCase())

                    return (
                      <div
                        key={partner.username}
                        className="chat-list-row"
                        role="button"
                        tabIndex={0}
                        aria-label={`${partner.name} bilan suhbatni ochish`}
                        onClick={() => handleSelectContactForChat(partner)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            handleSelectContactForChat(partner)
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          cursor: 'pointer',
                          borderBottom: idx !== allChatPartners.length - 1 ? '1px solid rgba(168, 85, 247, 0.16)' : 'none',
                          transition: 'background 0.2s',
                          gap: '14px',
                          backgroundColor: partner.isPinned ? 'rgba(147, 51, 234, 0.08)' : 'transparent',
                        }}
                      >
                        {/* Profil rasmi (Bosganda profil va ID modal ochiladi) */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            openUserProfileModal(partner.username)
                          }}
                          className="animated-avatar-ring"
                          style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: '#18181b', position: 'relative' }}
                          title="Profilni ko'rish va ID nusxalash"
                        >
                          <Image
                            src={getUserAvatar(partner.username, partner.avatar)}
                            alt={partner.name}
                            width={112}
                            height={112}
                            unoptimized
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        {/* Ism va oxirgi xabar */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                              <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {partner.name}
                              </span>
                              <Crown size={14} color="#facc15" style={{ flexShrink: 0 }} />
                              {!isSaved && partner.username !== 'all' && (
                                <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '999px', backgroundColor: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.4)', color: '#22d3ee', fontWeight: 700, flexShrink: 0 }}>
                                  @{partner.username}
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              {lastInfo.isMine && <span style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 800 }}>✓✓</span>}
                              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{lastInfo.time}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ fontSize: '13.5px', color: lastInfo.hasDraft ? '#fbbf24' : unread > 0 ? '#f472b6' : '#9ca3af', fontWeight: unread > 0 ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {lastInfo.preview}
                            </div>

                            {unread > 0 ? (
                              <span style={{ minWidth: '22px', height: '22px', padding: '0 7px', borderRadius: '999px', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 10px rgba(236,72,153,0.6)' }}>
                                {unread}
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', backgroundColor: 'rgba(147,51,234,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#d8b4fe', fontWeight: 700, flexShrink: 0 }}>
                                Ochish
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            aria-label={partner.isPinned ? 'Chatni qadashni bekor qilish' : 'Chatni qadash'}
                            title={partner.isPinned ? 'Qadashni bekor qilish' : 'Chatni qadash'}
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleChatPreference(partner.username, 'pinned')
                            }}
                            style={{ padding: '7px', borderRadius: '9px', border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(147,51,234,0.12)', color: partner.isPinned ? '#facc15' : '#9ca3af', cursor: 'pointer' }}
                          >
                            <Pin size={15} />
                          </button>
                          <button
                            type="button"
                            aria-label={partner.isMuted ? 'Chat ovozini yoqish' : 'Chatni ovozsiz qilish'}
                            title={partner.isMuted ? 'Ovozni yoqish' : 'Ovozini o‘chirish'}
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleChatPreference(partner.username, 'muted')
                            }}
                            style={{ padding: '7px', borderRadius: '9px', border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(147,51,234,0.12)', color: partner.isMuted ? '#f472b6' : '#9ca3af', cursor: 'pointer' }}
                          >
                            <VolumeX size={15} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* CHAT XONASI */}
          {activeTab === 'chat' && isChatOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
              {selectedContact && selectedContact.username !== 'all' && !contacts.some((c) => c.username.toLowerCase() === selectedContact.username.toLowerCase()) && (
                <div style={{ padding: '10px 14px', borderRadius: '14px', backgroundColor: 'rgba(147, 51, 234, 0.18)', border: '1px solid rgba(236, 72, 153, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#f3f4f6' }}>
                    <strong>@{selectedContact.username}</strong> — Profilini ko&apos;rish va ID nusxalash:
                  </span>
                  <button
                    onClick={() => openUserProfileModal(selectedContact.username)}
                    style={{ padding: '6px 12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Profil & ID Copy ✨
                  </button>
                </div>
              )}

              {displayedMessages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '50px', fontSize: '14px', padding: '0 12px' }}>
                  {selectedContact
                    ? `${selectedContact.name} bilan hali xabarlar yo'q. Birinchi bo'lib yozing! 💖`
                    : "Hali xabarlar yo'q. Birinchi bo'lib yozing! 💖"}
                </div>
              )}

              {displayedMessages.map((msg) => {
                const isMine = msg.sender_id.toLowerCase() === currentUser
                const senderClean = msg.sender_id.toLowerCase()
                const theme = getThemeColors(isMine)
                const isGift = msg.content.startsWith('GIFT_ANIMATION|')
                const giftParts = isGift ? msg.content.split('|') : []
                const isLetter = msg.content.startsWith('LETTER_CONTENT|')
                const letterBody = isLetter ? msg.content.replace('LETTER_CONTENT|', '') : ''
                const isOpened = openedLetterId === msg.id

                const isSticker = msg.content.includes('[STIKER:')
                const isVoice = msg.content.startsWith('VOICE_NOTE|')
                const voiceUrl = isVoice ? msg.content.replace('VOICE_NOTE|', '') : ''

                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px', width: '100%' }}>
                    {!isMine && (
                      <div onClick={() => openUserProfileModal(senderClean)} className="animated-avatar-ring" style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', backgroundColor: '#18181b' }}>
                        <Image src={getUserAvatar(senderClean)} alt={senderClean} width={72} height={72} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ position: 'relative', maxWidth: '75%', padding: '12px 16px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: theme.bg, border: theme.border, boxSizing: 'border-box' }}>
                      {!isMine && <div onClick={() => openUserProfileModal(senderClean)} style={{ fontSize: '11px', fontWeight: 800, color: '#f472b6', marginBottom: '4px', cursor: 'pointer' }}>@{senderClean}</div>}
                      {isGift ? (
                        <div style={{ textAlign: 'center', minWidth: '100px' }}>
                          <div style={{ fontSize: '36px' }}>{giftParts[1] || '🎁'}</div>
                          <div style={{ color: '#f9a8d4', fontWeight: 700 }}>{giftParts[2] || 'Sovg‘a'}</div>
                        </div>
                      ) : isLetter ? (
                        <div>
                          <button type="button" onClick={() => setOpenedLetterId(isOpened ? null : msg.id)} style={{ border: 0, background: 'transparent', color: '#f9a8d4', cursor: 'pointer', fontWeight: 700 }}>
                            {isOpened ? '💌 Maktubni yopish' : '💌 Maxfiy maktubni ochish'}
                          </button>
                          {isOpened && <div style={{ marginTop: '8px', fontSize: '14px', color: '#f3f4f6', lineHeight: '1.45', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{letterBody}</div>}
                        </div>
                      ) : isVoice ? (
                        <audio controls preload="none" src={voiceUrl} aria-label="Ovozli xabar" style={{ maxWidth: '100%' }} />
                      ) : isSticker ? (
                        <div style={{ fontSize: '17px', color: '#f3f4f6', lineHeight: '1.45', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                      ) : (
                        <div style={{ fontSize: '14px', color: '#f3f4f6', lineHeight: '1.45', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                      )}
                      <div style={{ fontSize: '10px', color: '#d8b4fe', marginTop: '5px', textAlign: 'right' }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓</div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* KONTAKTLAR */}
          {activeTab === 'contacts' && (
            <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#18181b', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 10px 0' }}>Yangi Kontakt Qo&apos;shish</h2>
                <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="text" value={newContactUsername} onChange={(e) => setNewContactUsername(e.target.value)} placeholder="ID (masalan: @bek-2026)" style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#09090b', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#fff', outline: 'none' }} />
                  <input type="text" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} placeholder="Ism (masalan: Bek 💖)" style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#09090b', border: '1px solid rgba(168, 85, 247, 0.35)', color: '#fff', outline: 'none' }} />
                  <button type="submit" style={{ padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Kontaktga qo&apos;shish</button>
                </form>
                {contactFeedback && <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: 600, color: '#34d399' }}>{contactFeedback}</div>}
              </div>

              <div style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#18181b', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f472b6', margin: '0 0 14px 0' }}>Mening Kontaktlarim ({contacts.length})</h3>
                {contacts.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', backgroundColor: '#0c0a14', marginBottom: '8px' }}>
                    <div onClick={() => openUserProfileModal(c.username)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <Image src={getUserAvatar(c.username, c.avatar)} alt={c.name} width={40} height={40} unoptimized style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: '#38bdf8' }}>@{c.username}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleSelectContactForChat(c)} style={{ padding: '8px 12px', borderRadius: '10px', background: '#9333ea', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Yozish</button>
                      <button onClick={() => handleDeleteContact(c.id)} style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOVG'ALAR */}
          {activeTab === 'gifts' && (
            <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#f472b6', marginBottom: '12px' }}>🎁 Sovg&apos;alar Do&apos;koni</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '12px' }}>
                {ALL_GIFTS.map((g) => (
                  <div key={g.id} style={{ padding: '14px', borderRadius: '16px', backgroundColor: '#18181b', border: '1px solid rgba(168, 85, 247, 0.35)', textAlign: 'center' }}>
                    <div style={{ fontSize: '38px', marginBottom: '6px' }}>{g.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>{g.name}</div>
                    <button onClick={() => sendGift(g.emoji, g.name)} style={{ width: '100%', marginTop: '10px', padding: '9px', borderRadius: '10px', border: 'none', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Yuborish</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JUFTLIK */}
          {activeTab === 'couple' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '30px', backgroundColor: '#18181b', borderRadius: '24px', border: '1px solid rgba(236,72,153,0.4)' }}>
              <h2 style={{ color: '#f472b6', marginBottom: '10px' }}>💖 Sevgi Vaqti Hisoblagichi</h2>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>{days} kun : {hours} soat : {minutes} daqiqa : {seconds} soniya</p>
            </div>
          )}

          {/* PROFIL */}
          {activeTab === 'letters' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', backgroundColor: '#18181b', borderRadius: '24px', border: '1px solid rgba(168,85,247,0.4)' }}>
              <h2 style={{ color: '#f472b6', marginTop: 0 }}>💌 Maxfiy maktub</h2>
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>Maktub tanlangan suhbatga yuboriladi.</p>
              <textarea
                value={letterText}
                onChange={(event) => setLetterText(event.target.value)}
                placeholder="Yuragingizdagini yozing..."
                rows={6}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', resize: 'vertical', background: '#09090b', border: '1px solid rgba(168,85,247,0.4)', color: '#fff' }}
              />
              <button type="button" onClick={() => void sendLoveLetter()} disabled={!letterText.trim()} style={{ marginTop: '10px', padding: '11px 16px', borderRadius: '12px', border: 0, background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: letterText.trim() ? 1 : 0.5 }}>
                Maktubni yuborish
              </button>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', backgroundColor: '#18181b', borderRadius: '24px', border: '1px solid rgba(168,85,247,0.4)' }}>
              <h2 style={{ color: '#34d399', marginTop: 0 }}>🖼️ Xotiralar galereyasi</h2>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                <Camera size={17} /> Rasm qo‘shish
                <input type="file" accept="image/*" onChange={handleMemoryPhotoUpload} style={{ display: 'none' }} />
              </label>
              {memories.length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: '30px 0' }}>Hali xotiralar yo‘q. Birinchi rasmingizni qo‘shing.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  {memories.map((memory, index) => (
                    <Image key={`${index}-${memory.slice(0, 20)}`} src={memory} alt={`Xotira ${index + 1}`} width={400} height={300} unoptimized style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px' }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', backgroundColor: '#18181b', borderRadius: '24px', border: '1px solid rgba(168,85,247,0.4)', textAlign: 'center' }}>
              <div onClick={() => { setZoomedAvatarUrl(profileAvatar); setIsAvatarModalOpen(true); }} style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px auto', cursor: 'zoom-in' }}>
                <Image src={profileAvatar} alt="Profil rasmi" width={160} height={160} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: '#d8b4fe', cursor: 'pointer', fontSize: '13px' }}>
                <Camera size={16} /> Profil rasmini o‘zgartirish
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
              </label>
              <h2 style={{ color: '#fff', margin: '0 0 4px 0' }}>{profileName}</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ color: '#22d3ee' }}>ID: @{currentUser}</span>
                <button onClick={() => handleCopyUserId(currentUser)} style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(34,211,238,0.2)', color: '#22d3ee', border: 'none', cursor: 'pointer', fontSize: '11px' }}>Copy</button>
              </div>
              <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Ism" style={{ width: '100%', padding: '10px', borderRadius: '10px', backgroundColor: '#09090b', border: '1px solid #333', color: '#fff', marginBottom: '10px', outline: 'none' }} />
              <input type="text" value={profileBio} onChange={(e) => handleBioChange(e.target.value)} placeholder="Bio status..." style={{ width: '100%', padding: '10px', borderRadius: '10px', backgroundColor: '#09090b', border: '1px solid #333', color: '#fff', outline: 'none' }} />
              <label style={{ display: 'block', marginTop: '16px', textAlign: 'left', color: '#d8b4fe', fontSize: '13px' }}>
                Xabar yuborish
                <select value={messagePermission} onChange={(event) => setMessagePermission(event.target.value as typeof messagePermission)} style={{ display: 'block', width: '100%', marginTop: '6px', padding: '10px', borderRadius: '10px', background: '#09090b', border: '1px solid #333', color: '#fff' }}>
                  <option value="all">Barchaga</option>
                  <option value="contacts">Faqat kontaktlarimga</option>
                  <option value="nobody">Hech kimga</option>
                </select>
              </label>
              <label style={{ display: 'block', marginTop: '12px', textAlign: 'left', color: '#d8b4fe', fontSize: '13px' }}>
                Qo‘ng‘iroqlar
                <select value={callPermission} onChange={(event) => setCallPermission(event.target.value as typeof callPermission)} style={{ display: 'block', width: '100%', marginTop: '6px', padding: '10px', borderRadius: '10px', background: '#09090b', border: '1px solid #333', color: '#fff' }}>
                  <option value="all">Barchaga</option>
                  <option value="contacts">Faqat kontaktlarimga</option>
                  <option value="nobody">Hech kimga</option>
                </select>
              </label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
                {(['purple', 'pink', 'gold'] as const).map((theme) => (
                  <button key={theme} type="button" onClick={() => setBubbleTheme(theme)} aria-pressed={bubbleTheme === theme} style={{ padding: '8px 12px', borderRadius: '10px', border: bubbleTheme === theme ? '2px solid #fff' : '1px solid #555', background: theme === 'pink' ? '#be185d' : theme === 'gold' ? '#a16207' : '#6b21a8', color: '#fff', cursor: 'pointer' }}>
                    {theme === 'purple' ? 'Binafsha' : theme === 'pink' ? 'Pushti' : 'Oltin'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* INPUT QISMI (Faqat chat ichida) */}
        {activeTab === 'chat' && isChatOpen && (
          <form onSubmit={sendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 16px', borderTop: '1px solid rgba(147, 51, 234, 0.3)', backgroundColor: '#0c0a14', flexShrink: 0 }}>
            {showEmojiPicker && (
              <div aria-label="Emoji tanlash" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                {EMOJI_LIST.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => addEmojiToInput(emoji)} style={{ padding: '5px', border: 0, borderRadius: '8px', background: '#18181b', fontSize: '20px', cursor: 'pointer' }}>{emoji}</button>
                ))}
              </div>
            )}
            {showStickerPicker && (
              <div aria-label="Stiker tanlash" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {LOVE_STICKERS.map((sticker) => (
                  <button key={sticker.id} type="button" onClick={() => void sendSticker(sticker.content)} style={{ padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(168,85,247,0.35)', background: '#18181b', color: '#fff', cursor: 'pointer' }}>{sticker.label}</button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" aria-label="Emoji tanlash" onClick={() => { setShowEmojiPicker((shown) => !shown); setShowStickerPicker(false) }} style={{ padding: '9px', border: 0, borderRadius: '10px', background: '#18181b', color: '#f9a8d4', cursor: 'pointer' }}>
                <Smile size={19} />
              </button>
              <button type="button" aria-label="Stiker tanlash" onClick={() => { setShowStickerPicker((shown) => !shown); setShowEmojiPicker(false) }} style={{ padding: '9px', border: 0, borderRadius: '10px', background: '#18181b', color: '#d8b4fe', cursor: 'pointer' }}>
                <Gift size={19} />
              </button>
              <button type="button" aria-label={isRecording ? 'Ovoz yozishni to‘xtatish' : 'Ovoz yozishni boshlash'} onClick={isRecording ? stopRecording : () => void startRecording()} style={{ padding: '9px', border: 0, borderRadius: '10px', background: isRecording ? '#991b1b' : '#18181b', color: '#fca5a5', cursor: 'pointer' }}>
                {isRecording ? <MicOff size={19} /> : <Mic size={19} />}
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={selectedContact ? `${selectedContact.name} ga yozing...` : 'Xabar yozing...'}
                style={{ minWidth: 0, flex: 1, padding: '10px 14px', borderRadius: '14px', backgroundColor: '#18181b', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#ffffff', fontSize: '16px', outline: 'none' }}
              />
              <button type="submit" disabled={!newMessage.trim()} style={{ padding: '11px 18px', borderRadius: '14px', border: 'none', background: 'linear-gradient(to right, #ec4899, #9333ea)', color: '#ffffff', fontWeight: 600, cursor: 'pointer', display: 'flex', opacity: newMessage.trim() ? 1 : 0.55 }}>
                <Send size={18} />
              </button>
            </div>
          </form>
        )}

        {/* NAVIGATION BAR */}
        <nav style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderTop: '1px solid rgba(147, 51, 234, 0.3)', backgroundColor: '#09090b', padding: '10px 12px', flexShrink: 0 }}>
          <button onClick={() => { setActiveTab('chat'); setIsChatOpen(false); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: activeTab === 'chat' ? '#22d3ee' : '#6b7280', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}><MessageCircle size={19} /> Chatlar</button>
          <button onClick={() => setActiveTab('contacts')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: activeTab === 'contacts' ? '#38bdf8' : '#6b7280', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}><Users size={19} /> Kontaktlar</button>
          <button onClick={() => setActiveTab('gifts')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: activeTab === 'gifts' ? '#f472b6' : '#6b7280', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}><Gift size={19} /> Sovg&apos;alar</button>
          <button onClick={() => setActiveTab('couple')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: activeTab === 'couple' ? '#c084fc' : '#6b7280', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}><CalendarHeart size={19} /> Juftlik</button>
          <button onClick={() => setActiveTab('profile')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: activeTab === 'profile' ? '#facc15' : '#6b7280', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}><User size={19} /> Profil</button>
        </nav>
      </div>
    </div>
  )
}