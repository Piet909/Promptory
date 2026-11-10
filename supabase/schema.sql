-- Promptory database schema
-- Run this file in Supabase SQL Editor before deploying.

create extension if not exists pgcrypto;

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  description text not null default '',
  category text not null default 'Generale',
  platform text not null default 'Universale',
  tags text[] not null default '{}',
  is_favorite boolean not null default false,
  is_public boolean not null default false,
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prompts_user_updated_idx
  on public.prompts(user_id, updated_at desc);
create index if not exists prompts_tags_idx on public.prompts using gin(tags);

alter table public.prompts enable row level security;

drop policy if exists "Users can read their own prompts" on public.prompts;
create policy "Users can read their own prompts"
  on public.prompts for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own prompts" on public.prompts;
create policy "Users can create their own prompts"
  on public.prompts for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own prompts" on public.prompts;
create policy "Users can update their own prompts"
  on public.prompts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own prompts" on public.prompts;
create policy "Users can delete their own prompts"
  on public.prompts for delete to authenticated
  using (auth.uid() = user_id);

-- Public sharing is intentionally not enabled in this first release:
-- every account has a private prompt vault by default.
-- Add a separate read-only community policy only when public gallery UX is ready.
