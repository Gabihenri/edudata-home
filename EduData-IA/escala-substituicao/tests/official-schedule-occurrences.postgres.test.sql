-- Escala Inteligente de Substituição
-- Harness isolado: ocorrências da grade oficial e conflitos temporais.
-- NÃO é migration de produção. Executar somente em banco de teste.

BEGIN;

CREATE SCHEMA IF NOT EXISTS escala_occurrence_test;

CREATE TABLE escala_occurrence_test.schedule_versions (
  id uuid PRIMARY KEY,
  school_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('draft','validated','published','superseded','revoked','archived')),
  valid_from date NOT NULL,
  valid_until date,
  CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE TABLE escala_occurrence_test.schedule_entries (
  id uuid PRIMARY KEY,
  schedule_version_id uuid NOT NULL REFERENCES escala_occurrence_test.schedule_versions(id),
  school_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  class_id uuid NOT NULL,
  component_id uuid NOT NULL,
  weekday smallint,
  start_time time NOT NULL,
  end_time time NOT NULL,
  valid_from date NOT NULL,
  valid_until date,
  CHECK (weekday IS NULL OR weekday BETWEEN 1 AND 7),
  CHECK (end_time > start_time),
  CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE TABLE escala_occurrence_test.occurrences (
  id uuid PRIMARY KEY,
  schedule_version_id uuid NOT NULL REFERENCES escala_occurrence_test.schedule_versions(id),
  schedule_entry_id uuid NOT NULL REFERENCES escala_occurrence_test.schedule_entries(id),
  school_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  class_id uuid NOT NULL,
  component_id uuid NOT NULL,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled','cancelled','superseded')),
  CHECK (end_time > start_time)
);

CREATE TABLE escala_occurrence_test.absences (
  id uuid PRIMARY KEY,
  teacher_id uuid NOT NULL,
  school_id uuid NOT NULL,
  absence_date date NOT NULL,
  start_time time,
  end_time time,
  status text NOT NULL CHECK (status IN ('confirmed','cancelled','pending')),
  CHECK ((start_time IS NULL AND end_time IS NULL) OR end_time > start_time)
);

INSERT INTO escala_occurrence_test.schedule_versions
(id, school_id, status, valid_from, valid_until)
VALUES
('00000000-0000-0000-0000-000000010001','00000000-0000-0000-0000-000000000001','published','2026-01-01',NULL),
('00000000-0000-0000-0000-000000010002','00000000-0000-0000-0000-000000000001','draft','2026-09-01',NULL);

INSERT INTO escala_occurrence_test.schedule_entries
(id, schedule_version_id, school_id, teacher_id, class_id, component_id, weekday, start_time, end_time, valid_from)
VALUES
('00000000-0000-0000-0000-000000020001','00000000-0000-0000-0000-000000010001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000301',1,'14:00','15:00','2026-01-01'),
('00000000-0000-0000-0000-000000020002','00000000-0000-0000-0000-000000010001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000302',1,'14:30','15:30','2026-01-01'),
('00000000-0000-0000-0000-000000020003','00000000-0000-0000-0000-000000010002','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000103','00000000-0000-0000-0000-000000000203','00000000-0000-0000-0000-000000000303',2,'16:00','17:00','2026-09-01');

INSERT INTO escala_occurrence_test.occurrences
(id, schedule_version_id, schedule_entry_id, school_id, teacher_id, class_id, component_id, scheduled_date, start_time, end_time, status)
VALUES
('00000000-0000-0000-0000-000000030001','00000000-0000-0000-0000-000000010001','00000000-0000-0000-0000-000000020001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000301','2026-09-14','14:00','15:00','scheduled');

-- OCC-01: ocorrência válida sobre versão publicada.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM escala_occurrence_test.occurrences o
    JOIN escala_occurrence_test.schedule_versions v ON v.id = o.schedule_version_id
    WHERE o.status = 'scheduled' AND v.status = 'published'
  ) THEN RAISE EXCEPTION 'OCC-01 failed: scheduled occurrence is not backed by published version'; END IF;
END $$;

-- OCC-02: intervalo temporal válido.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM escala_occurrence_test.occurrences WHERE end_time <= start_time) THEN
    RAISE EXCEPTION 'OCC-02 failed: invalid temporal interval';
  END IF;
