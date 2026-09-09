-- Escala de Substituição — Harness PostgreSQL isolado
-- DOC-01..DOC-20 — carga, homologação e identidade docente
-- NÃO É MIGRAÇÃO DE PRODUÇÃO.
-- Execução esperada: PostgreSQL isolado. A transação termina em ROLLBACK.

BEGIN;

DROP SCHEMA IF EXISTS escala_doc_test CASCADE;
CREATE SCHEMA escala_doc_test;
SET search_path = escala_doc_test, public;

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE organizations (
  id uuid PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE schools (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  UNIQUE (id, organization_id)
);

CREATE TABLE auth_users (
  id uuid PRIMARY KEY,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE organization_members (
  organization_id uuid NOT NULL REFERENCES organizations(id),
  school_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth_users(id),
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (organization_id, school_id, user_id),
  FOREIGN KEY (school_id, organization_id) REFERENCES schools(id, organization_id)
);

CREATE TABLE teacher_profiles (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  institutional_teacher_id text NOT NULL,
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('active','inactive')),
  UNIQUE (organization_id, institutional_teacher_id),
  UNIQUE (id, organization_id, school_id),
  FOREIGN KEY (school_id, organization_id) REFERENCES schools(id, organization_id)
);

CREATE TABLE teacher_load_batches (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  source_system text NOT NULL,
  source_hash text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, school_id, source_hash),
  FOREIGN KEY (school_id, organization_id) REFERENCES schools(id, organization_id)
);

CREATE TABLE teacher_load_rows (
  id uuid PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES teacher_load_batches(id),
  source_record_id text NOT NULL,
  raw_payload jsonb NOT NULL,
  normalized_payload jsonb NOT NULL,
  institutional_teacher_id text,
  name text NOT NULL,
  matching_status text NOT NULL CHECK (matching_status IN ('resolved','ambiguous','unresolved','rejected')),
  teacher_profile_id uuid,
  matching_method text,
  validation_status text NOT NULL CHECK (validation_status IN ('pending','validated','rejected')),
  rejection_reason text,
  CHECK (
    matching_status IN ('ambiguous','unresolved','rejected')
    OR teacher_profile_id IS NOT NULL
  ),
  CHECK (
    matching_status IN ('ambiguous','unresolved','rejected')
    OR matching_method IS NOT NULL
  )
);

CREATE TABLE academic_teacher_identity_links (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  teacher_profile_id uuid NOT NULL,
  auth_user_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','active','revoked')),
  valid_from date NOT NULL,
  valid_until date,
  source text NOT NULL,
  verified_by uuid,
  verified_at timestamptz,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  CHECK (valid_until IS NULL OR valid_until >= valid_from),
  CHECK (
    status <> 'active'
    OR (verified_by IS NOT NULL AND verified_at IS NOT NULL)
  ),
  FOREIGN KEY (school_id, organization_id) REFERENCES schools(id, organization_id),
  FOREIGN KEY (teacher_profile_id, organization_id, school_id)
    REFERENCES teacher_profiles(id, organization_id, school_id),
  FOREIGN KEY (auth_user_id) REFERENCES auth_users(id),
  FOREIGN KEY (organization_id, school_id, auth_user_id)
    REFERENCES organization_members(organization_id, school_id, user_id)
);

ALTER TABLE academic_teacher_identity_links
  ADD CONSTRAINT identity_link_no_overlap
  EXCLUDE USING gist (
    teacher_profile_id WITH =,
    school_id WITH =,
    daterange(valid_from, COALESCE(valid_until + 1, 'infinity'::date), '[)') WITH &&
  ) WHERE (status <> 'revoked');

CREATE FUNCTION reject_name_only_matching()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.matching_method IN ('name','email','name_or_email','fuzzy') THEN
    RAISE EXCEPTION 'Name/email/fuzzy matching is forbidden';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER teacher_load_no_name_matching
BEFORE INSERT OR UPDATE ON teacher_load_rows
FOR EACH ROW EXECUTE FUNCTION reject_name_only_matching();

CREATE FUNCTION validate_active_link()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  auth_active boolean;
  member_active boolean;
  teacher_status text;
BEGIN
  SELECT active INTO auth_active FROM auth_users WHERE id = NEW.auth_user_id;
  IF NOT COALESCE(auth_active, false) AND NEW.status = 'active' THEN
    RAISE EXCEPTION 'Active link requires active Auth user';
  END IF;

  SELECT active INTO member_active
  FROM organization_members
  WHERE organization_id = NEW.organization_id
    AND school_id = NEW.school_id
    AND user_id = NEW.auth_user_id;
  IF NOT COALESCE(member_active, false) AND NEW.status = 'active' THEN
    RAISE EXCEPTION 'Active link requires active institutional membership';
  END IF;

  SELECT status INTO teacher_status
  FROM teacher_profiles
  WHERE id = NEW.teacher_profile_id;
  IF teacher_status IS DISTINCT FROM 'active' AND NEW.status = 'active' THEN
    RAISE EXCEPTION 'Active link requires active teacher profile';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_identity_link
