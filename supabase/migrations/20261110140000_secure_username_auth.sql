create table if not exists public.linksy_usernames (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (
      username ~ '^[a-z0-9._-]{3,30}$'
      and username not in ('all', 'system')
    ),
  created_at timestamptz not null default now()
);

alter table public.linksy_usernames enable row level security;
revoke all on public.linksy_usernames from anon, authenticated;
grant all on public.linksy_usernames to service_role;

create or replace function public.linksy_current_username()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select username
  from public.linksy_usernames
  where user_id = auth.uid()
$$;

revoke all on function public.linksy_current_username() from public, anon;
grant execute on function public.linksy_current_username() to authenticated, service_role;

create table if not exists public.linksy_auth_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0
);

alter table public.linksy_auth_rate_limits enable row level security;
revoke all on public.linksy_auth_rate_limits from public, anon, authenticated;
grant all on public.linksy_auth_rate_limits to service_role;

create or replace function public.linksy_consume_auth_rate_limit(
  p_rate_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_count integer;
begin
  insert into public.linksy_auth_rate_limits as attempts (
    rate_key,
    window_started_at,
    attempt_count
  )
  values (p_rate_key, now(), 1)
  on conflict (rate_key) do update
  set
    window_started_at = case when
      attempts.window_started_at < now() - pg_catalog.make_interval(secs => p_window_seconds)
      then now() else attempts.window_started_at end,
    attempt_count = case
      when attempts.window_started_at < now() - pg_catalog.make_interval(secs => p_window_seconds) then 1
      else attempts.attempt_count + 1
    end
  returning attempt_count into v_attempt_count;

  return v_attempt_count <= p_limit;
end;
$$;

revoke all on function public.linksy_consume_auth_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.linksy_consume_auth_rate_limit(text, integer, integer) to service_role;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('messages', 'contacts')
  loop
    execute format(
      'drop policy %I on public.%I',
      existing_policy.policyname,
      existing_policy.tablename
    );
  end loop;
end
$$;

alter table public.messages enable row level security;
alter table public.contacts enable row level security;

revoke all on public.messages, public.contacts from anon;
grant select, insert, delete on public.messages to authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
grant all on public.messages, public.contacts to service_role;

create policy "linksy messages are visible to participants"
on public.messages
for select
to authenticated
using (
  sender_id = public.linksy_current_username()
  or receiver_id = public.linksy_current_username()
  or sender_id = 'all'
  or receiver_id = 'all'
);

create policy "linksy users send as their own id"
on public.messages
for insert
to authenticated
with check (
  sender_id = public.linksy_current_username()
  and (receiver_id = 'all' or receiver_id ~ '^[a-z0-9._-]{3,30}$')
);

create policy "linksy users delete only their conversations"
on public.messages
for delete
to authenticated
using (
  sender_id = public.linksy_current_username()
  or (
    receiver_id = public.linksy_current_username()
    and sender_id <> 'all'
  )
);

create policy "linksy users read their own contacts"
on public.contacts
for select
to authenticated
using (owner_id = public.linksy_current_username());

create policy "linksy users add their own contacts"
on public.contacts
for insert
to authenticated
with check (owner_id = public.linksy_current_username());

create policy "linksy users update their own contacts"
on public.contacts
for update
to authenticated
using (owner_id = public.linksy_current_username())
with check (owner_id = public.linksy_current_username());

create policy "linksy users delete their own contacts"
on public.contacts
for delete
to authenticated
using (owner_id = public.linksy_current_username());

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end
$$;
