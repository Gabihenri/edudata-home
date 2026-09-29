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

-- Materialization fixture: one published occurrence + one covering confirmed absence.
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
JOIN escala_vacancy_test.schedule_versions v ON v.id=o.schedule_version_id
JOIN escala_vacancy_test.absences a
  ON a.organization_id=o.organization_id
 AND a.school_id=o.school_id
 AND a.teacher_id=o.teacher_id
 AND a.absence_date=o.scheduled_date
 AND a.status='confirmed'
 AND a.start_time<=o.start_time
 AND a.end_time>=o.end_time
WHERE o.id='00000000-0000-0000-0000-000000001001'
  AND v.status='published'
  AND NOT EXISTS (
    SELECT 1 FROM escala_vacancy_test.vacancies vx
    WHERE vx.occurrence_id=o.id AND vx.status='active'
  )
LIMIT 1;

-- Reprocessing the same source pair must be idempotent.
INSERT INTO escala_vacancy_test.vacancies
  (id, occurrence_id, absence_id, organization_id, school_id, source_version_id, status)
VALUES
  ('00000000-0000-0000-0000-000000003002',
   '00000000-0000-0000-0000-000000001001',
   '00000000-0000-0000-0000-000000002001',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000011',
   '00000000-0000-0000-0000-000000000101',
   'active')
ON CONFLICT (occurrence_id, absence_id) DO NOTHING;

-- Declarative PostgreSQL assertions.
-- The execution adapter used by this project does not accept anonymous DO blocks.
-- Therefore the harness exposes each invariant as a boolean row.

SELECT *
FROM (
  SELECT 'VAC-01' AS case_id,
    NOT EXISTS (
      SELECT 1 FROM escala_vacancy_test.vacancies vx
      JOIN escala_vacancy_test.occurrences o ON o.id=vx.occurrence_id
      JOIN escala_vacancy_test.schedule_versions v ON v.id=o.schedule_version_id
      WHERE v.status <> 'published' AND vx.status='active'
    ) AS pass
  UNION ALL
  SELECT 'VAC-02',
    (SELECT count(*) FROM escala_vacancy_test.vacancies)=1
  UNION ALL
  SELECT 'VAC-03',
    (SELECT count(*) FROM escala_vacancy_test.vacancies
      WHERE occurrence_id='00000000-0000-0000-0000-000000001001' AND status='active')=1
  UNION ALL
  SELECT 'VAC-04',
    NOT EXISTS (SELECT 1 FROM escala_vacancy_test.vacancies WHERE absence_id='00000000-0000-0000-0000-000000002003')
  UNION ALL
  SELECT 'VAC-05',
    NOT EXISTS (SELECT 1 FROM escala_vacancy_test.vacancies WHERE absence_id='00000000-0000-0000-0000-000000002004' AND status='active')
  UNION ALL
  SELECT 'VAC-06',
    (SELECT count(*) FROM escala_vacancy_test.vacancies
      WHERE occurrence_id='00000000-0000-0000-0000-000000001001' AND status='active')=1
  UNION ALL
  SELECT 'VAC-07',
    NOT EXISTS (
      SELECT 1 FROM escala_vacancy_test.vacancies vx
      JOIN escala_vacancy_test.occurrences o ON o.id=vx.occurrence_id
      WHERE vx.source_version_id<>o.schedule_version_id
         OR vx.organization_id<>o.organization_id
         OR vx.school_id<>o.school_id
    )
  UNION ALL
  SELECT 'VAC-08',
    NOT EXISTS (
      SELECT 1 FROM escala_vacancy_test.vacancies vx
      JOIN escala_vacancy_test.occurrences o ON o.id=vx.occurrence_id
      JOIN escala_vacancy_test.schedule_versions v ON v.id=o.schedule_version_id
      WHERE v.status<>'published' AND vx.status='active'
    )
  UNION ALL
  SELECT 'VAC-09',
    EXISTS (
      SELECT 1
      FROM escala_vacancy_test.occurrences o
      JOIN escala_vacancy_test.absences a
        ON a.teacher_id=o.teacher_id
       AND a.absence_date=o.scheduled_date
      WHERE o.id='00000000-0000-0000-0000-000000001001'
        AND a.id='00000000-0000-0000-0000-000000002001'
        AND a.start_time<=o.start_time
        AND a.end_time>=o.end_time
    )
  UNION ALL
  SELECT 'VAC-10',
    NOT EXISTS (
      SELECT 1 FROM escala_vacancy_test.vacancies vx
      JOIN escala_vacancy_test.occurrences o ON o.id=vx.occurrence_id
      WHERE vx.organization_id<>o.organization_id OR vx.school_id<>o.school_id
    )
  UNION ALL
  SELECT 'VAC-PHY-05',
    EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname='escala_vacancy_test'
        AND indexname='vacancies_one_active_per_occurrence'
    )
  UNION ALL
  SELECT 'VAC-PHY-06',
    EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE connamespace='escala_vacancy_test'::regnamespace
        AND conrelid='escala_vacancy_test.vacancies'::regclass
        AND contype='u'
        AND conname LIKE '%occurrence_id%absence_id%'
    )
) assertions
ORDER BY case_id;

