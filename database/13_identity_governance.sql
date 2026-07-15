BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 13 — IDENTITY & INSTITUTIONAL GOVERNANCE
-- =========================================================
--
-- Objetivos:
-- 1. Evoluir vínculos institucionais existentes.
-- 2. Implementar hierarquia e escopo de acesso.
-- 3. Impedir acesso automático entre usuários pares.
-- 4. Preparar autorização compartilhada entre produtos.
-- 5. Criar trilha central de auditoria.
--
-- Regra oficial:
-- - usuário comum vê apenas seus próprios registros;
-- - usuários pares não acessam registros individuais entre si;
-- - superiores acessam somente subordinados no próprio escopo;
-- - acesso de auditoria deve ser autorizado e registrado;
-- - administrador técnico não acessa conteúdo pedagógico por padrão.
-- =========================================================


-- =========================================================
-- 1. EXTENSÕES
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================================================
-- 2. ORGANIZATION_MEMBERS
-- =========================================================

DO $$
BEGIN
  IF to_regclass('public.organization_members') IS NULL THEN
    RAISE EXCEPTION
      'A tabela public.organization_members não existe. Migration interrompida para evitar criação de arquitetura paralela.';
  END IF;
END;
$$;


ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS school_id uuid,
  ADD COLUMN IF NOT EXISTS hierarchy_level integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS scope_type text NOT NULL DEFAULT 'self',
  ADD COLUMN IF NOT EXISTS scope_id uuid,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS knowledge_area text,
  ADD COLUMN IF NOT EXISTS team_code text,
  ADD COLUMN IF NOT EXISTS reports_to_user_id uuid,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS can_view_team boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_school boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_network boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_users boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_products boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_audit boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_access_private_content boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();


ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_hierarchy_level_check;

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_hierarchy_level_check
  CHECK (
    hierarchy_level >= 0
    AND hierarchy_level <= 100
  );


ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_scope_type_check;

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_scope_type_check
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
  );


ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_access_period_check;

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_access_period_check
  CHECK (
    access_ends_at IS NULL
    OR access_starts_at IS NULL
    OR access_ends_at >= access_starts_at
  );


