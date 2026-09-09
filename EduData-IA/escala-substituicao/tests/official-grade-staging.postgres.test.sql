-- Escala Inteligente de Substituição
-- Harness isolado do staging/publicação da grade oficial.
-- NÃO é migration de produção.

BEGIN;

CREATE SCHEMA IF NOT EXISTS escala_grade_test;

CREATE TABLE escala_grade_test.batches (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  school_year_id uuid NOT NULL,
  source_system text NOT NULL,
  source_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('received','parsed','normalized','matching','homologation','published','rejected','cancelled')),
  imported_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX batches_source_hash_context_uq
  ON escala_grade_test.batches (organization_id, school_id, school_year_id, source_system, source_hash);

CREATE TABLE escala_grade_test.rows (
  id uuid PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES escala_grade_test.batches(id),
  source_record_id text NOT NULL,
  source_row_number integer,
  raw_payload jsonb NOT NULL,
  normalized_payload jsonb,
  class_external_id text,
  component_external_code text,
  teacher_external_id text,
  start_time time,
  end_time time,
  matching_status text NOT NULL CHECK (matching_status IN ('resolved','ambiguous','unresolved','rejected')),
  class_canonical_id uuid,
  component_canonical_id uuid,
  teacher_canonical_id uuid,
  matching_method text,
  matching_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation_status text NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending','validated','rejected')),
  validated_by uuid,
  validated_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time IS NULL OR start_time IS NULL OR start_time < end_time),
  CHECK (matching_status = 'resolved' OR class_canonical_id IS NULL),
  CHECK (matching_status = 'resolved' OR component_canonical_id IS NULL),
  CHECK (matching_status = 'resolved' OR teacher_canonical_id IS NULL)
);

CREATE TABLE escala_grade_test.versions (
  id uuid PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES escala_grade_test.batches(id),
  version_number integer NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','validated','published','superseded')),
  published_at timestamptz,
  published_by uuid,
  UNIQUE (batch_id, version_number)
);

CREATE TABLE escala_grade_test.publication_rows (
  id uuid PRIMARY KEY,
  version_id uuid NOT NULL REFERENCES escala_grade_test.versions(id),
  staging_row_id uuid NOT NULL REFERENCES escala_grade_test.rows(id),
  UNIQUE (version_id, staging_row_id)
);

-- Seed two batches: same source content must be idempotently recognizable.
INSERT INTO escala_grade_test.batches
(id,organization_id,school_id,school_year_id,source_system,source_hash,status)
VALUES
('00000000-0000-0000-0000-000000010001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000101','official-source','HASH-A','homologation');

-- IDP-01: duplicate source hash/context must be rejected.
DO $$
BEGIN
  BEGIN
    INSERT INTO escala_grade_test.batches
    (id,organization_id,school_id,school_year_id,source_system,source_hash,status)
    VALUES
    ('00000000-0000-0000-0000-000000010002','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000101','official-source','HASH-A','received');
    RAISE EXCEPTION 'IDP-01 failed: duplicate source hash accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END $$;

-- STG-01: valid resolved row.
INSERT INTO escala_grade_test.rows
(id,batch_id,source_record_id,raw_payload,normalized_payload,class_external_id,component_external_code,teacher_external_id,start_time,end_time,matching_status,class_canonical_id,component_canonical_id,teacher_canonical_id,matching_method,validation_status)
VALUES
('00000000-0000-0000-0000-000000020001','00000000-0000-0000-0000-000000010001','ROW-001','{"turma":"1A","componente":"FIS"}','{"class":"EXT-1A","component":"FIS"}','EXT-1A','FIS','TEACH-01','14:00','15:00','resolved','00000000-0000-0000-0000-000000001001','00000000-0000-0000-0000-000000002001','00000000-0000-0000-0000-000000003001','official_external_id','validated');

