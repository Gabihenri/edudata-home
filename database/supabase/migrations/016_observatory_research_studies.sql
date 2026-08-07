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

CREATE TABLE IF NOT EXISTS public.observatory_research_studies (
  id text PRIMARY KEY,
  contract_version text NOT NULL DEFAULT 'observatory-study-v1',
  title text NOT NULL,
  research_question text NOT NULL,
  scope text NOT NULL,
  methodology_summary text NOT NULL,
  findings_summary text,
  status text NOT NULL DEFAULT 'draft',
  is_public boolean NOT NULL DEFAULT false,
  author_user_id uuid NOT NULL,
  dataset_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  indicator_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  published_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT observatory_studies_contract_check
    CHECK (contract_version = 'observatory-study-v1'),
  CONSTRAINT observatory_studies_status_check
    CHECK (status IN ('draft','under_review','active','completed','published','archived'))
);

CREATE INDEX IF NOT EXISTS observatory_studies_status_idx
  ON public.observatory_research_studies (status, created_at DESC);
CREATE INDEX IF NOT EXISTS observatory_studies_public_idx
  ON public.observatory_research_studies (is_public, published_at DESC);

CREATE OR REPLACE FUNCTION public.set_observatory_studies_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_observatory_studies_updated_at
  ON public.observatory_research_studies;
CREATE TRIGGER set_observatory_studies_updated_at
BEFORE UPDATE ON public.observatory_research_studies
FOR EACH ROW EXECUTE FUNCTION public.set_observatory_studies_updated_at();

ALTER TABLE public.observatory_research_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS observatory_studies_select ON public.observatory_research_studies;
CREATE POLICY observatory_studies_select
ON public.observatory_research_studies FOR SELECT TO authenticated
USING (
  is_public = true
  OR public.can_view_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS observatory_studies_insert ON public.observatory_research_studies;
CREATE POLICY observatory_studies_insert
ON public.observatory_research_studies FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND author_user_id = auth.uid()
  AND public.can_update_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS observatory_studies_update ON public.observatory_research_studies;
CREATE POLICY observatory_studies_update
ON public.observatory_research_studies FOR UPDATE TO authenticated
USING (public.can_update_agenda_record(user_id, organization_id, school_id))
WITH CHECK (public.can_update_agenda_record(user_id, organization_id, school_id));

REVOKE DELETE ON public.observatory_research_studies FROM authenticated;

COMMIT;
