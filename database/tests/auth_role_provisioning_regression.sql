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
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL CHECK (owner_type IN ('user', 'organization')),
  subscriber_type text NOT NULL CHECK (subscriber_type IN ('user', 'organization')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired', 'suspended')),
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('default', 'manual', 'trial', 'billing', 'institutional')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  billing_cycle text NOT NULL DEFAULT 'monthly',
  quantity integer NOT NULL DEFAULT 1,
  currency text NOT NULL DEFAULT 'BRL',
  unit_amount_cents integer,
  total_amount_cents integer,
  current_period_start timestamptz,
  current_period_end timestamptz,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_default_free boolean NOT NULL DEFAULT false,
  CONSTRAINT subscriptions_owner_check CHECK (
    (owner_type = 'user' AND user_id IS NOT NULL AND organization_id IS NULL)
    OR (owner_type = 'organization' AND organization_id IS NOT NULL AND user_id IS NULL)
  )
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

-- Apply the real migration-20 helper and its dedicated Auth trigger.
\ir ../20_default_free_subscription.sql

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