CREATE INDEX IF NOT EXISTS idx_organization_members_user
  ON public.organization_members(user_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_organization
  ON public.organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_school
  ON public.organization_members(school_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_role
  ON public.organization_members(role);

CREATE INDEX IF NOT EXISTS idx_organization_members_hierarchy
  ON public.organization_members(hierarchy_level);

CREATE INDEX IF NOT EXISTS idx_organization_members_scope
  ON public.organization_members(scope_type, scope_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_reports_to
  ON public.organization_members(reports_to_user_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_status
  ON public.organization_members(status);


-- =========================================================
-- 3. USERS
-- =========================================================

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS phone text,
      ADD COLUMN IF NOT EXISTS requested_role text,
      ADD COLUMN IF NOT EXISTS profile_status text NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS active_organization_id uuid,
      ADD COLUMN IF NOT EXISTS active_school_id uuid,
      ADD COLUMN IF NOT EXISTS last_profile_update_at timestamptz,
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

    ALTER TABLE public.users
      DROP CONSTRAINT IF EXISTS users_profile_status_check;

    ALTER TABLE public.users
      ADD CONSTRAINT users_profile_status_check
      CHECK (
        profile_status IN (
          'pending',
          'active',
          'suspended',
          'rejected',
          'archived'
        )
      );

    CREATE INDEX IF NOT EXISTS idx_users_profile_status
      ON public.users(profile_status);

    CREATE INDEX IF NOT EXISTS idx_users_active_organization
      ON public.users(active_organization_id);

    CREATE INDEX IF NOT EXISTS idx_users_active_school
      ON public.users(active_school_id);
  END IF;
END;
$$;


-- =========================================================
-- 4. TEACHER_PROFILES
-- =========================================================

DO $$
BEGIN
  IF to_regclass('public.teacher_profiles') IS NOT NULL THEN
    ALTER TABLE public.teacher_profiles
      ADD COLUMN IF NOT EXISTS school_id uuid,
      ADD COLUMN IF NOT EXISTS organization_id uuid,
      ADD COLUMN IF NOT EXISTS knowledge_area text,
      ADD COLUMN IF NOT EXISTS teaching_stage text,
      ADD COLUMN IF NOT EXISTS subjects text[] NOT NULL DEFAULT ARRAY[]::text[],
      ADD COLUMN IF NOT EXISTS professional_registration text,
      ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

    CREATE INDEX IF NOT EXISTS idx_teacher_profiles_school
      ON public.teacher_profiles(school_id);

    CREATE INDEX IF NOT EXISTS idx_teacher_profiles_organization
      ON public.teacher_profiles(organization_id);

    CREATE INDEX IF NOT EXISTS idx_teacher_profiles_knowledge_area
      ON public.teacher_profiles(knowledge_area);
  END IF;
END;
$$;


-- =========================================================
-- 5. MATRIZ CENTRAL DE PERFIS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.identity_roles (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  hierarchy_level integer NOT NULL,
  default_scope_type text NOT NULL DEFAULT 'self',
  is_institutional_role boolean NOT NULL DEFAULT true,
  is_platform_role boolean NOT NULL DEFAULT false,
  can_view_team boolean NOT NULL DEFAULT false,
  can_view_school boolean NOT NULL DEFAULT false,
  can_view_network boolean NOT NULL DEFAULT false,
  can_manage_users boolean NOT NULL DEFAULT false,
  can_manage_products boolean NOT NULL DEFAULT false,
  can_audit boolean NOT NULL DEFAULT false,
  can_access_private_content boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT identity_roles_hierarchy_check
  CHECK (
    hierarchy_level >= 0
    AND hierarchy_level <= 100
  ),

  CONSTRAINT identity_roles_scope_check
  CHECK (
    default_scope_type IN (
      'self',
      'team',
      'area',
      'school',
      'organization',
      'network',
      'platform'
    )
  )
);


INSERT INTO public.identity_roles (
  code,
  name,
  description,
  hierarchy_level,
  default_scope_type,
  is_institutional_role,
  is_platform_role,
  can_view_team,
  can_view_school,
  can_view_network,
  can_manage_users,
  can_manage_products,
  can_audit,
  can_access_private_content
)
VALUES
  (
    'student',
    'Estudante',
    'Acessa somente seus próprios dados e recursos liberados.',
    5,
    'self',
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false
  ),
  (
    'teacher',
    'Professor',
    'Acessa somente seus próprios registros pedagógicos.',
    10,
    'self',
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false
  ),
  (
    'coordinator',
    'Coordenador',
    'Visualiza profissionais vinculados à sua equipe ou área.',
    30,
    'team',
    true,
    false,
    true,
    false,
    false,
    false,
    false,
    true,
    true
  ),
  (
    'vice_principal',
    'Vice-diretor',
    'Acessa dados autorizados da escola sob sua responsabilidade.',
    40,
    'school',
    true,
    false,
    true,
    true,
    false,
    false,
    false,
    true,
    true
  ),
  (
    'principal',
    'Diretor',
    'Acessa dados institucionais da escola sob sua gestão.',
    50,
    'school',
    true,
    false,
    true,
    true,
    false,
    true,
    true,
    true,
    true
  ),
  (
    'supervisor',
    'Supervisor',
    'Acessa escolas e equipes dentro do escopo de supervisão.',
    60,
    'organization',
    true,
    false,
    true,
    true,
    false,
    false,
    false,
    true,
    true
  ),
  (
    'regional_manager',
    'Gestor Regional',
    'Acessa unidades vinculadas à região sob sua responsabilidade.',
    70,
    'network',
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  ),
  (
    'institution_admin',
    'Administrador Institucional',
    'Gerencia usuários, vínculos, produtos e configurações da instituição.',
    80,
    'organization',
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    false
  ),
  (
    'platform_admin',
    'Administrador da Plataforma',
    'Administra recursos técnicos sem acesso automático a conteúdo privado.',
    90,
    'platform',
    false,
    true,
    false,
    false,
    false,
    true,
    true,
    true,
    false
  ),
  (
    'super_admin',
    'Superadministrador EduData IA',
    'Executa administração superior e acessos excepcionais auditados.',
    100,
    'platform',
    false,
    true,
    false,
    false,
    false,
    true,
    true,
    true,
    false
  )
ON CONFLICT (code)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  hierarchy_level = EXCLUDED.hierarchy_level,
  default_scope_type = EXCLUDED.default_scope_type,
  is_institutional_role = EXCLUDED.is_institutional_role,
  is_platform_role = EXCLUDED.is_platform_role,
  can_view_team = EXCLUDED.can_view_team,
  can_view_school = EXCLUDED.can_view_school,
  can_view_network = EXCLUDED.can_view_network,
  can_manage_users = EXCLUDED.can_manage_users,
  can_manage_products = EXCLUDED.can_manage_products,
  can_audit = EXCLUDED.can_audit,
  can_access_private_content = EXCLUDED.can_access_private_content,
  is_active = true,
  updated_at = now();


-- =========================================================
-- 6. ESCOPO EXPLÍCITO DE RESPONSABILIDADE
-- =========================================================

CREATE TABLE IF NOT EXISTS public.identity_responsibility_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  school_id uuid,
  manager_user_id uuid NOT NULL,
  target_user_id uuid,
  scope_type text NOT NULL,
  scope_reference_id uuid,
  knowledge_area text,
  department text,
  team_code text,
  permission_level text NOT NULL DEFAULT 'view',
  reason text,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT identity_responsibility_scope_type_check
  CHECK (
    scope_type IN (
      'user',
      'team',
      'area',
      'school',
      'organization',
      'network'
    )
  ),

  CONSTRAINT identity_responsibility_permission_check
  CHECK (
    permission_level IN (
      'view',
      'review',
      'manage',
      'audit'
    )
  ),

  CONSTRAINT identity_responsibility_status_check
  CHECK (
    status IN (
      'pending',
      'active',
      'suspended',
      'revoked',
      'expired'
    )
  ),

  CONSTRAINT identity_responsibility_period_check
  CHECK (
    valid_until IS NULL
    OR valid_until >= valid_from
  )
);


CREATE INDEX IF NOT EXISTS idx_identity_scope_manager
  ON public.identity_responsibility_scopes(manager_user_id);

CREATE INDEX IF NOT EXISTS idx_identity_scope_target
  ON public.identity_responsibility_scopes(target_user_id);

CREATE INDEX IF NOT EXISTS idx_identity_scope_organization
  ON public.identity_responsibility_scopes(organization_id);

CREATE INDEX IF NOT EXISTS idx_identity_scope_school
  ON public.identity_responsibility_scopes(school_id);

CREATE INDEX IF NOT EXISTS idx_identity_scope_status
  ON public.identity_responsibility_scopes(status);


-- =========================================================
-- 7. PRODUTOS E PERMISSÕES POR PERFIL
-- =========================================================

CREATE TABLE IF NOT EXISTS public.identity_product_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code text NOT NULL,
  product_code text NOT NULL,
  can_access boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_view_own boolean NOT NULL DEFAULT true,
  can_view_team boolean NOT NULL DEFAULT false,
  can_view_school boolean NOT NULL DEFAULT false,
  can_view_organization boolean NOT NULL DEFAULT false,
  can_update_own boolean NOT NULL DEFAULT true,
  can_update_others boolean NOT NULL DEFAULT false,
  can_delete_own boolean NOT NULL DEFAULT true,
  can_delete_others boolean NOT NULL DEFAULT false,
  can_export boolean NOT NULL DEFAULT false,
  can_audit boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT identity_product_permissions_unique
  UNIQUE (role_code, product_code)
);


CREATE INDEX IF NOT EXISTS idx_identity_product_permissions_role
  ON public.identity_product_permissions(role_code);

CREATE INDEX IF NOT EXISTS idx_identity_product_permissions_product
  ON public.identity_product_permissions(product_code);


INSERT INTO public.identity_product_permissions (
  role_code,
  product_code,
  can_access,
  can_create,
  can_view_own,
  can_view_team,
  can_view_school,
  can_view_organization,
  can_update_own,
  can_update_others,
  can_delete_own,
  can_delete_others,
  can_export,
  can_audit
)
VALUES
  ('teacher', 'professor_digital', true, true, true, false, false, false, true, false, true, false, true, false),
  ('teacher', 'agenda_edi', true, true, true, false, false, false, true, false, true, false, true, false),
  ('teacher', 'academy', true, false, true, false, false, false, false, false, false, false, true, false),
  ('teacher', 'analytics', true, false, true, false, false, false, false, false, false, false, true, false),

  ('coordinator', 'professor_digital', true, true, true, true, false, false, true, false, true, false, true, true),
  ('coordinator', 'agenda_edi', true, true, true, true, false, false, true, false, true, false, true, true),
  ('coordinator', 'academy', true, false, true, true, false, false, false, false, false, false, true, false),
  ('coordinator', 'analytics', true, false, true, true, false, false, false, false, false, false, true, true),
  ('coordinator', 'sgpa', true, false, true, true, false, false, false, false, false, false, true, true),

  ('vice_principal', 'agenda_edi', true, false, true, true, true, false, false, false, false, false, true, true),
  ('vice_principal', 'analytics', true, false, true, true, true, false, false, false, false, false, true, true),
  ('vice_principal', 'sgpa', true, false, true, true, true, false, false, false, false, false, true, true),

  ('principal', 'agenda_edi', true, false, true, true, true, false, false, false, false, false, true, true),
  ('principal', 'analytics', true, false, true, true, true, false, false, false, false, false, true, true),
  ('principal', 'academy', true, false, true, true, true, false, false, false, false, false, true, true),
  ('principal', 'sgpa', true, true, true, true, true, false, true, true, true, false, true, true),

  ('institution_admin', 'backoffice', true, true, true, true, true, true, true, true, true, true, true, true),
  ('institution_admin', 'experience_manager', true, true, true, true, true, true, true, true, true, true, true, true),

  ('platform_admin', 'backoffice', true, true, true, false, false, false, true, false, true, false, true, true),
  ('platform_admin', 'experience_manager', true, true, true, false, false, false, true, false, true, false, true, true),

  ('super_admin', 'backoffice', true, true, true, true, true, true, true, true, true, true, true, true),
  ('super_admin', 'experience_manager', true, true, true, true, true, true, true, true, true, true, true, true)
ON CONFLICT (role_code, product_code)
DO UPDATE SET
  can_access = EXCLUDED.can_access,
  can_create = EXCLUDED.can_create,
  can_view_own = EXCLUDED.can_view_own,
  can_view_team = EXCLUDED.can_view_team,
  can_view_school = EXCLUDED.can_view_school,
  can_view_organization = EXCLUDED.can_view_organization,
  can_update_own = EXCLUDED.can_update_own,
  can_update_others = EXCLUDED.can_update_others,
  can_delete_own = EXCLUDED.can_delete_own,
  can_delete_others = EXCLUDED.can_delete_others,
  can_export = EXCLUDED.can_export,
  can_audit = EXCLUDED.can_audit,
  updated_at = now();


-- =========================================================
-- 8. AUDITORIA CENTRAL
-- =========================================================

CREATE TABLE IF NOT EXISTS public.identity_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_role text,
  organization_id uuid,
  school_id uuid,
  product_code text NOT NULL,
  module_code text,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  resource_owner_user_id uuid,
  access_scope text,
  access_reason text,
  audit_case_reference text,
  request_id text,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  denied_reason text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);


CREATE INDEX IF NOT EXISTS idx_identity_audit_actor
  ON public.identity_audit_logs(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_identity_audit_owner
  ON public.identity_audit_logs(resource_owner_user_id);

CREATE INDEX IF NOT EXISTS idx_identity_audit_organization
  ON public.identity_audit_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_identity_audit_school
  ON public.identity_audit_logs(school_id);

CREATE INDEX IF NOT EXISTS idx_identity_audit_product
  ON public.identity_audit_logs(product_code);

CREATE INDEX IF NOT EXISTS idx_identity_audit_resource
  ON public.identity_audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_identity_audit_occurred_at
  ON public.identity_audit_logs(occurred_at DESC);


-- =========================================================
-- 9. SOLICITAÇÕES DE ACESSO DE AUDITORIA
-- =========================================================

CREATE TABLE IF NOT EXISTS public.identity_audit_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  school_id uuid,
  target_user_id uuid,
  product_code text NOT NULL,
  resource_type text,
  resource_id uuid,
  reason text NOT NULL,
  legal_or_institutional_basis text,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid,
  approved_at timestamptz,
  rejected_by uuid,
  rejected_at timestamptz,
  expires_at timestamptz,
  closed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT identity_audit_request_status_check
  CHECK (
    status IN (
      'pending',
      'approved',
      'rejected',
      'expired',
      'closed'
    )
  )
);


CREATE INDEX IF NOT EXISTS idx_identity_audit_request_requester
  ON public.identity_audit_access_requests(requester_user_id);

CREATE INDEX IF NOT EXISTS idx_identity_audit_request_target
  ON public.identity_audit_access_requests(target_user_id);

CREATE INDEX IF NOT EXISTS idx_identity_audit_request_status
  ON public.identity_audit_access_requests(status);

CREATE INDEX IF NOT EXISTS idx_identity_audit_request_organization
  ON public.identity_audit_access_requests(organization_id);


-- =========================================================
-- 10. FUNÇÕES AUXILIARES DE IDENTIDADE
-- =========================================================

CREATE OR REPLACE FUNCTION public.current_identity_membership()
RETURNS public.organization_members
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT om
  FROM public.organization_members om
  WHERE om.user_id = auth.uid()
    AND lower(coalesce(om.status, '')) = 'active'
    AND (
      om.access_starts_at IS NULL
      OR om.access_starts_at <= now()
    )
    AND (
      om.access_ends_at IS NULL
      OR om.access_ends_at >= now()
    )
  ORDER BY
    om.hierarchy_level DESC,
    om.created_at ASC
  LIMIT 1;
$$;


CREATE OR REPLACE FUNCTION public.current_identity_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT om.role
  FROM public.organization_members om
  WHERE om.user_id = auth.uid()
    AND lower(coalesce(om.status, '')) = 'active'
    AND (
      om.access_starts_at IS NULL
      OR om.access_starts_at <= now()
    )
    AND (
      om.access_ends_at IS NULL
      OR om.access_ends_at >= now()
    )
  ORDER BY
    om.hierarchy_level DESC,
    om.created_at ASC
  LIMIT 1;
$$;


CREATE OR REPLACE FUNCTION public.current_identity_hierarchy_level()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (
      SELECT om.hierarchy_level
      FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND lower(coalesce(om.status, '')) = 'active'
        AND (
          om.access_starts_at IS NULL
          OR om.access_starts_at <= now()
        )
        AND (
          om.access_ends_at IS NULL
          OR om.access_ends_at >= now()
        )
      ORDER BY
        om.hierarchy_level DESC,
        om.created_at ASC
      LIMIT 1
    ),
    0
  );
