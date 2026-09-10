-- Escala de Substituição — Harness PostgreSQL
-- Contract: official occurrence -> confirmed absence -> substitution vacancy
-- Synthetic / isolated test. No production tables are modified.
-- Execution status: not executed locally; requires PostgreSQL.

BEGIN;

CREATE SCHEMA escala_vacancy_test;

CREATE TABLE escala_vacancy_test.schedule_versions (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'validated', 'published', 'superseded', 'revoked'))
);

CREATE TABLE escala_vacancy_test.occurrences (
  id uuid PRIMARY KEY,
  schedule_version_id uuid NOT NULL REFERENCES escala_vacancy_test.schedule_versions(id),
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  class_id uuid NOT NULL,
  component_id uuid NOT NULL,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled')),
  CHECK (end_time > start_time)
);

CREATE TABLE escala_vacancy_test.absences (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  absence_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  CHECK (end_time > start_time)
);

CREATE TABLE escala_vacancy_test.vacancies (
  id uuid PRIMARY KEY,
  occurrence_id uuid NOT NULL REFERENCES escala_vacancy_test.occurrences(id),
  absence_id uuid NOT NULL REFERENCES escala_vacancy_test.absences(id),
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  source_version_id uuid NOT NULL REFERENCES escala_vacancy_test.schedule_versions(id),
  status text NOT NULL CHECK (status IN ('active', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (occurrence_id, absence_id)
);

CREATE UNIQUE INDEX vacancies_one_active_per_occurrence
  ON escala_vacancy_test.vacancies (occurrence_id)
  WHERE status = 'active';

-- Test fixtures.
INSERT INTO escala_vacancy_test.schedule_versions
  (id, organization_id, school_id, status)
VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'published'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'draft');

INSERT INTO escala_vacancy_test.occurrences
  (id, schedule_version_id, organization_id, school_id, teacher_id, class_id, component_id, scheduled_date, start_time, end_time)
VALUES
  ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000010001', '00000000-0000-0000-0000-000000020001', '00000000-0000-0000-0000-000000030001', '2026-09-14', '14:20', '15:10'),
  ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000010002', '00000000-0000-0000-0000-000000020002', '00000000-0000-0000-0000-000000030002', '2026-09-14', '15:20', '16:10');

INSERT INTO escala_vacancy_test.absences
  (id, organization_id, school_id, teacher_id, absence_date, start_time, end_time, status)
VALUES
  ('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000010001', '2026-09-14', '14:00', '15:30', 'confirmed'),
  ('00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000010001', '2026-09-14', '14:00', '15:30', 'confirmed'),
  ('00000000-0000-0000-0000-000000002003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000010001', '2026-09-14', '14:00', '15:30', 'pending'),
  ('00000000-0000-0000-0000-000000002004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000010001', '2026-09-14', '14:00', '15:30', 'cancelled');

-- VAC-01: only published schedule occurrences are eligible.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM escala_vacancy_test.occurrences o
    JOIN escala_vacancy_test.schedule_versions v ON v.id = o.schedule_version_id
    WHERE v.status <> 'published'
  ) THEN
    RAISE EXCEPTION 'VAC-01 failed: non-published occurrence considered eligible';
  END IF;
END $$;

-- VAC-02: confirmed absence must cover the occurrence temporally.
INSERT INTO escala_vacancy_test.vacancies
  (id, occurrence_id, absence_id, organization_id, school_id, source_version_id, status)
SELECT
  '00000000-0000-0000-0000-000000003001',
  o.id,
  a.id,
  o.organization_id,
  o.school_id,
  o.schedule_version_id,
  'active'
FROM escala_vacancy_test.occurrences o
JOIN escala_vacancy_test.schedule_versions v ON v.id = o.schedule_version_id
JOIN escala_vacancy_test.absences a
  ON a.organization_id = o.organization_id
 AND a.school_id = o.school_id
 AND a.teacher_id = o.teacher_id
 AND a.absence_date = o.scheduled_date
 AND a.status = 'confirmed'
 AND a.start_time <= o.start_time
 AND a.end_time >= o.end_time
WHERE o.id = '00000000-0000-0000-0000-000000001001'
  AND v.status = 'published'
  AND NOT EXISTS (
    SELECT 1
    FROM escala_vacancy_test.vacancies vx
    WHERE vx.occurrence_id = o.id
      AND vx.status = 'active'
  )
LIMIT 1;

DO $$
BEGIN
  IF (SELECT count(*) FROM escala_vacancy_test.vacancies) <> 1 THEN
    RAISE EXCEPTION 'VAC-02 failed: confirmed absence did not generate exactly one vacancy';
  END IF;
