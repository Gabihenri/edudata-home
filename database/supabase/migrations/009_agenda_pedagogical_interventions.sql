BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / PEDAGOGICAL COPILOT
-- AGENDA INTELIGENTE EDI
-- MIGRATION 009 — INTERVENÇÕES PEDAGÓGICAS
-- =========================================================
--
-- Arquitetura preservada:
--
-- Framework EDI
-- ↓
-- EIOS
-- ↓
-- Pedagogical Copilot
-- ↓
-- Core Compartilhado
-- ↓
-- Agenda Inteligente EDI e Produtos Especializados
--
-- Objetivos:
--
-- 1. Persistir intervenções pedagógicas geradas pelo EIOS.
-- 2. Preservar diagnóstico, plano, cronograma e avaliação.
-- 3. Registrar decisão final do professor.
-- 4. Sustentar revisão humana e autonomia profissional.
-- 5. Manter versionamento e histórico longitudinal.
-- 6. Relacionar evidências, turmas, aulas e planejamentos.
-- 7. Preservar contexto de usuário, escola e organização.
-- 8. Sustentar Explainable AI e rastreabilidade.
-- 9. Preparar Learning Graph e Educational Analytics.
-- 10. Impedir exclusão física do histórico pedagógico.
--
-- Pré-requisitos:
--
-- database/13_identity_governance.sql
-- database/30_agenda_operational_cycle_foundation.sql
-- database/supabase/migrations/006_agenda_governance_audit.sql
-- database/supabase/migrations/007_agenda_evidence_private_storage.sql
-- database/supabase/migrations/008_agenda_evidence_intelligence_runs.sql
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

  IF to_regclass(
    'public.agenda_evidence_intelligence_runs'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A tabela public.agenda_evidence_intelligence_runs não existe. Execute primeiro a Migration 008.';
  END IF;

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
-- 2. TABELA PRINCIPAL DE INTERVENÇÕES
-- =========================================================

CREATE TABLE IF NOT EXISTS
  public.agenda_pedagogical_interventions (
    id uuid
      PRIMARY KEY
      DEFAULT gen_random_uuid(),

    /*
     * Identificador estável produzido pelo EIOS.
     *
     * Permanece igual entre diferentes versões da mesma
     * intervenção pedagógica.
     */
    intervention_key text
      NOT NULL,

    /*
     * Identificador da versão no contrato de domínio.
     */
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

    /*
     * Chave estável para impedir duplicação causada por
     * retry, reprocessamento, API ou eventos do EIOS.
     */
    idempotency_key text
      NOT NULL,

    /*
     * Ligações principais com a Evidence Intelligence.
     */
    evidence_id uuid,

    evidence_intelligence_run_id uuid,

    source_analysis_id text,

    source_event_id text,

    /*
     * Ligações preparadas para o Learning Graph.
     *
     * São mantidas como text ou JSONB para preservar
     * compatibilidade com os identificadores atuais e
     * futuros do Core Compartilhado.
     */
    class_ids jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    planning_ids jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    lesson_ids jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    learning_objective_ids jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    skill_ids jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    competency_ids jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    indicator_ids jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    assessment_ids jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    related_intervention_ids jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    additional_entities jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    /*
     * Situação pedagógica da intervenção.
     */
    title text
      NOT NULL,

    summary text
      NOT NULL,

    status text
      NOT NULL
      DEFAULT 'draft',

    priority text
      NOT NULL
      DEFAULT 'moderate',

    risk_level text
      NOT NULL
      DEFAULT 'undetermined',

    scope text
      NOT NULL
      DEFAULT 'individual',

    source text
      NOT NULL
      DEFAULT 'eios_engine',

    source_product text
      NOT NULL
      DEFAULT 'agenda_inteligente_edi',

    capability text
      NOT NULL
      DEFAULT 'pedagogical_copilot',

    /*
     * Objetos completos do contrato oficial.
     */
    context jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    diagnostic jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    plan jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    expected_evidence jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    indicators jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    success_criteria jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    schedule jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    monitoring jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    effectiveness jsonb,

    explainability jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    privacy jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    research_eligibility jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    engine jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    /*
     * Decisão e autonomia profissional.
     */
    teacher_decision text
      NOT NULL
      DEFAULT 'pending',

    teacher_decision_payload jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    teacher_decided_at timestamptz,

    teacher_decided_by uuid,

    teacher_decision_rationale text,

    teacher_autonomy_confirmed boolean
      NOT NULL
      DEFAULT false,

    /*
     * Revisão humana.
     */
    requires_human_review boolean
      NOT NULL
      DEFAULT true,

    human_review_status text
      NOT NULL
      DEFAULT 'pending',

    human_review_payload jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    human_review_requested_at timestamptz,

    human_review_started_at timestamptz,

    human_review_completed_at timestamptz,

    human_reviewed_by uuid,

    human_reviewer_role text,

    /*
     * Acompanhamento e avaliação.
     */
    execution_status text
      NOT NULL
      DEFAULT 'not_started',

    evaluation_status text
      NOT NULL
      DEFAULT 'not_started',

    progress_percentage numeric(5, 2)
      NOT NULL
      DEFAULT 0,

    planned_start_at timestamptz,

    planned_end_at timestamptz,

    actual_start_at timestamptz,

    actual_end_at timestamptz,

    next_monitoring_at timestamptz,

    evaluated_at timestamptz,

    evaluated_by uuid,

    effectiveness_score numeric(6, 5),

    /*
     * Contexto multitenant.
     */
    user_id uuid
      NOT NULL,

    organization_id uuid,

    school_id uuid,

    owner_user_id uuid,

    created_by uuid,

    updated_by uuid,

    /*
     * Rastreabilidade distribuída do EIOS.
     */
    correlation_id text
      NOT NULL,

    causation_id text,

    request_id text,

    session_id text,

    trace_id text,

    traceability jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    audit_events jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    warnings jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    errors jsonb
      NOT NULL
      DEFAULT '[]'::jsonb,

    metadata jsonb
      NOT NULL
      DEFAULT '{}'::jsonb,

    /*
     * Auditoria temporal.
     */
    created_at timestamptz
      NOT NULL
      DEFAULT now(),

    updated_at timestamptz
      NOT NULL
      DEFAULT now(),

    archived_at timestamptz,

    CONSTRAINT
      agenda_pedagogical_interventions_key_version_unique
    UNIQUE (
      intervention_key,
      version_number
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_version_id_unique
    UNIQUE (
      version_id
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_idempotency_unique
    UNIQUE (
      idempotency_key
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_evidence_fk
    FOREIGN KEY (
      evidence_id
    )
    REFERENCES public.agenda_evidences(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

    CONSTRAINT
      agenda_pedagogical_interventions_evidence_run_fk
    FOREIGN KEY (
      evidence_intelligence_run_id
    )
    REFERENCES public.agenda_evidence_intelligence_runs(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

    CONSTRAINT
      agenda_pedagogical_interventions_previous_version_fk
    FOREIGN KEY (
      previous_version_id
    )
    REFERENCES public.agenda_pedagogical_interventions(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

    CONSTRAINT
      agenda_pedagogical_interventions_parent_version_fk
    FOREIGN KEY (
      parent_version_id
    )
    REFERENCES public.agenda_pedagogical_interventions(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

    CONSTRAINT
      agenda_pedagogical_interventions_version_number_check
    CHECK (
      version_number >= 1
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_version_status_check
    CHECK (
      version_status IN (
        'current',
        'superseded',
        'archived',
        'rejected'
      )
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_status_check
    CHECK (
      status IN (
        'draft',
        'generated',
        'awaiting_teacher_decision',
        'accepted',
        'adapted',
        'rejected',
        'scheduled',
        'in_progress',
        'paused',
        'completed',
        'cancelled',
        'under_evaluation',
        'evaluated',
        'archived'
      )
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_priority_check
    CHECK (
      priority IN (
        'low',
        'moderate',
        'high',
        'urgent',
        'critical'
      )
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_risk_check
    CHECK (
      risk_level IN (
        'none',
        'low',
        'moderate',
        'high',
        'critical',
        'undetermined'
      )
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_scope_check
    CHECK (
      scope IN (
        'individual',
        'small_group',
        'subgroup',
        'class',
        'multiple_classes',
        'school',
        'organization',
        'network'
      )
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_capability_check
    CHECK (
      capability = 'pedagogical_copilot'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_teacher_decision_check
    CHECK (
      teacher_decision IN (
        'pending',
        'accepted',
        'adapted',
        'rejected'
      )
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_human_review_status_check
    CHECK (
      human_review_status IN (
        'not_required',
        'pending',
        'in_review',
        'approved',
        'approved_with_changes',
        'changes_requested',
        'rejected'
      )
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_execution_status_check
    CHECK (
      execution_status IN (
        'not_started',
        'scheduled',
        'in_progress',
        'partially_completed',
        'completed',
        'paused',
        'cancelled',
        'not_applicable'
      )
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_evaluation_status_check
    CHECK (
      evaluation_status IN (
        'not_started',
        'collecting_evidence',
        'under_review',
        'effective',
        'partially_effective',
        'ineffective',
        'inconclusive',
        'requires_continuation',
        'requires_redesign'
      )
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_progress_check
    CHECK (
      progress_percentage >= 0
      AND progress_percentage <= 100
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_effectiveness_score_check
    CHECK (
      effectiveness_score IS NULL
      OR (
        effectiveness_score >= 0
        AND effectiveness_score <= 1
      )
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_planned_dates_check
    CHECK (
      planned_end_at IS NULL
      OR planned_start_at IS NULL
      OR planned_end_at >= planned_start_at
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_actual_dates_check
    CHECK (
      actual_end_at IS NULL
      OR actual_start_at IS NULL
      OR actual_end_at >= actual_start_at
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_teacher_decision_consistency_check
    CHECK (
      teacher_decision = 'pending'
      OR (
        teacher_decided_at IS NOT NULL
        AND teacher_decided_by IS NOT NULL
        AND teacher_autonomy_confirmed = true
      )
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_review_required_check
    CHECK (
      requires_human_review = true
      OR human_review_status = 'not_required'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_review_completion_check
    CHECK (
      human_review_completed_at IS NULL
      OR human_reviewed_by IS NOT NULL
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_current_version_check
    CHECK (
      is_current_version = true
      OR version_status <> 'current'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_context_json_check
    CHECK (
      jsonb_typeof(context) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_diagnostic_json_check
    CHECK (
      jsonb_typeof(diagnostic) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_plan_json_check
    CHECK (
      jsonb_typeof(plan) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_expected_evidence_json_check
    CHECK (
      jsonb_typeof(expected_evidence) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_indicators_json_check
    CHECK (
      jsonb_typeof(indicators) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_success_criteria_json_check
    CHECK (
      jsonb_typeof(success_criteria) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_schedule_json_check
    CHECK (
      jsonb_typeof(schedule) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_monitoring_json_check
    CHECK (
      jsonb_typeof(monitoring) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_effectiveness_json_check
    CHECK (
      effectiveness IS NULL
      OR jsonb_typeof(effectiveness) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_explainability_json_check
    CHECK (
      jsonb_typeof(explainability) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_privacy_json_check
    CHECK (
      jsonb_typeof(privacy) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_research_json_check
    CHECK (
      jsonb_typeof(research_eligibility) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_engine_json_check
    CHECK (
      jsonb_typeof(engine) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_teacher_payload_json_check
    CHECK (
      jsonb_typeof(teacher_decision_payload) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_review_payload_json_check
    CHECK (
      jsonb_typeof(human_review_payload) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_traceability_json_check
    CHECK (
      jsonb_typeof(traceability) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_audit_events_json_check
    CHECK (
      jsonb_typeof(audit_events) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_warnings_json_check
    CHECK (
      jsonb_typeof(warnings) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_errors_json_check
    CHECK (
      jsonb_typeof(errors) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_metadata_json_check
    CHECK (
      jsonb_typeof(metadata) = 'object'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_class_ids_json_check
    CHECK (
      jsonb_typeof(class_ids) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_planning_ids_json_check
    CHECK (
      jsonb_typeof(planning_ids) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_lesson_ids_json_check
    CHECK (
      jsonb_typeof(lesson_ids) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_objective_ids_json_check
    CHECK (
      jsonb_typeof(learning_objective_ids) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_skill_ids_json_check
    CHECK (
      jsonb_typeof(skill_ids) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_competency_ids_json_check
    CHECK (
      jsonb_typeof(competency_ids) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_indicator_ids_json_check
    CHECK (
      jsonb_typeof(indicator_ids) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_assessment_ids_json_check
    CHECK (
      jsonb_typeof(assessment_ids) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_related_ids_json_check
    CHECK (
      jsonb_typeof(related_intervention_ids) = 'array'
    ),

    CONSTRAINT
      agenda_pedagogical_interventions_entities_json_check
    CHECK (
      jsonb_typeof(additional_entities) = 'array'
    )
  );


-- =========================================================
-- 3. COMENTÁRIOS DE GOVERNANÇA
-- =========================================================

COMMENT ON TABLE
  public.agenda_pedagogical_interventions
IS
  'Histórico versionado das intervenções pedagógicas produzidas pela Capability Pedagogical Copilot do EIOS.';

COMMENT ON COLUMN
  public.agenda_pedagogical_interventions.intervention_key
IS
  'Identificador lógico estável da intervenção entre suas diferentes versões.';

COMMENT ON COLUMN
  public.agenda_pedagogical_interventions.idempotency_key
IS
  'Chave única para impedir duplicação da mesma geração ou persistência lógica.';

COMMENT ON COLUMN
  public.agenda_pedagogical_interventions.teacher_decision
IS
  'Decisão profissional do professor: aceitar, adaptar ou rejeitar a recomendação do EIOS.';

COMMENT ON COLUMN
  public.agenda_pedagogical_interventions.teacher_autonomy_confirmed
IS
  'Confirma que a decisão final é humana e não uma decisão automatizada do EIOS.';

COMMENT ON COLUMN
  public.agenda_pedagogical_interventions.explainability
IS
  'Justificativas, regras, limitações e incertezas utilizadas na recomendação pedagógica.';

COMMENT ON COLUMN
  public.agenda_pedagogical_interventions.research_eligibility
IS
  'Condições de governança para uso agregado, anonimizado ou longitudinal em pesquisa.';

COMMENT ON COLUMN
  public.agenda_pedagogical_interventions.is_current_version
IS
  'Indica a versão atualmente válida da intervenção pedagógica.';


-- =========================================================
-- 4. ÍNDICES
-- =========================================================

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_key
ON public.agenda_pedagogical_interventions (
  intervention_key,
  version_number DESC
);

CREATE UNIQUE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_current_version
ON public.agenda_pedagogical_interventions (
  intervention_key
)
WHERE is_current_version = true;

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_evidence
ON public.agenda_pedagogical_interventions (
  evidence_id,
  created_at DESC
)
WHERE evidence_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_evidence_run
ON public.agenda_pedagogical_interventions (
  evidence_intelligence_run_id,
  created_at DESC
)
WHERE evidence_intelligence_run_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_user
ON public.agenda_pedagogical_interventions (
  user_id,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_owner
ON public.agenda_pedagogical_interventions (
  owner_user_id,
  created_at DESC
)
WHERE owner_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_organization
ON public.agenda_pedagogical_interventions (
  organization_id,
  created_at DESC
)
WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_school
ON public.agenda_pedagogical_interventions (
  school_id,
  created_at DESC
)
WHERE school_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_status
ON public.agenda_pedagogical_interventions (
  status,
  updated_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_priority_risk
ON public.agenda_pedagogical_interventions (
  priority,
  risk_level,
  updated_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_teacher_decision
ON public.agenda_pedagogical_interventions (
  teacher_decision,
  updated_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_human_review
ON public.agenda_pedagogical_interventions (
  human_review_status,
  updated_at DESC
)
WHERE requires_human_review = true;

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_execution
ON public.agenda_pedagogical_interventions (
  execution_status,
  planned_start_at,
  planned_end_at
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_evaluation
ON public.agenda_pedagogical_interventions (
  evaluation_status,
  evaluated_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_next_monitoring
ON public.agenda_pedagogical_interventions (
  next_monitoring_at
)
WHERE next_monitoring_at IS NOT NULL
  AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_correlation
ON public.agenda_pedagogical_interventions (
  correlation_id
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_trace
ON public.agenda_pedagogical_interventions (
  trace_id
)
WHERE trace_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_created
ON public.agenda_pedagogical_interventions (
  created_at DESC
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_context_gin
ON public.agenda_pedagogical_interventions
USING gin (
  context
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_diagnostic_gin
ON public.agenda_pedagogical_interventions
USING gin (
  diagnostic
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_plan_gin
ON public.agenda_pedagogical_interventions
USING gin (
  plan
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_class_ids_gin
ON public.agenda_pedagogical_interventions
USING gin (
  class_ids
);

CREATE INDEX IF NOT EXISTS
  idx_agenda_pedagogical_interventions_objectives_gin
ON public.agenda_pedagogical_interventions
USING gin (
  learning_objective_ids
);


-- =========================================================
-- 5. NORMALIZAÇÃO E CONTEXTO AUTOMÁTICO
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.apply_agenda_pedagogical_intervention_context()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_evidence
    public.agenda_evidences%ROWTYPE;

  previous_current_id uuid;
BEGIN
  /*
   * Quando houver evidência vinculada, o contexto
   * multitenant deve ser herdado da evidência original.
   */
  IF NEW.evidence_id IS NOT NULL THEN
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
  END IF;

  /*
   * Intervenções sem evidência vinculada permanecem
   * permitidas, desde que possuam usuário responsável.
   */
  IF NEW.user_id IS NULL THEN
    NEW.user_id :=
      auth.uid();
  END IF;

  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION
      'A intervenção pedagógica deve possuir um usuário responsável.';
  END IF;

  IF NEW.owner_user_id IS NULL THEN
    NEW.owner_user_id :=
      NEW.user_id;
  END IF;

  IF TG_OP = 'INSERT'
     AND NEW.created_by IS NULL THEN
    NEW.created_by :=
      auth.uid();
  END IF;

  NEW.updated_by :=
    COALESCE(
      auth.uid(),
      NEW.updated_by,
      NEW.created_by
    );

  NEW.updated_at :=
    now();

  /*
   * Normalização da revisão humana.
   */
  IF NEW.requires_human_review = false THEN
    NEW.human_review_status :=
      'not_required';

    NEW.human_review_requested_at :=
      NULL;
  ELSIF NEW.human_review_status = 'not_required' THEN
    NEW.human_review_status :=
      'pending';
  END IF;

  IF NEW.requires_human_review = true
     AND NEW.human_review_requested_at IS NULL THEN
    NEW.human_review_requested_at :=
      now();
  END IF;

  /*
   * Normalização da decisão do professor.
   */
  IF NEW.teacher_decision <> 'pending'
     AND NEW.teacher_decided_at IS NULL THEN
    NEW.teacher_decided_at :=
      now();
  END IF;

  IF NEW.teacher_decision <> 'pending'
     AND NEW.teacher_decided_by IS NULL THEN
    NEW.teacher_decided_by :=
      auth.uid();
  END IF;

  /*
   * Normalização do ciclo pedagógico.
   */
  IF NEW.status = 'in_progress'
     AND NEW.actual_start_at IS NULL THEN
    NEW.actual_start_at :=
      now();
  END IF;

  IF NEW.status IN (
       'completed',
       'evaluated'
     )
     AND NEW.actual_end_at IS NULL THEN
    NEW.actual_end_at :=
      now();
  END IF;

  IF NEW.status = 'evaluated'
     AND NEW.evaluated_at IS NULL THEN
    NEW.evaluated_at :=
      now();
  END IF;

  IF NEW.evaluation_status <> 'not_started'
     AND NEW.status = 'completed' THEN
    NEW.status :=
      'under_evaluation';
  END IF;

  /*
   * Arquivamento lógico.
   */
  IF NEW.status = 'archived'
     AND NEW.archived_at IS NULL THEN
    NEW.archived_at :=
      now();
  END IF;

  /*
   * Apenas uma versão corrente por intervenção.
   *
   * A versão anterior é marcada como superseded
   * quando uma nova versão corrente é inserida.
   */
  IF NEW.is_current_version = true THEN
    SELECT id
    INTO previous_current_id
    FROM public.agenda_pedagogical_interventions
    WHERE intervention_key = NEW.intervention_key
      AND is_current_version = true
      AND id <> NEW.id
    ORDER BY version_number DESC
    LIMIT 1;

    IF previous_current_id IS NOT NULL THEN
      UPDATE public.agenda_pedagogical_interventions
      SET
        is_current_version = false,
        version_status = 'superseded',
        updated_at = now(),
        updated_by = COALESCE(
          auth.uid(),
          updated_by
        )
      WHERE id = previous_current_id;

      IF NEW.previous_version_id IS NULL THEN
        NEW.previous_version_id :=
          previous_current_id;
      END IF;
    END IF;

    NEW.version_status :=
      'current';
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_apply_agenda_pedagogical_intervention_context
ON public.agenda_pedagogical_interventions;

CREATE TRIGGER
  trg_apply_agenda_pedagogical_intervention_context
BEFORE INSERT OR UPDATE
ON public.agenda_pedagogical_interventions
FOR EACH ROW
EXECUTE FUNCTION
  public.apply_agenda_pedagogical_intervention_context();


-- =========================================================
-- 6. PROTEÇÃO DOS CAMPOS DE IDENTIDADE E HISTÓRICO
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.protect_agenda_pedagogical_intervention_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.intervention_key <> OLD.intervention_key THEN
    RAISE EXCEPTION
      'O intervention_key não pode ser alterado após a criação.';
  END IF;

  IF NEW.version_id <> OLD.version_id THEN
    RAISE EXCEPTION
      'O version_id não pode ser alterado após a criação.';
  END IF;

  IF NEW.version_number <> OLD.version_number THEN
    RAISE EXCEPTION
      'O version_number não pode ser alterado após a criação.';
  END IF;

  IF NEW.idempotency_key <> OLD.idempotency_key THEN
    RAISE EXCEPTION
      'O idempotency_key não pode ser alterado após a criação.';
  END IF;

  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION
      'O usuário responsável pela intervenção não pode ser alterado.';
  END IF;

  IF NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION
      'A data de criação não pode ser alterada.';
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_protect_agenda_pedagogical_intervention_identity
ON public.agenda_pedagogical_interventions;

CREATE TRIGGER
  trg_protect_agenda_pedagogical_intervention_identity
BEFORE UPDATE
ON public.agenda_pedagogical_interventions
FOR EACH ROW
EXECUTE FUNCTION
  public.protect_agenda_pedagogical_intervention_identity();


-- =========================================================
-- 7. BLOQUEIO DE EXCLUSÃO FÍSICA
-- =========================================================

CREATE OR REPLACE FUNCTION
  public.block_agenda_pedagogical_intervention_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION
    'Intervenções pedagógicas integram o histórico longitudinal e não podem ser excluídas fisicamente. Utilize arquivamento lógico.';

  RETURN OLD;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_block_agenda_pedagogical_intervention_delete
ON public.agenda_pedagogical_interventions;

CREATE TRIGGER
  trg_block_agenda_pedagogical_intervention_delete
BEFORE DELETE
ON public.agenda_pedagogical_interventions
FOR EACH ROW
EXECUTE FUNCTION
  public.block_agenda_pedagogical_intervention_delete();


-- =========================================================
-- 8. ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE
  public.agenda_pedagogical_interventions
ENABLE ROW LEVEL SECURITY;

ALTER TABLE
  public.agenda_pedagogical_interventions
FORCE ROW LEVEL SECURITY;


-- =========================================================
-- 8.1 SELECT
-- =========================================================

DROP POLICY IF EXISTS
  agenda_pedagogical_interventions_select_policy
ON public.agenda_pedagogical_interventions;

CREATE POLICY
  agenda_pedagogical_interventions_select_policy
ON public.agenda_pedagogical_interventions
FOR SELECT
TO authenticated
USING (
  public.can_view_agenda_record(
    user_id,
    organization_id,
    school_id
  )
);


-- =========================================================
-- 8.2 INSERT
-- =========================================================

DROP POLICY IF EXISTS
  agenda_pedagogical_interventions_insert_policy
ON public.agenda_pedagogical_interventions;

CREATE POLICY
  agenda_pedagogical_interventions_insert_policy
ON public.agenda_pedagogical_interventions
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_update_agenda_record(
    user_id,
    organization_id,
    school_id
  )
  AND (
    created_by IS NULL
    OR created_by = auth.uid()
  )
);


-- =========================================================
-- 8.3 UPDATE
-- =========================================================

DROP POLICY IF EXISTS
  agenda_pedagogical_interventions_update_policy
ON public.agenda_pedagogical_interventions;

CREATE POLICY
  agenda_pedagogical_interventions_update_policy
ON public.agenda_pedagogical_interventions
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


-- =========================================================
-- 8.4 DELETE
-- =========================================================
--
-- Nenhuma policy de DELETE é criada.
-- A exclusão física também é bloqueada por trigger.
-- =========================================================


-- =========================================================
-- 9. PRIVILÉGIOS
-- =========================================================

REVOKE ALL
ON public.agenda_pedagogical_interventions
FROM anon;

GRANT SELECT,
      INSERT,
      UPDATE
ON public.agenda_pedagogical_interventions
TO authenticated;

GRANT ALL
ON public.agenda_pedagogical_interventions
TO service_role;


-- =========================================================
-- 10. VIEW DE VERSÕES CORRENTES
-- =========================================================

CREATE OR REPLACE VIEW
  public.agenda_current_pedagogical_interventions
WITH (
  security_invoker = true
)
AS
SELECT
  *
FROM public.agenda_pedagogical_interventions
WHERE is_current_version = true
  AND archived_at IS NULL;


COMMENT ON VIEW
  public.agenda_current_pedagogical_interventions
IS
  'Versões correntes e não arquivadas das intervenções pedagógicas do Pedagogical Copilot.';


GRANT SELECT
ON public.agenda_current_pedagogical_interventions
TO authenticated;

GRANT SELECT
ON public.agenda_current_pedagogical_interventions
TO service_role;


-- =========================================================
-- 11. VIEW RESUMIDA PARA LISTAGENS E PAINÉIS
-- =========================================================

CREATE OR REPLACE VIEW
  public.agenda_pedagogical_intervention_summaries
WITH (
  security_invoker = true
)
AS
SELECT
  id,

  intervention_key,

  version_id,

  version_number,

  version_label,

  evidence_id,

  evidence_intelligence_run_id,

  title,

  summary,

  status,

  priority,

  risk_level,

  scope,

  teacher_decision,

  requires_human_review,

  human_review_status,

  execution_status,

  evaluation_status,

  progress_percentage,

  planned_start_at,

  planned_end_at,

  next_monitoring_at,

  user_id,

  organization_id,

  school_id,

  owner_user_id,

  correlation_id,

  created_at,

  updated_at,

  archived_at,

  jsonb_array_length(
    COALESCE(
      plan -> 'objectives',
      '[]'::jsonb
    )
  ) AS objective_count,

  jsonb_array_length(
    COALESCE(
      plan -> 'actions',
      '[]'::jsonb
    )
  ) AS action_count

FROM public.agenda_pedagogical_interventions
WHERE is_current_version = true;


COMMENT ON VIEW
  public.agenda_pedagogical_intervention_summaries
IS
  'Resumo das intervenções pedagógicas para listagens, dashboards e acompanhamento operacional.';


GRANT SELECT
ON public.agenda_pedagogical_intervention_summaries
TO authenticated;

GRANT SELECT
ON public.agenda_pedagogical_intervention_summaries
TO service_role;


-- =========================================================
-- 12. VALIDAÇÃO FINAL DA MIGRATION
-- =========================================================

DO $$
BEGIN
  IF to_regclass(
    'public.agenda_pedagogical_interventions'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A tabela public.agenda_pedagogical_interventions não foi criada.';
  END IF;

  IF to_regclass(
    'public.agenda_current_pedagogical_interventions'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A view public.agenda_current_pedagogical_interventions não foi criada.';
  END IF;

  IF to_regclass(
    'public.agenda_pedagogical_intervention_summaries'
  ) IS NULL THEN
    RAISE EXCEPTION
      'A view public.agenda_pedagogical_intervention_summaries não foi criada.';
  END IF;
END;
$$;


COMMIT;