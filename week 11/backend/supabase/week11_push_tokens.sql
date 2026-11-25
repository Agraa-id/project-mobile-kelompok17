create table if not exists public.week11_push_tokens (
  expo_push_token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('android', 'ios')),
  updated_at timestamptz not null default now()
);

alter table public.week11_push_tokens enable row level security;

grant select, delete on public.week11_push_tokens to authenticated;

drop policy if exists "week11_push_tokens_select_own" on public.week11_push_tokens;
create policy "week11_push_tokens_select_own"
  on public.week11_push_tokens
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "week11_push_tokens_delete_own" on public.week11_push_tokens;
create policy "week11_push_tokens_delete_own"
  on public.week11_push_tokens
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.register_week11_push_token(
  p_expo_push_token text,
  p_platform text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required to register a push token.';
  end if;

  if p_platform not in ('android', 'ios') then
    raise exception 'Push token platform must be android or ios.';
  end if;

  if p_expo_push_token is null
    or length(p_expo_push_token) > 256
    or not (
      p_expo_push_token like 'ExpoPushToken[%]'
      or p_expo_push_token like 'ExponentPushToken[%]'
    )
  then
    raise exception 'A valid Expo push token is required.';
  end if;

  insert into public.week11_push_tokens (expo_push_token, user_id, platform, updated_at)
  values (p_expo_push_token, current_user_id, p_platform, now())
  on conflict (expo_push_token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.register_week11_push_token(text, text) from public, anon;
grant execute on function public.register_week11_push_token(text, text) to authenticated;
