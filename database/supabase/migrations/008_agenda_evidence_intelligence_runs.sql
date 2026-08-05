BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / EVIDENCE INTELLIGENCE
-- AGENDA INTELIGENTE EDI
-- MIGRATION 008 — HISTÓRICO DE PROCESSAMENTO INTELIGENTE
-- =========================================================
--
-- Arquitetura preservada:
--
-- Framework EDI
-- ↓
-- EIOS
-- ↓
-- Evidence Intelligence
-- ↓
-- Agenda Inteligente EDI
--
-- Objetivos:
--
-- 1. Persistir cada execução do Evidence Intelligence.
-- 2. Preservar histórico de processamento e reprocessamento.
-- 3. Permitir múltiplas versões do motor.
-- 4. Registrar qualidade, confiabilidade e classificações EDI.
-- 5. Sustentar revisão humana e Explainable AI.
-- 6. Preservar escopo de usuário, escola e organização.
-- 7. Preparar idempotência, Outbox e processamento assíncrono.
-- 8. Não alterar a tabela public.agenda_evidences.
-- 9. Não implementar fila ou worker nesta migration.
--
-- Pré-requisitos:
--
-- database/13_identity_governance.sql
-- database/supabase/migrations/006_agenda_governance_audit.sql
-- database/supabase/migrations/007_agenda_evidence_private_storage.sql
-- database/30_agenda_operational_cycle_foundation.sql
-- =========================================================


-- =========================================================
-- 1. VALIDAÇÃO DE PRÉ-REQUISITOS
-- =========================================================

