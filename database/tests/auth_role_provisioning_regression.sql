-- Isolated PostgreSQL regression for migrations 20, 21 and 32-35.
-- Covers legacy-profile preservation, untrusted signup metadata, trigger
-- execution context, and direct helper privilege boundaries.
-- Run in a disposable PostgreSQL database as postgres:
--   psql -v ON_ERROR_STOP=1 -f database/tests/auth_role_provisioning_regression.sql
-- The edi_free plan row below is a deterministic fixture representing the
-- commercial seed established by migration 19. This test isolates Auth and
-- provisioning behavior; it does not replay the full commercial catalog.

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
  user_id uuid NOT NULL UNIQUE,
  role text,
  status text,
  onboarding_completed boolean,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
);

CREATE TABLE public.plans (
  id uuid PRIMARY KEY,
  code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_free boolean NOT NULL DEFAULT false,
  audience_type text NOT NULL DEFAULT 'individual',
  audience text NOT NULL DEFAULT 'individual',
  billing_model text NOT NULL DEFAULT 'subscription',
  billing_mode text NOT NULL DEFAULT 'recurring',
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
    CHECK (status IN ('pending', 'active', 'trialing', 'past_due', 'paused', 'incomplete', 'canceled', 'expired', 'suspended')),
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

INSERT INTO public.plans (
  id, code, is_active, is_free, audience_type, audience,
  billing_model, billing_mode, sort_order
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'edi_free', true, true, 'individual', 'individual', 'free', 'free', 10
);

-- Existing privileged profiles must survive the default-profile backfill.
INSERT INTO auth.users (id, email)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  'existing-admin@example.test'
);

INSERT INTO public.user_profiles (
  user_id, role, status, onboarding_completed, metadata, created_at, updated_at
)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  'super_admin', 'active', true, '{"origin":"preexisting"}'::jsonb, now(), now()
);

GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
GRANT INSERT ON auth.users TO supabase_auth_admin;

-- Migration 32 also hardens shared internal RPCs. These inert signatures
-- model the functions whose grants it adjusts; they are outside this Auth test.
CREATE FUNCTION public.can_view_identity_user(uuid, uuid, uuid)
RETURNS boolean LANGUAGE sql AS 'SELECT false';
CREATE FUNCTION public.edi_current_user_access(text)
RETURNS boolean LANGUAGE sql AS $ SELECT false $;
CREATE FUNCTION public.edi_current_user_access_snapshot()
RETURNS jsonb LANGUAGE sql AS 'SELECT ''{}''::jsonb';
CREATE FUNCTION public.edi_has_current_user_feature(text)
RETURNS boolean LANGUAGE sql AS $ SELECT false $;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

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

-- Migration 32 removes direct API-role execution of internal helpers.
\ir ../32_security_hardening.sql

-- Migration 33 removes metadata-based role assignment and provisions edi_free.
\ir ../33_security_auth_role_provisioning.sql

-- Migration 34 keeps Auth trigger execution functional without exposing the profile helper.
\ir ../34_fix_auth_profile_trigger_context.sql

-- Migration 35 removes direct API-role execution of the internal EDI Free helper.
\ir ../35_restrict_default_free_subscription_helper.sql

DO $$
DECLARE
  profile_helper_oid oid := 'public.ensure_default_user_profile(uuid)'::regprocedure;
  subscription_helper_oid oid := 'public.ensure_default_free_subscription(uuid)'::regprocedure;
  profile_wrapper_oid oid := 'public.handle_new_auth_user_default_profile()'::regprocedure;
  subscription_wrapper_oid oid := 'public.handle_new_auth_user_default_subscription()'::regprocedure;
  access_wrapper_oid oid := 'public.edi_create_default_user_access()'::regprocedure;
  function_oid oid;