$$;


CREATE OR REPLACE FUNCTION public.can_access_identity_product(
  requested_product_code text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.identity_product_permissions ipp
      ON ipp.role_code = om.role
    WHERE om.user_id = auth.uid()
      AND lower(coalesce(om.status, '')) = 'active'
      AND ipp.product_code = requested_product_code
      AND ipp.can_access = true
      AND (
        om.access_starts_at IS NULL
        OR om.access_starts_at <= now()
      )
      AND (
        om.access_ends_at IS NULL
        OR om.access_ends_at >= now()
      )
  );
$$;


CREATE OR REPLACE FUNCTION public.can_view_identity_user(
  target_user_id uuid,
  target_organization_id uuid DEFAULT NULL,
  target_school_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  membership public.organization_members;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF auth.uid() = target_user_id THEN
    RETURN true;
  END IF;

  SELECT om.*
  INTO membership
  FROM public.organization_members om
  WHERE om.user_id = auth.uid()
    AND lower(coalesce(om.status, '')) = 'active'
    AND (
      om.access_starts_at IS NULL
      OR om.access_starts_at <= now()
    )
    AND (
      om.access_ends_at IS NULL
      OR om.access_ends_at >= now()
    )
  ORDER BY
    om.hierarchy_level DESC,
    om.created_at ASC
  LIMIT 1;

  IF membership.id IS NULL THEN
    RETURN false;
  END IF;

  IF target_organization_id IS NOT NULL
     AND membership.organization_id <> target_organization_id THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.identity_responsibility_scopes scope
    WHERE scope.manager_user_id = auth.uid()
      AND scope.target_user_id = target_user_id
      AND scope.status = 'active'
      AND scope.valid_from <= now()
      AND (
        scope.valid_until IS NULL
        OR scope.valid_until >= now()
      )
  ) THEN
    RETURN true;
  END IF;

  IF membership.can_view_school = true
     AND membership.school_id IS NOT NULL
     AND target_school_id = membership.school_id THEN
    RETURN true;
  END IF;

  IF membership.can_view_network = true
     AND membership.organization_id = target_organization_id THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;


