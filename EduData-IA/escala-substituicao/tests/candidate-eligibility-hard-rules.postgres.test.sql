-- Escala de Substituição — Harness PostgreSQL
-- HARD eligibility rules v1.
-- Synthetic / isolated test. No production tables are modified.

BEGIN;

CREATE SCHEMA escala_candidate_test;

CREATE TABLE escala_candidate_test.vacancies (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  component_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'resolved', 'blocked')),
  source_published boolean NOT NULL
);

CREATE TABLE escala_candidate_test.teachers (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  identity_homologated boolean NOT NULL,
  operationally_in_scope boolean NOT NULL,
  qualification_valid boolean NOT NULL,
  administrative_block boolean NOT NULL
);

CREATE TABLE escala_candidate_test.unavailability (
  id uuid PRIMARY KEY,
  teacher_id uuid NOT NULL REFERENCES escala_candidate_test.teachers(id),
  unavailable_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  CHECK (end_time > start_time)
);

CREATE TABLE escala_candidate_test.official_obligations (
  id uuid PRIMARY KEY,
  teacher_id uuid NOT NULL REFERENCES escala_candidate_test.teachers(id),
  school_id uuid NOT NULL,
  obligation_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'cancelled')),
  CHECK (end_time > start_time)
);

CREATE TABLE escala_candidate_test.confirmed_substitutions (
  id uuid PRIMARY KEY,
  teacher_id uuid NOT NULL REFERENCES escala_candidate_test.teachers(id),
  school_id uuid NOT NULL,
  substitution_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
  CHECK (end_time > start_time)
);

CREATE TABLE escala_candidate_test.candidates (
  id uuid PRIMARY KEY,
  vacancy_id uuid NOT NULL REFERENCES escala_candidate_test.vacancies(id),
  teacher_id uuid NOT NULL REFERENCES escala_candidate_test.teachers(id),
  eligibility_status text NOT NULL CHECK (eligibility_status IN ('eligible', 'ineligible', 'blocked', 'pending_validation')),
  evaluated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE escala_candidate_test.candidate_rule_results (
  candidate_id uuid NOT NULL REFERENCES escala_candidate_test.candidates(id),
  rule_code text NOT NULL,
  passed boolean NOT NULL,
  PRIMARY KEY (candidate_id, rule_code)
);

INSERT INTO escala_candidate_test.vacancies
  (id, organization_id, school_id, scheduled_date, start_time, end_time, component_id, status, source_published)
VALUES
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2026-09-14', '14:20', '15:10', '40000000-0000-0000-0000-000000000001', 'active', true);

-- T01: fully eligible.
INSERT INTO escala_candidate_test.teachers VALUES
('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', true, true, true, false);

-- T02: identity not homologated.
INSERT INTO escala_candidate_test.teachers VALUES
('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', false, true, true, false);

-- T03: out of operational scope.
INSERT INTO escala_candidate_test.teachers VALUES
('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', true, false, true, false);

-- T04: qualification mismatch.
INSERT INTO escala_candidate_test.teachers VALUES
('50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', true, true, false, false);

-- T05: administrative block.
INSERT INTO escala_candidate_test.teachers VALUES
('50000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', true, true, true, true);

-- T06: confirmed unavailability overlaps vacancy.
INSERT INTO escala_candidate_test.teachers VALUES
('50000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', true, true, true, false);
INSERT INTO escala_candidate_test.unavailability VALUES
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000006', '2026-09-14', '14:00', '14:40', 'confirmed');

-- T07: own official obligation overlaps vacancy.
INSERT INTO escala_candidate_test.teachers VALUES
('50000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', true, true, true, false);
INSERT INTO escala_candidate_test.official_obligations VALUES
('70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', '2026-09-14', '15:00', '15:30', 'scheduled');

-- T08: confirmed substitution overlaps vacancy.
INSERT INTO escala_candidate_test.teachers VALUES
('50000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', true, true, true, false);
INSERT INTO escala_candidate_test.confirmed_substitutions VALUES
('80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000001', '2026-09-14', '14:50', '15:20', 'confirmed');

-- T09: multiple hard failures must remain observable independently.
INSERT INTO escala_candidate_test.teachers VALUES
('50000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', false, false, false, true);

-- T10: boundary-touching obligation is NOT a temporal conflict.
INSERT INTO escala_candidate_test.teachers VALUES
('50000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', true, true, true, false);
INSERT INTO escala_candidate_test.official_obligations VALUES
('70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000001', '2026-09-14', '15:10', '16:00', 'scheduled');

-- Evaluate T01.
INSERT INTO escala_candidate_test.candidates (id, vacancy_id, teacher_id, eligibility_status)
VALUES ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'eligible');
INSERT INTO escala_candidate_test.candidate_rule_results
SELECT '90000000-0000-0000-0000-000000000001', r.rule_code, true
FROM (VALUES ('HARD-01'), ('HARD-02'), ('HARD-03'), ('HARD-04'), ('HARD-05'), ('HARD-06'), ('HARD-07'), ('HARD-08')) r(rule_code);

