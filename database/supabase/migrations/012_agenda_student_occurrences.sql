BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / ACADEMIC CORE
-- AGENDA INTELIGENTE EDI
-- MIGRATION 012 — OCORRÊNCIAS DOS ESTUDANTES
-- =========================================================

DO $$
BEGIN
  IF to_regprocedure(
    'public.can_view_agenda_record(uuid,uuid,uuid)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A função public.can_view_agenda_record(uuid,uuid,uuid) não existe.';
  END IF;

  IF to_regprocedure(
    'public.can_update_agenda_record(uuid,uuid,uuid)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A função public.can_update_agenda_record(uuid,uuid,uuid) não existe.';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS
  public.agenda_student_occurrences (
    id text PRIMARY KEY,

    contract_version text
      NOT NULL
      DEFAULT 'student-occurrence-v1',

    student_id text NOT NULL,
    class_id text NOT NULL,
    offering_id text,
    lesson_id text,
    academic_period_id text,

    recorded_by_user_id uuid NOT NULL,
    recorded_at timestamptz NOT NULL,
    occurred_at timestamptz NOT NULL,

    nature text NOT NULL,
    severity text NOT NULL,
    status text NOT NULL,

    title text NOT NULL,
    description text NOT NULL,
    location text,

    positive boolean NOT NULL DEFAULT false,
    requires_follow_up boolean NOT NULL DEFAULT false,
    recurrent boolean NOT NULL DEFAULT false,
    recurrence_group_id text,

    people_involved jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    actions jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    evidence_ids jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    intervention_ids jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    governance jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    privacy jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    metadata jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    user_id uuid NOT NULL,
    organization_id uuid,
    school_id uuid,

    reviewed_by uuid,
    reviewed_at timestamptz,

    created_at timestamptz
      NOT NULL
      DEFAULT now(),

    updated_at timestamptz
      NOT NULL
      DEFAULT now(),

    archived_at timestamptz,

    CONSTRAINT
      agenda_student_occurrences_contract_check
    CHECK (
      contract_version = 'student-occurrence-v1'
    ),

    CONSTRAINT
      agenda_student_occurrences_nature_check
    CHECK (
      nature IN (
        'behavior',
        'coexistence',
        'attendance',
        'engagement',
        'pedagogical',
        'mediation',
        'positive_recognition',
        'leadership',
        'protagonism',
        'collaboration',
        'support_needed',
        'other'
      )
    ),

    CONSTRAINT
      agenda_student_occurrences_severity_check
    CHECK (
      severity IN (
        'informational',
        'low',
        'moderate',
        'high',
        'critical'
      )
    ),

    CONSTRAINT
      agenda_student_occurrences_status_check
    CHECK (
      status IN (
        'open',
        'under_follow_up',
        'resolved',
        'recurrent',
        'referred',
        'archived'
      )
    )
  );

CREATE INDEX IF NOT EXISTS
  agenda_student_occurrences_student_idx
ON public.agenda_student_occurrences (
  student_id,
  occurred_at DESC
);

CREATE INDEX IF NOT EXISTS
  agenda_student_occurrences_class_idx
ON public.agenda_student_occurrences (
  class_id,
  occurred_at DESC
);

CREATE INDEX IF NOT EXISTS
  agenda_student_occurrences_follow_up_idx
ON public.agenda_student_occurrences (
  requires_follow_up,
  status,
  occurred_at DESC
);

CREATE INDEX IF NOT EXISTS
  agenda_student_occurrences_school_idx
ON public.agenda_student_occurrences (
  organization_id,
  school_id,
  occurred_at DESC
);

CREATE OR REPLACE FUNCTION
  public.set_agenda_student_occurrences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
  set_agenda_student_occurrences_updated_at
ON public.agenda_student_occurrences;

CREATE TRIGGER
  set_agenda_student_occurrences_updated_at
BEFORE UPDATE
ON public.agenda_student_occurrences
FOR EACH ROW
EXECUTE FUNCTION
  public.set_agenda_student_occurrences_updated_at();

ALTER TABLE
  public.agenda_student_occurrences
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
  agenda_student_occurrences_select
ON public.agenda_student_occurrences;

CREATE POLICY
  agenda_student_occurrences_select
ON public.agenda_student_occurrences
FOR SELECT
TO authenticated
USING (
  public.can_view_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);

DROP POLICY IF EXISTS
  agenda_student_occurrences_insert
ON public.agenda_student_occurrences;

CREATE POLICY
  agenda_student_occurrences_insert
ON public.agenda_student_occurrences
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND recorded_by_user_id = auth.uid()
  AND public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);

DROP POLICY IF EXISTS
  agenda_student_occurrences_update
ON public.agenda_student_occurrences;

CREATE POLICY
  agenda_student_occurrences_update
ON public.agenda_student_occurrences
FOR UPDATE
TO authenticated
USING (
  public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
)
WITH CHECK (
  public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);

-- Não há policy DELETE: preservar histórico longitudinal.

COMMENT ON TABLE
  public.agenda_student_occurrences
IS
  'Registros longitudinais de ocorrências educacionais. Não autorizam rotulagem automática, diagnóstico clínico ou decisão disciplinar automática.';

COMMENT ON COLUMN
  public.agenda_student_occurrences.positive
IS
  'Permite registrar reconhecimento, protagonismo, colaboração e outros eventos positivos, evitando histórico exclusivamente punitivo.';

COMMENT ON COLUMN
  public.agenda_student_occurrences.governance
IS
  'Metadados de correlação, auditoria, proveniência e revisão humana do EIOS Governance Core.';

COMMIT;