-- =========================================================
-- 11. TRIGGERS DE UPDATED_AT
-- =========================================================

CREATE OR REPLACE FUNCTION public.set_identity_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_organization_members_updated_at
  ON public.organization_members;

CREATE TRIGGER trg_organization_members_updated_at
BEFORE UPDATE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.set_identity_updated_at();


DROP TRIGGER IF EXISTS trg_identity_roles_updated_at
  ON public.identity_roles;

CREATE TRIGGER trg_identity_roles_updated_at
BEFORE UPDATE ON public.identity_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_identity_updated_at();


DROP TRIGGER IF EXISTS trg_identity_responsibility_scopes_updated_at
  ON public.identity_responsibility_scopes;

CREATE TRIGGER trg_identity_responsibility_scopes_updated_at
BEFORE UPDATE ON public.identity_responsibility_scopes
FOR EACH ROW
EXECUTE FUNCTION public.set_identity_updated_at();


DROP TRIGGER IF EXISTS trg_identity_product_permissions_updated_at
  ON public.identity_product_permissions;

CREATE TRIGGER trg_identity_product_permissions_updated_at
BEFORE UPDATE ON public.identity_product_permissions
FOR EACH ROW
EXECUTE FUNCTION public.set_identity_updated_at();


-- =========================================================
-- 12. RLS DAS NOVAS TABELAS
-- =========================================================