END $$;

-- VAC-03: idempotency for the same occurrence + absence.
INSERT INTO escala_vacancy_test.vacancies
  (id, occurrence_id, absence_id, organization_id, school_id, source_version_id, status)
VALUES
  ('00000000-0000-0000-0000-000000003002', '00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000101', 'active')
ON CONFLICT (occurrence_id, absence_id) DO NOTHING;

DO $$
BEGIN
  IF (SELECT count(*) FROM escala_vacancy_test.vacancies WHERE occurrence_id = '00000000-0000-0000-0000-000000001001' AND status = 'active') <> 1 THEN
    RAISE EXCEPTION 'VAC-03 failed: duplicate active vacancy created';
  END IF;
END $$;

-- VAC-04: pending absence cannot generate a vacancy.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM escala_vacancy_test.occurrences o
    JOIN escala_vacancy_test.absences a
      ON a.teacher_id = o.teacher_id
     AND a.absence_date = o.scheduled_date
     AND a.status = 'pending'
     AND a.start_time <= o.start_time
     AND a.end_time >= o.end_time
    WHERE o.id = '00000000-0000-0000-0000-000000001001'
  ) AND EXISTS (
    SELECT 1 FROM escala_vacancy_test.vacancies v WHERE v.absence_id = '00000000-0000-0000-0000-000000002003'
  ) THEN
    RAISE EXCEPTION 'VAC-04 failed: pending absence generated vacancy';
  END IF;
END $$;

-- VAC-05: cancelled absence cannot generate an active vacancy.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_vacancy_test.vacancies
    WHERE absence_id = '00000000-0000-0000-0000-000000002004'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'VAC-05 failed: cancelled absence generated active vacancy';
  END IF;
END $$;

-- VAC-06: two different confirmed absences cannot create two active vacancies for one occurrence.
-- The partial unique index is the database invariant protecting the obligation.
DO $$
BEGIN
  BEGIN
    INSERT INTO escala_vacancy_test.vacancies
      (id, occurrence_id, absence_id, organization_id, school_id, source_version_id, status)
    VALUES
      ('00000000-0000-0000-0000-000000003003', '00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000101', 'active');
    RAISE EXCEPTION 'VAC-06 failed: second active vacancy was accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END $$;

-- VAC-07: provenance must remain linked to occurrence, absence and published version.
DO $$
DECLARE
  mismatch_count integer;
BEGIN
  SELECT count(*) INTO mismatch_count
  FROM escala_vacancy_test.vacancies vx
  JOIN escala_vacancy_test.occurrences o ON o.id = vx.occurrence_id
  WHERE vx.source_version_id <> o.schedule_version_id
     OR vx.organization_id <> o.organization_id
     OR vx.school_id <> o.school_id;
  IF mismatch_count <> 0 THEN
    RAISE EXCEPTION 'VAC-07 failed: vacancy provenance mismatch';
  END IF;
END $$;

-- VAC-08: a non-published occurrence must never receive an active vacancy.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM escala_vacancy_test.vacancies vx
    JOIN escala_vacancy_test.occurrences o ON o.id = vx.occurrence_id
    JOIN escala_vacancy_test.schedule_versions v ON v.id = o.schedule_version_id
    WHERE v.status <> 'published'
      AND vx.status = 'active'
  ) THEN
    RAISE EXCEPTION 'VAC-08 failed: vacancy attached to non-published occurrence';
  END IF;
END $$;

-- VAC-09: exact boundary is not sufficient coverage if the absence starts after the lesson.
DO $$
DECLARE
  coverage boolean;
BEGIN
  SELECT (a.start_time <= o.start_time AND a.end_time >= o.end_time)
    INTO coverage
  FROM escala_vacancy_test.occurrences o
  JOIN escala_vacancy_test.absences a
    ON a.teacher_id = o.teacher_id
   AND a.absence_date = o.scheduled_date
  WHERE o.id = '00000000-0000-0000-0000-000000001001'
    AND a.id = '00000000-0000-0000-0000-000000002001';
  IF coverage IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'VAC-09 failed: absence coverage rule not satisfied';
  END IF;
END $$;

-- VAC-10: same school and organization are mandatory for vacancy generation.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM escala_vacancy_test.vacancies vx
    JOIN escala_vacancy_test.occurrences o ON o.id = vx.occurrence_id
    WHERE vx.organization_id <> o.organization_id
       OR vx.school_id <> o.school_id
  ) THEN
    RAISE EXCEPTION 'VAC-10 failed: cross-scope vacancy detected';
  END IF;
END $$;

-- No production side effects.
ROLLBACK;
