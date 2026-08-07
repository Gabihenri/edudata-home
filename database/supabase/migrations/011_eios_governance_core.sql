BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS GOVERNANCE CORE
-- MIGRATION 011 — AUDIT / WORKFLOW / PROVENANCE / DECISIONS
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

-- =========================================================
-- 1. AUDIT EVENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.eios_governance_audit_events (
  id text PRIMARY KEY,
  schema_version text NOT NULL DEFAULT '1.0.0',
  capability text NOT NULL,
  action text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  occurred_at timestamptz NOT NULL,

  actor jsonb NOT NULL DEFAULT '{}'::jsonb,
  resource jsonb NOT NULL DEFAULT '{}'::jsonb,
  engine jsonb,

  source_product text,
  framework_version text,
  eios_version text,
  reason text,
  previous_state jsonb,
  new_state jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  trace jsonb NOT NULL DEFAULT '{}'::jsonb,

  hash_algorithm text NOT NULL DEFAULT 'fnv1a32',
  previous_event_hash text,
  event_hash text NOT NULL,

  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT eios_governance_audit_schema_check
    CHECK (schema_version = '1.0.0'),
  CONSTRAINT eios_governance_audit_severity_check
    CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT eios_governance_audit_hash_algorithm_check
    CHECK (hash_algorithm = 'fnv1a32')
);

CREATE INDEX IF NOT EXISTS eios_governance_audit_user_idx
ON public.eios_governance_audit_events (
  user_id,
  occurred_at DESC
);

CREATE INDEX IF NOT EXISTS eios_governance_audit_org_school_idx
ON public.eios_governance_audit_events (
  organization_id,
  school_id,
  occurred_at DESC
);

CREATE INDEX IF NOT EXISTS eios_governance_audit_capability_idx
ON public.eios_governance_audit_events (
  capability,
  occurred_at DESC
);

CREATE INDEX IF NOT EXISTS eios_governance_audit_resource_idx
ON public.eios_governance_audit_events
USING gin (resource);

CREATE INDEX IF NOT EXISTS eios_governance_audit_trace_idx
ON public.eios_governance_audit_events
USING gin (trace);

