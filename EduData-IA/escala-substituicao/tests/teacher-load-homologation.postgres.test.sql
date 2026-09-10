-- Escala de Substituição — Harness PostgreSQL isolado
-- DOC-01..DOC-20 — carga, matching, homologação e identidade docente
-- TESTE/CONTRATO: não é migração de produção.
-- Todas as alterações ficam isoladas em escala_doc_test e são desfeitas no final.

BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;
DROP SCHEMA IF EXISTS escala_doc_test CASCADE;
CREATE SCHEMA escala_doc_test;
SET LOCAL search_path = escala_doc_test, public;
CREATE TABLE organizations (id uuid PRIMARY KEY, name text NOT NULL);
CREATE TABLE schools (id uuid PRIMARY KEY, organization_id uuid NOT NULL REFERENCES organizations(id), name text NOT NULL, UNIQUE (id, organization_id));
CREATE TABLE auth_users (id uuid PRIMARY KEY, active boolean NOT NULL);
CREATE TABLE organization_members (organization_id uuid NOT NULL, school_id uuid NOT NULL, user_id uuid NOT NULL REFERENCES auth_users(id), active boolean NOT NULL, PRIMARY KEY (organization_id, school_id, user_id), FOREIGN KEY (school_id, organization_id) REFERENCES schools(id, organization_id));
CREATE TABLE teacher_profiles (id uuid PRIMARY KEY, organization_id uuid NOT NULL, school_id uuid NOT NULL, institutional_teacher_id text NOT NULL, name text NOT NULL, status text NOT NULL CHECK (status IN ('active','inactive')), UNIQUE (organization_id, institutional_teacher_id), UNIQUE (id, organization_id, school_id), FOREIGN KEY (school_id, organization_id) REFERENCES schools(id, organization_id));
CREATE TABLE teacher_load_batches (id uuid PRIMARY KEY, organization_id uuid NOT NULL, school_id uuid NOT NULL, source_system text NOT NULL, source_hash text NOT NULL, source_version text, UNIQUE (organization_id, school_id, source_hash), FOREIGN KEY (school_id, organization_id) REFERENCES schools(id, organization_id));
CREATE TABLE teacher_load_rows (id uuid PRIMARY KEY, batch_id uuid NOT NULL REFERENCES teacher_load_batches(id), source_record_id text NOT NULL, raw_payload jsonb NOT NULL, normalized_payload jsonb NOT NULL, institutional_teacher_id text, name text NOT NULL, matching_status text NOT NULL CHECK (matching_status IN ('resolved','ambiguous','unresolved','rejected')), teacher_profile_id uuid, matching_method text, validation_status text NOT NULL CHECK (validation_status IN ('pending','validated','rejected')), rejection_reason text, CHECK (matching_status <> 'resolved' OR (teacher_profile_id IS NOT NULL AND matching_method IS NOT NULL)), CHECK (matching_status <> 'resolved' OR validation_status = 'validated'));
CREATE TABLE homologation_permissions (user_id uuid NOT NULL REFERENCES auth_users(id), permission_code text NOT NULL, organization_id uuid NOT NULL, school_id uuid NOT NULL, PRIMARY KEY (user_id, permission_code, organization_id, school_id), FOREIGN KEY (organization_id, school_id, user_id) REFERENCES organization_members(organization_id, school_id, user_id));
CREATE TABLE identity_audit_logs (id bigserial PRIMARY KEY, event_type text NOT NULL, actor_user_id uuid, organization_id uuid NOT NULL, school_id uuid NOT NULL, subject_id uuid, provenance jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE academic_teacher_identity_links (id uuid PRIMARY KEY, organization_id uuid NOT NULL, school_id uuid NOT NULL, teacher_profile_id uuid NOT NULL, auth_user_id uuid NOT NULL, status text NOT NULL CHECK (status IN ('pending','active','revoked')), valid_from date NOT NULL, valid_until date, source text NOT NULL, verified_by uuid, verified_at timestamptz, provenance jsonb NOT NULL DEFAULT '{}'::jsonb, CHECK (valid_until IS NULL OR valid_until >= valid_from), CHECK (status <> 'active' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL)), FOREIGN KEY (school_id, organization_id) REFERENCES schools(id, organization_id), FOREIGN KEY (teacher_profile_id, organization_id, school_id) REFERENCES teacher_profiles(id, organization_id, school_id), FOREIGN KEY (auth_user_id) REFERENCES auth_users(id), FOREIGN KEY (organization_id, school_id, auth_user_id) REFERENCES organization_members(organization_id, school_id, user_id));
ALTER TABLE academic_teacher_identity_links ADD CONSTRAINT identity_link_no_overlap EXCLUDE USING gist (teacher_profile_id WITH =, school_id WITH =, daterange(valid_from, COALESCE(valid_until + 1, 'infinity'::date), '[)') WITH &&) WHERE (status <> 'revoked');
CREATE FUNCTION forbid_weak_matching() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.matching_method IN ('name','email','name_only','email_only','name_or_email','fuzzy') THEN RAISE EXCEPTION 'weak matching is forbidden'; END IF; RETURN NEW; END $$;
CREATE TRIGGER trg_forbid_weak_matching BEFORE INSERT OR UPDATE ON teacher_load_rows FOR EACH ROW EXECUTE FUNCTION forbid_weak_matching();
CREATE FUNCTION validate_active_identity_link() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE a boolean; m boolean; t text; p boolean; BEGIN SELECT active INTO a FROM auth_users WHERE id=NEW.auth_user_id; SELECT active INTO m FROM organization_members WHERE organization_id=NEW.organization_id AND school_id=NEW.school_id AND user_id=NEW.auth_user_id; SELECT status INTO t FROM teacher_profiles WHERE id=NEW.teacher_profile_id; SELECT EXISTS (SELECT 1 FROM homologation_permissions WHERE user_id=NEW.verified_by AND permission_code='escala.manage_teacher_identity_links' AND organization_id=NEW.organization_id AND school_id=NEW.school_id) INTO p; IF NEW.status='active' AND NOT COALESCE(a,false) THEN RAISE EXCEPTION 'inactive auth'; END IF; IF NEW.status='active' AND NOT COALESCE(m,false) THEN RAISE EXCEPTION 'inactive membership'; END IF; IF NEW.status='active' AND t IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'inactive teacher'; END IF; IF NEW.status='active' AND NOT COALESCE(p,false) THEN RAISE EXCEPTION 'missing homologation permission'; END IF; RETURN NEW; END $$;
CREATE TRIGGER trg_validate_active_identity_link BEFORE INSERT OR UPDATE ON academic_teacher_identity_links FOR EACH ROW EXECUTE FUNCTION validate_active_identity_link();
CREATE FUNCTION assert_true(label text, condition boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF NOT COALESCE(condition,false) THEN RAISE EXCEPTION 'ASSERTION FAILED: %', label; END IF; END $$;
INSERT INTO organizations VALUES ('00000000-0000-0000-0000-000000000001','Org A'), ('00000000-0000-0000-0000-000000000002','Org B');
INSERT INTO schools VALUES ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','School A1'), ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','School A2'), ('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000002','School B1');
INSERT INTO auth_users VALUES ('10000000-0000-0000-0000-000000000001',true), ('10000000-0000-0000-0000-000000000002',true), ('10000000-0000-0000-0000-000000000003',false), ('10000000-0000-0000-0000-000000000004',true);
INSERT INTO organization_members VALUES ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000001',true), ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012','10000000-0000-0000-0000-000000000002',true), ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021','10000000-0000-0000-0000-000000000003',true), ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000004',true);
INSERT INTO teacher_profiles VALUES ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','T-001','Professor A','active'), ('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012','T-002','Professor B','active'), ('20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','T-003','Professor C','inactive');
INSERT INTO homologation_permissions VALUES ('10000000-0000-0000-0000-000000000001','escala.manage_teacher_identity_links','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011'), ('10000000-0000-0000-0000-000000000002','escala.manage_teacher_identity_links','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012');
-- DOC-01
INSERT INTO teacher_load_batches VALUES ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','sed_grade','HASH-001','2026-09');
DO $$ BEGIN BEGIN INSERT INTO teacher_load_batches VALUES ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','sed_grade','HASH-001','2026-09'); RAISE EXCEPTION 'DOC-01 failed'; EXCEPTION WHEN unique_violation THEN NULL; END; END $$;
SELECT assert_true('DOC-01', (SELECT count(*)=1 FROM teacher_load_batches WHERE source_hash='HASH-001'));
-- DOC-02
INSERT INTO teacher_load_rows VALUES ('31000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','SRC-001','{"name":"Professor A","id":"T-001"}','{"institutional_teacher_id":"T-001"}','T-001','Professor A','resolved','20000000-0000-0000-0000-000000000001','institutional_id','validated',NULL);
SELECT assert_true('DOC-02', (SELECT matching_status='resolved' AND teacher_profile_id='20000000-0000-0000-0000-000000000001'::uuid FROM teacher_load_rows WHERE id='31000000-0000-0000-0000-000000000001'));
-- DOC-03
INSERT INTO teacher_load_rows VALUES ('31000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','SRC-003','{"name":"Professor X"}','{"name":"Professor X"}',NULL,'Professor X','unresolved',NULL,NULL,'pending',NULL);
SELECT assert_true('DOC-03', (SELECT matching_status='unresolved' AND teacher_profile_id IS NULL FROM teacher_load_rows WHERE id='31000000-0000-0000-0000-000000000003'));
-- DOC-04
INSERT INTO teacher_load_rows VALUES ('31000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000001','SRC-004','{"email":"x@example.invalid"}','{"email":"x@example.invalid"}',NULL,'Professor Y','unresolved',NULL,NULL,'pending',NULL);
SELECT assert_true('DOC-04', (SELECT matching_status='unresolved' AND teacher_profile_id IS NULL FROM teacher_load_rows WHERE id='31000000-0000-0000-0000-000000000004'));
-- DOC-05
INSERT INTO teacher_load_rows VALUES ('31000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000001','SRC-005','{"name":"Professor B"}','{"name":"Professor B"}',NULL,'Professor B','ambiguous',NULL,NULL,'pending',NULL);
SELECT assert_true('DOC-05', (SELECT matching_status='ambiguous' AND teacher_profile_id IS NULL FROM teacher_load_rows WHERE id='31000000-0000-0000-0000-000000000005'));
-- DOC-06
DO $$ BEGIN BEGIN INSERT INTO academic_teacher_identity_links VALUES ('40000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','pending','2026-01-01',NULL,'test',NULL,NULL,'{}'); RAISE EXCEPTION 'DOC-06 failed'; EXCEPTION WHEN foreign_key_violation THEN NULL; END; END $$;
-- DOC-07
DO $$ BEGIN BEGIN INSERT INTO academic_teacher_identity_links VALUES ('40000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','pending','2026-01-01',NULL,'test',NULL,NULL,'{}'); RAISE EXCEPTION 'DOC-07 failed'; EXCEPTION WHEN foreign_key_violation THEN NULL; END; END $$;
-- DOC-08
DO $$ BEGIN BEGIN INSERT INTO academic_teacher_identity_links VALUES ('40000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','active','2026-01-01',NULL,'test','10000000-0000-0000-0000-000000000004',now(),'{}'); RAISE EXCEPTION 'DOC-08 failed'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'missing homologation permission' THEN RAISE; END IF; END; END $$;
-- DOC-09
SELECT assert_true('DOC-09', (SELECT status='active' FROM teacher_profiles WHERE id='20000000-0000-0000-0000-000000000001') AND NOT EXISTS (SELECT 1 FROM academic_teacher_identity_links WHERE teacher_profile_id='20000000-0000-0000-0000-000000000001'::uuid AND status='active'));
-- DOC-10
INSERT INTO academic_teacher_identity_links VALUES ('40000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','active','2026-01-01',NULL,'manual_homologation','10000000-0000-0000-0000-000000000001',now(),'{"source_record_id":"SRC-001"}');
SELECT assert_true('DOC-10', (SELECT status='active' AND verified_by IS NOT NULL AND verified_at IS NOT NULL FROM academic_teacher_identity_links WHERE id='40000000-0000-0000-0000-000000000010'));
-- DOC-11
DO $$ BEGIN BEGIN INSERT INTO academic_teacher_identity_links VALUES ('40000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','active','2027-01-01',NULL,'manual','10000000-0000-0000-0000-000000000004',now(),'{}'); RAISE EXCEPTION 'DOC-11 failed'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'missing homologation permission' THEN RAISE; END IF; END; END $$;
-- DOC-12
DO $$ BEGIN BEGIN INSERT INTO academic_teacher_identity_links VALUES ('40000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','pending','2026-06-01','2026-12-31','import',NULL,NULL,'{}'); RAISE EXCEPTION 'DOC-12 failed'; EXCEPTION WHEN exclusion_violation THEN NULL; END; END $$;
-- DOC-13
INSERT INTO academic_teacher_identity_links VALUES ('40000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','pending','2026-01-01',NULL,'manual','10000000-0000-0000-0000-000000000002',now(),'{"school_context":"A2"}');
SELECT assert_true('DOC-13', (SELECT count(*)=1 FROM academic_teacher_identity_links WHERE auth_user_id='10000000-0000-0000-0000-000000000002'));
-- DOC-14
DO $$ BEGIN BEGIN INSERT INTO teacher_load_rows VALUES ('31000000-0000-0000-0000-000000000014','30000000-0000-0000-0000-000000000001','SRC-014','{}','{}',NULL,'Professor A','resolved','20000000-0000-0000-0000-000000000001','fuzzy','validated',NULL); RAISE EXCEPTION 'DOC-14 failed'; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'weak matching is forbidden' THEN RAISE; END IF; END; END $$;
-- DOC-15
UPDATE academic_teacher_identity_links SET status='revoked', valid_until='2026-08-31' WHERE id='40000000-0000-0000-0000-000000000010';
SELECT assert_true('DOC-15', (SELECT status='revoked' AND valid_until='2026-08-31' FROM academic_teacher_identity_links WHERE id='40000000-0000-0000-0000-000000000010'));
-- DOC-16
INSERT INTO teacher_load_batches VALUES ('30000000-0000-0000-0000-000000000016','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','sed_grade','HASH-002','2026-09-corrigido');
INSERT INTO teacher_load_rows VALUES ('31000000-0000-0000-0000-000000000016','30000000-0000-0000-0000-000000000016','SRC-001','{"name":"Professor A","corrected":true}','{"institutional_teacher_id":"T-001"}','T-001','Professor A','resolved','20000000-0000-0000-0000-000000000001','institutional_id','validated',NULL);
SELECT assert_true('DOC-16', (SELECT count(*)=2 FROM teacher_load_rows WHERE source_record_id='SRC-001'));
-- DOC-17
SELECT assert_true('DOC-17', (SELECT raw_payload='{"name":"Professor A","id":"T-001"}'::jsonb FROM teacher_load_rows WHERE id='31000000-0000-0000-0000-000000000001'));
-- DOC-18
INSERT INTO identity_audit_logs(event_type,actor_user_id,organization_id,school_id,subject_id,provenance) VALUES ('teacher_identity_homologated','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','{"source":"teacher_load"}');
SELECT assert_true('DOC-18', (SELECT count(*)=1 FROM identity_audit_logs WHERE event_type='teacher_identity_homologated'));
-- DOC-19
INSERT INTO academic_teacher_identity_links VALUES ('40000000-0000-0000-0000-000000000019','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','pending','2027-01-01','2027-12-31','history','10000000-0000-0000-0000-000000000001',now(),'{"version":"v2"}');
SELECT assert_true('DOC-19', (SELECT count(*)=1 FROM academic_teacher_identity_links WHERE teacher_profile_id='20000000-0000-0000-0000-000000000001' AND DATE '2027-06-15' BETWEEN valid_from AND valid_until AND status='pending'));
-- DOC-20
SELECT assert_true('DOC-20', (SELECT count(*)=0 FROM teacher_load_rows WHERE matching_status IN ('rejected','unresolved','ambiguous') AND teacher_profile_id IS NOT NULL));
SELECT 'DOC-01..DOC-20 PASS' AS result;
ROLLBACK;