DO $$
BEGIN
  IF to_regclass(
    'public.agenda_evidences'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A tabela public.agenda_evidences não existe. A migration foi interrompida para evitar arquitetura paralela.';
  END IF;

  IF to_regprocedure(
    'public.can_view_agenda_record(uuid,uuid,uuid)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A função public.can_view_agenda_record(uuid,uuid,uuid) não existe. Execute primeiro as migrations oficiais de identidade e governança da Agenda.';
  END IF;

  IF to_regprocedure(
    'public.can_update_agenda_record(uuid,uuid,uuid)'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A função public.can_update_agenda_record(uuid,uuid,uuid) não existe. Execute primeiro as migrations oficiais de identidade e governança da Agenda.';
  END IF;
END;
$$;


-- =========================================================
-- 2. TABELA DE EXECUÇÕES DO EVIDENCE INTELLIGENCE
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.agenda_evidence_intelligence_runs (
    id uuid
      PRIMARY KEY
      DEFAULT gen_random_uuid(),

    /*
     * Evidência original da Agenda.
     */
    evidence_id uuid
      NOT NULL,

    /*
     * Identificador do evento EIOS que iniciou a execução.
     *
     * Mantido como text para preservar compatibilidade
     * com UUIDs e outros identificadores versionados.
     */
    event_id text,

    /*
     * Chave estável de idempotência.
     *
     * Deve permitir reconhecer uma execução já persistida,
     * especialmente durante retry, Outbox ou reprocessamento.
     */
    idempotency_key text
      NOT NULL,

    /*
     * Identificação e versão do motor.
     */
    engine_name text
      NOT NULL
      DEFAULT 'evidence-intelligence',

    engine_version text
      NOT NULL,

    contract_version text,

    /*
     * Motivo ou origem da execução.
     */
    processing_source text
      NOT NULL
      DEFAULT 'agenda-evidence-created-event',

    processing_status text
      NOT NULL
      DEFAULT 'pending',

    /*
     * Pontuações normalizadas entre 0 e 1.
     *
     * Os objetos completos permanecem armazenados
     * nos campos JSONB correspondentes.
     */
    quality_score numeric(6, 5),

    reliability_score numeric(6, 5),

    confidence_score numeric(6, 5),

    /*
     * Resultados estruturados do motor.
     */
    quality jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    reliability jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    framework_classifications jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    validation jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    explanation jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    /*
     * Governança do processamento.
     */
    requires_human_review boolean
      NOT NULL
      DEFAULT false,

    human_review_status text
      NOT NULL
      DEFAULT 'not_required',

    human_reviewed_at timestamptz,

    human_reviewed_by uuid,

    human_review_notes text,

    /*
     * Diagnóstico da execução.
     */
    warnings jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    errors jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    attempt_count integer
      NOT NULL
      DEFAULT 1,

    /*
     * Rastreamento distribuído do EIOS.
     */
    correlation_id text,

    causation_id text,

    parent_event_id text,

    trace_id text,

    /*
     * Contexto multitenant copiado da evidência.
     */
    user_id uuid
      NOT NULL,

    organization_id uuid,

    school_id uuid,

    /*
     * Auditoria operacional.
     */
    requested_by uuid,

    started_at timestamptz
      NOT NULL
      DEFAULT now(),

    processed_at timestamptz,

    failed_at timestamptz,

    last_error text,

    metadata jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    created_at timestamptz
      NOT NULL
      DEFAULT now(),

    updated_at timestamptz
      NOT NULL
      DEFAULT now(),

    CONSTRAINT
      agenda_evidence_intelligence_runs_evidence_fk
    FOREIGN KEY (
      evidence_id
    )
    REFERENCES public.agenda_evidences(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

    CONSTRAINT
      agenda_evidence_intelligence_runs_idempotency_unique
    UNIQUE (
      idempotency_key
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_status_check
    CHECK (
      processing_status IN (
        'pending',
        'processing',
        'completed',
        'requires_human_review',
        'failed',
        'cancelled',
        'ignored'
      )
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_human_review_status_check
    CHECK (
      human_review_status IN (
        'not_required',
        'pending',
        'in_review',
        'approved',
        'rejected',
        'changes_requested'
      )
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_quality_score_check
    CHECK (
      quality_score IS NULL
      OR (
        quality_score >= 0
        AND quality_score <= 1
      )
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_reliability_score_check
    CHECK (
      reliability_score IS NULL
      OR (
        reliability_score >= 0
        AND reliability_score <= 1
      )
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_confidence_score_check
    CHECK (
      confidence_score IS NULL
      OR (
        confidence_score >= 0
        AND confidence_score <= 1
      )
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_attempt_count_check
    CHECK (
      attempt_count >= 1
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_processed_at_check
    CHECK (
      processed_at IS NULL
      OR processed_at >= started_at
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_failed_at_check
    CHECK (
      failed_at IS NULL
      OR failed_at >= started_at
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_review_consistency_check
    CHECK (
      human_reviewed_at IS NULL
      OR human_reviewed_by IS NOT NULL
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_review_required_check
    CHECK (
      requires_human_review = true
      OR human_review_status = 'not_required'
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_quality_json_check
    CHECK (
      jsonb_typeof(
        quality
      ) = 'object'
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_reliability_json_check
    CHECK (
      jsonb_typeof(
        reliability
      ) = 'object'
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_classifications_json_check
    CHECK (
      jsonb_typeof(
        framework_classifications
      ) = 'array'
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_validation_json_check
    CHECK (
      jsonb_typeof(
        validation
      ) = 'object'
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_explanation_json_check
    CHECK (
      jsonb_typeof(
        explanation
      ) = 'object'
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_warnings_json_check
    CHECK (
      jsonb_typeof(
        warnings
      ) = 'array'
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_errors_json_check
    CHECK (
      jsonb_typeof(
        errors
      ) = 'array'
    ),

    CONSTRAINT
      agenda_evidence_intelligence_runs_metadata_json_check
    CHECK (
      jsonb_typeof(
        metadata
      ) = 'object'
    )
  );


-- =========================================================
-- 3. COMENTÁRIOS DE GOVERNANÇA
-- =========================================================

COMMENT ON TABLE
  public.agenda_evidence_intelligence_runs
IS
  'Histórico versionado das execuções do Evidence Intelligence sobre evidências da Agenda Inteligente EDI.';

COMMENT ON COLUMN
  public.agenda_evidence_intelligence_runs.idempotency_key
IS
  'Chave única que impede persistência duplicada da mesma execução lógica.';

COMMENT ON COLUMN
  public.agenda_evidence_intelligence_runs.framework_classifications
IS
  'Classificações produzidas de acordo com o Framework EDI.';

COMMENT ON COLUMN
  public.agenda_evidence_intelligence_runs.explanation
IS
  'Estrutura explicável do processamento, destinada a Explainable AI e rastreabilidade pedagógica.';

COMMENT ON COLUMN
  public.agenda_evidence_intelligence_runs.requires_human_review
IS
  'Indica que o resultado não deve ser tratado como decisão autônoma e exige revisão humana.';


-- =========================================================
-- 4. ÍNDICES
-- =========================================================

CREATE INDEX IF NOT EXISTS
  idx_agenda_evidence_intelligence_runs_evidence
ON public.agenda_evidence_intelligence_runs (
  evidence_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_evidence_intelligence_runs_event
ON public.agenda_evidence_intelligence_runs (
  event_id
)
WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_agenda_evidence_intelligence_runs_status
ON public.agenda_evidence_intelligence_runs (
  processing_status,
  created_at
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_evidence_intelligence_runs_review
ON public.agenda_evidence_intelligence_runs (
  human_review_status,
  created_at
)
WHERE requires_human_review = true;

CREATE INDEX IF NOT EXISTS
  idx_agenda_evidence_intelligence_runs_user
ON public.agenda_evidence_intelligence_runs (
  user_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_evidence_intelligence_runs_organization
ON public.agenda_evidence_intelligence_runs (
  organization_id,
  created_at DESC
)
WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_agenda_evidence_intelligence_runs_school
ON public.agenda_evidence_intelligence_runs (
  school_id,
  created_at DESC
)
WHERE school_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_agenda_evidence_intelligence_runs_engine
ON public.agenda_evidence_intelligence_runs (
  engine_name,
  engine_version,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_evidence_intelligence_runs_correlation
ON public.agenda_evidence_intelligence_runs (
  correlation_id
)
WHERE correlation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_agenda_evidence_intelligence_runs_trace
ON public.agenda_evidence_intelligence_runs (
  trace_id
)
WHERE trace_id IS NOT NULL;


-- =========================================================
-- 5. SINCRONIZAÇÃO AUTOMÁTICA DE CONTEXTO
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.apply_agenda_evidence_intelligence_run_context()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_evidence
    public.agenda_evidences%ROWTYPE;
BEGIN
  SELECT *
  INTO source_evidence
  FROM public.agenda_evidences
  WHERE id = NEW.evidence_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'A evidência % não existe.',
      NEW.evidence_id;
  END IF;

  NEW.user_id :=
    source_evidence.user_id;

  NEW.organization_id :=
    source_evidence.organization_id;

  NEW.school_id :=
    source_evidence.school_id;

  NEW.updated_at :=
    now();

  IF NEW.requested_by IS NULL THEN
    NEW.requested_by :=
      auth.uid();
  END IF;

  IF NEW.requires_human_review = true
     AND NEW.human_review_status = 'not_required' THEN
    NEW.human_review_status :=
      'pending';
  END IF;

  IF NEW.processing_status = 'completed'
     AND NEW.processed_at IS NULL THEN
    NEW.processed_at :=
      now();
  END IF;

  IF NEW.processing_status = 'requires_human_review'
     AND NEW.processed_at IS NULL THEN
    NEW.processed_at :=
      now();
  END IF;

  IF NEW.processing_status = 'failed'
     AND NEW.failed_at IS NULL THEN
    NEW.failed_at :=
      now();
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_apply_agenda_evidence_intelligence_run_context
ON public.agenda_evidence_intelligence_runs;

CREATE TRIGGER
  trg_apply_agenda_evidence_intelligence_run_context
BEFORE INSERT OR UPDATE
ON public.agenda_evidence_intelligence_runs
FOR EACH ROW
EXECUTE FUNCTION
  public.apply_agenda_evidence_intelligence_run_context();


-- =========================================================
-- 6. BLOQUEIO DE EXCLUSÃO FÍSICA
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.block_agenda_evidence_intelligence_run_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION
    'Execuções do Evidence Intelligence fazem parte do histórico de auditoria e não podem ser excluídas fisicamente.';

  RETURN OLD;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_block_agenda_evidence_intelligence_run_delete
ON public.agenda_evidence_intelligence_runs;

CREATE TRIGGER
  trg_block_agenda_evidence_intelligence_run_delete
BEFORE DELETE
ON public.agenda_evidence_intelligence_runs
FOR EACH ROW
EXECUTE FUNCTION
  public.block_agenda_evidence_intelligence_run_delete();


-- =========================================================
-- 7. ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE
  public.agenda_evidence_intelligence_runs
ENABLE ROW LEVEL SECURITY;

ALTER TABLE
  public.agenda_evidence_intelligence_runs
FORCE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS
  agenda_evidence_intelligence_runs_select_policy
ON public.agenda_evidence_intelligence_runs;

CREATE POLICY
  agenda_evidence_intelligence_runs_select_policy
ON public.agenda_evidence_intelligence_runs
FOR SELECT
TO authenticated
USING (
  public.can_view_agenda_record(
    auth.uid(),
    user_id,
    school_id
  )
);


DROP POLICY IF EXISTS
  agenda_evidence_intelligence_runs_insert_policy
ON public.agenda_evidence_intelligence_runs;

CREATE POLICY
  agenda_evidence_intelligence_runs_insert_policy
ON public.agenda_evidence_intelligence_runs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.agenda_evidences evidence
    WHERE evidence.id =
      evidence_id

      AND evidence.deleted_at
        IS NULL

      AND public.can_update_agenda_record(
        auth.uid(),
        evidence.user_id,
        evidence.school_id
      )
  )
);


DROP POLICY IF EXISTS
  agenda_evidence_intelligence_runs_update_policy
ON public.agenda_evidence_intelligence_runs;

CREATE POLICY
  agenda_evidence_intelligence_runs_update_policy
ON public.agenda_evidence_intelligence_runs
FOR UPDATE
TO authenticated
USING (
  public.can_update_agenda_record(
    auth.uid(),
    user_id,
    school_id
  )
)
WITH CHECK (
  public.can_update_agenda_record(
    auth.uid(),
    user_id,
    school_id
  )
);


-- Nenhuma política DELETE é criada.
-- O histórico não pode ser excluído por usuários autenticados.


-- =========================================================
-- 8. PERMISSÕES
-- =========================================================

REVOKE ALL
ON TABLE
  public.agenda_evidence_intelligence_runs
FROM anon;

GRANT SELECT,
      INSERT,
      UPDATE
ON TABLE
  public.agenda_evidence_intelligence_runs
TO authenticated;

GRANT ALL
ON TABLE
  public.agenda_evidence_intelligence_runs
TO service_role;


-- =========================================================
-- 9. VALIDAÇÃO FINAL
-- =========================================================

DO $$
BEGIN
  IF to_regclass(
    'public.agenda_evidence_intelligence_runs'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A tabela public.agenda_evidence_intelligence_runs não foi criada.';
  END IF;

  IF to_regprocedure(
    'public.apply_agenda_evidence_intelligence_run_context()'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A função de contexto do Evidence Intelligence não foi criada.';
  END IF;

  IF to_regprocedure(
    'public.block_agenda_evidence_intelligence_run_delete()'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A função de proteção do histórico do Evidence Intelligence não foi criada.';
  END IF;
END;
$$;

COMMIT;