BEFORE INSERT OR UPDATE ON academic_teacher_identity_links
FOR EACH ROW EXECUTE FUNCTION validate_active_link();

INSERT INTO organizations VALUES
  ('00000000-0000-0000-0000-000000000001','Org A'),
  ('00000000-0000-0000-0000-000000000002','Org B');

INSERT INTO schools VALUES
  ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','School A1'),
  ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','School A2'),
  ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000002','School B1');

INSERT INTO auth_users VALUES
  ('10000000-0000-0000-0000-000000000001',true),
  ('10000000-0000-0000-0000-000000000002',true),
  ('10000000-0000-0000-0000-000000000003',false);

INSERT INTO organization_members VALUES
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000001',true),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012','10000000-0000-0000-0000-000000000002',true),
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000003',true);

INSERT INTO teacher_profiles VALUES
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','T-001','Professor A','active'),
  ('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012','T-002','Professor B','active'),
  ('20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','T-003','Professor C','inactive');

-- DOC-01: carga válida com identificador institucional.
INSERT INTO teacher_load_batches VALUES
  ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','fonte_oficial','HASH-001');
INSERT INTO teacher_load_rows VALUES
  ('31000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','SRC-001','{"name":"Professor A"}','{"institutional_teacher_id":"T-001"}','T-001','Professor A','resolved','20000000-0000-0000-0000-000000000001','institutional_id','validated',NULL);

-- DOC-02: mesma carga/hash/contexto deve falhar por idempotência.
DO $$ BEGIN
  BEGIN
    INSERT INTO teacher_load_batches VALUES
      ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','fonte_oficial','HASH-001');
    RAISE EXCEPTION 'DOC-02 failed: duplicate hash accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END $$;

-- DOC-03: ambiguous não pode receber canonical ID.
INSERT INTO teacher_load_rows VALUES
  ('31000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','SRC-002','{"name":"Professor X"}','{"name":"Professor X"}',NULL,'Professor X','ambiguous',NULL,NULL,'pending',NULL);

-- DOC-04: unresolved não pode ser promovido.
INSERT INTO teacher_load_rows VALUES
  ('31000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','SRC-003','{"name":"Professor Y"}','{"name":"Professor Y"}',NULL,'Professor Y','unresolved',NULL,NULL,'pending',NULL);

-- DOC-05: rejeitado permanece sem canonicalização.
INSERT INTO teacher_load_rows VALUES
  ('31000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000001','SRC-004','{"name":"Professor Z"}','{"name":"Professor Z"}',NULL,'Professor Z','rejected',NULL,NULL,'rejected','Fonte inválida');

-- DOC-06: name/email/fuzzy matching é rejeitado pelo trigger.
DO $$ BEGIN
  BEGIN
    INSERT INTO teacher_load_rows VALUES
      ('31000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000001','SRC-005','{}','{}',NULL,'Professor A','resolved','20000000-0000-0000-0000-000000000001','name','validated',NULL);
    RAISE EXCEPTION 'DOC-06 failed: name matching accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Name/email/fuzzy matching is forbidden' THEN RAISE; END IF;
  END;
END $$;

-- DOC-07: vínculo ativo válido.
INSERT INTO academic_teacher_identity_links VALUES
  ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','active','2026-01-01',NULL,'manual_homologation','10000000-0000-0000-0000-000000000001',now(),'{"evidence":"institutional_id"}');

-- DOC-08: vínculo para Auth inativo deve falhar.
DO $$ BEGIN
  BEGIN
    INSERT INTO academic_teacher_identity_links VALUES
      ('40000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000012','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','active','2026-01-01',NULL,'manual_homologation','10000000-0000-0000-0000-000000000002',now(),'{}');
    RAISE EXCEPTION 'DOC-08 failed: inactive Auth accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM NOT LIKE 'Active link requires active Auth user' THEN RAISE; END IF;
  END;
END $$;

-- DOC-09: vínculo ativo sem verificador deve falhar.
DO $$ BEGIN
  BEGIN
    INSERT INTO academic_teacher_identity_links VALUES
      ('40000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','active','2027-01-01',NULL,'import',NULL,NULL,'{}');
    RAISE EXCEPTION 'DOC-09 failed: active unverified link accepted';
  EXCEPTION WHEN check_violation THEN NULL;
