BEGIN;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / ACADEMIC CORE
-- AGENDA INTELIGENTE EDI
-- MIGRATION 013 — CENTRO DE AVALIAÇÕES
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
  public.agenda_assessments (
    id text PRIMARY KEY,
    contract_version text NOT NULL DEFAULT 'assessment-center-v1',
    title text NOT NULL,
    description text,
    purpose text NOT NULL,
    instrument_type text NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    offering_id text NOT NULL,
    class_id text NOT NULL,
    component_id text NOT NULL,
    academic_period_id text NOT NULL,
    lesson_id text,
    teacher_id uuid NOT NULL,
    scale_id text,
    scale_type text NOT NULL,
    calculation_method text NOT NULL,
    weight numeric NOT NULL DEFAULT 1,
    maximum_score numeric,
    passing_score numeric,
    scheduled_at timestamptz,
    applied_at timestamptz,
    learning_outcome_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
    criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
    classification_scale jsonb NOT NULL DEFAULT '[]'::jsonb,
    requires_human_review boolean NOT NULL DEFAULT true,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    user_id uuid NOT NULL,
    organization_id uuid,
    school_id uuid,
    created_by uuid NOT NULL,
    updated_by uuid,
    reviewed_by uuid,
    reviewed_at timestamptz,
    archived_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT agenda_assessments_contract_check
      CHECK (contract_version = 'assessment-center-v1'),
    CONSTRAINT agenda_assessments_purpose_check
      CHECK (purpose IN (
        'diagnostic','formative','summative','recovery',
        'recomposition','classification','monitoring'
      )),
    CONSTRAINT agenda_assessments_status_check
      CHECK (status IN (
        'draft','scheduled','open','applied','under_review',
        'completed','cancelled','archived'
      )),
    CONSTRAINT agenda_assessments_weight_check
      CHECK (weight > 0)
  );

CREATE TABLE IF NOT EXISTS
  public.agenda_assessment_results (
    id text PRIMARY KEY,
    assessment_id text NOT NULL,
    student_id text NOT NULL,
    enrollment_id text,
    class_id text NOT NULL,
    academic_period_id text NOT NULL,
    status text NOT NULL DEFAULT 'not_started',
    raw_score numeric,
    normalized_score numeric,
    percentage numeric,
    concept text,
    classification text NOT NULL DEFAULT 'not_classified',
    criterion_results jsonb NOT NULL DEFAULT '[]'::jsonb,
    learning_outcome_results jsonb NOT NULL DEFAULT '[]'::jsonb,
    teacher_feedback text,
    recovery_required boolean NOT NULL DEFAULT false,
    recomposition_required boolean NOT NULL DEFAULT false,
    reviewed_by uuid,
    reviewed_at timestamptz,
    finalized_by uuid,
    finalized_at timestamptz,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    user_id uuid NOT NULL,
    organization_id uuid,
    school_id uuid,
    archived_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT agenda_assessment_results_assessment_fk
      FOREIGN KEY (assessment_id)
      REFERENCES public.agenda_assessments(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
    CONSTRAINT agenda_assessment_results_unique_student
      UNIQUE (assessment_id, student_id),
    CONSTRAINT agenda_assessment_results_status_check
      CHECK (status IN (
        'not_started','in_progress','submitted','reviewed',
        'finalized','absent','excused'
      )),
    CONSTRAINT agenda_assessment_results_classification_check
      CHECK (classification IN (
        'critical','initial','developing','adequate',
        'proficient','advanced','not_classified'
      )),
    CONSTRAINT agenda_assessment_results_percentage_check
      CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100))
  );

