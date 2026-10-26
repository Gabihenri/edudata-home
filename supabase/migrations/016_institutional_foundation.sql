-- Foundation required by the institutional governance and EDI-QI migrations.
-- This migration is intentionally idempotent for databases where these tables
-- already exist. It does not seed institutions or memberships.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations
  add column if not exists name text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid,
  role text not null default 'teacher',
  status text not null default 'active',
  hierarchy_level integer not null default 10,
  scope_type text not null default 'self',
  scope_id uuid,
  reports_to_user_id uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  access_starts_at timestamptz,
  access_ends_at timestamptz,
  can_view_team boolean not null default false,
  can_view_school boolean not null default false,
  can_view_network boolean not null default false,
  can_manage_users boolean not null default false,
  can_manage_products boolean not null default false,
  can_audit boolean not null default false,
  can_access_private_content boolean not null default false,
  onboarding_completed boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_access_period_check
    check (access_ends_at is null or access_starts_at is null or access_ends_at >= access_starts_at)
);

-- Existing deployments may have an older organization_members table. Add the
-- columns consumed by later migrations without replacing existing records.
alter table public.organization_members
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists school_id uuid,
  add column if not exists role text not null default 'teacher',
  add column if not exists status text not null default 'active',
  add column if not exists hierarchy_level integer not null default 10,
  add column if not exists scope_type text not null default 'self',
  add column if not exists scope_id uuid,
  add column if not exists reports_to_user_id uuid references auth.users(id) on delete set null,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists access_starts_at timestamptz,
  add column if not exists access_ends_at timestamptz,
  add column if not exists can_view_team boolean not null default false,
  add column if not exists can_view_school boolean not null default false,
  add column if not exists can_view_network boolean not null default false,
  add column if not exists can_manage_users boolean not null default false,
  add column if not exists can_manage_products boolean not null default false,
  add column if not exists can_audit boolean not null default false,
  add column if not exists can_access_private_content boolean not null default false,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists organization_members_user_org_status_idx
  on public.organization_members(user_id, organization_id, status);
create index if not exists organization_members_school_idx
  on public.organization_members(school_id);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'organizations'
      and policyname = 'organizations_read_active_membership'
  ) then
    create policy organizations_read_active_membership
      on public.organizations for select
      to authenticated
      using (
        exists (
          select 1
          from public.organization_members member
          where member.organization_id = organizations.id
            and member.user_id = auth.uid()
            and member.status = 'active'
            and (member.access_starts_at is null or member.access_starts_at <= now())
            and (member.access_ends_at is null or member.access_ends_at > now())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_members'
      and policyname = 'organization_members_read_own'
  ) then
    create policy organization_members_read_own
      on public.organization_members for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end;
$$;

revoke all on table public.organizations from anon, authenticated;
grant select on table public.organizations to authenticated;
grant select on table public.organizations to service_role;

revoke all on table public.organization_members from anon, authenticated;
grant select on table public.organization_members to authenticated;
grant select on table public.organization_members to service_role;
