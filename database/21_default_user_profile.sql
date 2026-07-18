BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- MIGRATION 21 — DEFAULT USER PROFILE
-- =========================================================
--
-- Objetivos:
-- 1. Criar perfil individual padrão para usuários existentes.
-- 2. Criar perfil automaticamente para novos usuários.
-- 3. Garantir acesso inicial compatível com o plano edi_free.
-- 4. Preservar perfis e papéis já existentes.
-- 5. Não permitir autoatribuição de papéis institucionais.
--
-- Perfil individual padrão:
-- - role: professor
-- - status: active
-- - onboarding_completed: false
--
-- Esta migração:
-- - não altera perfis existentes válidos;
-- - não substitui super_admin;
-- - não substitui coordenador, diretor ou administrador;
-- - não cria vínculos institucionais;
-- - não altera organizações ou escolas.
-- =========================================================


-- =========================================================
-- 1. VALIDAÇÃO DA ESTRUTURA
-- =========================================================

DO $$
BEGIN
  IF to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: auth.users.';
  END IF;

  IF to_regclass('public.user_profiles') IS NULL THEN
    RAISE EXCEPTION
      'Tabela obrigatória não encontrada: public.user_profiles.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION
      'A coluna obrigatória public.user_profiles.user_id não existe.';
  END IF;
END;
$$;


-- =========================================================
-- 2. COMPATIBILIDADE DA TABELA USER_PROFILES
-- =========================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;


-- Apenas campos ausentes ou inválidos recebem valores padrão.
-- Papéis existentes não são substituídos.

UPDATE public.user_profiles
SET
  role = CASE
    WHEN role IS NULL
      OR trim(role) = ''
    THEN 'professor'
    ELSE role
  END,

  status = CASE
    WHEN status IS NULL
      OR trim(status) = ''
    THEN 'active'
    ELSE status
  END,

  onboarding_completed =
    COALESCE(
      onboarding_completed,
      false
    ),

  metadata =
    COALESCE(
      metadata,
      '{}'::jsonb
    ),

  created_at =
    COALESCE(
      created_at,
      now()
    ),

  updated_at =
    COALESCE(
      updated_at,
      created_at,
      now()
    )

WHERE role IS NULL
   OR trim(role) = ''
   OR status IS NULL
   OR trim(status) = ''
   OR onboarding_completed IS NULL
   OR metadata IS NULL
   OR created_at IS NULL
   OR updated_at IS NULL;


ALTER TABLE public.user_profiles
  ALTER COLUMN role
    SET DEFAULT 'professor',

  ALTER COLUMN role
    SET NOT NULL,

  ALTER COLUMN status
    SET DEFAULT 'active',

  ALTER COLUMN status
    SET NOT NULL,

  ALTER COLUMN onboarding_completed
    SET DEFAULT false,

  ALTER COLUMN onboarding_completed
    SET NOT NULL,

  ALTER COLUMN metadata
    SET DEFAULT '{}'::jsonb,

  ALTER COLUMN metadata
    SET NOT NULL,

  ALTER COLUMN created_at
    SET DEFAULT now(),

  ALTER COLUMN created_at
    SET NOT NULL,

  ALTER COLUMN updated_at
    SET DEFAULT now(),

  ALTER COLUMN updated_at
    SET NOT NULL;


-- =========================================================
-- 3. VALIDAÇÃO DE IDENTIDADE E DUPLICIDADE
-- =========================================================

DO $$
DECLARE
  null_user_ids integer;
  duplicate_user_ids integer;
BEGIN
  SELECT count(*)
  INTO null_user_ids
  FROM public.user_profiles
  WHERE user_id IS NULL;

  IF null_user_ids <> 0 THEN
    RAISE EXCEPTION
      'Existem % perfil(is) sem user_id.',
      null_user_ids;
  END IF;


  SELECT count(*)
  INTO duplicate_user_ids
  FROM (
    SELECT user_id
    FROM public.user_profiles
    GROUP BY user_id
    HAVING count(*) > 1
  ) AS duplicated_profiles;

  IF duplicate_user_ids <> 0 THEN
    RAISE EXCEPTION
      'Existem usuários com mais de um registro em user_profiles.';
  END IF;