CREATE TABLE IF NOT EXISTS
  public.agenda_gradebook_entries (
    id text PRIMARY KEY,
    student_id text NOT NULL,
    class_id text NOT NULL,
    component_id text NOT NULL,
    academic_period_id text NOT NULL,
    assessment_id text,
    assessment_result_id text,
    entry_type text NOT NULL,
    title text NOT NULL,
    value numeric,
    percentage numeric,
    concept text,
    weight numeric NOT NULL DEFAULT 1,
    classification text NOT NULL DEFAULT 'not_classified',
    recorded_by uuid NOT NULL,
    recorded_at timestamptz NOT NULL,
    reason text,
    supersedes_entry_id text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    user_id uuid NOT NULL,
    organization_id uuid,
    school_id uuid,
    archived_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT agenda_gradebook_entries_assessment_fk
      FOREIGN KEY (assessment_id)
      REFERENCES public.agenda_assessments(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
    CONSTRAINT agenda_gradebook_entries_result_fk
      FOREIGN KEY (assessment_result_id)
      REFERENCES public.agenda_assessment_results(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
    CONSTRAINT agenda_gradebook_entries_supersedes_fk
      FOREIGN KEY (supersedes_entry_id)
      REFERENCES public.agenda_gradebook_entries(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
    CONSTRAINT agenda_gradebook_entries_type_check
      CHECK (entry_type IN (
        'assessment','recovery','recomposition',
        'manual_adjustment','final_grade'
      )),
    CONSTRAINT agenda_gradebook_entries_classification_check
      CHECK (classification IN (
        'critical','initial','developing','adequate',
        'proficient','advanced','not_classified'
      )),
    CONSTRAINT agenda_gradebook_entries_percentage_check
      CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100)),
    CONSTRAINT agenda_gradebook_entries_weight_check
      CHECK (weight > 0)
  );

CREATE INDEX IF NOT EXISTS agenda_assessments_class_period_idx
ON public.agenda_assessments (class_id, academic_period_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agenda_assessment_results_student_idx
ON public.agenda_assessment_results (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agenda_assessment_results_assessment_idx
ON public.agenda_assessment_results (assessment_id, classification, created_at DESC);

CREATE INDEX IF NOT EXISTS agenda_gradebook_student_period_idx
ON public.agenda_gradebook_entries (
  student_id, class_id, component_id, academic_period_id, recorded_at DESC
);

CREATE OR REPLACE FUNCTION public.set_agenda_assessment_center_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_agenda_assessments_updated_at
ON public.agenda_assessments;
CREATE TRIGGER set_agenda_assessments_updated_at
BEFORE UPDATE ON public.agenda_assessments
FOR EACH ROW EXECUTE FUNCTION public.set_agenda_assessment_center_updated_at();

DROP TRIGGER IF EXISTS set_agenda_assessment_results_updated_at
ON public.agenda_assessment_results;
CREATE TRIGGER set_agenda_assessment_results_updated_at
BEFORE UPDATE ON public.agenda_assessment_results
FOR EACH ROW EXECUTE FUNCTION public.set_agenda_assessment_center_updated_at();

DROP TRIGGER IF EXISTS set_agenda_gradebook_entries_updated_at
ON public.agenda_gradebook_entries;
CREATE TRIGGER set_agenda_gradebook_entries_updated_at
BEFORE UPDATE ON public.agenda_gradebook_entries
FOR EACH ROW EXECUTE FUNCTION public.set_agenda_assessment_center_updated_at();

ALTER TABLE public.agenda_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_gradebook_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agenda_assessments_select ON public.agenda_assessments;
CREATE POLICY agenda_assessments_select
ON public.agenda_assessments FOR SELECT TO authenticated
USING (public.can_view_agenda_record(user_id, organization_id, school_id));

DROP POLICY IF EXISTS agenda_assessments_insert ON public.agenda_assessments;
CREATE POLICY agenda_assessments_insert
ON public.agenda_assessments FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() = created_by
  AND public.can_update_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS agenda_assessments_update ON public.agenda_assessments;
CREATE POLICY agenda_assessments_update
ON public.agenda_assessments FOR UPDATE TO authenticated
USING (public.can_update_agenda_record(user_id, organization_id, school_id))
WITH CHECK (public.can_update_agenda_record(user_id, organization_id, school_id));

DROP POLICY IF EXISTS agenda_assessment_results_select ON public.agenda_assessment_results;
CREATE POLICY agenda_assessment_results_select
ON public.agenda_assessment_results FOR SELECT TO authenticated
USING (public.can_view_agenda_record(user_id, organization_id, school_id));

DROP POLICY IF EXISTS agenda_assessment_results_insert ON public.agenda_assessment_results;
CREATE POLICY agenda_assessment_results_insert
ON public.agenda_assessment_results FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.can_update_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS agenda_assessment_results_update ON public.agenda_assessment_results;
CREATE POLICY agenda_assessment_results_update
ON public.agenda_assessment_results FOR UPDATE TO authenticated
USING (public.can_update_agenda_record(user_id, organization_id, school_id))
WITH CHECK (public.can_update_agenda_record(user_id, organization_id, school_id));

DROP POLICY IF EXISTS agenda_gradebook_entries_select ON public.agenda_gradebook_entries;
CREATE POLICY agenda_gradebook_entries_select
ON public.agenda_gradebook_entries FOR SELECT TO authenticated
USING (public.can_view_agenda_record(user_id, organization_id, school_id));

DROP POLICY IF EXISTS agenda_gradebook_entries_insert ON public.agenda_gradebook_entries;
CREATE POLICY agenda_gradebook_entries_insert
ON public.agenda_gradebook_entries FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() = recorded_by
  AND public.can_update_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS agenda_gradebook_entries_update ON public.agenda_gradebook_entries;
CREATE POLICY agenda_gradebook_entries_update
ON public.agenda_gradebook_entries FOR UPDATE TO authenticated
USING (public.can_update_agenda_record(user_id, organization_id, school_id))
WITH CHECK (public.can_update_agenda_record(user_id, organization_id, school_id));

COMMENT ON TABLE public.agenda_assessments IS
  'Definições de avaliações da Agenda Inteligente EDI, incluindo diagnóstica, formativa, somativa, recuperação e recomposição.';

COMMENT ON TABLE public.agenda_assessment_results IS
  'Resultados por estudante com classificação pedagógica revisável; não autoriza rotulagem ou decisão automática.';

COMMENT ON TABLE public.agenda_gradebook_entries IS
  'Diário de notas versionável por novos lançamentos, sem exclusão física do histórico.';

COMMIT;
