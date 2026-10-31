-- Isolated PostgreSQL regression for migrations 21, 33 and 34.
-- Run as postgres with psql -v ON_ERROR_STOP=1.
-- This harness models only the Supabase Auth objects required by these migrations.

\set ON_ERROR_STOP on

CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE ROLE supabase_auth_admin NOLOGIN;

CREATE SCHEMA auth;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  email text,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_app_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.user_profiles (
  user_id uuid NOT NULL UNIQUE
);

CREATE TABLE public.plans (
  id uuid PRIMARY KEY,
  code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL,
  subscriber_type text NOT NULL,
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status text NOT NULL,
  source text,
  starts_at timestamptz NOT NULL,
  is_default_free boolean NOT NULL DEFAULT false
);

INSERT INTO public.plans (id, code, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'edi_free', true);

GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT INSERT ON auth.users TO supabase_auth_admin;

-- Migration 33 replaces this legacy trigger function.
CREATE FUNCTION public.edi_create_default_user_access()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN NEW;
END;
$$;

CREATE TRIGGER edi_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.edi_create_default_user_access();

CREATE FUNCTION public.ensure_default_free_subscription(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $test$
DECLARE
  existing_subscription_id uuid;
BEGIN
  SELECT id
  INTO existing_subscription_id
  FROM public.subscriptions
  WHERE user_id = target_user_id
    AND is_default_free = true
    AND status = 'active'
  LIMIT 1;

  IF existing_subscription_id IS NOT NULL THEN
    RETURN existing_subscription_id;
  END IF;

  INSERT INTO public.subscriptions (
    owner_type,
    subscriber_type,
    user_id,
    plan_id,
    status,
    source,
    starts_at,
    is_default_free
  )
  VALUES (
    'user',
    'user',
    target_user_id,
    '00000000-0000-0000-0000-000000000001',
    'active',
    'default',
    now(),
    true
  )
  RETURNING id INTO existing_subscription_id;

  RETURN existing_subscription_id;
END;
$test$;

CREATE FUNCTION public.handle_new_auth_user_default_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $test$
BEGIN
  PERFORM public.ensure_default_free_subscription(NEW.id);
  RETURN NEW;
END;
$test$;

CREATE TRIGGER on_auth_user_created_ensure_edi_free_subscription
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user_default_subscription();

-- Migration 21 installs the second Auth trigger and its SECURITY DEFINER wrapper.
\ir ../21_default_user_profile.sql

-- Migration 33 removes metadata-based role assignment and provisions edi_free.
\ir ../33_security_auth_role_provisioning.sql

-- Migration 34 restricts the helper while preserving trusted trigger execution.
\ir ../34_fix_auth_profile_trigger_context.sql

DO $$
DECLARE
  helper_oid oid := 'public.ensure_default_user_profile(uuid)'::regprocedure;
  wrapper_oid oid := 'public.handle_new_auth_user_default_profile()'::regprocedure;
BEGIN
  IF has_function_privilege('anon', helper_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', helper_oid, 'EXECUTE')
     OR has_function_privilege('service_role', helper_oid, 'EXECUTE')
     OR has_function_privilege('supabase_auth_admin', helper_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'A non-owner role can execute ensure_default_user_profile directly.';
  END IF;

  IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = wrapper_oid) THEN
    RAISE EXCEPTION 'The Auth profile trigger wrapper is not SECURITY DEFINER.';
  END IF;

  IF pg_get_userbyid((SELECT proowner FROM pg_proc WHERE oid = wrapper_oid)) <> 'postgres'
     OR pg_get_userbyid((SELECT proowner FROM pg_proc WHERE oid = helper_oid)) <> 'postgres' THEN
    RAISE EXCEPTION 'Unexpected function owner; trusted trigger/helper execution context is not postgres.';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
      AND NOT tgisinternal
      AND tgname IN (
        'edi_auth_user_created',
        'on_auth_user_created_ensure_default_profile',
        'on_auth_user_created_ensure_edi_free_subscription'
      )
  ) <> 3 THEN
    RAISE EXCEPTION 'Expected all three signup triggers to be attached.';
  END IF;
END;
$$;

-- Signup with attacker-controlled metadata must remain a professor account.
SET ROLE supabase_auth_admin;

INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'malicious-signup@example.test',
  '{"role":"super_admin","full_name":"Malicious Signup"}'::jsonb,
  '{"role":"super_admin"}'::jsonb
);

RESET ROLE;

DO $$
DECLARE
  created_role text;
  profile_count integer;
  free_count integer;
BEGIN
  SELECT role
  INTO created_role
  FROM public.user_profiles
  WHERE user_id = '10000000-0000-0000-0000-000000000001';

  IF created_role IS DISTINCT FROM 'professor' THEN
    RAISE EXCEPTION 'Expected professor role, received %.', created_role;
  END IF;

  SELECT count(*)
  INTO profile_count
  FROM public.user_profiles
  WHERE user_id = '10000000-0000-0000-0000-000000000001';

  IF profile_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one profile after both triggers, found %.', profile_count;
  END IF;

  SELECT count(*)
  INTO free_count
  FROM public.subscriptions
  WHERE user_id = '10000000-0000-0000-0000-000000000001'
    AND plan_id = '00000000-0000-0000-0000-000000000001'
    AND owner_type = 'user'
    AND subscriber_type = 'user'
    AND status = 'active'
    AND is_default_free = true;

  IF free_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one active default edi_free subscription, found %.', free_count;
  END IF;
END;
$$;

SELECT 'PASS: malicious signup remains professor; all three triggers work; edi_free is provisioned once; helper is not exposed.' AS regression_result;
