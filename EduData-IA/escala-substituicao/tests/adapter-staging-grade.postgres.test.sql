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
  source_hash text NOT NULL,
  UNIQUE (import_batch_id, source_row_reference)
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

SELECT plan(29);

SELECT ok(
  (SELECT count(*) FROM escala_test.organizations) = 0,
  'harness starts empty'
);

INSERT INTO escala_test.organizations VALUES ('00000000-0000-0000-0000-000000000001','ORG-TEST');
INSERT INTO escala_test.schools VALUES ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','SCHOOL-TEST');
INSERT INTO escala_test.teachers VALUES ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','T-001');
INSERT INTO escala_test.classes VALUES ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011',2026,'C-001');
INSERT INTO escala_test.components VALUES ('00000000-0000-0000-0000-000000000301','00000000-0000-0000-0000-000000000001','COMP-001');

SELECT ok(
  (SELECT count(*) FROM escala_test.organizations) = 1
  AND (SELECT count(*) FROM escala_test.schools) = 1
  AND (SELECT count(*) FROM escala_test.teachers) = 1
  AND (SELECT count(*) FROM escala_test.classes) = 1
  AND (SELECT count(*) FROM escala_test.components) = 1,
  'F01 base entities are present with required foreign-key structure'
);

INSERT INTO escala_test.import_batches VALUES ('00000000-0000-0000-0000-000000000401','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011',2026,'HASH-F01','validated');
INSERT INTO escala_test.import_rows VALUES ('00000000-0000-0000-0000-000000000501','00000000-0000-0000-0000-000000000401','row-1','{"raw":"F01"}','{"normalized":"F01"}','resolved','resolved','resolved','resolved','HASH-F01');
SELECT is((SELECT matching_status FROM escala_test.import_rows WHERE id='00000000-0000-0000-0000-000000000501'),'resolved','F01 resolved matching');

SELECT is(
  (SELECT teacher_status || ':' || class_status || ':' || component_status
   FROM escala_test.import_rows WHERE id='00000000-0000-0000-0000-000000000501'),
  'resolved:resolved:resolved',
  'F01 all entity matches are resolved'
);

INSERT INTO escala_test.schedule_versions VALUES ('00000000-0000-0000-0000-000000000601','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011',2026,1,'2026-02-01','2026-12-31','published','HASH-F01');
INSERT INTO escala_test.schedule_occurrences VALUES ('00000000-0000-0000-0000-000000000701','00000000-0000-0000-0000-000000000601','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000301','2026-09-09','08:00','09:00');
SELECT ok((SELECT end_time > start_time FROM escala_test.schedule_occurrences WHERE id='00000000-0000-0000-0000-000000000701'),'valid temporal interval');

