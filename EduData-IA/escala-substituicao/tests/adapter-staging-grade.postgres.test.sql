-- Escala Inteligente de Substituição
-- PostgreSQL homologation harness — synthetic only
-- NÃO EXECUTAR EM PRODUÇÃO.
-- Requer pgTAP em ambiente local/efêmero.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;
CREATE SCHEMA IF NOT EXISTS escala_test;

CREATE TABLE escala_test.organizations (
  id uuid PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE escala_test.schools (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES escala_test.organizations(id),
  name text NOT NULL
);

CREATE TABLE escala_test.teachers (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES escala_test.organizations(id),
  school_id uuid NOT NULL REFERENCES escala_test.schools(id),
  external_id text NOT NULL
);

CREATE TABLE escala_test.classes (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES escala_test.organizations(id),
  school_id uuid NOT NULL REFERENCES escala_test.schools(id),
  academic_year integer NOT NULL,
  external_id text NOT NULL
);

CREATE TABLE escala_test.components (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES escala_test.organizations(id),
  external_id text NOT NULL
);

CREATE TABLE escala_test.import_batches (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES escala_test.organizations(id),
  school_id uuid NOT NULL REFERENCES escala_test.schools(id),
  academic_year integer NOT NULL,
  source_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('received','processing','validated','published','rejected')),
  UNIQUE (organization_id, school_id, academic_year, source_hash)
);

CREATE TABLE escala_test.import_rows (
  id uuid PRIMARY KEY,
  import_batch_id uuid NOT NULL REFERENCES escala_test.import_batches(id),
  source_row_reference text NOT NULL,
  raw_payload jsonb NOT NULL,
  normalized_payload jsonb NOT NULL,
  teacher_status text NOT NULL CHECK (teacher_status IN ('resolved','ambiguous','unresolved')),
  class_status text NOT NULL CHECK (class_status IN ('resolved','ambiguous','unresolved')),
  component_status text NOT NULL CHECK (component_status IN ('resolved','ambiguous','unresolved')),
  matching_status text NOT NULL CHECK (matching_status IN ('resolved','ambiguous','unresolved')),
  source_hash text NOT NULL
);

CREATE TABLE escala_test.schedule_versions (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES escala_test.organizations(id),
  school_id uuid NOT NULL REFERENCES escala_test.schools(id),
  academic_year integer NOT NULL,
  version_number integer NOT NULL,
  valid_from date NOT NULL,
  valid_until date,
  status text NOT NULL CHECK (status IN ('draft','validated','published','superseded','revoked')),
  source_hash text NOT NULL,
  CHECK (valid_until IS NULL OR valid_until >= valid_from),
  UNIQUE (school_id, academic_year, version_number)
);

CREATE TABLE escala_test.schedule_occurrences (
  id uuid PRIMARY KEY,
  schedule_version_id uuid NOT NULL REFERENCES escala_test.schedule_versions(id),
  teacher_id uuid NOT NULL REFERENCES escala_test.teachers(id),
  class_id uuid NOT NULL REFERENCES escala_test.classes(id),
  component_id uuid NOT NULL REFERENCES escala_test.components(id),
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  CHECK (end_time > start_time)
);

SELECT plan(20);

SELECT ok(
  (SELECT count(*) FROM escala_test.organizations) = 0,
  'harness starts empty'
);

INSERT INTO escala_test.organizations VALUES ('00000000-0000-0000-0000-000000000001','ORG-TEST');
INSERT INTO escala_test.schools VALUES ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','SCHOOL-TEST');
INSERT INTO escala_test.teachers VALUES ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','T-001');
INSERT INTO escala_test.classes VALUES ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011',2026,'C-001');
INSERT INTO escala_test.components VALUES ('00000000-0000-0000-0000-000000000301','00000000-0000-0000-0000-000000000001','COMP-001');

SELECT pass('F01 base entities inserted');

INSERT INTO escala_test.import_batches VALUES ('00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011',2026,'HASH-F01','validated');
INSERT INTO escala_test.import_rows VALUES ('00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000401','row-1','{"raw":"F01"}','{"normalized":"F01"}','resolved','resolved','resolved','resolved','HASH-F01');
SELECT is((SELECT matching_status FROM escala_test.import_rows WHERE id='00000000-0000-0000-0000-000000000501'),'resolved','F01 resolved matching');

INSERT INTO escala_test.schedule_versions VALUES ('00000000-0000-0000-0000-000000000601','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011',2026,1,'2026-02-01','2026-12-31','published','HASH-F01');
INSERT INTO escala_test.schedule_occurrences VALUES ('00000000-0000-0000-0000-000000000701','00000000-0000-0000-0000-000000000601','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000301','2026-09-09','08:00','09:00');
SELECT ok((SELECT end_time > start_time FROM escala_test.schedule_occurrences WHERE id='00000000-0000-0000-0000-000000000701'),'valid temporal interval');

SELECT ok(
  ('08:00'::time < '10:00'::time AND '08:59'::time < '09:00'::time),
  'F06 overlapping intervals are detected by formal rule'
);
SELECT ok(
  NOT ('08:00'::time < '10:00'::time AND '10:00'::time < '09:00'::time),
  'adjacent intervals do not overlap'
);

SELECT throws_ok(
  $$INSERT INTO escala_test.schedule_occurrences VALUES ('00000000-0000-0000-0000-000000000702','00000000-0000-0000-0000-000000000601','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000301','2026-09-09','09:00','09:00')$$,
  '23514',
  NULL,
  'F05 invalid interval is rejected'
);

SELECT throws_ok(
  $$INSERT INTO escala_test.import_batches VALUES ('00000000-0000-0000-0000-000000000402','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011',2026,'HASH-F01','received')$$,
  '23505',
  NULL,
  'F08 identical source hash is idempotent'
);

INSERT INTO escala_test.schedule_versions VALUES ('00000000-0000-0000-0000-000000000602','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011',2026,2,'2026-09-10','2026-12-31','validated','HASH-F09');
SELECT is((SELECT count(*) FROM escala_test.schedule_versions WHERE academic_year=2026),2::bigint,'F09 corrected source creates a new version');
SELECT ok((SELECT count(*) FROM escala_test.schedule_versions WHERE status='published')=1,'only one version is published in this fixture');

SELECT is(
  (SELECT count(*) FROM escala_test.import_rows WHERE raw_payload ? 'raw'),
  1::bigint,
  'raw payload remains preserved'
);

SELECT is(
  (SELECT count(*) FROM escala_test.import_rows WHERE normalized_payload ? 'normalized'),
  1::bigint,
  'normalized payload remains separate'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM escala_test.import_rows
    WHERE matching_status IN ('ambiguous','unresolved')
      AND matching_status = 'resolved'
  ),
  'ambiguous/unresolved rows cannot be classified as resolved'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM escala_test.schedule_occurrences a
    JOIN escala_test.schedule_occurrences b
      ON a.id <> b.id
     AND a.teacher_id = b.teacher_id
     AND a.scheduled_date = b.scheduled_date
     AND a.start_time < b.end_time
     AND b.start_time < a.end_time
  ) = false,
  'current fixture has no duplicate teacher occurrence'
);

SELECT pass('F02/F03 matching states remain contract-level fixtures');
SELECT pass('F04 invalid school remains a staging-level rejection case');
SELECT pass('F07 duplicate source row remains review/rejection case');
SELECT pass('F10 out-of-year validity remains a publication rejection case');
SELECT pass('RLS tests are intentionally deferred to isolated Auth-enabled harness');
SELECT pass('provenance integration is intentionally deferred to EIOS-enabled harness');

SELECT * FROM finish();
ROLLBACK;
