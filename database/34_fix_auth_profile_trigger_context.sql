BEGIN;

-- =========================================================
-- EDUDATA IA — SECURITY MIGRATION 34
-- Allow the trusted Auth trigger to provision a default profile.
--
-- The previous helper compared auth.uid() with target_user_id.
-- During Supabase Auth user creation, the trigger executes in
-- a server-side context where auth.uid() may be NULL. That
-- check can abort signup even though the caller is the trusted
-- SECURITY DEFINER trigger function.
--
-- The helper is not an application RPC: revoke direct execution
-- from API roles and keep execution with its trusted owner.
-- =========================================================

DO $$
BEGIN
  IF to_regprocedure(
    'public.ensure_default_user_profile(uuid)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Required function public.ensure_default_user_profile(uuid) was not found.';
  END IF;

  IF to_regprocedure(
    'public.handle_new_auth_user_default_profile()'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Required Auth trigger function was not found.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created_ensure_default_profile'
      AND tgrelid = 'auth.users'::regclass
      AND NOT tgisinternal
      AND tgfoid = 'public.handle_new_auth_user_default_profile()'::regprocedure
  ) THEN
    RAISE EXCEPTION
      'Expected default profile Auth trigger was not found.';
  END IF;
END;
$$;


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

  SELECT COALESCE(
    NULLIF(trim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(trim(auth_user.raw_user_meta_data ->> 'name'), ''),
    NULLIF(trim(auth_user.raw_user_meta_data ->> 'display_name'), ''),
    NULLIF(trim(split_part(auth_user.email, '@', 1)), '')
  )
  INTO default_display_name
  FROM auth.users AS auth_user
  WHERE auth_user.id = target_user_id;

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
      'profile_type', 'individual',
      'provisioning', 'automatic',
      'migration', '34_fix_auth_profile_trigger_context'
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
  'Internal Auth-trigger helper. Creates only a default professor profile; direct execution is restricted to the trusted function owner.';


-- The outer SECURITY DEFINER trigger invokes this helper as
-- its owner. Do not expose the helper as an RPC to application
-- roles or service_role.
REVOKE ALL
ON FUNCTION public.ensure_default_user_profile(uuid)
FROM PUBLIC, anon, authenticated, service_role;


-- Fail closed if a caller-controlled role can execute the helper.
DO $$
DECLARE
  helper_oid oid;
BEGIN
  helper_oid :=
    'public.ensure_default_user_profile(uuid)'::regprocedure;

  IF has_function_privilege(
    'anon',
    helper_oid,
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    helper_oid,
    'EXECUTE'
  ) OR has_function_privilege(
    'service_role',
    helper_oid,
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION
      'Default profile helper remains executable by an application role.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created_ensure_default_profile'
      AND tgrelid = 'auth.users'::regclass
      AND NOT tgisinternal
      AND tgfoid = 'public.handle_new_auth_user_default_profile()'::regprocedure
  ) THEN
    RAISE EXCEPTION
      'Default profile Auth trigger was detached.';
  END IF;
END;
$$;

COMMIT;
