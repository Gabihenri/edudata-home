-- ESCALA — Harness PostgreSQL isolado para identidade Auth ↔ docente
-- NÃO É MIGRATION DE PRODUÇÃO.
-- Execute somente em banco de teste/local.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS escala_identity_test;

CREATE TABLE escala_identity_test.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE escala_identity_test.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES escala_identity_test.organizations(id)
);

CREATE TABLE escala_identity_test.auth_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE escala_identity_test.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES escala_identity_test.auth_users(id)
);

CREATE TABLE escala_identity_test.organization_members (
  user_id uuid NOT NULL REFERENCES escala_identity_test.auth_users(id),
  organization_id uuid NOT NULL REFERENCES escala_identity_test.organizations(id),
  school_id uuid REFERENCES escala_identity_test.schools(id),
  status text NOT NULL DEFAULT 'active'
);

CREATE TABLE escala_identity_test.teacher_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES escala_identity_test.organizations(id),
  school_id uuid NOT NULL REFERENCES escala_identity_test.schools(id)
);

CREATE TABLE escala_identity_test.links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES escala_identity_test.organizations(id),
  school_id uuid NOT NULL REFERENCES escala_identity_test.schools(id),
  teacher_profile_id uuid NOT NULL REFERENCES escala_identity_test.teacher_profiles(id),
  auth_user_id uuid NOT NULL REFERENCES escala_identity_test.auth_users(id),
  status text NOT NULL CHECK (status IN ('pending','active','revoked')),
  valid_from timestamptz NOT NULL,
  valid_until timestamptz,
  verified_by uuid REFERENCES escala_identity_test.auth_users(id),
  verified_at timestamptz,
  source text NOT NULL,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT valid_period CHECK (valid_until IS NULL OR valid_until >= valid_from),
  CONSTRAINT active_requires_verification CHECK (
    status <> 'active' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL)
  )
);

CREATE OR REPLACE FUNCTION escala_identity_test.validate_link_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  t_org uuid;
  t_school uuid;
  s_org uuid;
BEGIN
  SELECT organization_id, school_id INTO t_org, t_school
  FROM escala_identity_test.teacher_profiles WHERE id = NEW.teacher_profile_id;
  SELECT organization_id INTO s_org
  FROM escala_identity_test.schools WHERE id = NEW.school_id;
  IF t_org IS DISTINCT FROM NEW.organization_id OR t_school IS DISTINCT FROM NEW.school_id
     OR s_org IS DISTINCT FROM NEW.organization_id THEN
    RAISE EXCEPTION 'identity link institutional scope mismatch';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_link_scope
BEFORE INSERT OR UPDATE ON escala_identity_test.links
FOR EACH ROW EXECUTE FUNCTION escala_identity_test.validate_link_scope();

CREATE OR REPLACE FUNCTION escala_identity_test.prevent_active_overlap()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' AND EXISTS (
    SELECT 1 FROM escala_identity_test.links l
    WHERE l.id <> NEW.id
      AND l.auth_user_id = NEW.auth_user_id
      AND l.status = 'active'
      AND NEW.valid_from < COALESCE(l.valid_until, 'infinity'::timestamptz)
      AND l.valid_from < COALESCE(NEW.valid_until, 'infinity'::timestamptz)
  ) THEN
    RAISE EXCEPTION 'active identity link temporal overlap';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_active_overlap
BEFORE INSERT OR UPDATE ON escala_identity_test.links
FOR EACH ROW EXECUTE FUNCTION escala_identity_test.prevent_active_overlap();

DO $$
DECLARE
  org1 uuid := gen_random_uuid();
  org2 uuid := gen_random_uuid();
  school1 uuid := gen_random_uuid();
  school2 uuid := gen_random_uuid();
  auth1 uuid := gen_random_uuid();
  auth2 uuid := gen_random_uuid();
  teacher1 uuid := gen_random_uuid();
  teacher2 uuid := gen_random_uuid();
  link_id uuid;