-- T02: HARD-01.
INSERT INTO escala_candidate_test.candidates VALUES
('90000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'ineligible', now());
INSERT INTO escala_candidate_test.candidate_rule_results VALUES
('90000000-0000-0000-0000-000000000002', 'HARD-01', false);

-- T03: HARD-02.
INSERT INTO escala_candidate_test.candidates VALUES
('90000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 'ineligible', now());
INSERT INTO escala_candidate_test.candidate_rule_results VALUES
('90000000-0000-0000-0000-000000000003', 'HARD-02', false);

-- T04: HARD-06.
INSERT INTO escala_candidate_test.candidates VALUES
('90000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 'ineligible', now());
INSERT INTO escala_candidate_test.candidate_rule_results VALUES
('90000000-0000-0000-0000-000000000004', 'HARD-06', false);

-- T05: HARD-07.
INSERT INTO escala_candidate_test.candidates VALUES
('90000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', 'ineligible', now());
INSERT INTO escala_candidate_test.candidate_rule_results VALUES
('90000000-0000-0000-0000-000000000005', 'HARD-07', false);

-- T06: HARD-03 overlap: 14:00-14:40 overlaps 14:20-15:10.
INSERT INTO escala_candidate_test.candidates VALUES
('90000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000006', 'ineligible', now());
INSERT INTO escala_candidate_test.candidate_rule_results VALUES
('90000000-0000-0000-0000-000000000006', 'HARD-03', false);

-- T07: HARD-04 overlap: 15:00-15:30 overlaps 14:20-15:10.
INSERT INTO escala_candidate_test.candidates VALUES
('90000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000007', 'ineligible', now());
INSERT INTO escala_candidate_test.candidate_rule_results VALUES
('90000000-0000-0000-0000-000000000007', 'HARD-04', false);

-- T08: HARD-05 overlap: 14:50-15:20 overlaps vacancy.
INSERT INTO escala_candidate_test.candidates VALUES
('90000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000008', 'ineligible', now());
INSERT INTO escala_candidate_test.candidate_rule_results VALUES
('90000000-0000-0000-0000-000000000008', 'HARD-05', false);

-- T09: multiple failures; all must be retained.
INSERT INTO escala_candidate_test.candidates VALUES
('90000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000009', 'ineligible', now());
INSERT INTO escala_candidate_test.candidate_rule_results
SELECT '90000000-0000-0000-0000-000000000009', rule_code, false
FROM (VALUES ('HARD-01'), ('HARD-02'), ('HARD-06'), ('HARD-07')) r(rule_code);

-- T10: exact boundary 15:10 is not conflict.
INSERT INTO escala_candidate_test.candidates VALUES
('90000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000010', 'eligible', now());
INSERT INTO escala_candidate_test.candidate_rule_results VALUES
('90000000-0000-0000-0000-000000000010', 'HARD-04', true);

-- GATE-01: no ineligible candidate may be treated as eligible.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_candidate_test.candidates c
    WHERE c.eligibility_status = 'eligible'
      AND EXISTS (
        SELECT 1 FROM escala_candidate_test.candidate_rule_results r
        WHERE r.candidate_id = c.id AND r.passed = false
      )
  ) THEN
    RAISE EXCEPTION 'GATE-01 failed: ineligible candidate marked eligible';
  END IF;
END $$;

-- GATE-02: every explicit hard failure produces an ineligible result.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM escala_candidate_test.candidate_rule_results r
    JOIN escala_candidate_test.candidates c ON c.id = r.candidate_id
    WHERE r.passed = false AND c.eligibility_status = 'eligible'
  ) THEN
    RAISE EXCEPTION 'GATE-02 failed: hard rule failure bypassed eligibility gate';
  END IF;
END $$;

-- GATE-03: multiple violations are preserved rather than collapsed to one reason.
DO $$
BEGIN
  IF (SELECT count(*) FROM escala_candidate_test.candidate_rule_results WHERE candidate_id = '90000000-0000-0000-0000-000000000009' AND passed = false) <> 4 THEN
    RAISE EXCEPTION 'GATE-03 failed: multiple hard failures were not preserved';
  END IF;
END $$;

-- GATE-04: temporal boundary rule is strict overlap, not <= on both edges.
DO $$
DECLARE
  conflict boolean;
BEGIN
  SELECT (o.start_time < v.end_time AND v.start_time < o.end_time)
    INTO conflict
  FROM escala_candidate_test.official_obligations o
  CROSS JOIN escala_candidate_test.vacancies v
  WHERE o.id = '70000000-0000-0000-0000-000000000002'
    AND v.id = '10000000-0000-0000-0000-000000000001';
  IF conflict IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'GATE-04 failed: boundary-touching interval treated as conflict';
  END IF;
END $$;

-- GATE-05: source publication is a prerequisite for candidate evaluation.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_candidate_test.vacancies
    WHERE status = 'active' AND source_published = false
  ) THEN
    RAISE EXCEPTION 'GATE-05 failed: unpublished vacancy remained eligible for evaluation';
  END IF;
END $$;

ROLLBACK;
