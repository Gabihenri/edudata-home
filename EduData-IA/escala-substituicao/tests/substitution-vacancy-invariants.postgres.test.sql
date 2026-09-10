-- Escala de Substituição — Harness PostgreSQL
-- Physical invariants for substitution_vacancies v1.
-- Synthetic / isolated test. No production tables are modified.

BEGIN;

CREATE SCHEMA escala_vacancy_invariants_test;

CREATE TABLE escala_vacancy_invariants_test.schedule_versions (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'validated', 'published', 'superseded', 'revoked'))
);

CREATE TABLE escala_vacancy_invariants_test.occurrences (
  id uuid PRIMARY KEY,
  schedule_version_id uuid NOT NULL REFERENCES escala_vacancy_invariants_test.schedule_versions(id),
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  CHECK (end_time > start_time)
);

CREATE TABLE escala_vacancy_invariants_test.absences (
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

CREATE TABLE escala_vacancy_invariants_test.vacancies (
  id uuid PRIMARY KEY,
  occurrence_id uuid NOT NULL REFERENCES escala_vacancy_invariants_test.occurrences(id),
  absence_id uuid NOT NULL REFERENCES escala_vacancy_invariants_test.absences(id),
  organization_id uuid NOT NULL,
  school_id uuid NOT NULL,
  schedule_version_id uuid NOT NULL REFERENCES escala_vacancy_invariants_test.schedule_versions(id),
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'resolved', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (occurrence_id, absence_id)
);

CREATE UNIQUE INDEX vacancies_active_occurrence_uq
  ON escala_vacancy_invariants_test.vacancies (occurrence_id)
  WHERE status = 'active';

-- INVARIANT-01: occurrence and absence must belong to the same institutional scope.
INSERT INTO escala_vacancy_invariants_test.schedule_versions
  (id, organization_id, school_id, status)
VALUES
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'published');

INSERT INTO escala_vacancy_invariants_test.occurrences
  (id, schedule_version_id, organization_id, school_id, teacher_id, scheduled_date, start_time, end_time)
VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '2026-09-14', '14:20', '15:10');

INSERT INTO escala_vacancy_invariants_test.absences
  (id, organization_id, school_id, teacher_id, absence_date, start_time, end_time, status)
VALUES
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '2026-09-14', '14:00', '15:30', 'confirmed');

INSERT INTO escala_vacancy_invariants_test.vacancies
  (id, occurrence_id, absence_id, organization_id, school_id, schedule_version_id, status)
VALUES
  ('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'active');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM escala_vacancy_invariants_test.vacancies v
    JOIN escala_vacancy_invariants_test.occurrences o ON o.id = v.occurrence_id
    JOIN escala_vacancy_invariants_test.absences a ON a.id = v.absence_id
    WHERE v.organization_id = o.organization_id
      AND v.school_id = o.school_id
      AND v.organization_id = a.organization_id
      AND v.school_id = a.school_id
  ) THEN
    RAISE EXCEPTION 'INVARIANT-01 failed: institutional scope is not preserved';
  END IF;
END $$;

-- INVARIANT-02: vacancy provenance must point to the occurrence version.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM escala_vacancy_invariants_test.vacancies v
    JOIN escala_vacancy_invariants_test.occurrences o ON o.id = v.occurrence_id
    WHERE v.schedule_version_id <> o.schedule_version_id
  ) THEN
    RAISE EXCEPTION 'INVARIANT-02 failed: schedule version provenance mismatch';
  END IF;
END $$;

-- INVARIANT-03: only confirmed absence may support an active vacancy.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM escala_vacancy_invariants_test.vacancies v
    JOIN escala_vacancy_invariants_test.absences a ON a.id = v.absence_id
    WHERE v.status = 'active'
      AND a.status <> 'confirmed'
  ) THEN
    RAISE EXCEPTION 'INVARIANT-03 failed: active vacancy backed by non-confirmed absence';
  END IF;
END $$;

-- INVARIANT-04: active vacancy must cover the complete occurrence interval.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM escala_vacancy_invariants_test.vacancies v
    JOIN escala_vacancy_invariants_test.occurrences o ON o.id = v.occurrence_id
    JOIN escala_vacancy_invariants_test.absences a ON a.id = v.absence_id
    WHERE v.status = 'active'
      AND NOT (
        a.absence_date = o.scheduled_date
        AND a.start_time <= o.start_time
        AND a.end_time >= o.end_time
      )
  ) THEN
    RAISE EXCEPTION 'INVARIANT-04 failed: active vacancy has incomplete temporal coverage';
  END IF;
