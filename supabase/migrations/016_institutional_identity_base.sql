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


-- Explicit Data API privileges. Browser reads are limited by RLS to the
-- signed-in user's active institutional membership; writes remain backend-only.
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

revoke all on table public.organizations from anon;
revoke all on table public.organization_members from anon;
grant select on table public.organizations to authenticated;
grant select on table public.organization_members to authenticated;
grant select, insert, update, delete on table public.organizations to service_role;
grant select, insert, update, delete on table public.organization_members to service_role;

drop policy if exists organization_members_read_own on public.organization_members;
create policy organization_members_read_own
  on public.organization_members for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists organizations_read_active_membership on public.organizations;
create policy organizations_read_active_membership
  on public.organizations for select to authenticated
  using (
    exists (
      select 1
      from public.organization_members member
      where member.organization_id = organizations.id
        and member.user_id = (select auth.uid())
        and member.status = 'active'
    )
  );