END $$;

-- DOC-10: intervalo inválido deve falhar.
DO $$ BEGIN
  BEGIN
    INSERT INTO academic_teacher_identity_links VALUES
      ('40000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','pending','2027-02-01','2027-01-01','import',NULL,NULL,'{}');
    RAISE EXCEPTION 'DOC-10 failed: invalid interval accepted';
  EXCEPTION WHEN check_violation THEN NULL;
END $$;

-- DOC-11: sobreposição temporal deve falhar.
DO $$ BEGIN
  BEGIN
    INSERT INTO academic_teacher_identity_links VALUES
      ('40000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','pending','2026-06-01','2026-12-31','import',NULL,NULL,'{}');
    RAISE EXCEPTION 'DOC-11 failed: overlap accepted';
  EXCEPTION WHEN exclusion_violation THEN NULL;
END $$;

-- DOC-12: multi-school é permitida quando existe contexto institucional próprio.
INSERT INTO academic_teacher_identity_links VALUES
  ('40000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','pending','2026-01-01',NULL,'manual_homologation',NULL,NULL,'{"context":"school-A2"}');

-- DOC-13: cross-organization deve falhar por FK.
DO $$ BEGIN
  BEGIN
    INSERT INTO academic_teacher_identity_links VALUES
      ('40000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','pending','2026-01-01',NULL,'manual',NULL,NULL,'{}');
    RAISE EXCEPTION 'DOC-13 failed: cross-org accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
END $$;

-- DOC-14: teacher profile inexistente deve falhar por FK.
DO $$ BEGIN
  BEGIN
    INSERT INTO academic_teacher_identity_links VALUES
      ('40000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000009999','10000000-0000-0000-0000-000000000001','pending','2026-01-01',NULL,'manual',NULL,NULL,'{}');
    RAISE EXCEPTION 'DOC-14 failed: nonexistent teacher accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
END $$;

-- DOC-15: raw_payload deve permanecer preservado.
DO $$
DECLARE raw jsonb;
BEGIN
  SELECT raw_payload INTO raw FROM teacher_load_rows WHERE id='31000000-0000-0000-0000-000000000001';
  IF raw IS DISTINCT FROM '{"name":"Professor A"}'::jsonb THEN
    RAISE EXCEPTION 'DOC-15 failed: raw payload changed';
  END IF;
END $$;

-- DOC-16: resolved requer canonical ID.
DO $$ BEGIN
  BEGIN
    INSERT INTO teacher_load_rows VALUES
      ('31000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000001','SRC-006','{}','{}','T-999','Professor Q','resolved',NULL,'institutional_id','validated',NULL);
    RAISE EXCEPTION 'DOC-16 failed: resolved without canonical teacher accepted';
  EXCEPTION WHEN check_violation THEN NULL;
END $$;

-- DOC-17: active link requer membership no mesmo contexto.
DO $$ BEGIN
  BEGIN
    INSERT INTO academic_teacher_identity_links VALUES
      ('40000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','active','2028-01-01',NULL,'manual','10000000-0000-0000-0000-000000000001',now(),'{}');
    RAISE EXCEPTION 'DOC-17 failed: incompatible membership accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
END $$;

-- DOC-18: revogação preserva histórico e libera novo período.
UPDATE academic_teacher_identity_links
SET status='revoked', valid_until='2026-08-31'
WHERE id='40000000-0000-0000-0000-000000000001';
INSERT INTO academic_teacher_identity_links VALUES
  ('40000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','pending','2026-09-01',NULL,'manual_homologation',NULL,NULL,'{"replaces":"40000000-0000-0000-0000-000000000001"}');

-- DOC-19: somente vínculo ativo representa identidade operacional atual.
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n
  FROM academic_teacher_identity_links
  WHERE teacher_profile_id='20000000-0000-0000-0000-000000000001'
    AND status='active'
    AND valid_from <= '2026-09-15'
    AND (valid_until IS NULL OR valid_until >= '2026-09-15');
  IF n <> 0 THEN RAISE EXCEPTION 'DOC-19 failed'; END IF;
END $$;

-- DOC-20: promoção só após validação explícita.
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n
  FROM teacher_load_rows
  WHERE matching_status='resolved' AND validation_status='validated' AND teacher_profile_id IS NOT NULL;
  IF n <> 1 THEN RAISE EXCEPTION 'DOC-20 failed: promotion gate inconsistent'; END IF;
END $$;

SELECT 'DOC-01..DOC-20: harness assertions completed' AS audit_result;

ROLLBACK;