SELECT
  count(*) AS case_count,
  count(*) FILTER (WHERE pass) AS pass_count,
  count(*) FILTER (WHERE NOT pass) AS fail_count
FROM (
  SELECT *
  FROM (
    SELECT 'VAC-01' AS case_id, NOT EXISTS (SELECT 1 FROM escala_vacancy_test.vacancies vx JOIN escala_vacancy_test.occurrences o ON o.id=vx.occurrence_id JOIN escala_vacancy_test.schedule_versions v ON v.id=o.schedule_version_id WHERE v.status<>'published' AND vx.status='active') AS pass
    UNION ALL SELECT 'VAC-02', (SELECT count(*) FROM escala_vacancy_test.vacancies)=1
    UNION ALL SELECT 'VAC-03', (SELECT count(*) FROM escala_vacancy_test.vacancies WHERE occurrence_id='00000000-0000-0000-0000-000000001001' AND status='active')=1
    UNION ALL SELECT 'VAC-04', NOT EXISTS (SELECT 1 FROM escala_vacancy_test.vacancies WHERE absence_id='00000000-0000-0000-0000-000000002003')
    UNION ALL SELECT 'VAC-05', NOT EXISTS (SELECT 1 FROM escala_vacancy_test.vacancies WHERE absence_id='00000000-0000-0000-0000-000000002004' AND status='active')
    UNION ALL SELECT 'VAC-06', (SELECT count(*) FROM escala_vacancy_test.vacancies WHERE occurrence_id='00000000-0000-0000-0000-000000001001' AND status='active')=1
    UNION ALL SELECT 'VAC-07', NOT EXISTS (SELECT 1 FROM escala_vacancy_test.vacancies vx JOIN escala_vacancy_test.occurrences o ON o.id=vx.occurrence_id WHERE vx.source_version_id<>o.schedule_version_id OR vx.organization_id<>o.organization_id OR vx.school_id<>o.school_id)
    UNION ALL SELECT 'VAC-08', NOT EXISTS (SELECT 1 FROM escala_vacancy_test.vacancies vx JOIN escala_vacancy_test.occurrences o ON o.id=vx.occurrence_id JOIN escala_vacancy_test.schedule_versions v ON v.id=o.schedule_version_id WHERE v.status<>'published' AND vx.status='active')
    UNION ALL SELECT 'VAC-09', EXISTS (SELECT 1 FROM escala_vacancy_test.occurrences o JOIN escala_vacancy_test.absences a ON a.teacher_id=o.teacher_id AND a.absence_date=o.scheduled_date WHERE o.id='00000000-0000-0000-0000-000000001001' AND a.id='00000000-0000-0000-0000-000000002001' AND a.start_time<=o.start_time AND a.end_time>=o.end_time)
    UNION ALL SELECT 'VAC-10', NOT EXISTS (SELECT 1 FROM escala_vacancy_test.vacancies vx JOIN escala_vacancy_test.occurrences o ON o.id=vx.occurrence_id WHERE vx.organization_id<>o.organization_id OR vx.school_id<>o.school_id)
    UNION ALL SELECT 'VAC-PHY-05', EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='escala_vacancy_test' AND indexname='vacancies_one_active_per_occurrence')
    UNION ALL SELECT 'VAC-PHY-06', EXISTS (SELECT 1 FROM pg_constraint WHERE connamespace='escala_vacancy_test'::regnamespace AND conrelid='escala_vacancy_test.vacancies'::regclass AND contype='u' AND conname LIKE '%occurrence_id%absence_id%')
  ) x
) summary;

ROLLBACK;