END;
$$;


CREATE UNIQUE INDEX IF NOT EXISTS
  idx_user_profiles_user_id_unique

ON public.user_profiles(user_id);


CREATE INDEX IF NOT EXISTS
  idx_user_profiles_role_status

ON public.user_profiles(
  role,
  status
);


COMMENT ON COLUMN public.user_profiles.role IS
  'Perfil funcional global. Usuários individuais recebem professor; papéis institucionais dependem de vínculo autorizado.';


COMMENT ON COLUMN public.user_profiles.status IS
  'Estado operacional do perfil utilizado pelo controle de acesso compartilhado.';


COMMENT ON COLUMN public.user_profiles.onboarding_completed IS
  'Indica se o usuário concluiu a configuração inicial do próprio perfil.';


-- =========================================================
-- 4. FUNÇÃO DE PROVISIONAMENTO DO PERFIL PADRÃO
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.ensure_default_user_profile(
    target_user_id uuid
  )
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  default_display_name text;
BEGIN
  IF target_user_id IS NULL THEN
    RETURN NULL;
  END IF;


  SELECT
    COALESCE(
      NULLIF(
        trim(
          auth_user.raw_user_meta_data
            ->> 'full_name'
        ),
        ''
      ),

      NULLIF(
        trim(
          auth_user.raw_user_meta_data
            ->> 'name'
        ),
        ''
      ),

      NULLIF(
        trim(
          auth_user.raw_user_meta_data
            ->> 'display_name'
        ),
        ''
      ),

      NULLIF(
        trim(
          split_part(
            auth_user.email,
            '@',
            1
          )
        ),
        ''
      )
    )

  INTO default_display_name

  FROM auth.users AS auth_user

  WHERE auth_user.id =
        target_user_id;


  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Usuário não encontrado para criação do perfil padrão: %.',
      target_user_id;
  END IF;


  INSERT INTO public.user_profiles (
    user_id,
    display_name,
    phone,
    role,
    status,
    onboarding_completed,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    target_user_id,
    default_display_name,
    NULL,
    'professor',
    'active',
    false,

    jsonb_build_object(
      'profile_type',
      'individual',

      'provisioning',
      'automatic',

      'migration',
      '21_default_user_profile'
    ),

    now(),
    now()
  )

  ON CONFLICT (user_id)
  DO NOTHING;


  RETURN target_user_id;
END;
$$;


COMMENT ON FUNCTION
  public.ensure_default_user_profile(uuid)
IS
  'Garante perfil individual professor/active para o usuário informado sem alterar perfis existentes.';


-- =========================================================
-- 5. PROTEÇÃO DA FUNÇÃO
-- =========================================================

REVOKE ALL
ON FUNCTION
  public.ensure_default_user_profile(uuid)
FROM PUBLIC;


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'postgres'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.ensure_default_user_profile(uuid) TO postgres';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'service_role'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.ensure_default_user_profile(uuid) TO service_role';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'supabase_auth_admin'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.ensure_default_user_profile(uuid) TO supabase_auth_admin';
  END IF;
END;
$$;


-- =========================================================
-- 6. PROVISIONAMENTO DOS USUÁRIOS EXISTENTES
-- =========================================================

INSERT INTO public.user_profiles (
  user_id,
  display_name,
  phone,
  role,
  status,
  onboarding_completed,
  metadata,
  created_at,
  updated_at
)

SELECT
  auth_user.id,

  COALESCE(
    NULLIF(
      trim(
        auth_user.raw_user_meta_data
          ->> 'full_name'
      ),
      ''
    ),

    NULLIF(
      trim(
        auth_user.raw_user_meta_data
          ->> 'name'
      ),
      ''
    ),

    NULLIF(
      trim(
        auth_user.raw_user_meta_data
          ->> 'display_name'
      ),
      ''
    ),

    NULLIF(
      trim(
        split_part(
          auth_user.email,
          '@',
          1
        )
      ),
      ''
    )
  ),

  NULL,

  'professor',
  'active',

  false,

  jsonb_build_object(
    'profile_type',
    'individual',

    'provisioning',
    'backfill',

    'migration',
    '21_default_user_profile'
  ),

  now(),
  now()

