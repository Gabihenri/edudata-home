-- EDI-QI institutional governance smoke tests using pgTAP.
-- These checks inspect schema metadata only; no application data is inserted.

BEGIN;

SELECT plan(23);

SELECT ok(
  to_regclass('public.organizations') IS NOT NULL,
  'public.organizations exists'
);
SELECT ok(
  to_regclass('public.organization_members') IS NOT NULL,
  'public.organization_members exists'
);
SELECT ok(
  to_regclass('public.eios_institutional_policies') IS NOT NULL,
  'public.eios_institutional_policies exists'
);
SELECT ok(
  to_regclass('public.eios_score_governance') IS NOT NULL,
  'public.eios_score_governance exists'
);
SELECT ok(
  to_regclass('public.eios_policy_audit_events') IS NOT NULL,
  'public.eios_policy_audit_events exists'
);

SELECT ok(
  (SELECT c.relrowsecurity
   FROM pg_class c
   WHERE c.oid = to_regclass('public.eios_institutional_policies')),
  'RLS is enabled on eios_institutional_policies'
);
SELECT ok(
  (SELECT c.relrowsecurity
   FROM pg_class c
   WHERE c.oid = to_regclass('public.eios_score_governance')),
  'RLS is enabled on eios_score_governance'
);
SELECT ok(
  (SELECT c.relrowsecurity
   FROM pg_class c
   WHERE c.oid = to_regclass('public.eios_policy_audit_events')),
  'RLS is enabled on eios_policy_audit_events'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND policyname = 'institution_members_read_policies'),
  'member read policy exists for institutional policies'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND policyname = 'institution_governors_manage_policies'),
  'governor management policy exists for institutional policies'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND policyname = 'institution_members_read_score_governance'),
  'member read policy exists for score governance'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND policyname = 'institution_governors_manage_score_governance'),
  'governor management policy exists for score governance'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND policyname = 'institution_members_read_policy_audit'),
  'member read policy exists for policy audit'
);
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND policyname = 'institution_governors_insert_policy_audit'),
  'governor insert policy exists for policy audit'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conrelid = to_regclass('public.organization_members')
      AND c.conname = 'organization_members_role_check'
      AND pg_get_constraintdef(c.oid) LIKE '%coordenador%'
      AND pg_get_constraintdef(c.oid) LIKE '%diretor%'
      AND pg_get_constraintdef(c.oid) LIKE '%administrador%'
  ),
  'membership role constraint includes supported institutional roles'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname IN (
        'institution_governors_manage_policies',
        'institution_governors_manage_score_governance',
        'institution_members_read_policy_audit',
        'institution_governors_insert_policy_audit'
      )
      AND concat_ws(' ', qual, with_check) ~ '(principal|manager|institution_admin|super_admin)'
  ),
  'EIOS policies do not reference unsupported legacy roles'
);


SELECT ok(
  to_regclass('public.matriculas_na_academia') IS NOT NULL,
  'academy enrollment table exists'
);
SELECT ok(
  (SELECT c.relrowsecurity
   FROM pg_class c
   WHERE c.oid = to_regclass('public.matriculas_na_academia')),
  'RLS is enabled on academy enrollment table'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'matriculas_na_academia'
      AND column_name = 'lgpd_consent'
  ),
  'academy enrollment table stores explicit consent flag'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'matriculas_na_academia'
      AND column_name = 'privacy_consent_at'
  ),
  'academy enrollment table stores consent timestamp'
);
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'matriculas_na_academia'
      AND column_name = 'privacy_notice_version'
  ),
  'academy enrollment table supports privacy notice version'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public.matriculas_na_academia', 'SELECT'),
  'anonymous role cannot select academy enrollment PII'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.matriculas_na_academia', 'SELECT'),
  'authenticated client role cannot select academy enrollment PII'
);

SELECT * FROM finish();

ROLLBACK;