BEGIN
  IF has_function_privilege('anon', profile_helper_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', profile_helper_oid, 'EXECUTE')
     OR has_function_privilege('service_role', profile_helper_oid, 'EXECUTE')
     OR has_function_privilege('supabase_auth_admin', profile_helper_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'A non-owner role can execute ensure_default_user_profile directly.';
  END IF;

  IF has_function_privilege('anon', subscription_helper_oid, 'EXECUTE')
     OR has_function_privilege('authenticated', subscription_helper_oid, 'EXECUTE')
     OR has_function_privilege('service_role', subscription_helper_oid, 'EXECUTE')
     OR has_function_privilege('supabase_auth_admin', subscription_helper_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'A non-owner role can execute ensure_default_free_subscription directly.';
  END IF;

  -- Trigger entry points must execute with their trusted function owner.
  FOREACH function_oid IN ARRAY ARRAY[
    profile_wrapper_oid,
    subscription_wrapper_oid,
    access_wrapper_oid
  ]
  LOOP
    IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = function_oid) THEN
      RAISE EXCEPTION 'Auth trigger function % is not SECURITY DEFINER.', function_oid::regprocedure;
    END IF;

    IF pg_get_userbyid((SELECT proowner FROM pg_proc WHERE oid = function_oid)) <> 'postgres' THEN
      RAISE EXCEPTION 'Auth trigger function % is not owned by postgres.', function_oid::regprocedure;
    END IF;
  END LOOP;

  IF pg_get_userbyid((SELECT proowner FROM pg_proc WHERE oid = profile_helper_oid)) <> 'postgres'
     OR pg_get_userbyid((SELECT proowner FROM pg_proc WHERE oid = subscription_helper_oid)) <> 'postgres' THEN
    RAISE EXCEPTION 'A provisioning helper is not owned by postgres.';
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

-- Existing privileged profile must be preserved by migration 21 and remain unique.
DO $$
DECLARE
  preserved_role text;
  preserved_count integer;
BEGIN
  SELECT role INTO preserved_role
  FROM public.user_profiles
  WHERE user_id = '20000000-0000-0000-0000-000000000002';

  IF preserved_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Existing privileged profile was changed; expected super_admin, received %.', preserved_role;
  END IF;

  SELECT count(*) INTO preserved_count
  FROM public.user_profiles
  WHERE user_id = '20000000-0000-0000-0000-000000000002';

  IF preserved_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one preserved existing profile, found %.', preserved_count;
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

-- OAuth-style signup: user metadata contains a display name only,
-- while app metadata carries an attacker-controlled privileged role.
SET ROLE supabase_auth_admin;

INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
VALUES (
  '30000000-0000-0000-0000-000000000003',
  'oauth-signup@example.test',
  '{"full_name":"OAuth Signup"}'::jsonb,
  '{"role":"super_admin"}'::jsonb
);

RESET ROLE;

DO $
DECLARE
  created_role text;
  profile_count integer;
  free_count integer;
  total_subscription_count integer;
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

  SELECT count(*)
  INTO total_subscription_count
  FROM public.subscriptions
  WHERE user_id = '10000000-0000-0000-0000-000000000001';

  IF total_subscription_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one subscription total for the new user, found %.', total_subscription_count;
  END IF;
END;
$;

DO $
DECLARE
  oauth_role text;
  oauth_profile_count integer;
  oauth_free_count integer;
BEGIN
  SELECT role INTO oauth_role
  FROM public.user_profiles
  WHERE user_id = '30000000-0000-0000-0000-000000000003';

  IF oauth_role IS DISTINCT FROM 'professor' THEN
    RAISE EXCEPTION 'OAuth app_metadata must not assign a privileged role; received %.', oauth_role;
  END IF;

  SELECT count(*) INTO oauth_profile_count
  FROM public.user_profiles
  WHERE user_id = '30000000-0000-0000-0000-000000000003';

  SELECT count(*) INTO oauth_free_count
  FROM public.subscriptions
  WHERE user_id = '30000000-0000-0000-0000-000000000003'
    AND is_default_free = true
    AND status = 'active';

  IF oauth_profile_count <> 1 OR oauth_free_count <> 1 THEN
    RAISE EXCEPTION 'OAuth signup must create exactly one profile and one EDI Free subscription.';
  END IF;
END;
$;

SELECT 'PASS: legacy super_admin preserved; user_metadata and app_metadata cannot assign privileged roles; all three Auth triggers execute; exactly one edi_free subscription is provisioned per signup; internal helpers are not executable by API/Auth roles.' AS regression_result;
