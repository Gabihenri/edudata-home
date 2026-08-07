BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.can_view_agenda_record(uuid,uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'A função public.can_view_agenda_record(uuid,uuid,uuid) não existe.';
  END IF;

  IF to_regprocedure('public.can_update_agenda_record(uuid,uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'A função public.can_update_agenda_record(uuid,uuid,uuid) não existe.';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.agenda_pedagogical_cases (
  id text PRIMARY KEY,
  contract_version text NOT NULL DEFAULT 'pedagogical-case-v1',

  student_id text,
  student_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  class_id text NOT NULL,
  academic_period_id text,

  title text NOT NULL,
  summary text NOT NULL,
  origin text NOT NULL,
  priority text NOT NULL DEFAULT 'moderate',
  status text NOT NULL DEFAULT 'open',

  occurrence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  assessment_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  intervention_ids jsonb NOT NULL DEFAULT '[]'::jsonb,

  objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  success_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,

  opened_by_user_id uuid NOT NULL,
  opened_at timestamptz NOT NULL,
  responsible_user_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_at timestamptz,

  resolution_summary text,
  closed_by_user_id uuid,
  closed_at timestamptz,

  governance jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,

  CONSTRAINT agenda_pedagogical_cases_contract_check
    CHECK (contract_version = 'pedagogical-case-v1'),

  CONSTRAINT agenda_pedagogical_cases_origin_check
    CHECK (origin IN (
      'occurrence','assessment','attendance','evidence',
      'teacher_observation','coordination','family_contact','other'
    )),

  CONSTRAINT agenda_pedagogical_cases_priority_check
    CHECK (priority IN ('low','moderate','high','urgent')),

  CONSTRAINT agenda_pedagogical_cases_status_check
    CHECK (status IN (
      'open','under_analysis','action_plan_defined','under_follow_up',
      'resolved','closed','archived'
    ))
);

CREATE INDEX IF NOT EXISTS agenda_pedagogical_cases_student_idx
  ON public.agenda_pedagogical_cases (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agenda_pedagogical_cases_class_idx
  ON public.agenda_pedagogical_cases (class_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS agenda_pedagogical_cases_priority_idx
  ON public.agenda_pedagogical_cases (priority, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_agenda_pedagogical_cases_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_agenda_pedagogical_cases_updated_at
  ON public.agenda_pedagogical_cases;

CREATE TRIGGER set_agenda_pedagogical_cases_updated_at
BEFORE UPDATE ON public.agenda_pedagogical_cases
FOR EACH ROW
EXECUTE FUNCTION public.set_agenda_pedagogical_cases_updated_at();

ALTER TABLE public.agenda_pedagogical_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agenda_pedagogical_cases_select
  ON public.agenda_pedagogical_cases;
CREATE POLICY agenda_pedagogical_cases_select
ON public.agenda_pedagogical_cases
FOR SELECT TO authenticated
USING (
  public.can_view_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS agenda_pedagogical_cases_insert
  ON public.agenda_pedagogical_cases;
CREATE POLICY agenda_pedagogical_cases_insert
ON public.agenda_pedagogical_cases
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND opened_by_user_id = auth.uid()
  AND public.can_update_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS agenda_pedagogical_cases_update
  ON public.agenda_pedagogical_cases;
CREATE POLICY agenda_pedagogical_cases_update
ON public.agenda_pedagogical_cases
FOR UPDATE TO authenticated
USING (
  public.can_update_agenda_record(user_id, organization_id, school_id)
)
WITH CHECK (
  public.can_update_agenda_record(user_id, organization_id, school_id)
);

REVOKE DELETE ON public.agenda_pedagogical_cases FROM authenticated;

COMMIT;
