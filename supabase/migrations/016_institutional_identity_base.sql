-- Establish the minimal institutional identity contract required by migration 018.
-- Existing installations already have these tables; IF NOT EXISTS preserves them.
-- This migration intentionally does not evolve or normalize an existing schema.
create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'teacher',
  status text not null default 'active',
  can_manage_products boolean not null default false,
  can_audit boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_members_user_org_idx
  on public.organization_members(user_id, organization_id);


-- These are internal identity/authorization tables. They are accessed by the
-- trusted backend using service_role, not directly by browser roles.
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_members from anon, authenticated;
grant select, insert, update, delete on table public.organizations to service_role;
grant select, insert, update, delete on table public.organization_members to service_role;
