BEGIN;

-- =========================================================
-- EDUDATA IA — CORE COMPARTILHADO
-- BOOTSTRAP LOCAL DE ORGANIZAÇÃO E IDENTIDADE
--
-- O Core histórico mantém parte da evolução em database/*.sql,
-- enquanto o runner local aplica apenas supabase/migrations/*.
-- Este bootstrap reproduz somente o contrato estrutural mínimo
-- necessário para que as migrations ativas possam referenciar
-- organizations e organization_members.
--
-- A evolução completa e governança permanecem nas migrations
-- históricas do Core (ex.: database/13_identity_governance.sql
-- e database/14_organizations.sql).
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid,
  role text NOT NULL DEFAULT 'teacher',
  status text NOT NULL DEFAULT 'active',
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
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT organization_members_hierarchy_level_check
    CHECK (hierarchy_level >= 0 AND hierarchy_level <= 100),

  CONSTRAINT organization_members_scope_type_check
    CHECK (
      scope_type IN (
        'self',
        'team',
        'area',
        'school',
        'organization',
        'network',
        'platform'
      )
    ),

  CONSTRAINT organization_members_access_period_check
    CHECK (
      access_ends_at IS NULL
      OR access_starts_at IS NULL
      OR access_ends_at >= access_starts_at
    )
);

CREATE INDEX IF NOT EXISTS idx_organization_members_user
  ON public.organization_members(user_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_organization
  ON public.organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_school
  ON public.organization_members(school_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_role
  ON public.organization_members(role);

CREATE INDEX IF NOT EXISTS idx_organization_members_status
  ON public.organization_members(status);

COMMIT;