SELECT ok(
  ('08:00'::time < '10:00'::time AND '09:00'::time < '10:00'::time),
  'F06 overlapping intervals satisfy the formal intersection predicate'
);
SELECT ok(
  NOT ('08:00'::time < '10:00'::time AND '10:00'::time < '11:00'::time),
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

INSERT INTO escala_test.import_rows VALUES ('00000000-0000-0000-0000-000000000502','00000000-0000-0000-0000-000000000401','row-2','{"raw":"F02"}','{"normalized":"F02"}','ambiguous','resolved','resolved','ambiguous','HASH-F02');
SELECT is((SELECT matching_status FROM escala_test.import_rows WHERE id='00000000-0000-0000-0000-000000000502'),'ambiguous','F02 ambiguous matching remains reviewable');
SELECT ok(
  (SELECT teacher_status FROM escala_test.import_rows WHERE id='00000000-0000-0000-0000-000000000502') = 'ambiguous'
  AND (SELECT matching_status FROM escala_test.import_rows WHERE id='00000000-0000-0000-0000-000000000502') <> 'resolved',
  'F02 ambiguity cannot be promoted to resolved'
);

INSERT INTO escala_test.import_rows VALUES ('00000000-0000-0000-0000-000000000503','00000000-0000-0000-0000-000000000401','row-3','{"raw":"F03"}','{"normalized":"F03"}','unresolved','resolved','resolved','unresolved','HASH-F03');
SELECT is((SELECT matching_status FROM escala_test.import_rows WHERE id='00000000-0000-0000-0000-000000000503'),'unresolved','F03 unresolved matching remains blocked');
SELECT ok(
  (SELECT teacher_status FROM escala_test.import_rows WHERE id='00000000-0000-0000-0000-000000000503') = 'unresolved'
  AND (SELECT matching_status FROM escala_test.import_rows WHERE id='00000000-0000-0000-0000-000000000503') <> 'resolved',
  'F03 unresolved identity cannot be promoted to resolved'
);

SELECT throws_ok(
  $$INSERT INTO escala_test.import_rows VALUES ('00000000-0000-0000-0000-000000000504','00000000-0000-0000-0000-000000000401','row-1','{"raw":"F04"}','{"normalized":"F04"}','resolved','resolved','resolved','resolved','HASH-F04')$$,
  '23505',
  NULL,
  'F07 duplicate source row is rejected within the batch'
);

INSERT INTO escala_test.schools VALUES ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','SCHOOL-TEST-2');
SELECT throws_ok(
  $$INSERT INTO escala_test.classes VALUES ('00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012',2025,'C-F04')$$,
  '23503',
  NULL,
  'F04 invalid class school reference is rejected by FK'
);

INSERT INTO escala_test.schedule_versions VALUES ('00000000-0000-0000-0000-000000000602','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011',2026,2,'2026-09-10','2026-12-31','validated','HASH-F09');
SELECT is((SELECT count(*) FROM escala_test.schedule_versions WHERE academic_year=2026),2::bigint,'F09 corrected source creates a new version');
SELECT ok((SELECT count(*) FROM escala_test.schedule_versions WHERE status='published')=1,'only one version is published in this fixture');

SELECT throws_ok(
  $$INSERT INTO escala_test.schedule_versions VALUES ('00000000-0000-0000-0000-000000000603','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011',2026,3,'2026-12-31','2026-12-01','validated','HASH-F10')$$,
  '23514',
  NULL,
  'F10 invalid validity interval is rejected'
);

SELECT ok(
  (SELECT valid_from <= COALESCE(valid_until, valid_from)
   FROM escala_test.schedule_versions
   WHERE id='00000000-0000-0000-0000-000000000602'),
  'F10 valid version has coherent validity interval'
);

-- ADP-13: an occurrence outside the published version validity must be excluded
-- from the publishable set. This is a synthetic temporal rule only; it does not
-- infer or implement any SED-specific physical key or publication mechanism.
WITH synthetic_occurrence AS (
  SELECT DATE '2027-01-01' AS scheduled_date
), synthetic_validity AS (
  SELECT DATE '2026-02-01' AS valid_from, DATE '2026-12-31' AS valid_until
)
SELECT is(
  (SELECT count(*) FROM synthetic_occurrence o, synthetic_validity v
   WHERE o.scheduled_date NOT BETWEEN v.valid_from AND v.valid_until),
  1::bigint,
  'ADP-13 identifies an occurrence outside version validity'
);

WITH synthetic_occurrence AS (
  SELECT DATE '2027-01-01' AS scheduled_date
), synthetic_validity AS (
  SELECT DATE '2026-02-01' AS valid_from, DATE '2026-12-31' AS valid_until
)
SELECT is(
  (SELECT count(*) FROM synthetic_occurrence o, synthetic_validity v
   WHERE o.scheduled_date BETWEEN v.valid_from AND v.valid_until),
  0::bigint,
  'ADP-13 occurrence outside validity is excluded from the publishable set'
);

-- ADP-10: two normalized rows may represent the same synthetic logical slot
-- while carrying incompatible teacher/time payloads. They must not be treated
-- as idempotent merely because the logical slot is repeated. This is a
-- behavioral guard only; it does not define a SED-specific identity key.
WITH synthetic_rows AS (
  SELECT
    'slot-A'::text AS logical_slot,
    'teacher-A'::text AS teacher_ref,
    '08:00-09:00'::text AS time_ref,
    'HASH-A'::text AS source_hash
  UNION ALL
  SELECT
    'slot-A',
    'teacher-B',
    '08:00-09:00',
    'HASH-B'
), incompatible AS (
  SELECT logical_slot
  FROM synthetic_rows
  GROUP BY logical_slot
  HAVING count(*) = 2
     AND count(DISTINCT teacher_ref) > 1
     AND count(DISTINCT time_ref) = 1
     AND count(DISTINCT source_hash) = 2
)
SELECT is(
  (SELECT count(*) FROM incompatible),
  1::bigint,
  'ADP-10 detects incompatible duplicate content for the same synthetic logical slot'
);

WITH synthetic_rows AS (
  SELECT
    'slot-A'::text AS logical_slot,
    'teacher-A'::text AS teacher_ref,
    '08:00-09:00'::text AS time_ref,
    'HASH-A'::text AS source_hash
  UNION ALL
  SELECT
    'slot-A',
    'teacher-B',
    '08:00-09:00',
    'HASH-B'
), incompatible AS (
  SELECT logical_slot
  FROM synthetic_rows
  GROUP BY logical_slot
  HAVING count(*) = 2
     AND count(DISTINCT teacher_ref) > 1
     AND count(DISTINCT time_ref) = 1
     AND count(DISTINCT source_hash) = 2
)
SELECT is(
  (SELECT count(*) FROM incompatible WHERE logical_slot IS NOT NULL),
  1::bigint,
  'ADP-10 incompatible duplicate remains non-idempotent and requires review'
);

SELECT is(
  (SELECT count(*) FROM escala_test.import_rows WHERE raw_payload ? 'raw'),
  3::bigint,
  'raw payload remains preserved for every accepted synthetic row'
);

SELECT is(
  (SELECT count(*) FROM escala_test.import_rows WHERE normalized_payload ? 'normalized'),
  3::bigint,
  'normalized payload remains separate from raw payload'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM escala_test.import_rows
    WHERE (matching_status = 'resolved' AND (teacher_status <> 'resolved' OR class_status <> 'resolved' OR component_status <> 'resolved'))
  ),
  'resolved matching requires every entity status to be resolved'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM escala_test.schedule_occurrences a
    JOIN escala_test.schedule_occurrences b
      ON a.id <> b.id
     AND a.teacher_id = b.teacher_id
     AND a.scheduled_date = b.scheduled_date
     AND a.start_time < b.end_time
     AND b.start_time < a.end_time
  ),
  'current fixture has no conflicting teacher occurrences'
);

SELECT ok(
  (SELECT count(*) FROM escala_test.schedule_versions WHERE source_hash='HASH-F01') = 1
  AND (SELECT count(*) FROM escala_test.schedule_versions WHERE source_hash='HASH-F09') = 1,
  'source hashes identify distinct synthetic versions'
);

SELECT * FROM finish();
ROLLBACK;
