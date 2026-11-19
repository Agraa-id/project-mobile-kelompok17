create table if not exists public.venue_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.venue_tasks enable row level security;

grant select, insert, update, delete on public.venue_tasks to anon, authenticated;

drop policy if exists "venue_tasks_public_access" on public.venue_tasks;
create policy "venue_tasks_public_access"
  on public.venue_tasks
  for all
  to anon, authenticated
  using (true)
  with check (true);
