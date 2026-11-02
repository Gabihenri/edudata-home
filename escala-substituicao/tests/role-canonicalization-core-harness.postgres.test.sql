-- EduData IA — isolated contract harness for Core role canonicalization.
-- Scope: disposable PostgreSQL session only. No public tables, DDL or production data.
-- Run in a scratch/test database with psql:
--   psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f escala-substituicao/tests/role-canonicalization-core-harness.postgres.test.sql
--
-- IMPORTANT:
-- This validates the proposed mapping contract in isolation; it does NOT invoke
-- production functions and is NOT a substitute for a full Core regression suite.
-- Do not use this file as a production migration.

BEGIN;

CREATE TEMP TABLE role_catalog_fixture (
  code text PRIMARY KEY
) ON COMMIT DROP;

INSERT INTO role_catalog_fixture (code) VALUES
  ('student'),
  ('teacher'),
  ('coordinator'),
  ('vice_principal'),
  ('principal'),
  ('supervisor'),
  ('regional_manager'),
  ('institution_admin'),
  ('platform_admin'),
  ('super_admin');

CREATE OR REPLACE FUNCTION pg_temp.resolve_canonical_role(input_role text)
RETURNS text
LANGUAGE sql
STABLE
AS $function$
  SELECT CASE lower(trim(input_role))
    WHEN 'professor' THEN 'teacher'
    WHEN 'coordenador' THEN 'coordinator'
    WHEN 'diretor' THEN 'principal'
    WHEN 'administrador' THEN 'institution_admin'
    ELSE (
      SELECT code
      FROM pg_temp.role_catalog_fixture
      WHERE code = lower(trim(input_role))
    )
  END;
$function$;

CREATE TEMP TABLE role_resolution_cases (
  input_role text NOT NULL,
  expected_role text
) ON COMMIT DROP;

INSERT INTO role_resolution_cases (input_role, expected_role) VALUES
  ('professor', 'teacher'),
  ('coordenador', 'coordinator'),
  ('diretor', 'principal'),
  ('administrador', 'institution_admin'),
  ('teacher', 'teacher'),
  ('coordinator', 'coordinator'),
  ('principal', 'principal'),
  ('institution_admin', 'institution_admin'),
  ('platform_admin', 'platform_admin'),
  ('super_admin', 'super_admin'),
  ('unknown_role', NULL),
  ('', NULL);

DO $test$
DECLARE
  failed_case record;
BEGIN
  SELECT input_role, expected_role,
         pg_temp.resolve_canonical_role(input_role) AS actual_role
  INTO failed_case
  FROM role_resolution_cases
  WHERE pg_temp.resolve_canonical_role(input_role)
        IS DISTINCT FROM expected_role
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION
      'ROLE_RESOLUTION_FAILED input=%, expected=%, actual=%',
      failed_case.input_role,
      failed_case.expected_role,
      failed_case.actual_role;
  END IF;

  -- Unknown/null inputs must never fall through to a privileged role.
  IF pg_temp.resolve_canonical_role('unknown_role') IS NOT NULL
     OR pg_temp.resolve_canonical_role(NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL_CLOSED_UNKNOWN_ROLE_FAILED';
  END IF;

  RAISE NOTICE 'PASS: legacy-to-canonical role resolution contract';
  RAISE NOTICE 'PASS: canonical roles remain canonical';
  RAISE NOTICE 'PASS: unknown/null roles fail closed';
END;
$test$;

ROLLBACK;
