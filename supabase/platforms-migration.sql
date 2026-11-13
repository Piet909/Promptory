-- Promptory: piattaforme AI personalizzate per utente
-- Eseguire una sola volta nel Supabase SQL Editor.

create table if not exists public.ai_platforms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 50),
  description text,
  url text,
  icon text,
  color text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_platforms_user_name_unique unique (user_id, name)
);

create index if not exists ai_platforms_user_idx
  on public.ai_platforms(user_id, is_archived, name);

alter table public.ai_platforms enable row level security;

drop policy if exists "Users can read their own AI platforms" on public.ai_platforms;
create policy "Users can read their own AI platforms"
  on public.ai_platforms for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own AI platforms" on public.ai_platforms;
create policy "Users can create their own AI platforms"
  on public.ai_platforms for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own AI platforms" on public.ai_platforms;
create policy "Users can update their own AI platforms"
  on public.ai_platforms for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own AI platforms" on public.ai_platforms;
create policy "Users can delete their own AI platforms"
  on public.ai_platforms for delete to authenticated
  using (auth.uid() = user_id);