ALTER TABLE public.identity_roles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.identity_responsibility_scopes
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.identity_product_permissions
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.identity_audit_logs
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.identity_audit_access_requests
  ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS identity_roles_authenticated_read
  ON public.identity_roles;

CREATE POLICY identity_roles_authenticated_read
ON public.identity_roles
FOR SELECT
TO authenticated
USING (is_active = true);


DROP POLICY IF EXISTS identity_permissions_authenticated_read
  ON public.identity_product_permissions;

CREATE POLICY identity_permissions_authenticated_read
ON public.identity_product_permissions
FOR SELECT
TO authenticated
USING (true);


DROP POLICY IF EXISTS responsibility_scopes_owner_or_manager
  ON public.identity_responsibility_scopes;

CREATE POLICY responsibility_scopes_owner_or_manager
ON public.identity_responsibility_scopes
FOR SELECT
TO authenticated
USING (
  manager_user_id = auth.uid()
  OR target_user_id = auth.uid()
);


DROP POLICY IF EXISTS audit_requests_requester_read
  ON public.identity_audit_access_requests;

CREATE POLICY audit_requests_requester_read
ON public.identity_audit_access_requests
FOR SELECT
TO authenticated
USING (
  requester_user_id = auth.uid()
  OR target_user_id = auth.uid()
);


