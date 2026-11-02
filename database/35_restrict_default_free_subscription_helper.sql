BEGIN;

-- =========================================================
-- EDUDATA IA — SECURITY MIGRATION 35
-- Restrict direct execution of the internal EDI Free helper.
--
-- Signup entry points are SECURITY DEFINER functions owned
-- by postgres. They can call this helper without granting
-- direct RPC execution to API roles.
-- =========================================================

DO $$
BEGIN
  IF to_regprocedure(
    'public.ensure_default_free_subscription(uuid)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Required function public.ensure_default_free_subscription(uuid) was not found.';
  END IF;

  IF to_regprocedure(
    'public.handle_new_auth_user_default_subscription()'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Required EDI Free Auth trigger function was not found.';
  END IF;

  IF to_regprocedure(
    'public.edi_create_default_user_access()'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Required default access Auth trigger function was not found.';
  END IF;
END;
$$;

REVOKE ALL
ON FUNCTION public.ensure_default_free_subscription(uuid)
FROM PUBLIC, anon, authenticated, service_role, supabase_auth_admin;

-- Fail closed if any API role retains direct execution.
DO $$
DECLARE
  helper_oid oid;
BEGIN
  helper_oid :=
    'public.ensure_default_free_subscription(uuid)'::regprocedure;

  IF has_function_privilege('anon', helper_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', helper_oid, 'EXECUTE')
     OR has_function_privilege('service_role', helper_oid, 'EXECUTE')
     OR has_function_privilege('supabase_auth_admin', helper_oid, 'EXECUTE') THEN
    RAISE EXCEPTION
      'Default EDI Free helper remains executable by an API/Auth role.';
  END IF;

  IF pg_get_userbyid(
    (SELECT proowner FROM pg_proc WHERE oid = helper_oid)
  ) <> 'postgres' THEN
    RAISE EXCEPTION
      'Default EDI Free helper must remain owned by postgres.';
  END IF;
END;
$$;

COMMIT;
