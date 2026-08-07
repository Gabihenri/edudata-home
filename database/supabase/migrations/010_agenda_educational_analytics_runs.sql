BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / EDUCATIONAL ANALYTICS
-- AGENDA INTELIGENTE EDI
-- MIGRATION 010 — EXECUÇÕES E HISTÓRICO ANALÍTICO
-- =========================================================
--
-- Arquitetura preservada:
-- Framework EDI
-- ↓
-- EIOS
-- ↓
-- Educational Analytics
-- ↓
-- Core Compartilhado
-- ↓
-- Produtos Especializados
--
-- Objetivos:
-- 1. Persistir execuções consolidadas do Educational Analytics.
-- 2. Preservar versionamento e histórico longitudinal.
-- 3. Persistir relatório analítico sem aprová-lo automaticamente.
-- 4. Registrar revisão humana e aprovação explícita.
-- 5. Preservar privacidade, ética, explicabilidade e rastreabilidade.
-- 6. Impedir exclusão física via políticas de usuário.
-- 7. Preparar consumo por Learning Graph e Research Intelligence.
-- =========================================================

-- =========================================================
-- 1. PRÉ-REQUISITOS
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
-- 2. TABELA PRINCIPAL
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.agenda_educational_analytics_runs (
    id uuid
      PRIMARY KEY
      DEFAULT gen_random_uuid(),

    analysis_id text
      NOT NULL,

    analysis_key text
      NOT NULL,

    version_id text
      NOT NULL,

    version_number integer
      NOT NULL
      DEFAULT 1,

    version_label text
      NOT NULL
      DEFAULT '1.0',

    version_status text
      NOT NULL
      DEFAULT 'current',

    previous_version_id uuid,

    parent_version_id uuid,

    is_current_version boolean
      NOT NULL
      DEFAULT true,

    idempotency_key text
      NOT NULL,

    status text
      NOT NULL,

    scope text
      NOT NULL,

    title text
      NOT NULL,

    description text,

    capability text
      NOT NULL
      DEFAULT 'educational_analytics',

    source_product text
      NOT NULL
      DEFAULT 'agenda_inteligente_edi',

    context jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    configuration jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    data_quality jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    privacy jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    ethics jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    research_eligibility jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    explainability jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    traceability jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    analytics_payload jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    report_payload jsonb,

    correlation_count integer
      NOT NULL
      DEFAULT 0,

    pattern_count integer
      NOT NULL
      DEFAULT 0,

    anomaly_count integer
      NOT NULL
      DEFAULT 0,

    influence_count integer
      NOT NULL
      DEFAULT 0,

    prediction_count integer
      NOT NULL
      DEFAULT 0,

    recommendation_count integer
      NOT NULL
      DEFAULT 0,

    research_result_count integer
      NOT NULL
      DEFAULT 0,

    contains_personal_data boolean
      NOT NULL
      DEFAULT false,

    contains_sensitive_data boolean
      NOT NULL
      DEFAULT false,

    contains_minor_data boolean
      NOT NULL
      DEFAULT false,

    anonymized boolean
      NOT NULL
      DEFAULT false,

    pseudonymized boolean
      NOT NULL
      DEFAULT false,

    requires_human_review boolean
      NOT NULL
      DEFAULT true,

    human_review_status text
      NOT NULL
      DEFAULT 'pending',

    human_review_payload jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    reviewed_at timestamptz,

    reviewed_by uuid,

    approved boolean
      NOT NULL
      DEFAULT false,

    approved_at timestamptz,

    approved_by uuid,

    user_id uuid
      NOT NULL,

    organization_id uuid,

    school_id uuid,

    owner_user_id uuid,

    created_by uuid,

    updated_by uuid,

    correlation_id text
      NOT NULL,

    causation_id text,

    request_id text,

    session_id text,

    trace_id text,

    warnings jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    errors jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    metadata jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    generated_at timestamptz
      NOT NULL,

    completed_at timestamptz,

    created_at timestamptz
      NOT NULL
      DEFAULT now(),

    updated_at timestamptz
      NOT NULL
      DEFAULT now(),

    archived_at timestamptz,

    CONSTRAINT
      agenda_educational_analytics_runs_analysis_version_unique
    UNIQUE (
      analysis_key,
      version_number
    ),

    CONSTRAINT
      agenda_educational_analytics_runs_version_id_unique
    UNIQUE (
      version_id
    ),

    CONSTRAINT
      agenda_educational_analytics_runs_idempotency_unique
    UNIQUE (
      idempotency_key
    ),

    CONSTRAINT
      agenda_educational_analytics_runs_previous_version_fk
    FOREIGN KEY (
      previous_version_id
    )
    REFERENCES public.agenda_educational_analytics_runs(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

    CONSTRAINT
      agenda_educational_analytics_runs_parent_version_fk
    FOREIGN KEY (
      parent_version_id
    )
    REFERENCES public.agenda_educational_analytics_runs(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

    CONSTRAINT
      agenda_educational_analytics_runs_version_number_check
    CHECK (
      version_number >= 1
    ),

    CONSTRAINT
      agenda_educational_analytics_runs_version_status_check
    CHECK (
      version_status IN (
        'current',
        'superseded',
        'archived',
        'rejected'
      )
    ),

    CONSTRAINT
      agenda_educational_analytics_runs_status_check
    CHECK (
      status IN (
        'idle',
        'queued',
        'validating',
        'running',
        'completed',
        'completed_with_warnings',
        'failed',
        'cancelled',
        'archived'
      )
    ),

    CONSTRAINT
      agenda_educational_analytics_runs_capability_check
    CHECK (
      capability = 'educational_analytics'
    ),

    CONSTRAINT
      agenda_educational_analytics_runs_human_review_status_check
    CHECK (
      human_review_status IN (
        'pending',
        'in_review',
        'approved',
        'approved_with_changes',
        'rejected'
      )
    ),

    CONSTRAINT
      agenda_educational_analytics_runs_counts_check
    CHECK (
      correlation_count >= 0
      AND pattern_count >= 0
      AND anomaly_count >= 0
      AND influence_count >= 0
      AND prediction_count >= 0
      AND recommendation_count >= 0
      AND research_result_count >= 0
    )
  );

-- Apenas uma versão corrente por analysis_key.
CREATE UNIQUE INDEX IF NOT EXISTS
  agenda_educational_analytics_runs_current_key_unique
ON public.agenda_educational_analytics_runs (
  analysis_key
)
WHERE is_current_version = true
  AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS
  agenda_educational_analytics_runs_user_idx
ON public.agenda_educational_analytics_runs (
  user_id,
  generated_at DESC
);

CREATE INDEX IF NOT EXISTS
  agenda_educational_analytics_runs_org_school_idx
ON public.agenda_educational_analytics_runs (
  organization_id,
  school_id,
  generated_at DESC
);

CREATE INDEX IF NOT EXISTS
  agenda_educational_analytics_runs_analysis_key_idx
ON public.agenda_educational_analytics_runs (
  analysis_key,
  version_number DESC
);

CREATE INDEX IF NOT EXISTS
  agenda_educational_analytics_runs_correlation_idx
ON public.agenda_educational_analytics_runs (
  correlation_id
);

CREATE INDEX IF NOT EXISTS
  agenda_educational_analytics_runs_review_idx
ON public.agenda_educational_analytics_runs (
  human_review_status,
  requires_human_review,
  generated_at DESC
);

-- =========================================================
-- 3. UPDATED_AT
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.set_agenda_educational_analytics_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
  set_agenda_educational_analytics_updated_at
ON public.agenda_educational_analytics_runs;

CREATE TRIGGER
  set_agenda_educational_analytics_updated_at
BEFORE UPDATE
ON public.agenda_educational_analytics_runs
FOR EACH ROW
EXECUTE FUNCTION
  public.set_agenda_educational_analytics_updated_at();

-- =========================================================
-- 4. RLS
-- =========================================================

ALTER TABLE
  public.agenda_educational_analytics_runs
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
  agenda_educational_analytics_runs_select
ON public.agenda_educational_analytics_runs;

CREATE POLICY
  agenda_educational_analytics_runs_select
ON public.agenda_educational_analytics_runs
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
  agenda_educational_analytics_runs_insert
ON public.agenda_educational_analytics_runs;

CREATE POLICY
  agenda_educational_analytics_runs_insert
ON public.agenda_educational_analytics_runs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);

DROP POLICY IF EXISTS
  agenda_educational_analytics_runs_update
ON public.agenda_educational_analytics_runs;

CREATE POLICY
  agenda_educational_analytics_runs_update
ON public.agenda_educational_analytics_runs
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

-- Nenhuma policy DELETE é criada.
-- O histórico analítico é preservado por arquivamento lógico.

-- =========================================================
-- 5. COMENTÁRIOS DE GOVERNANÇA
-- =========================================================

COMMENT ON TABLE
  public.agenda_educational_analytics_runs
IS
  'Histórico versionado das execuções do EIOS Educational Analytics. Resultados apoiam decisão profissional e não autorizam decisão automatizada.';

COMMENT ON COLUMN
  public.agenda_educational_analytics_runs.analytics_payload
IS
  'Snapshot consolidado do contrato EducationalAnalyticsResult, protegido por RLS e metadados de privacidade.';

COMMENT ON COLUMN
  public.agenda_educational_analytics_runs.report_payload
IS
  'Relatório analítico gerado pelo EIOS. A existência do relatório não implica revisão ou aprovação humana.';

COMMENT ON COLUMN
  public.agenda_educational_analytics_runs.approved
IS
  'Aprovação humana explícita. Nunca deve ser definida automaticamente pelo motor analítico.';

COMMIT;
