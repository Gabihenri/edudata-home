BEGIN;

-- =========================================================
-- EDUDATA IA — SECURITY HARDENING
-- MIGRATION 33 — PIN SEARCH_PATH FOR LEGACY RLS HELPERS
-- =========================================================
--
-- The legacy RLS foundation defines SECURITY DEFINER helpers
-- without a function-level search_path. Pin the path for
-- existing installations without rewriting migration history.
--
-- Keep pg_catalog first so built-ins cannot be shadowed.
-- The public schema is retained because the helpers query
-- the platform's public.users table. auth.uid() is qualified.
-- =========================================================

DO $$
BEGIN
  IF to_regprocedure('public.current_user_id()') IS NULL
     OR to_regprocedure('public.current_school_id()') IS NULL
     OR to_regprocedure('public.current_organization_id()') IS NULL
  THEN
    RAISE EXCEPTION
      'Required RLS helper function is missing; migration 33 cannot safely continue.';
  END IF;
END;
$$;

ALTER FUNCTION public.current_user_id()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.current_school_id()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.current_organization_id()
  SET search_path = pg_catalog, public;

COMMIT;