-- STG-02: ambiguous row cannot carry canonical identity.
INSERT INTO escala_grade_test.rows
(id,batch_id,source_record_id,raw_payload,matching_status,rejection_reason)
VALUES
('00000000-0000-0000-0000-000000020002','00000000-0000-0000-0000-000000010001','ROW-002','{"turma":"1A"}','ambiguous','duas turmas possíveis');

-- STG-03: unresolved row cannot be published.
INSERT INTO escala_grade_test.rows
(id,batch_id,source_record_id,raw_payload,matching_status)
VALUES
('00000000-0000-0000-0000-000000020003','00000000-0000-0000-0000-000000010001','ROW-003','{"componente":"?"}','unresolved');

-- STG-04: rejected row remains preserved.
INSERT INTO escala_grade_test.rows
(id,batch_id,source_record_id,raw_payload,matching_status,rejection_reason)
VALUES
('00000000-0000-0000-0000-000000020004','00000000-0000-0000-0000-000000010001','ROW-004','{"linha":"invalida"}','rejected','registro inválido');

-- AUD-01: publication can reference only validated resolved rows.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_grade_test.rows
    WHERE validation_status='validated' AND matching_status <> 'resolved'
  ) THEN
    RAISE EXCEPTION 'AUD-01 failed: non-resolved row validated';
  END IF;
END $$;

-- Publish version 1 with only the resolved row.
INSERT INTO escala_grade_test.versions
(id,batch_id,version_number,status,published_at,published_by)
VALUES
('00000000-0000-0000-0000-000000030001','00000000-0000-0000-0000-000000010001',1,'published',now(),'00000000-0000-0000-0000-000000009999');

INSERT INTO escala_grade_test.publication_rows(version_id,staging_row_id)
SELECT '00000000-0000-0000-0000-000000030001',id
FROM escala_grade_test.rows
WHERE batch_id='00000000-0000-0000-0000-000000010001'
  AND matching_status='resolved'
  AND validation_status='validated';

-- AUD-02: exactly one row published from the resolved/validated set.
DO $$
BEGIN
  IF (SELECT count(*) FROM escala_grade_test.publication_rows
      WHERE version_id='00000000-0000-0000-0000-000000030001') <> 1 THEN
    RAISE EXCEPTION 'AUD-02 failed: publication set is incorrect';
  END IF;
END $$;

-- Version 2 supersedes version 1; version 1 remains historical.
INSERT INTO escala_grade_test.versions
(id,batch_id,version_number,status,published_at,published_by)
VALUES
('00000000-0000-0000-0000-000000030002','00000000-0000-0000-0000-000000010001',2,'published',now(),'00000000-0000-0000-0000-000000009999');

UPDATE escala_grade_test.versions
SET status='superseded'
WHERE id='00000000-0000-0000-0000-000000030001';

-- AUD-03: historical version is preserved.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM escala_grade_test.versions
    WHERE id='00000000-0000-0000-0000-000000030001' AND status='superseded'
  ) THEN
    RAISE EXCEPTION 'AUD-03 failed: prior version was not preserved';
  END IF;
END $$;

-- AUD-04: raw evidence remains available after publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM escala_grade_test.rows
    WHERE id='00000000-0000-0000-0000-000000020001'
      AND raw_payload IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'AUD-04 failed: raw payload not preserved';
  END IF;
END $$;

-- AUD-05: invalid interval must be rejected by CHECK.
DO $$
BEGIN
  BEGIN
    INSERT INTO escala_grade_test.rows
    (id,batch_id,source_record_id,raw_payload,start_time,end_time,matching_status)
    VALUES
    ('00000000-0000-0000-0000-000000020005','00000000-0000-0000-0000-000000010001','ROW-005','{"x":1}','16:00','15:00','unresolved');
    RAISE EXCEPTION 'AUD-05 failed: invalid interval accepted';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END $$;

-- AUD-06: name-only matching is never a valid publication method.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_grade_test.rows
    WHERE matching_status='resolved' AND matching_method='name_only'
  ) THEN
    RAISE EXCEPTION 'AUD-06 failed: name-only matching accepted';
  END IF;
END $$;

-- No production persistence.
ROLLBACK;