DROP POLICY IF EXISTS audit_requests_requester_insert
  ON public.identity_audit_access_requests;

CREATE POLICY audit_requests_requester_insert
ON public.identity_audit_access_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requester_user_id = auth.uid()
);


-- Logs de auditoria não ficam disponíveis diretamente
-- para usuários comuns. Leitura deve ocorrer por API
-- administrativa autorizada e auditada.


-- =========================================================
-- 13. NORMALIZAÇÃO INICIAL DOS VÍNCULOS EXISTENTES
-- =========================================================

UPDATE public.organization_members
SET
  hierarchy_level = CASE lower(coalesce(role, ''))
    WHEN 'student' THEN 5
    WHEN 'aluno' THEN 5

    WHEN 'teacher' THEN 10
    WHEN 'professor' THEN 10

    WHEN 'coordinator' THEN 30
    WHEN 'coordenador' THEN 30

    WHEN 'vice_principal' THEN 40
    WHEN 'vice-diretor' THEN 40
    WHEN 'vice_diretor' THEN 40

    WHEN 'principal' THEN 50
    WHEN 'director' THEN 50
    WHEN 'diretor' THEN 50

    WHEN 'supervisor' THEN 60

    WHEN 'regional_manager' THEN 70
    WHEN 'gestor_regional' THEN 70

    WHEN 'institution_admin' THEN 80
    WHEN 'admin_institucional' THEN 80

    WHEN 'platform_admin' THEN 90
    WHEN 'admin' THEN 90

    WHEN 'super_admin' THEN 100

    ELSE hierarchy_level
  END,

  scope_type = CASE lower(coalesce(role, ''))
    WHEN 'student' THEN 'self'
    WHEN 'aluno' THEN 'self'

    WHEN 'teacher' THEN 'self'
    WHEN 'professor' THEN 'self'

    WHEN 'coordinator' THEN 'team'
    WHEN 'coordenador' THEN 'team'

    WHEN 'vice_principal' THEN 'school'
    WHEN 'vice-diretor' THEN 'school'
    WHEN 'vice_diretor' THEN 'school'

    WHEN 'principal' THEN 'school'
    WHEN 'director' THEN 'school'
    WHEN 'diretor' THEN 'school'

    WHEN 'supervisor' THEN 'organization'

    WHEN 'regional_manager' THEN 'network'
    WHEN 'gestor_regional' THEN 'network'

    WHEN 'institution_admin' THEN 'organization'
    WHEN 'admin_institucional' THEN 'organization'

    WHEN 'platform_admin' THEN 'platform'
    WHEN 'admin' THEN 'platform'
    WHEN 'super_admin' THEN 'platform'

    ELSE scope_type
  END,

  can_view_team = CASE
    WHEN lower(coalesce(role, '')) IN (
      'coordinator',
      'coordenador',
      'vice_principal',
      'vice-diretor',
      'vice_diretor',
      'principal',
      'director',
      'diretor',
      'supervisor',
      'regional_manager',
      'gestor_regional',
      'institution_admin',
      'admin_institucional'
    )
    THEN true
    ELSE can_view_team
  END,

  can_view_school = CASE
    WHEN lower(coalesce(role, '')) IN (
      'vice_principal',
      'vice-diretor',
      'vice_diretor',
      'principal',
      'director',
      'diretor',
      'supervisor',
      'regional_manager',
      'gestor_regional',
      'institution_admin',
      'admin_institucional'
    )
    THEN true
    ELSE can_view_school
  END,

  can_view_network = CASE
    WHEN lower(coalesce(role, '')) IN (
      'regional_manager',
      'gestor_regional',
      'institution_admin',
      'admin_institucional'
    )
    THEN true
    ELSE can_view_network
  END,

  can_manage_users = CASE
    WHEN lower(coalesce(role, '')) IN (
      'principal',
      'director',
      'diretor',
      'regional_manager',
      'gestor_regional',
      'institution_admin',
      'admin_institucional',
      'platform_admin',
      'admin',
      'super_admin'
    )
    THEN true
    ELSE can_manage_users
  END,

  can_manage_products = CASE
    WHEN lower(coalesce(role, '')) IN (
      'institution_admin',
      'admin_institucional',
      'platform_admin',
      'admin',
      'super_admin'
    )
    THEN true
    ELSE can_manage_products
  END,

  can_audit = CASE
    WHEN lower(coalesce(role, '')) IN (
      'coordinator',
      'coordenador',
      'vice_principal',
      'vice-diretor',
      'vice_diretor',
      'principal',
      'director',
      'diretor',
      'supervisor',
      'regional_manager',
      'gestor_regional',
      'institution_admin',
      'admin_institucional',
      'platform_admin',
      'admin',
      'super_admin'
    )
    THEN true
    ELSE can_audit
  END,

  can_access_private_content = CASE
    WHEN lower(coalesce(role, '')) IN (
      'coordinator',
      'coordenador',
      'vice_principal',
      'vice-diretor',
      'vice_diretor',
      'principal',
      'director',
      'diretor',
      'supervisor',
      'regional_manager',
      'gestor_regional'
    )
    THEN true
    ELSE false
  END,

  updated_at = now();


