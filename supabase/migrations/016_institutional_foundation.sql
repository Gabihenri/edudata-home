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

-- Reconcile the institutional table with the organization repository contract.
-- Keep existing records and migrate the legacy type/active fields when present.
alter table public.organizations
  add column if not exists name text,
  add column if not exists short_name text,
  add column if not exists organization_type text,
  add column if not exists document text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists logo_url text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip_code text,
  add column if not exists country text,
  add column if not exists status text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'type'
  ) then
    execute $migration$
      update public.organizations
      set organization_type = coalesce(
        nullif(trim(organization_type), ''),
        nullif(trim(type), ''),
        'other'
      )
    $migration$;
  else
    update public.organizations
    set organization_type = coalesce(nullif(trim(organization_type), ''), 'other');
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'active'
  ) then
    execute $migration$
      update public.organizations
      set status = coalesce(
        nullif(trim(status), ''),
        case when active = true then 'active' else 'inactive' end
      )
    $migration$;
  else
    update public.organizations
    set status = coalesce(nullif(trim(status), ''), 'active');
  end if;
end;
$$;

update public.organizations
set
  country = coalesce(nullif(trim(country), ''), 'Brasil'),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, created_at, now()),
  organization_type = coalesce(nullif(trim(organization_type), ''), 'other'),
  status = coalesce(nullif(trim(status), ''), 'active');

alter table public.organizations
  alter column organization_type set default 'other',
  alter column organization_type set not null,
  alter column country set default 'Brasil',
  alter column status set default 'active',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.organizations
  drop constraint if exists organizations_status_check;

alter table public.organizations
  add constraint organizations_status_check
  check (status in ('active', 'inactive', 'pending', 'suspended', 'archived'));

create index if not exists idx_organizations_name
  on public.organizations(name);
create index if not exists idx_organizations_status
  on public.organizations(status);
create index if not exists idx_organizations_type
  on public.organizations(organization_type);
create index if not exists idx_organizations_city
  on public.organizations(city);
create index if not exists idx_organizations_state
  on public.organizations(state);
create unique index if not exists idx_organizations_document_unique
  on public.organizations(document)
  where document is not null and trim(document) <> '';

create or replace function public.set_organization_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute function public.set_organization_updated_at();

comment on table public.organizations is
  'Organizações institucionais compartilhadas por todos os produtos da EduData IA.';
comment on column public.organizations.organization_type is
  'Tipo da organização, como plataforma, secretaria, diretoria, rede, escola mantenedora, universidade ou empresa.';
comment on column public.organizations.status is
  'Situação operacional da organização na plataforma.';

-- Keep legacy deployments writable when old NOT NULL columns (type) remain.
-- New application writes use organization_type/status; legacy writes to type/active
-- are mirrored on updates. JSON conversion lets this trigger work on both schemas.
create or replace function public.sync_organization_legacy_columns()
returns trigger
language plpgsql
as $sync_org$
declare
  v_new jsonb := to_jsonb(NEW);
  v_old jsonb;
  v_type text;
  v_status text;
  v_has_legacy_type boolean;
  v_has_legacy_active boolean;
begin
  if TG_OP = 'UPDATE' then
    v_old := to_jsonb(OLD);
  else
    v_old := '{}'::jsonb;
  end if;

  select exists (
    select 1 from pg_attribute
    where attrelid = TG_RELID and attname = 'type'
      and attnum > 0 and not attisdropped
  ) into v_has_legacy_type;

  if v_has_legacy_type then
    if TG_OP = 'INSERT' then
      v_type := coalesce(nullif(v_new->>'organization_type', ''), nullif(v_new->>'type', ''), 'other');
    elsif (v_new->>'organization_type') is distinct from (v_old->>'organization_type') then
      v_type := coalesce(nullif(v_new->>'organization_type', ''), nullif(v_new->>'type', ''), 'other');
    elsif (v_new->>'type') is distinct from (v_old->>'type') then
      v_type := coalesce(nullif(v_new->>'type', ''), nullif(v_new->>'organization_type', ''), 'other');
    else
      v_type := coalesce(nullif(v_new->>'organization_type', ''), nullif(v_new->>'type', ''), 'other');
    end if;
    v_new := jsonb_set(v_new, '{organization_type}', to_jsonb(v_type), true);
    v_new := jsonb_set(v_new, '{type}', to_jsonb(v_type), true);
  end if;

  select exists (
    select 1 from pg_attribute
    where attrelid = TG_RELID and attname = 'active'
      and attnum > 0 and not attisdropped
  ) into v_has_legacy_active;

  if v_has_legacy_active then
    if TG_OP = 'INSERT' then
      v_status := case
        when coalesce((v_new->>'active')::boolean, true) = false then 'inactive'
        else coalesce(nullif(v_new->>'status', ''), 'active')
      end;
    elsif (v_new->>'status') is distinct from (v_old->>'status') then
      v_status := coalesce(nullif(v_new->>'status', ''), 'active');
    elsif (v_new->>'active') is distinct from (v_old->>'active') then
      v_status := case when coalesce((v_new->>'active')::boolean, true) then 'active' else 'inactive' end;
    else
      v_status := coalesce(nullif(v_new->>'status', ''), case when coalesce((v_new->>'active')::boolean, true) then 'active' else 'inactive' end);
    end if;
    v_new := jsonb_set(v_new, '{status}', to_jsonb(v_status), true);
    v_new := jsonb_set(v_new, '{active}', to_jsonb(v_status = 'active'), true);
  end if;

  return jsonb_populate_record(NEW, v_new);
end;
$sync_org$;

drop trigger if exists trg_organizations_sync_legacy_columns on public.organizations;
create trigger trg_organizations_sync_legacy_columns
before insert or update on public.organizations
for each row execute function public.sync_organization_legacy_columns();

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
