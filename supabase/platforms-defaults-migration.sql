-- Promptory: rende personalizzabili le piattaforme predefinite per ogni utente.
-- Eseguire una sola volta nel Supabase SQL Editor, dopo platforms-migration.sql.

alter table public.ai_platforms
  add column if not exists is_system boolean not null default false,
  add column if not exists system_key text;

-- Una chiave stabile identifica ciascuna piattaforma inclusa, anche dopo una rinomina.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ai_platforms_user_system_key_unique'
      and conrelid = 'public.ai_platforms'::regclass
  ) then
    alter table public.ai_platforms
      add constraint ai_platforms_user_system_key_unique unique (user_id, system_key);
  end if;
end $$;

-- Protegge Altro da modifiche anche a livello database.
-- La UI non espone azioni di modifica, archiviazione o eliminazione per questa voce.
create or replace function public.promptory_protect_altro_platform()
returns trigger
language plpgsql
as $$
begin
  if old.system_key = 'altro' and (
    new.name is distinct from old.name or
    new.description is distinct from old.description or
    new.url is distinct from old.url or
    new.icon is distinct from old.icon or
    new.color is distinct from old.color or
    new.is_archived is distinct from old.is_archived
  ) then
    raise exception 'La piattaforma Altro è predefinita e non può essere modificata.';
  end if;
  return new;
end;
$$;

drop trigger if exists promptory_protect_altro_platform_trigger on public.ai_platforms;
create trigger promptory_protect_altro_platform_trigger
before update on public.ai_platforms
for each row execute function public.promptory_protect_altro_platform();

-- La protezione della riga Altro include anche l'eliminazione.
create or replace function public.promptory_protect_altro_platform_delete()
returns trigger
language plpgsql
as $$
begin
  if old.system_key = 'altro' then
    raise exception 'La piattaforma Altro è predefinita e non può essere eliminata.';
  end if;
  return old;
end;
$$;

drop trigger if exists promptory_protect_altro_platform_delete_trigger on public.ai_platforms;
create trigger promptory_protect_altro_platform_delete_trigger
before delete on public.ai_platforms
for each row execute function public.promptory_protect_altro_platform_delete();