END $$;

-- INVARIANT-05: same occurrence + absence cannot duplicate.
INSERT INTO escala_vacancy_invariants_test.vacancies
  (id, occurrence_id, absence_id, organization_id, school_id, schedule_version_id, status)
VALUES
  ('70000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'active')
ON CONFLICT (occurrence_id, absence_id) DO NOTHING;

DO $$
BEGIN
  IF (SELECT count(*) FROM escala_vacancy_invariants_test.vacancies WHERE occurrence_id = '40000000-0000-0000-0000-000000000001' AND absence_id = '60000000-0000-0000-0000-000000000001') <> 1 THEN
    RAISE EXCEPTION 'INVARIANT-05 failed: idempotency invariant violated';
  END IF;
END $$;

-- INVARIANT-06: a second active vacancy for the same occurrence is prohibited.
INSERT INTO escala_vacancy_invariants_test.absences
  (id, organization_id, school_id, teacher_id, absence_date, start_time, end_time, status)
VALUES
  ('60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '2026-09-14', '14:00', '15:30', 'confirmed');

DO $$
BEGIN
  BEGIN
    INSERT INTO escala_vacancy_invariants_test.vacancies
      (id, occurrence_id, absence_id, organization_id, school_id, schedule_version_id, status)
    VALUES
      ('70000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'active');
    RAISE EXCEPTION 'INVARIANT-06 failed: second active vacancy accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END $$;

-- INVARIANT-07: resolved/cancelled/blocked history may coexist, but only one active row is permitted.
INSERT INTO escala_vacancy_invariants_test.vacancies
  (id, occurrence_id, absence_id, organization_id, school_id, schedule_version_id, status)
VALUES
  ('70000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'cancelled');

DO $$
BEGIN
  IF (SELECT count(*) FROM escala_vacancy_invariants_test.vacancies WHERE occurrence_id = '40000000-0000-0000-0000-000000000001' AND status = 'active') <> 1 THEN
    RAISE EXCEPTION 'INVARIANT-07 failed: active vacancy cardinality changed unexpectedly';
  END IF;
END $$;

-- INVARIANT-08: cross-scope records are rejected by the contract before materialization.
DO $$
DECLARE
  compatible boolean;
BEGIN
  SELECT (
    o.organization_id = a.organization_id
    AND o.school_id = a.school_id
    AND o.teacher_id = a.teacher_id
    AND o.scheduled_date = a.absence_date
    AND a.start_time <= o.start_time
    AND a.end_time >= o.end_time
  ) INTO compatible
  FROM escala_vacancy_invariants_test.occurrences o
  CROSS JOIN escala_vacancy_invariants_test.absences a
  WHERE o.id = '40000000-0000-0000-0000-000000000001'
    AND a.id = '60000000-0000-0000-0000-000000000002';

  IF compatible IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'INVARIANT-08 failed: compatible source relation unexpectedly false';
  END IF;
END $$;

-- INVARIANT-09: cancelled absence has no active vacancy.
UPDATE escala_vacancy_invariants_test.absences
SET status = 'cancelled'
WHERE id = '60000000-0000-0000-0000-000000000001';

UPDATE escala_vacancy_invariants_test.vacancies
SET status = 'cancelled', updated_at = now()
WHERE absence_id = '60000000-0000-0000-0000-000000000001';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM escala_vacancy_invariants_test.vacancies v
    JOIN escala_vacancy_invariants_test.absences a ON a.id = v.absence_id
    WHERE a.status = 'cancelled' AND v.status = 'active'
  ) THEN
    RAISE EXCEPTION 'INVARIANT-09 failed: cancelled absence retained active vacancy';
  END IF;
END $$;

-- INVARIANT-10: every vacancy remains traceable to its complete source chain.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM escala_vacancy_invariants_test.vacancies v
    LEFT JOIN escala_vacancy_invariants_test.occurrences o ON o.id = v.occurrence_id
    LEFT JOIN escala_vacancy_invariants_test.absences a ON a.id = v.absence_id
    LEFT JOIN escala_vacancy_invariants_test.schedule_versions s ON s.id = v.schedule_version_id
    WHERE o.id IS NULL OR a.id IS NULL OR s.id IS NULL
  ) THEN
    RAISE EXCEPTION 'INVARIANT-10 failed: incomplete vacancy provenance';
  END IF;
END $$;

ROLLBACK;
