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

CREATE TABLE IF NOT EXISTS public.sgpa_compliance_checks (
  id text PRIMARY KEY,
  contract_version text NOT NULL DEFAULT 'sgpa-compliance-v1',
  code text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'not_evaluated',
  severity text NOT NULL DEFAULT 'informational',
  responsible_user_id uuid,
  evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  finding text,
  recommendation text,
  due_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT sgpa_compliance_contract_check
    CHECK (contract_version = 'sgpa-compliance-v1'),
  CONSTRAINT sgpa_compliance_status_check
    CHECK (status IN ('compliant','attention','non_compliant','not_evaluated')),
  CONSTRAINT sgpa_compliance_severity_check
    CHECK (severity IN ('informational','low','moderate','high','critical'))
);

CREATE TABLE IF NOT EXISTS public.sgpa_action_plans (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  priority text NOT NULL DEFAULT 'moderate',
  compliance_check_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  owner_user_id uuid NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  success_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT sgpa_action_plans_status_check
    CHECK (status IN ('draft','active','blocked','completed','cancelled','archived')),
  CONSTRAINT sgpa_action_plans_priority_check
    CHECK (priority IN ('informational','low','moderate','high','critical'))
);

CREATE INDEX IF NOT EXISTS sgpa_compliance_status_idx
  ON public.sgpa_compliance_checks (status, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS sgpa_action_plans_status_idx
  ON public.sgpa_action_plans (status, priority, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_sgpa_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_sgpa_compliance_updated_at
  ON public.sgpa_compliance_checks;
CREATE TRIGGER set_sgpa_compliance_updated_at
BEFORE UPDATE ON public.sgpa_compliance_checks
FOR EACH ROW EXECUTE FUNCTION public.set_sgpa_updated_at();

DROP TRIGGER IF EXISTS set_sgpa_action_plans_updated_at
  ON public.sgpa_action_plans;
CREATE TRIGGER set_sgpa_action_plans_updated_at
BEFORE UPDATE ON public.sgpa_action_plans
FOR EACH ROW EXECUTE FUNCTION public.set_sgpa_updated_at();

ALTER TABLE public.sgpa_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sgpa_action_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sgpa_compliance_select ON public.sgpa_compliance_checks;
CREATE POLICY sgpa_compliance_select
ON public.sgpa_compliance_checks FOR SELECT TO authenticated
USING (public.can_view_agenda_record(user_id, organization_id, school_id));

DROP POLICY IF EXISTS sgpa_compliance_insert ON public.sgpa_compliance_checks;
CREATE POLICY sgpa_compliance_insert
ON public.sgpa_compliance_checks FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND created_by = auth.uid()
  AND public.can_update_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS sgpa_compliance_update ON public.sgpa_compliance_checks;
CREATE POLICY sgpa_compliance_update
ON public.sgpa_compliance_checks FOR UPDATE TO authenticated
USING (public.can_update_agenda_record(user_id, organization_id, school_id))
WITH CHECK (public.can_update_agenda_record(user_id, organization_id, school_id));

DROP POLICY IF EXISTS sgpa_action_plans_select ON public.sgpa_action_plans;
CREATE POLICY sgpa_action_plans_select
ON public.sgpa_action_plans FOR SELECT TO authenticated
USING (public.can_view_agenda_record(user_id, organization_id, school_id));

DROP POLICY IF EXISTS sgpa_action_plans_insert ON public.sgpa_action_plans;
CREATE POLICY sgpa_action_plans_insert
ON public.sgpa_action_plans FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND owner_user_id = auth.uid()
  AND public.can_update_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS sgpa_action_plans_update ON public.sgpa_action_plans;
CREATE POLICY sgpa_action_plans_update
ON public.sgpa_action_plans FOR UPDATE TO authenticated
USING (public.can_update_agenda_record(user_id, organization_id, school_id))
WITH CHECK (public.can_update_agenda_record(user_id, organization_id, school_id));

REVOKE DELETE ON public.sgpa_compliance_checks FROM authenticated;
REVOKE DELETE ON public.sgpa_action_plans FROM authenticated;

COMMIT;
