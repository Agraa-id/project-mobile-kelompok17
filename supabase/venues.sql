create table if not exists public.venues (
  id text primary key,
  name text not null,
  sport text not null,
  location text not null,
  price integer not null check (price >= 0),
  rating numeric(2, 1),
  surface text,
  image text not null
);

alter table public.venues enable row level security;

grant select on public.venues to anon, authenticated;

drop policy if exists "venues_select_public" on public.venues;
create policy "venues_select_public"
  on public.venues
  for select
  to anon, authenticated
  using (true);

insert into public.venues (id, name, sport, location, price, rating, surface, image)
values
  (
    'urban-futsal',
    'Urban Futsal Kemang',
    'Futsal',
    'Kemang, Jakarta Selatan',
    180000,
    4.8,
    'Vinyl indoor',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80'
  ),
  (
    'cempaka-badminton',
    'Cempaka Badminton Hall',
    'Badminton',
    'Cilandak, Jakarta Selatan',
    75000,
    4.7,
    'Karpet sintetis',
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1000&q=80'
  ),
  (
    'northside-basket',
    'Northside Basket Court',
    'Basket',
    'Pondok Indah, Jakarta Selatan',
    220000,
    4.9,
    'Indoor hardwood',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=80'
  )
on conflict (id) do nothing;
