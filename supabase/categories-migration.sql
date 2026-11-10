-- Promptory: categorie personalizzate per utente
-- Eseguire una sola volta nel Supabase SQL Editor.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 32),
  created_at timestamptz not null default now(),
  constraint categories_user_name_unique unique (user_id, name)
);

create index if not exists categories_user_idx on public.categories(user_id);
alter table public.categories enable row level security;

drop policy if exists "Users can read their own categories" on public.categories;
create policy "Users can read their own categories"
  on public.categories for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own categories" on public.categories;
create policy "Users can create their own categories"
  on public.categories for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own categories" on public.categories;
create policy "Users can update their own categories"
  on public.categories for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own categories" on public.categories;
create policy "Users can delete their own categories"
  on public.categories for delete to authenticated
  using (auth.uid() = user_id);