END $$;

-- OCC-03: teacher conflict detection uses interval overlap: A.start < B.end AND B.start < A.end.
INSERT INTO escala_occurrence_test.occurrences
(id, schedule_version_id, schedule_entry_id, school_id, teacher_id, class_id, component_id, scheduled_date, start_time, end_time, status)
VALUES
('00000000-0000-0000-0000-000000030002','00000000-0000-0000-0000-000000010001','00000000-0000-0000-0000-000000020002','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000302','2026-09-14','14:30','15:30','scheduled');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM escala_occurrence_test.occurrences a
    JOIN escala_occurrence_test.occurrences b ON a.id < b.id
      AND a.teacher_id = b.teacher_id
      AND a.scheduled_date = b.scheduled_date
      AND a.status = 'scheduled' AND b.status = 'scheduled'
      AND a.start_time < b.end_time AND b.start_time < a.end_time
  ) THEN RAISE EXCEPTION 'OCC-03 failed: overlapping teacher occurrences were not detected'; END IF;
END $$;

-- OCC-04: exact boundary is not a conflict (15:00-16:00 follows 14:00-15:00).
INSERT INTO escala_occurrence_test.occurrences
(id, schedule_version_id, schedule_entry_id, school_id, teacher_id, class_id, component_id, scheduled_date, start_time, end_time, status)
VALUES
('00000000-0000-0000-0000-000000030003','00000000-0000-0000-0000-000000010001','00000000-0000-0000-0000-000000020001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000204','00000000-0000-0000-0000-000000000304','2026-09-14','15:00','16:00','scheduled');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_occurrence_test.occurrences a
    JOIN escala_occurrence_test.occurrences b ON a.id < b.id
      AND a.teacher_id = b.teacher_id AND a.scheduled_date = b.scheduled_date
      AND a.status = 'scheduled' AND b.status = 'scheduled'
      AND a.start_time < b.end_time AND b.start_time < a.end_time
    WHERE a.id = '00000000-0000-0000-0000-000000030001'
      AND b.id = '00000000-0000-0000-0000-000000030003'
  ) THEN RAISE EXCEPTION 'OCC-04 failed: boundary-only intervals treated as overlap'; END IF;
END $$;

-- OCC-05: confirmed absence covering occurrence creates an affected obligation.
INSERT INTO escala_occurrence_test.absences
(id, teacher_id, school_id, absence_date, start_time, end_time, status)
VALUES
('00000000-0000-0000-0000-000000040001','00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000001','2026-09-14','13:00','18:00','confirmed');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM escala_occurrence_test.occurrences o
    JOIN escala_occurrence_test.absences a ON a.teacher_id = o.teacher_id
      AND a.school_id = o.school_id AND a.absence_date = o.scheduled_date
      AND a.status = 'confirmed'
      AND (a.start_time IS NULL OR (a.start_time < o.end_time AND o.start_time < a.end_time))
    WHERE o.id = '00000000-0000-0000-0000-000000030001'
  ) THEN RAISE EXCEPTION 'OCC-05 failed: covered occurrence not identified'; END IF;
END $$;

-- OCC-06: draft version must not feed production occurrence consumption.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM escala_occurrence_test.occurrences o
    JOIN escala_occurrence_test.schedule_versions v ON v.id = o.schedule_version_id
    WHERE v.status <> 'published' AND o.status = 'scheduled'
  ) THEN RAISE EXCEPTION 'OCC-06 failed: non-published version feeds scheduled occurrence'; END IF;
END $$;

-- OCC-07: teacher simultaneous allocation conflict is observable before substitution.
DO $$
BEGIN
  IF (
    SELECT count(*) FROM escala_occurrence_test.occurrences a
    JOIN escala_occurrence_test.occurrences b ON a.id < b.id
      AND a.teacher_id = b.teacher_id AND a.scheduled_date = b.scheduled_date
      AND a.status = 'scheduled' AND b.status = 'scheduled'
      AND a.start_time < b.end_time AND b.start_time < a.end_time
  ) <> 1 THEN RAISE EXCEPTION 'OCC-07 failed: expected one teacher overlap'; END IF;
END $$;

-- Harness intentionally rolled back: no persistent test objects.
ROLLBACK;
