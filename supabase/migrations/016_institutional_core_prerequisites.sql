-- Bootstrap the institutional tables required by migrations 017/018.
-- Schema is aligned with the connected project's information_schema metadata
-- and the canonical Core definition in database/14_organizations.sql.
-- This is additive: existing tables are not altered by this migration.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text DEFAULT 'educational',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  short_name text,
  organization_type text NOT NULL DEFAULT 'other',
  document text,
  email text,
  phone text,
  website text,
  logo_url text,
  address text,
  city text,
  state text,
  zip_code text,
  country text DEFAULT 'Brasil',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_status_check
    CHECK (status IN ('active', 'inactive', 'pending', 'suspended', 'archived'))
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'professor',
  status text NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  school_id uuid,
  hierarchy_level integer NOT NULL DEFAULT 10,
  scope_type text NOT NULL DEFAULT 'self',
  scope_id uuid,
  department text,
  knowledge_area text,
  team_code text,
  reports_to_user_id uuid,
  approved_by uuid,
  approved_at timestamptz,
  access_starts_at timestamptz,
  access_ends_at timestamptz,
  can_view_team boolean NOT NULL DEFAULT false,
  can_view_school boolean NOT NULL DEFAULT false,
  can_view_network boolean NOT NULL DEFAULT false,
  can_manage_users boolean NOT NULL DEFAULT false,
  can_manage_products boolean NOT NULL DEFAULT false,
  can_audit boolean NOT NULL DEFAULT false,
  can_access_private_content boolean NOT NULL DEFAULT false,
  onboarding_completed boolean NOT NULL DEFAULT false,
  CONSTRAINT organization_members_unique UNIQUE (organization_id, user_id),
  CONSTRAINT organization_members_hierarchy_level_check
    CHECK (hierarchy_level >= 0 AND hierarchy_level <= 100),
  CONSTRAINT organization_members_scope_type_check
    CHECK (scope_type IN ('self', 'team', 'area', 'school', 'organization', 'network', 'platform')),
  CONSTRAINT organization_members_access_period_check
    CHECK (access_ends_at IS NULL OR access_starts_at IS NULL OR access_ends_at >= access_starts_at),
  CONSTRAINT organization_members_role_check
    CHECK (role IN ('professor', 'coordenador', 'diretor', 'administrador')),
  CONSTRAINT organization_members_status_check
    CHECK (status IN ('invited', 'active', 'suspended', 'removed'))
);

CREATE INDEX IF NOT EXISTS idx_organizations_status
  ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_organization_members_user
  ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization
  ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_status
  ON public.organization_members(status);

COMMIT;
