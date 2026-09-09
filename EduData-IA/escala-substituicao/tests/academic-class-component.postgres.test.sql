-- Escala Inteligente de Substituição
-- Harness isolado: academic_classes + academic_components
-- NÃO é migration de produção. Executar somente em banco de teste.

BEGIN;

CREATE SCHEMA IF NOT EXISTS escala_academic_test;

CREATE TABLE escala_academic_test.organizations (
  id uuid PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE escala_academic_test.schools (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES escala_academic_test.organizations(id),
  name text NOT NULL,
  UNIQUE (id, organization_id)
);

CREATE TABLE escala_academic_test.school_years (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES escala_academic_test.organizations(id),
  school_id uuid NOT NULL,
  label text NOT NULL,
  UNIQUE (id, school_id, organization_id),
  FOREIGN KEY (school_id, organization_id)
    REFERENCES escala_academic_test.schools(id, organization_id)
);

CREATE TABLE escala_academic_test.academic_classes (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  school_year_id uuid NOT NULL,
  official_external_id text,
  official_code text,
  official_name text NOT NULL,
  stage text,
  grade_level text,
  shift text,
  status text NOT NULL CHECK (status IN ('active','inactive','archived')),
  source_system text NOT NULL,
  source_record_id text,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until > valid_from),
  FOREIGN KEY (school_id, organization_id)
    REFERENCES escala_academic_test.schools(id, organization_id),
  FOREIGN KEY (school_year_id, school_id, organization_id)
    REFERENCES escala_academic_test.school_years(id, school_id, organization_id)
);

CREATE UNIQUE INDEX academic_classes_external_uq
  ON escala_academic_test.academic_classes (school_id, school_year_id, official_external_id)
  WHERE official_external_id IS NOT NULL;

CREATE TABLE escala_academic_test.academic_components (
  id uuid PRIMARY KEY,
  organization_id uuid,
  official_code text,
  official_name text NOT NULL,
  knowledge_area text,
  teaching_stage text,
  status text NOT NULL CHECK (status IN ('active','inactive','archived')),
  source_system text NOT NULL,
  source_record_id text,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE TABLE escala_academic_test.import_staging (
  id uuid PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('class','component')),
  source_record_id text NOT NULL,
  matching_status text NOT NULL CHECK (matching_status IN ('resolved','ambiguous','unresolved','rejected')),
  matching_method text,
  canonical_id uuid,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  validated_by uuid,
  validated_at timestamptz
);

-- Seed
INSERT INTO escala_academic_test.organizations VALUES
('00000000-0000-0000-0000-000000000001','Org A'),
('00000000-0000-0000-0000-000000000002','Org B');

INSERT INTO escala_academic_test.schools VALUES
('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','School A','Org A'),
('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','School B','Org A'),
('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000002','School C','Org B');

INSERT INTO escala_academic_test.school_years VALUES
('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','2026'),
('00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012','2026'),
('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000021','2026');

-- CLASS-01: valid class
INSERT INTO escala_academic_test.academic_classes
(id, organization_id, school_id, school_year_id, official_external_id, official_code, official_name, status, source_system, valid_from)
VALUES
('00000000-0000-0000-0000-000000001001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000101','EXT-001','1A','1º Ano A','active','official-source','2026-01-01');

-- CLASS-02: duplicate external id must fail (expected constraint violation)
-- CLASS-03/04: wrong school/org/year must fail (expected FK violation)
-- CLASS-05: invalid validity must fail (expected CHECK violation)

-- COMP-01: valid institutional component
INSERT INTO escala_academic_test.academic_components
(id, organization_id, official_code, official_name, status, source_system, valid_from)
VALUES
('00000000-0000-0000-0000-000000002001','00000000-0000-0000-0000-000000000001','FIS','Física','active','official-source','2026-01-01');

-- COMP-02: duplicate-code behavior is intentionally not enforced yet;
-- scope of official_code (global vs institutional) remains a homologation dependency.

-- MATCH-01: resolved is publishable after validation.
INSERT INTO escala_academic_test.import_staging
(id, entity_type, source_record_id, matching_status, matching_method, canonical_id, validated_at)
VALUES
('00000000-0000-0000-0000-000000003001','class','EXT-001','resolved','official_external_id','00000000-0000-0000-0000-000000001001',now());

-- MATCH-02..04: ambiguous/unresolved/rejected remain outside publication.
INSERT INTO escala_academic_test.import_staging
(id, entity_type, source_record_id, matching_status, matching_method)
VALUES
('00000000-0000-0000-0000-000000003002','class','EXT-002','ambiguous','composite_homologated'),
('00000000-0000-0000-0000-000000003003','component','EXT-C-003','unresolved',NULL),
('00000000-0000-0000-0000-000000003004','component','EXT-C-004','rejected',NULL);

-- AUDIT-01: no text-only matching as canonical identity.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_academic_test.import_staging
    WHERE matching_status = 'resolved' AND matching_method = 'name_only'
  ) THEN
    RAISE EXCEPTION 'AUDIT-01 failed: name-only matching cannot be resolved';
  END IF;
END $$;

-- AUDIT-02: only resolved rows may carry a canonical id.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_academic_test.import_staging
    WHERE matching_status <> 'resolved' AND canonical_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'AUDIT-02 failed: non-resolved staging row has canonical id';
  END IF;
END $$;

-- AUDIT-03: valid temporal range.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_academic_test.academic_classes
    WHERE valid_until IS NOT NULL AND valid_until <= valid_from
  ) THEN
    RAISE EXCEPTION 'AUDIT-03 failed: invalid class validity';
  END IF;
END $$;

-- AUDIT-04: external class identity is unique in school/year context.
DO $$
BEGIN
  IF (
    SELECT count(*) FROM escala_academic_test.academic_classes
    WHERE school_id = '00000000-0000-0000-0000-000000000011'
      AND school_year_id = '00000000-0000-0000-0000-000000000101'
      AND official_external_id = 'EXT-001'
  ) <> 1 THEN
    RAISE EXCEPTION 'AUDIT-04 failed: external identity is not unique';
  END IF;
END $$;

-- AUDIT-05: global component is permitted without organization scope.
INSERT INTO escala_academic_test.academic_components
(id, official_code, official_name, status, source_system, valid_from)
VALUES
('00000000-0000-0000-0000-000000002002','MAT','Matemática','active','official-catalog','2026-01-01');

-- AUDIT-06: history is represented through validity, not destructive overwrite.
INSERT INTO escala_academic_test.academic_classes
(id, organization_id, school_id, school_year_id, official_external_id, official_name, status, source_system, valid_from, valid_until)
VALUES
('00000000-0000-0000-0000-000000001002','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000101','EXT-OLD','1º Ano A - histórico','archived','official-source','2025-01-01','2025-12-31');

-- The harness is intentionally rolled back: no persistent test objects.
ROLLBACK;
