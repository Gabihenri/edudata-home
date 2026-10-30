BEGIN;

-- =========================================================
-- EDUDATA IA — SECURITY MIGRATION 33
-- Prevent self-assignment of privileged roles during signup.
--
-- The previous auth trigger accepted role values from
-- auth.users.raw_user_meta_data and raw_app_meta_data.
-- raw_user_meta_data is user-controlled and must never be
-- an authorization source.
--
-- Preserve the EDI Free subscription provisioning behavior.
-- This migration only changes the default profile role.
-- =========================================================

DO $$
BEGIN
  IF to_regprocedure(
    'public.edi_create_default_user_access()'
  ) IS NULL THEN
    RAISE EXCEPTION
      'Required function public.edi_create_default_user_access() was not found.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'edi_auth_user_created'
      AND tgrelid = 'auth.users'::regclass
      AND NOT tgisinternal
      AND tgfoid = 'public.edi_create_default_user_access()'::regprocedure
  ) THEN
    RAISE EXCEPTION
      'Expected auth.users trigger edi_auth_user_created was not found.';
  END IF;
END;
$$;


CREATE OR REPLACE FUNCTION
  public.edi_create_default_user_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $function$
DECLARE
  free_plan_id uuid;
  initial_name text;
BEGIN
  -- Never derive a permission-bearing role from signup metadata.
  -- All new accounts start as individual professors.
  initial_name := COALESCE(
    NULLIF(
      trim(new.raw_user_meta_data ->> 'full_name'),
      ''
    ),
    NULLIF(
      trim(new.raw_user_meta_data ->> 'name'),
      ''
    ),
    NULLIF(
      trim(split_part(COALESCE(new.email, ''), '@', 1)),
      ''
    )
  );

  INSERT INTO public.user_profiles (
    user_id,
    role,
    status,
    display_name
  )
  VALUES (
    new.id,
    'professor',
    'active',
    NULLIF(initial_name, '')
  )
  ON CONFLICT (user_id)
  DO NOTHING;

  -- Preserve automatic EDI Free subscription provisioning.
  SELECT id
  INTO free_plan_id
  FROM public.plans
  WHERE code = 'edi_free'
    AND is_active = true
  LIMIT 1;

  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (
      owner_type,
      user_id,
      plan_id,
      status,
      source,
      starts_at
    )
    VALUES (
      'user',
      new.id,
      free_plan_id,
      'active',
      'default',
      now()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
END;
$function$;


COMMENT ON FUNCTION
  public.edi_create_default_user_access()
IS
  'Creates a default professor profile and EDI Free subscription. Signup metadata is never used to assign roles.';


-- This is a trigger implementation, not an application RPC.
REVOKE ALL
ON FUNCTION public.edi_create_default_user_access()
FROM PUBLIC, anon, authenticated;


DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'postgres'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.edi_create_default_user_access() TO postgres';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'supabase_auth_admin'
  ) THEN
    EXECUTE
      'GRANT EXECUTE ON FUNCTION public.edi_create_default_user_access() TO supabase_auth_admin';
  END IF;
END;
$$;


-- Fail closed if the deployed function still references a
-- user-supplied role or if the signup trigger was detached.
DO $$
DECLARE
  definition text;
BEGIN
  SELECT pg_get_functiondef(
    'public.edi_create_default_user_access()'::regprocedure
  )
  INTO definition;

  IF position(
    'raw_user_meta_data ->> ''role'''
    IN definition
  ) > 0 OR position(
    'raw_app_meta_data ->> ''role'''
    IN definition
  ) > 0 THEN
    RAISE EXCEPTION
      'Unsafe role metadata reference remains in signup provisioning.';
  END IF;

  IF position(
    '''professor'''
    IN definition
  ) = 0 THEN
    RAISE EXCEPTION
      'Default professor role assignment was not found.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'edi_auth_user_created'
      AND tgrelid = 'auth.users'::regclass
      AND NOT tgisinternal
      AND tgfoid = 'public.edi_create_default_user_access()'::regprocedure
  ) THEN
    RAISE EXCEPTION
      'Signup provisioning trigger is not attached to the expected function.';
  END IF;
END;
$$;

COMMIT;