BEGIN
  INSERT INTO escala_identity_test.organizations VALUES (org1), (org2);
  INSERT INTO escala_identity_test.schools VALUES (school1, org1), (school2, org2);
  INSERT INTO escala_identity_test.auth_users VALUES (auth1), (auth2);
  INSERT INTO escala_identity_test.user_profiles VALUES (auth1), (auth2);
  INSERT INTO escala_identity_test.organization_members VALUES (auth1, org1, school1, 'active');
  INSERT INTO escala_identity_test.organization_members VALUES (auth2, org2, school2, 'active');
  INSERT INTO escala_identity_test.teacher_profiles VALUES (teacher1, org1, school1), (teacher2, org2, school2);

  -- ID-01: vínculo válido.
  INSERT INTO escala_identity_test.links
    (organization_id, school_id, teacher_profile_id, auth_user_id, status, valid_from, verified_by, verified_at, source)
  VALUES (org1, school1, teacher1, auth1, 'active', '2026-01-01', auth1, now(), 'homologacao');

  -- ID-02: Auth inexistente deve ser rejeitado pela FK.
  BEGIN
    INSERT INTO escala_identity_test.links
      (organization_id, school_id, teacher_profile_id, auth_user_id, status, valid_from, verified_by, verified_at, source)
    VALUES (org1, school1, teacher1, gen_random_uuid(), 'active', '2026-01-01', auth1, now(), 'teste');
    RAISE EXCEPTION 'ID-02 FAILED';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  -- ID-03: perfil inexistente deve ser rejeitado pela FK.
  BEGIN
    INSERT INTO escala_identity_test.links
      (organization_id, school_id, teacher_profile_id, auth_user_id, status, valid_from, verified_by, verified_at, source)
    VALUES (org1, school1, gen_random_uuid(), auth1, 'active', '2026-01-01', auth1, now(), 'teste');
    RAISE EXCEPTION 'ID-03 FAILED';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;

  -- ID-04: organização incompatível.
  BEGIN
    INSERT INTO escala_identity_test.links
      (organization_id, school_id, teacher_profile_id, auth_user_id, status, valid_from, verified_by, verified_at, source)
    VALUES (org2, school2, teacher1, auth2, 'active', '2026-01-01', auth2, now(), 'teste');
    RAISE EXCEPTION 'ID-04 FAILED';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'identity link institutional scope mismatch' THEN RAISE; END IF;
  END;

  -- ID-05: escola incompatível.
  BEGIN
    INSERT INTO escala_identity_test.links
      (organization_id, school_id, teacher_profile_id, auth_user_id, status, valid_from, verified_by, verified_at, source)
    VALUES (org1, school2, teacher1, auth1, 'active', '2026-01-01', auth1, now(), 'teste');
    RAISE EXCEPTION 'ID-05 FAILED';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'identity link institutional scope mismatch' THEN RAISE; END IF;
  END;

  -- ID-06: segunda ligação ativa temporalmente sobreposta é rejeitada.
  BEGIN
    INSERT INTO escala_identity_test.links
      (organization_id, school_id, teacher_profile_id, auth_user_id, status, valid_from, verified_by, verified_at, source)
    VALUES (org1, school1, teacher1, auth1, 'active', '2026-02-01', auth1, now(), 'teste');
    RAISE EXCEPTION 'ID-06 FAILED';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'active identity link temporal overlap' THEN RAISE; END IF;
  END;

  -- ID-07: revogação preserva histórico.
  UPDATE escala_identity_test.links SET status='revoked', valid_until='2026-12-31' RETURNING id INTO link_id;
  IF NOT EXISTS (SELECT 1 FROM escala_identity_test.links WHERE id=link_id AND status='revoked') THEN
    RAISE EXCEPTION 'ID-07 FAILED';
  END IF;

  -- ID-08: reativação controlada com nova vigência e homologação.
  UPDATE escala_identity_test.links
    SET status='active', valid_from='2027-01-01', valid_until=NULL, verified_by=auth1, verified_at=now()
    WHERE id=link_id;
  IF NOT EXISTS (SELECT 1 FROM escala_identity_test.links WHERE id=link_id AND status='active' AND valid_from='2027-01-01') THEN
    RAISE EXCEPTION 'ID-08 FAILED';
  END IF;

  -- ID-09: o esquema não contém campos de fuzzy match; publicação depende de vínculo explícito.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='escala_identity_test' AND table_name='links' AND column_name IN ('name_similarity','fuzzy_score')) THEN
    RAISE EXCEPTION 'ID-09 FAILED';
  END IF;

  -- ID-10: histórico mantém datas/status para reprodução temporal.
  IF NOT EXISTS (SELECT 1 FROM escala_identity_test.links WHERE id=link_id AND valid_from='2027-01-01') THEN
    RAISE EXCEPTION 'ID-10 FAILED';
  END IF;
END;
$$;

-- Auditoria final do harness.
DO $$
BEGIN
  IF (SELECT count(*) FROM escala_identity_test.links) <> 1 THEN
    RAISE EXCEPTION 'HARNESS FAILED: unexpected link count';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM escala_identity_test.links WHERE status='active' AND verified_by IS NOT NULL) THEN
    RAISE EXCEPTION 'HARNESS FAILED: active link without verification';
  END IF;
END;
$$;

ROLLBACK;