-- =========================================================
-- 14. COMENTÁRIOS INSTITUCIONAIS
-- =========================================================

COMMENT ON TABLE public.identity_roles IS
  'Matriz central de perfis e níveis hierárquicos compartilhada por todos os produtos da EduData IA.';

COMMENT ON TABLE public.identity_responsibility_scopes IS
  'Define quais usuários, equipes, áreas, escolas ou organizações estão sob responsabilidade de um gestor.';

COMMENT ON TABLE public.identity_product_permissions IS
  'Define permissões padrão de cada perfil para cada produto da EduData IA.';

COMMENT ON TABLE public.identity_audit_logs IS
  'Trilha central e imutável de acessos, operações e auditorias realizadas na plataforma.';

COMMENT ON TABLE public.identity_audit_access_requests IS
  'Solicitações formais de acesso excepcional para auditoria institucional.';

COMMENT ON COLUMN public.organization_members.hierarchy_level IS
  'Nível hierárquico entre 0 e 100. Nível maior não concede acesso automático fora do escopo.';

COMMENT ON COLUMN public.organization_members.scope_type IS
  'Escopo máximo do vínculo: self, team, area, school, organization, network ou platform.';

COMMENT ON COLUMN public.organization_members.can_access_private_content IS
  'Permite conteúdo individual somente dentro do escopo autorizado. Administradores técnicos permanecem sem acesso por padrão.';


COMMIT;