-- =========================================================
-- 2. WORKFLOW TRANSITIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.eios_governance_workflow_transitions (
  id text PRIMARY KEY,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  from_state text NOT NULL,
  to_state text NOT NULL,
  reason text NOT NULL,
  reason_text text,
  actor_id text NOT NULL,
  actor_role text,
  occurred_at timestamptz NOT NULL,
  correlation_id text NOT NULL,
  audit_event_id text,
  requires_human_review boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT eios_governance_workflow_state_from_check
    CHECK (from_state IN (
      'draft',
      'generated',
      'under_human_review',
      'approved',
      'published',
      'rejected',
      'archived'
    )),
  CONSTRAINT eios_governance_workflow_state_to_check
    CHECK (to_state IN (
      'draft',
      'generated',
      'under_human_review',
      'approved',
      'published',
      'rejected',
      'archived'
    )),
  CONSTRAINT eios_governance_workflow_audit_fk
    FOREIGN KEY (audit_event_id)
    REFERENCES public.eios_governance_audit_events(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS eios_governance_workflow_resource_idx
ON public.eios_governance_workflow_transitions (
  resource_type,
  resource_id,
  occurred_at DESC
);

CREATE INDEX IF NOT EXISTS eios_governance_workflow_review_idx
ON public.eios_governance_workflow_transitions (
  requires_human_review,
  to_state,
  occurred_at DESC
);

-- =========================================================
-- 3. PROVENANCE RECORDS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.eios_governance_provenance_records (
  id text PRIMARY KEY,
  schema_version text NOT NULL DEFAULT '1.0.0',
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  resource_version text,
  analysis_id text,
  run_id text,
  report_id text,
  framework_version text,
  eios_version text,
  source_product text,

  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  engines jsonb NOT NULL DEFAULT '[]'::jsonb,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,

  generated_by text,
  generated_at timestamptz NOT NULL,
  correlation_id text NOT NULL,
  parent_provenance_ids jsonb NOT NULL DEFAULT '[]'::jsonb,

  hash_algorithm text NOT NULL DEFAULT 'fnv1a32',
  content_hash text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT eios_governance_provenance_schema_check
    CHECK (schema_version = '1.0.0'),
  CONSTRAINT eios_governance_provenance_hash_algorithm_check
    CHECK (hash_algorithm = 'fnv1a32')
);

CREATE INDEX IF NOT EXISTS eios_governance_provenance_resource_idx
ON public.eios_governance_provenance_records (
  resource_type,
  resource_id,
  generated_at DESC
);

CREATE INDEX IF NOT EXISTS eios_governance_provenance_analysis_idx
ON public.eios_governance_provenance_records (
  analysis_id,
  run_id,
  generated_at DESC
);

-- =========================================================
-- 4. HUMAN DECISION REGISTRY
-- =========================================================

CREATE TABLE IF NOT EXISTS public.eios_governance_decision_records (
  id text PRIMARY KEY,
  schema_version text NOT NULL DEFAULT '1.0.0',
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  decision text NOT NULL,
  decided_by text NOT NULL,
  decided_by_role text,
  decided_at timestamptz NOT NULL,
  reason text NOT NULL,
  adapted_content text,

  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  analysis_id text,
  run_id text,
  recommendation_id text,
  intervention_id text,
  correlation_id text NOT NULL,
  audit_event_id text,
  provenance_id text,
  outcome jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT eios_governance_decision_schema_check
    CHECK (schema_version = '1.0.0'),
  CONSTRAINT eios_governance_decision_type_check
    CHECK (decision IN (
      'accept',
      'adapt',
      'reject',
      'approve',
      'publish',
      'archive',
      'defer',
      'custom'
    )),
  CONSTRAINT eios_governance_decision_audit_fk
    FOREIGN KEY (audit_event_id)
    REFERENCES public.eios_governance_audit_events(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT eios_governance_decision_provenance_fk
    FOREIGN KEY (provenance_id)
    REFERENCES public.eios_governance_provenance_records(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS eios_governance_decision_subject_idx
ON public.eios_governance_decision_records (
  subject_type,
  subject_id,
  decided_at DESC
);

CREATE INDEX IF NOT EXISTS eios_governance_decision_analysis_idx
ON public.eios_governance_decision_records (
  analysis_id,
  run_id,
  decided_at DESC
);

-- =========================================================
-- 5. ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE public.eios_governance_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eios_governance_workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eios_governance_provenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eios_governance_decision_records ENABLE ROW LEVEL SECURITY;

-- Audit: append-only for authenticated actors.
DROP POLICY IF EXISTS eios_governance_audit_select
ON public.eios_governance_audit_events;
CREATE POLICY eios_governance_audit_select
ON public.eios_governance_audit_events
FOR SELECT TO authenticated
USING (
  public.can_view_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS eios_governance_audit_insert
ON public.eios_governance_audit_events;
CREATE POLICY eios_governance_audit_insert
ON public.eios_governance_audit_events
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.can_update_agenda_record(user_id, organization_id, school_id)
);

-- Workflow: append-only.
DROP POLICY IF EXISTS eios_governance_workflow_select
ON public.eios_governance_workflow_transitions;
CREATE POLICY eios_governance_workflow_select
ON public.eios_governance_workflow_transitions
FOR SELECT TO authenticated
USING (
  public.can_view_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS eios_governance_workflow_insert
ON public.eios_governance_workflow_transitions;
CREATE POLICY eios_governance_workflow_insert
ON public.eios_governance_workflow_transitions
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.can_update_agenda_record(user_id, organization_id, school_id)
);

-- Provenance: append-only.
DROP POLICY IF EXISTS eios_governance_provenance_select
ON public.eios_governance_provenance_records;
CREATE POLICY eios_governance_provenance_select
ON public.eios_governance_provenance_records
FOR SELECT TO authenticated
USING (
  public.can_view_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS eios_governance_provenance_insert
ON public.eios_governance_provenance_records;
CREATE POLICY eios_governance_provenance_insert
ON public.eios_governance_provenance_records
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.can_update_agenda_record(user_id, organization_id, school_id)
);

-- Decisions: append-only; correções devem gerar novo registro.
DROP POLICY IF EXISTS eios_governance_decision_select
ON public.eios_governance_decision_records;
CREATE POLICY eios_governance_decision_select
ON public.eios_governance_decision_records
FOR SELECT TO authenticated
USING (
  public.can_view_agenda_record(user_id, organization_id, school_id)
);

DROP POLICY IF EXISTS eios_governance_decision_insert
ON public.eios_governance_decision_records;
CREATE POLICY eios_governance_decision_insert
ON public.eios_governance_decision_records
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.can_update_agenda_record(user_id, organization_id, school_id)
);

-- Nenhuma policy UPDATE/DELETE é criada para os quatro registros.
-- Governança é histórica, append-only e auditável.

COMMENT ON TABLE public.eios_governance_audit_events IS
  'Trilha de auditoria imutável do EIOS Governance Core.';

COMMENT ON TABLE public.eios_governance_workflow_transitions IS
  'Histórico imutável de transições de workflow e revisão humana do EIOS.';

COMMENT ON TABLE public.eios_governance_provenance_records IS
  'Cadeia de proveniência dos artefatos produzidos pelo EIOS.';

COMMENT ON TABLE public.eios_governance_decision_records IS
  'Registro histórico de decisões humanas relacionadas a análises, recomendações, evidências e intervenções.';

COMMIT;