FROM auth.users AS auth_user

WHERE NOT EXISTS (
  SELECT 1

  FROM public.user_profiles
    AS existing_profile

  WHERE existing_profile.user_id =
        auth_user.id
)

ON CONFLICT (user_id)
DO NOTHING;


-- =========================================================
-- 7. TRIGGER PARA NOVOS USUÁRIOS
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.handle_new_auth_user_default_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  PERFORM
    public.ensure_default_user_profile(
      NEW.id
    );

  RETURN NEW;
END;
$$;


COMMENT ON FUNCTION
  public.handle_new_auth_user_default_profile()
IS
  'Cria o perfil individual padrão após a criação de um usuário no Supabase Auth.';


REVOKE ALL
ON FUNCTION
  public.handle_new_auth_user_default_profile()
FROM PUBLIC;


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'postgres'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.handle_new_auth_user_default_profile() TO postgres';
  END IF;


  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'supabase_auth_admin'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.handle_new_auth_user_default_profile() TO supabase_auth_admin';
  END IF;
END;
$$;


DROP TRIGGER IF EXISTS
  on_auth_user_created_ensure_default_profile
ON auth.users;


CREATE TRIGGER
  on_auth_user_created_ensure_default_profile

AFTER INSERT
ON auth.users

FOR EACH ROW

EXECUTE FUNCTION
  public.handle_new_auth_user_default_profile();


-- =========================================================
-- 8. UPDATED_AT AUTOMÁTICO
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.set_user_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_user_profiles_updated_at
ON public.user_profiles;


CREATE TRIGGER
  trg_user_profiles_updated_at

BEFORE UPDATE
ON public.user_profiles

FOR EACH ROW

EXECUTE FUNCTION
  public.set_user_profiles_updated_at();


-- =========================================================
-- 9. VALIDAÇÃO FINAL
-- =========================================================

DO $$
DECLARE
  users_without_profile integer;
  duplicated_profiles integer;
  invalid_profiles integer;
BEGIN
  SELECT count(*)
  INTO users_without_profile

  FROM auth.users AS auth_user

  WHERE NOT EXISTS (
    SELECT 1

    FROM public.user_profiles
      AS profile

    WHERE profile.user_id =
          auth_user.id
  );


  IF users_without_profile <> 0 THEN
    RAISE EXCEPTION
      'Falha no provisionamento: % usuário(s) sem perfil.',
      users_without_profile;
  END IF;


  SELECT count(*)
  INTO duplicated_profiles

  FROM (
    SELECT user_id

    FROM public.user_profiles

    GROUP BY user_id

    HAVING count(*) > 1
  ) AS duplicates;


  IF duplicated_profiles <> 0 THEN
    RAISE EXCEPTION
      'Falha no provisionamento: existem perfis duplicados.';
  END IF;


  SELECT count(*)
  INTO invalid_profiles

  FROM public.user_profiles

  WHERE user_id IS NULL
     OR role IS NULL
     OR trim(role) = ''
     OR status IS NULL
     OR trim(status) = ''
     OR onboarding_completed IS NULL
     OR metadata IS NULL;


  IF invalid_profiles <> 0 THEN
    RAISE EXCEPTION
      'Falha no provisionamento: % perfil(is) inválido(s).',
      invalid_profiles;
  END IF;


  IF to_regclass(
    'public.idx_user_profiles_user_id_unique'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Índice único de user_profiles não foi criado.';
  END IF;


  IF to_regprocedure(
    'public.ensure_default_user_profile(uuid)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Função de provisionamento do perfil não foi criada.';
  END IF;


  IF NOT EXISTS (
    SELECT 1

    FROM pg_trigger

    WHERE tgname =
      'on_auth_user_created_ensure_default_profile'

      AND tgisinternal = false
  ) THEN
    RAISE EXCEPTION
      'Trigger de criação automática do perfil não foi criado.';
  END IF;
END;
$$;


COMMIT;