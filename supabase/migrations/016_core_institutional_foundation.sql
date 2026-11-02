-- Core institucional mínimo para bootstrap local do Supabase.
-- Contrato reconstruído a partir do catálogo PostgreSQL do projeto remoto
-- em 2026-10-30. Esta migration não é executada automaticamente em produção
-- por este commit; ela permite que o histórico local alcance a migration 018.
--
-- Importante: preserva o contrato físico legado de organization_members.
-- Não cria vínculos FK organization_id/school_id que não existem no Core atual.

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp" with schema extensions;

create table if not exists public.organizations (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  type text default 'educational',
  status text not null default 'active'
    check (status in ('active', 'inactive', 'pending', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  short_name text,
  organization_type text not null default 'other',
  document text,
  email text,
  phone text,
  website text,
  logo_url text,
  address text,
  city text,
  state text,
  zip_code text,
  country text default 'Brasil',
  updated_at timestamptz not null default now()
);

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

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'professor'
    check (role in ('professor', 'coordenador', 'diretor', 'administrador')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'removed')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  school_id uuid,
  hierarchy_level integer not null default 10
    check (hierarchy_level >= 0 and hierarchy_level <= 100),
  scope_type text not null default 'self'
    check (scope_type in ('self', 'team', 'area', 'school', 'organization', 'network', 'platform')),
  scope_id uuid,
  department text,
  knowledge_area text,
  team_code text,
  reports_to_user_id uuid,
  approved_by uuid,
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
  constraint organization_members_unique unique (organization_id, user_id),
  constraint organization_members_access_period_check
    check (access_ends_at is null or access_starts_at is null or access_ends_at >= access_starts_at)
);

create index if not exists idx_organization_members_user
  on public.organization_members(user_id);
create index if not exists idx_organization_members_org
  on public.organization_members(organization_id);
create index if not exists idx_organization_members_school
  on public.organization_members(school_id);
create index if not exists idx_organization_members_role
  on public.organization_members(role);
create index if not exists idx_organization_members_hierarchy
  on public.organization_members(hierarchy_level);
create index if not exists idx_organization_members_scope
  on public.organization_members(scope_type, scope_id);
create index if not exists idx_organization_members_reports_to
  on public.organization_members(reports_to_user_id);
create index if not exists idx_organization_members_status
  on public.organization_members(status);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists organizations_active_member_read on public.organizations;
create policy organizations_active_member_read
  on public.organizations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = organizations.id
        and om.user_id = auth.uid()
        and lower(coalesce(om.status, '')) = 'active'
        and (om.access_starts_at is null or om.access_starts_at <= now())
        and (om.access_ends_at is null or om.access_ends_at >= now())
    )
  );

drop policy if exists organization_members_own_read on public.organization_members;
create policy organization_members_own_read
  on public.organization_members
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on public.organizations to authenticated;
grant select on public.organization_members to authenticated;

comment on table public.organizations is
  'Organizações institucionais compartilhadas por todos os produtos da EduData IA.';
comment on table public.organization_members is
  'Vínculos institucionais e escopos de autorização do Core compartilhado EduData IA.';
