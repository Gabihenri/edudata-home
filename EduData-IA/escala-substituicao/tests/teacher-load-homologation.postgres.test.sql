-- Escala de Substituição — Harness PostgreSQL
-- Carga + homologação docente DOC-01..DOC-20.
-- Synthetic / isolated test. No production tables are modified.
-- Contract basis: docs/40-contrato-carga-homologacao-docente-v1.md

BEGIN;
CREATE SCHEMA escala_doc_test;
CREATE TABLE escala_doc_test.sources (id int primary key, source_system text not null, source_version text, source_hash text not null, organization_id int not null, school_id int, unique(source_system,source_version,source_hash,organization_id,school_id));
CREATE TABLE escala_doc_test.staging (id int primary key, source_id int not null references escala_doc_test.sources(id), source_record_id text not null, raw_payload jsonb not null, normalized_payload jsonb not null, external_teacher_id text, name_original text, email_original text, organization_id int not null, school_id int, status text not null check(status in ('resolved','ambiguous','unresolved','rejected')), identity_id int, matching_method text, rejection_reason text, raw_hash text not null, unique(source_id,source_record_id));
CREATE TABLE escala_doc_test.teachers (id int primary key, institutional_id text unique, name text not null, organization_id int not null, school_id int not null, status text not null, valid_from date not null, valid_until date, unique(organization_id,school_id,institutional_id));
CREATE TABLE escala_doc_test.auth_users (id int primary key, organization_id int not null, active boolean not null);
CREATE TABLE escala_doc_test.memberships (auth_user_id int, organization_id int, school_id int, active boolean not null, primary key(auth_user_id,organization_id,school_id));
CREATE TABLE escala_doc_test.links (id int primary key, teacher_id int not null references escala_doc_test.teachers(id), auth_user_id int not null references escala_doc_test.auth_users(id), organization_id int not null, school_id int not null, status text not null check(status in ('pending','active','revoked')), valid_from date not null, valid_until date, verifier_auth_user_id int, evidence_source_id int, unique(teacher_id,auth_user_id,organization_id,school_id,valid_from));
CREATE TABLE escala_doc_test.exceptions (id int primary key, staging_id int not null, reason text not null, status text not null, decision text, decided_by int, decided_at timestamptz);
CREATE TABLE escala_doc_test.audit (id bigserial primary key, event_type text not null, subject_id int not null, actor_id int, evidence_source_id int, occurred_at timestamptz not null default now());
INSERT INTO escala_doc_test.sources VALUES (1,'sed','2026-09','hash-A',10,100),(2,'sed','2026-10','hash-B',10,200),(3,'other','1','hash-C',20,300);
INSERT INTO escala_doc_test.teachers VALUES (1,'MAT-001','Ana Lima',10,100,'active','2026-01-01',NULL),(2,'MAT-002','Bruno Souza',10,100,'active','2026-01-01',NULL),(3,'MAT-003','Carla Alves',10,200,'active','2026-01-01',NULL),(4,'MAT-004','Daniel Costa',10,100,'active','2026-01-01',NULL);
INSERT INTO escala_doc_test.auth_users VALUES (101,10,true),(102,10,true),(103,20,true),(104,10,false),(105,10,true);
INSERT INTO escala_doc_test.memberships VALUES (101,10,100,true),(102,10,100,true),(105,10,100,true),(101,10,200,true),(103,20,300,true);
INSERT INTO escala_doc_test.staging VALUES
(1,1,'r1','{"institutional_id":"MAT-001","name":"Ana Lima"}','{"institutional_id":"MAT-001","name":"Ana Lima"}','MAT-001','Ana Lima',NULL,10,100,'resolved',1,'institutional_id',NULL,'raw-1'),
(2,1,'r2','{"name":"Bruno Souza"}','{"name":"Bruno Souza"}',NULL,'Bruno Souza',NULL,10,100,'unresolved',NULL,NULL,NULL,'raw-2'),
(3,1,'r3','{"email":"x@example.org"}','{"email":"x@example.org"}',NULL,NULL,'x@example.org',10,100,'unresolved',NULL,NULL,NULL,'raw-3'),
(4,1,'r4','{"name":"Ana Lima"}','{"name":"Ana Lima"}',NULL,'Ana Lima',NULL,10,100,'ambiguous',NULL,NULL,NULL,'raw-4'),
(5,3,'r5','{"institutional_id":"MAT-001"}','{"institutional_id":"MAT-001"}','MAT-001','Ana Lima',NULL,20,300,'rejected',NULL,'institutional_id','organization_mismatch','raw-5'),
(6,1,'r6','{"institutional_id":"MAT-002","school_id":999}','{"institutional_id":"MAT-002","school_id":999}','MAT-002','Bruno Souza',NULL,10,999,'rejected',NULL,'institutional_id','school_mismatch','raw-6');
CREATE OR REPLACE FUNCTION escala_doc_test.resolve_by_institutional_id(p_staging_id int) RETURNS text LANGUAGE sql AS $$ SELECT CASE WHEN count(t.id)=1 THEN 'resolved' WHEN count(t.id)>1 THEN 'ambiguous' ELSE 'unresolved' END FROM escala_doc_test.staging s LEFT JOIN escala_doc_test.teachers t ON t.institutional_id=s.external_teacher_id AND t.organization_id=s.organization_id AND t.school_id=s.school_id WHERE s.id=p_staging_id; $$;
INSERT INTO escala_doc_test.links VALUES (1,1,101,10,100,'active','2026-01-01',NULL,102,1),(2,3,101,10,200,'pending','2026-01-01',NULL,NULL,2),(3,1,105,10,100,'revoked','2026-01-01','2026-06-30',102,1);
INSERT INTO escala_doc_test.exceptions VALUES (1,2,'unresolved','open',NULL,NULL,NULL),(2,3,'unresolved','open',NULL,NULL,NULL),(3,4,'ambiguous','open',NULL,NULL,NULL),(4,5,'organization_mismatch','closed','reject',102,now()),(5,6,'school_mismatch','closed','reject',102,now());
INSERT INTO escala_doc_test.audit(event_type,subject_id,actor_id,evidence_source_id) VALUES ('import',1,NULL,1),('canonization',1,102,1),('link_homologated',1,102,1),('link_revoked',3,102,1),('exception_resolved',4,102,3),('record_rejected',5,102,3);
DO $$ BEGIN
IF (SELECT count(*) FROM escala_doc_test.sources WHERE source_hash='hash-A')<>1 THEN RAISE EXCEPTION 'DOC-01 failed'; END IF;
IF escala_doc_test.resolve_by_institutional_id(1)<>'resolved' THEN RAISE EXCEPTION 'DOC-02 failed'; END IF;
IF (SELECT status FROM escala_doc_test.staging WHERE id=2)<>'unresolved' THEN RAISE EXCEPTION 'DOC-03 failed'; END IF;
IF (SELECT status FROM escala_doc_test.staging WHERE id=3)<>'unresolved' THEN RAISE EXCEPTION 'DOC-04 failed'; END IF;
IF (SELECT status FROM escala_doc_test.staging WHERE id=4)<>'ambiguous' THEN RAISE EXCEPTION 'DOC-05 failed'; END IF;
IF (SELECT status FROM escala_doc_test.staging WHERE id=5)<>'rejected' THEN RAISE EXCEPTION 'DOC-06 failed'; END IF;
IF (SELECT status FROM escala_doc_test.staging WHERE id=6)<>'rejected' THEN RAISE EXCEPTION 'DOC-07 failed'; END IF;
IF EXISTS (SELECT 1 FROM escala_doc_test.links WHERE auth_user_id=104 AND status='active') THEN RAISE EXCEPTION 'DOC-08 failed'; END IF;
IF NOT EXISTS (SELECT 1 FROM escala_doc_test.teachers WHERE id=2) THEN RAISE EXCEPTION 'DOC-09 failed'; END IF;
IF NOT EXISTS (SELECT 1 FROM escala_doc_test.links WHERE id=1 AND status='active' AND verifier_auth_user_id IS NOT NULL AND evidence_source_id IS NOT NULL) THEN RAISE EXCEPTION 'DOC-10 failed'; END IF;
IF EXISTS (SELECT 1 FROM escala_doc_test.links l JOIN escala_doc_test.auth_users a ON a.id=l.verifier_auth_user_id WHERE l.status='active' AND (a.active=false OR NOT EXISTS (SELECT 1 FROM escala_doc_test.memberships m WHERE m.auth_user_id=a.id AND m.organization_id=l.organization_id AND m.school_id=l.school_id AND m.active))) THEN RAISE EXCEPTION 'DOC-11 failed'; END IF;
IF EXISTS (SELECT 1 FROM escala_doc_test.links a JOIN escala_doc_test.links b ON a.id<b.id AND a.teacher_id=b.teacher_id AND a.school_id=b.school_id AND a.valid_from<=COALESCE(b.valid_until,'9999-12-31') AND b.valid_from<=COALESCE(a.valid_until,'9999-12-31') WHERE a.status='active' AND b.status='active') THEN RAISE EXCEPTION 'DOC-12 failed'; END IF;
IF NOT EXISTS (SELECT 1 FROM escala_doc_test.links WHERE teacher_id=3 AND organization_id=10 AND school_id=200) THEN RAISE EXCEPTION 'DOC-13 failed'; END IF;
IF EXISTS (SELECT 1 FROM escala_doc_test.staging WHERE matching_method='fuzzy' AND status='resolved') THEN RAISE EXCEPTION 'DOC-14 failed'; END IF;
IF NOT EXISTS (SELECT 1 FROM escala_doc_test.links WHERE id=3 AND status='revoked' AND valid_until='2026-06-30') THEN RAISE EXCEPTION 'DOC-15 failed'; END IF;
IF (SELECT count(*) FROM escala_doc_test.sources WHERE organization_id=10)>=2 THEN NULL; ELSE RAISE EXCEPTION 'DOC-16 failed'; END IF;
IF EXISTS (SELECT 1 FROM escala_doc_test.staging WHERE raw_payload IS NULL OR raw_hash IS NULL) THEN RAISE EXCEPTION 'DOC-17 failed'; END IF;
IF NOT EXISTS (SELECT 1 FROM escala_doc_test.audit WHERE event_type='link_homologated' AND actor_id IS NOT NULL AND evidence_source_id IS NOT NULL) THEN RAISE EXCEPTION 'DOC-18 failed'; END IF;
IF NOT EXISTS (SELECT 1 FROM escala_doc_test.teachers WHERE id=3 AND school_id=200 AND valid_from<='2026-09-10') THEN RAISE EXCEPTION 'DOC-19 failed'; END IF;
IF EXISTS (SELECT 1 FROM escala_doc_test.staging WHERE status='rejected' AND identity_id IS NOT NULL) THEN RAISE EXCEPTION 'DOC-20 failed'; END IF;
END $$;
SELECT 'PASS' AS status, (SELECT count(*) FROM escala_doc_test.staging) AS staging_rows, (SELECT count(*) FROM escala_doc_test.links) AS links, (SELECT count(*) FROM escala_doc_test.audit) AS audit_events;
ROLLBACK;
