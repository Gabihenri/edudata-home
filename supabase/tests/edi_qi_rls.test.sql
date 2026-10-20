-- EDI-QI institutional governance smoke tests.
-- Fail closed if prerequisite migrations or expected RLS policies are missing.
-- These checks inspect schema metadata only; no application data is inserted.

DO $$
DECLARE
  required_table text;
  expected_policy text;
  missing_policies text[] := ARRAY[]::text[];
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'organizations',
    'organization_members',
    'eios_institutional_policies',
    'eios_score_governance',
    'eios_policy_audit_events'
  ]
  LOOP
    IF to_regclass(format('public.%I', required_table)) IS NULL THEN
      RAISE EXCEPTION 'EDI-QI schema test failed: missing table public.%', required_table;
    END IF;
  END LOOP;

  IF NOT (
    SELECT c.relrowsecurity
    FROM pg_class c
    WHERE c.oid = 'public.eios_institutional_policies'::regclass
  ) THEN
    RAISE EXCEPTION 'EDI-QI schema test failed: RLS is disabled on eios_institutional_policies';
  END IF;

  IF NOT (
    SELECT c.relrowsecurity
    FROM pg_class c
    WHERE c.oid = 'public.eios_score_governance'::regclass
  ) THEN
    RAISE EXCEPTION 'EDI-QI schema test failed: RLS is disabled on eios_score_governance';
  END IF;

  IF NOT (
    SELECT c.relrowsecurity
    FROM pg_class c
    WHERE c.oid = 'public.eios_policy_audit_events'::regclass
  ) THEN
    RAISE EXCEPTION 'EDI-QI schema test failed: RLS is disabled on eios_policy_audit_events';
  END IF;

  FOREACH expected_policy IN ARRAY ARRAY[
    'institution_members_read_policies',
    'institution_governors_manage_policies',
    'institution_members_read_score_governance',
    'institution_governors_manage_score_governance',
    'institution_members_read_policy_audit',
    'institution_governors_insert_policy_audit'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND policyname = expected_policy
    ) THEN
      missing_policies := array_append(missing_policies, expected_policy);
    END IF;
  END LOOP;

  IF cardinality(missing_policies) > 0 THEN
    RAISE EXCEPTION 'EDI-QI schema test failed: missing RLS policies: %',
      array_to_string(missing_policies, ', ');
  END IF;
END;
$$;

SELECT 'EDI-QI institutional governance schema checks passed' AS result;
