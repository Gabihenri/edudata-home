BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================================================
-- EDUDATA IA PLATFORM
-- EIOS / CORE COMPARTILHADO
-- AGENDA INTELIGENTE EDI
-- MIGRATION 30 — FUNDAÇÃO DO CICLO OPERACIONAL
-- =========================================================
--
-- Arquitetura preservada:
--
-- Framework EDI
-- ↓
-- EIOS
-- ↓
-- Core Compartilhado
-- ↓
-- Agenda Inteligente EDI
--
-- Ciclo operacional:
--
-- Objetivo
-- ↓
-- Planejamento
-- ↓
-- Aula programada
-- ↓
-- Aula realizada
-- ↓
-- Evidência
-- ↓
-- Reflexão
-- ↓
-- Indicador
-- ↓
-- Próxima ação
--
-- Esta migration:
--
-- 1. Não recria tabelas existentes.
-- 2. Não remove dados existentes.
-- 3. Evolui Planejamentos, Tarefas, Eventos e Evidências.
-- 4. Cria persistência real para Objetivos e Aulas.
-- 5. Cria a base persistente de Reflexão Pós-Aula.
-- 6. Reutiliza autorização, auditoria e exclusão lógica.
-- 7. Não implementa inteligência artificial local.
-- 8. Mantém os pilares oficiais:
--    Evidências, Desenvolvimento e Inteligência.
-- =========================================================


-- =========================================================
-- 1. VALIDAÇÃO DE PRÉ-REQUISITOS
-- =========================================================

DO $$
DECLARE
  required_table text;
  required_function text;
BEGIN
  FOREACH required_table IN ARRAY ARRAY[
    'agenda_events',
    'agenda_tasks',
    'agenda_planning',
    'agenda_evidences',
    'agenda_classes',
    'school_years',
    'academic_periods',
    'indicators',
    'organization_members',
    'identity_audit_logs'
  ]
  LOOP
    IF to_regclass(
      format(
        'public.%I',
        required_table
      )
    ) IS NULL THEN
      RAISE EXCEPTION
        'A tabela public.% não existe. A migration foi interrompida para evitar arquitetura paralela.',
        required_table;
    END IF;
  END LOOP;

  FOREACH required_function IN ARRAY ARRAY[
    'public.agenda_resource_table_name(text)',
    'public.agenda_resource_owner_column(text)',
    'public.can_view_agenda_record(uuid,uuid,uuid)',
    'public.can_update_agenda_record(uuid,uuid,uuid)',
    'public.apply_agenda_record_governance()',
    'public.audit_agenda_record_change()',
    'public.block_agenda_hard_delete()',
    'public.soft_delete_agenda_record(text,uuid,text,uuid)',
    'public.restore_agenda_record(text,uuid,text,uuid)'
  ]
  LOOP
    IF to_regprocedure(
      required_function
    ) IS NULL THEN
      RAISE EXCEPTION
        'A função % não existe. Execute primeiro as migrations oficiais de identidade e governança da Agenda.',
        required_function;
    END IF;
  END LOOP;
END;
$$;


-- =========================================================
-- 2. EVOLUÇÃO DE PLANEJAMENTOS
-- =========================================================

ALTER TABLE public.agenda_planning
  ADD COLUMN IF NOT EXISTS class_id uuid,
  ADD COLUMN IF NOT EXISTS school_year_id uuid,
  ADD COLUMN IF NOT EXISTS academic_period_id uuid,

  ADD COLUMN IF NOT EXISTS planned_start_time time without time zone,
  ADD COLUMN IF NOT EXISTS planned_end_time time without time zone,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,

  ADD COLUMN IF NOT EXISTS source_planning_id uuid,

  ADD COLUMN IF NOT EXISTS is_template boolean
    NOT NULL
    DEFAULT false,

  ADD COLUMN IF NOT EXISTS template_name text,

  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_changed_by uuid,
  ADD COLUMN IF NOT EXISTS status_change_reason text,

  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,

  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,

  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid,
  ADD COLUMN IF NOT EXISTS archive_reason text,

  ADD COLUMN IF NOT EXISTS metadata jsonb
    NOT NULL
    DEFAULT '{}'::jsonb;


ALTER TABLE public.agenda_planning
  DROP CONSTRAINT IF EXISTS agenda_planning_status_check;

ALTER TABLE public.agenda_planning
  ADD CONSTRAINT agenda_planning_status_check
  CHECK (
    status IN (
      'rascunho',
      'em_revisao',
      'em revisão',
      'aprovado',
      'programado',
      'executado',
      'arquivado',

      -- Compatibilidade com registros legados.
      'planejado',
      'concluido',
      'concluído'
    )
  )
  NOT VALID;


ALTER TABLE public.agenda_planning
  DROP CONSTRAINT IF EXISTS agenda_planning_time_range_check;

ALTER TABLE public.agenda_planning
  ADD CONSTRAINT agenda_planning_time_range_check
  CHECK (
    planned_start_time IS NULL
    OR planned_end_time IS NULL
    OR planned_end_time > planned_start_time
  )
  NOT VALID;


ALTER TABLE public.agenda_planning
  DROP CONSTRAINT IF EXISTS agenda_planning_duration_check;

ALTER TABLE public.agenda_planning
  ADD CONSTRAINT agenda_planning_duration_check
  CHECK (
    duration_minutes IS NULL
    OR duration_minutes > 0
  )
  NOT VALID;


ALTER TABLE public.agenda_planning
  DROP CONSTRAINT IF EXISTS agenda_planning_template_name_check;

ALTER TABLE public.agenda_planning
  ADD CONSTRAINT agenda_planning_template_name_check
  CHECK (
    is_template = false
    OR nullif(
      btrim(template_name),
      ''
    ) IS NOT NULL
  )
  NOT VALID;


-- =========================================================
-- 3. EVOLUÇÃO DE TAREFAS
-- =========================================================

ALTER TABLE public.agenda_tasks
  ADD COLUMN IF NOT EXISTS planning_id uuid,
  ADD COLUMN IF NOT EXISTS lesson_id uuid,
  ADD COLUMN IF NOT EXISTS objective_id uuid,
  ADD COLUMN IF NOT EXISTS class_id uuid,
  ADD COLUMN IF NOT EXISTS evidence_id uuid,

  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_by uuid,

  ADD COLUMN IF NOT EXISTS reopened_at timestamptz,
  ADD COLUMN IF NOT EXISTS reopened_by uuid,
  ADD COLUMN IF NOT EXISTS reopening_reason text,

  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,

  ADD COLUMN IF NOT EXISTS original_due_date timestamptz,
  ADD COLUMN IF NOT EXISTS rescheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS rescheduled_by uuid,
  ADD COLUMN IF NOT EXISTS rescheduling_reason text,

  ADD COLUMN IF NOT EXISTS metadata jsonb
    NOT NULL
    DEFAULT '{}'::jsonb;


ALTER TABLE public.agenda_tasks
  DROP CONSTRAINT IF EXISTS agenda_tasks_status_check;

ALTER TABLE public.agenda_tasks
  ADD CONSTRAINT agenda_tasks_status_check
  CHECK (
    status IN (
      'pendente',
      'em_andamento',
      'andamento',
      'concluida',
      'concluído',
      'concluido',
      'finalizada',
      'finalizado',
      'cancelada',
      'cancelado'
    )
  )
  NOT VALID;


ALTER TABLE public.agenda_tasks
  DROP CONSTRAINT IF EXISTS agenda_tasks_priority_check;

ALTER TABLE public.agenda_tasks
  ADD CONSTRAINT agenda_tasks_priority_check
  CHECK (
    priority IN (
      'baixa',
      'media',
      'média',
      'alta',
      'urgente',
      'normal',
      'high',
      'critical'
    )
  )
  NOT VALID;


-- =========================================================
-- 4. EVOLUÇÃO DE EVENTOS
-- =========================================================

ALTER TABLE public.agenda_events
  ADD COLUMN IF NOT EXISTS class_id uuid,
  ADD COLUMN IF NOT EXISTS lesson_id uuid,
  ADD COLUMN IF NOT EXISTS objective_id uuid,

  ADD COLUMN IF NOT EXISTS status_change_reason text,

  ADD COLUMN IF NOT EXISTS metadata jsonb
    NOT NULL
    DEFAULT '{}'::jsonb;


-- =========================================================
-- 5. EVOLUÇÃO DE EVIDÊNCIAS
-- =========================================================

ALTER TABLE public.agenda_evidences
  ADD COLUMN IF NOT EXISTS class_id uuid,
  ADD COLUMN IF NOT EXISTS objective_id uuid,
  ADD COLUMN IF NOT EXISTS lesson_id uuid,
  ADD COLUMN IF NOT EXISTS reflection_id uuid,
  ADD COLUMN IF NOT EXISTS academic_period_id uuid,

  ADD COLUMN IF NOT EXISTS metadata jsonb
    NOT NULL
    DEFAULT '{}'::jsonb;


-- =========================================================
-- 6. OBJETIVOS PERSISTENTES
-- =========================================================

CREATE TABLE IF NOT EXISTS public.agenda_objectives (
  id uuid PRIMARY KEY
    DEFAULT gen_random_uuid(),

  title text NOT NULL,
  description text,

  category text NOT NULL
    DEFAULT 'pedagogico',

  period text,

  class_id uuid,
  subject text,

  responsible_user_id uuid,

  expected_indicator text,
  expected_evidence text,

  start_date date,
  end_date date,

  school_year_id uuid,
  academic_period_id uuid,

  status text NOT NULL
    DEFAULT 'rascunho',

  progress numeric(5, 2)
    NOT NULL
    DEFAULT 0,

  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,

  created_by uuid,
  updated_by uuid,

  deleted_at timestamptz,
  deleted_by uuid,
  deletion_reason text,

  restored_at timestamptz,
  restored_by uuid,
  restore_reason text,

  metadata jsonb
    NOT NULL
    DEFAULT '{}'::jsonb,

  created_at timestamptz
    NOT NULL
    DEFAULT now(),

  updated_at timestamptz
    NOT NULL
    DEFAULT now(),

  CONSTRAINT agenda_objectives_status_check
  CHECK (
    status IN (
      'rascunho',
      'ativo',
      'em_acompanhamento',
      'concluido',
      'suspenso',
      'cancelado',
      'arquivado'
    )
  ),

  CONSTRAINT agenda_objectives_progress_check
  CHECK (
    progress >= 0
    AND progress <= 100
  ),

  CONSTRAINT agenda_objectives_date_range_check
  CHECK (
    start_date IS NULL
    OR end_date IS NULL
    OR end_date >= start_date
  ),

  CONSTRAINT agenda_objectives_soft_delete_check
  CHECK (
    deleted_at IS NULL
    OR (
      deleted_by IS NOT NULL
      AND nullif(
        btrim(deletion_reason),
        ''
      ) IS NOT NULL
    )
  ),

  CONSTRAINT agenda_objectives_restore_check
  CHECK (
    restored_at IS NULL
    OR (
      restored_by IS NOT NULL
      AND nullif(
        btrim(restore_reason),
        ''
      ) IS NOT NULL
    )
  ),

  CONSTRAINT agenda_objectives_class_fk
  FOREIGN KEY (
    class_id
  )
  REFERENCES public.agenda_classes(id)
  ON DELETE SET NULL,

  CONSTRAINT agenda_objectives_school_year_fk
  FOREIGN KEY (
    school_year_id
  )
  REFERENCES public.school_years(id)
  ON DELETE SET NULL,

  CONSTRAINT agenda_objectives_academic_period_fk
  FOREIGN KEY (
    academic_period_id
  )
  REFERENCES public.academic_periods(id)
  ON DELETE SET NULL
);


-- =========================================================
-- 7. AULAS PERSISTENTES
-- =========================================================

CREATE TABLE IF NOT EXISTS public.agenda_lessons (
  id uuid PRIMARY KEY
    DEFAULT gen_random_uuid(),

  title text NOT NULL,

  class_id uuid,
  subject text,

  scheduled_date date,
  start_time time without time zone,
  end_time time without time zone,

  planning_id uuid,
  academic_period_id uuid,

  description text,

  skills text[]
    NOT NULL
    DEFAULT ARRAY[]::text[],

  resources text,
  methodology text,

  status text NOT NULL
    DEFAULT 'planejada',

  observations text,
  next_action text,

  actual_start_at timestamptz,
  actual_end_at timestamptz,

  completed_at timestamptz,
  completed_by uuid,

  rescheduled_from_date date,
  rescheduled_at timestamptz,
  rescheduled_by uuid,
  rescheduling_reason text,

  cancelled_at timestamptz,
  cancelled_by uuid,
  cancellation_reason text,

  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,

  created_by uuid,
  updated_by uuid,

  deleted_at timestamptz,
  deleted_by uuid,
  deletion_reason text,

  restored_at timestamptz,
  restored_by uuid,
  restore_reason text,

  metadata jsonb
    NOT NULL
    DEFAULT '{}'::jsonb,

  created_at timestamptz
    NOT NULL
    DEFAULT now(),

  updated_at timestamptz
    NOT NULL
    DEFAULT now(),

  CONSTRAINT agenda_lessons_status_check
  CHECK (
    status IN (
      'planejada',
      'em_preparacao',
      'realizada',
      'parcialmente_realizada',
      'reagendada',
      'cancelada'
    )
  ),

  CONSTRAINT agenda_lessons_time_range_check
  CHECK (
    start_time IS NULL
    OR end_time IS NULL
    OR end_time > start_time
  ),

  CONSTRAINT agenda_lessons_actual_time_range_check
  CHECK (
    actual_start_at IS NULL
    OR actual_end_at IS NULL
    OR actual_end_at >= actual_start_at
  ),

  CONSTRAINT agenda_lessons_soft_delete_check
  CHECK (
    deleted_at IS NULL
    OR (
      deleted_by IS NOT NULL
      AND nullif(
        btrim(deletion_reason),
        ''
      ) IS NOT NULL
    )
  ),

  CONSTRAINT agenda_lessons_restore_check
  CHECK (
    restored_at IS NULL
    OR (
      restored_by IS NOT NULL
      AND nullif(
        btrim(restore_reason),
        ''
      ) IS NOT NULL
    )
  ),

  CONSTRAINT agenda_lessons_class_fk
  FOREIGN KEY (
    class_id
  )
  REFERENCES public.agenda_classes(id)
  ON DELETE SET NULL,

  CONSTRAINT agenda_lessons_planning_fk
  FOREIGN KEY (
    planning_id
  )
  REFERENCES public.agenda_planning(id)
  ON DELETE SET NULL,

  CONSTRAINT agenda_lessons_academic_period_fk
  FOREIGN KEY (
    academic_period_id
  )
  REFERENCES public.academic_periods(id)
  ON DELETE SET NULL
);


-- =========================================================
-- 8. REFLEXÃO PÓS-AULA
-- =========================================================

CREATE TABLE IF NOT EXISTS public.agenda_lesson_reflections (
  id uuid PRIMARY KEY
    DEFAULT gen_random_uuid(),

  lesson_id uuid NOT NULL,

  performed_summary text,
  worked_well text,
  observed_difficulties text,
  adaptations_made text,
  class_needs text,

  needs_retake boolean
    NOT NULL
    DEFAULT false,

  next_action text,

  status text NOT NULL
    DEFAULT 'rascunho',

  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,

  created_by uuid,
  updated_by uuid,

  deleted_at timestamptz,
  deleted_by uuid,
  deletion_reason text,

  restored_at timestamptz,
  restored_by uuid,
  restore_reason text,

  metadata jsonb
    NOT NULL
    DEFAULT '{}'::jsonb,

  created_at timestamptz
    NOT NULL
    DEFAULT now(),

  updated_at timestamptz
    NOT NULL
    DEFAULT now(),

  CONSTRAINT agenda_lesson_reflections_status_check
  CHECK (
    status IN (
      'rascunho',
      'concluida',
      'arquivada'
    )
  ),

  CONSTRAINT agenda_lesson_reflections_soft_delete_check
  CHECK (
    deleted_at IS NULL
    OR (
      deleted_by IS NOT NULL
      AND nullif(
        btrim(deletion_reason),
        ''
      ) IS NOT NULL
    )
  ),

  CONSTRAINT agenda_lesson_reflections_restore_check
  CHECK (
    restored_at IS NULL
    OR (
      restored_by IS NOT NULL
      AND nullif(
        btrim(restore_reason),
        ''
      ) IS NOT NULL
    )
  ),

  CONSTRAINT agenda_lesson_reflections_lesson_fk
  FOREIGN KEY (
    lesson_id
  )
  REFERENCES public.agenda_lessons(id)
  ON DELETE RESTRICT
);


-- =========================================================
-- 9. RELAÇÃO ENTRE PLANEJAMENTOS E OBJETIVOS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.agenda_planning_objectives (
  id uuid PRIMARY KEY
    DEFAULT gen_random_uuid(),

  planning_id uuid NOT NULL,
  objective_id uuid NOT NULL,

  relationship_role text
    NOT NULL
    DEFAULT 'supporting',

  sequence integer
    NOT NULL
    DEFAULT 1,

  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,

  created_by uuid,
  updated_by uuid,

  deleted_at timestamptz,
  deleted_by uuid,
  deletion_reason text,

  restored_at timestamptz,
  restored_by uuid,
  restore_reason text,

  metadata jsonb
    NOT NULL
    DEFAULT '{}'::jsonb,

  created_at timestamptz
    NOT NULL
    DEFAULT now(),

  updated_at timestamptz
    NOT NULL
    DEFAULT now(),

  CONSTRAINT agenda_planning_objectives_role_check
  CHECK (
    relationship_role IN (
      'primary',
      'supporting'
    )
  ),

  CONSTRAINT agenda_planning_objectives_sequence_check
  CHECK (
    sequence >= 1
  ),

  CONSTRAINT agenda_planning_objectives_soft_delete_check
  CHECK (
    deleted_at IS NULL
    OR (
      deleted_by IS NOT NULL
      AND nullif(
        btrim(deletion_reason),
        ''
      ) IS NOT NULL
    )
  ),

  CONSTRAINT agenda_planning_objectives_restore_check
  CHECK (
    restored_at IS NULL
    OR (
      restored_by IS NOT NULL
      AND nullif(
        btrim(restore_reason),
        ''
      ) IS NOT NULL
    )
  ),

  CONSTRAINT agenda_planning_objectives_planning_fk
  FOREIGN KEY (
    planning_id
  )
  REFERENCES public.agenda_planning(id)
  ON DELETE RESTRICT,

  CONSTRAINT agenda_planning_objectives_objective_fk
  FOREIGN KEY (
    objective_id
  )
  REFERENCES public.agenda_objectives(id)
  ON DELETE RESTRICT
);


-- =========================================================
-- 10. RELAÇÃO ENTRE AULAS E OBJETIVOS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.agenda_lesson_objectives (
  id uuid PRIMARY KEY
    DEFAULT gen_random_uuid(),

  lesson_id uuid NOT NULL,
  objective_id uuid NOT NULL,

  relationship_role text
    NOT NULL
    DEFAULT 'supporting',

  sequence integer
    NOT NULL
    DEFAULT 1,

  user_id uuid NOT NULL,
  organization_id uuid,
  school_id uuid,

  created_by uuid,
  updated_by uuid,

  deleted_at timestamptz,
  deleted_by uuid,
  deletion_reason text,

  restored_at timestamptz,
  restored_by uuid,
  restore_reason text,

  metadata jsonb
    NOT NULL
    DEFAULT '{}'::jsonb,

  created_at timestamptz
    NOT NULL
    DEFAULT now(),

  updated_at timestamptz
    NOT NULL
    DEFAULT now(),

  CONSTRAINT agenda_lesson_objectives_role_check
  CHECK (
    relationship_role IN (
      'primary',
      'supporting'
    )
  ),

  CONSTRAINT agenda_lesson_objectives_sequence_check
  CHECK (
    sequence >= 1
  ),

  CONSTRAINT agenda_lesson_objectives_soft_delete_check
  CHECK (
    deleted_at IS NULL
    OR (
      deleted_by IS NOT NULL
      AND nullif(
        btrim(deletion_reason),
        ''
      ) IS NOT NULL
    )
  ),

  CONSTRAINT agenda_lesson_objectives_restore_check
  CHECK (
    restored_at IS NULL
    OR (
      restored_by IS NOT NULL
      AND nullif(
        btrim(restore_reason),
        ''
      ) IS NOT NULL
    )
  ),

  CONSTRAINT agenda_lesson_objectives_lesson_fk
  FOREIGN KEY (
    lesson_id
  )
  REFERENCES public.agenda_lessons(id)
  ON DELETE RESTRICT,

  CONSTRAINT agenda_lesson_objectives_objective_fk
  FOREIGN KEY (
    objective_id
  )
  REFERENCES public.agenda_objectives(id)
  ON DELETE RESTRICT
);


-- =========================================================
-- 11. CHAVES ESTRANGEIRAS NAS TABELAS EXISTENTES
-- =========================================================
--
-- As constraints são adicionadas como NOT VALID para:
--
-- 1. preservar dados legados;
-- 2. validar imediatamente novos registros;
-- 3. permitir auditoria dos vínculos antigos antes da
--    validação integral.
-- =========================================================

DO $$
DECLARE
  relation record;
BEGIN
  FOR relation IN
    SELECT *
    FROM (
      VALUES
        (
          'agenda_planning',
          'agenda_planning_class_fk',
          'class_id',
          'agenda_classes'
        ),
        (
          'agenda_planning',
          'agenda_planning_school_year_fk',
          'school_year_id',
          'school_years'
        ),
        (
          'agenda_planning',
          'agenda_planning_academic_period_fk',
          'academic_period_id',
          'academic_periods'
        ),
        (
          'agenda_planning',
          'agenda_planning_source_fk',
          'source_planning_id',
          'agenda_planning'
        ),

        (
          'agenda_tasks',
          'agenda_tasks_planning_fk',
          'planning_id',
          'agenda_planning'
        ),
        (
          'agenda_tasks',
          'agenda_tasks_lesson_fk',
          'lesson_id',
          'agenda_lessons'
        ),
        (
          'agenda_tasks',
          'agenda_tasks_objective_fk',
          'objective_id',
          'agenda_objectives'
        ),
        (
          'agenda_tasks',
          'agenda_tasks_class_fk',
          'class_id',
          'agenda_classes'
        ),
        (
          'agenda_tasks',
          'agenda_tasks_evidence_fk',
          'evidence_id',
          'agenda_evidences'
        ),

        (
          'agenda_events',
          'agenda_events_planning_fk',
          'planning_id',
          'agenda_planning'
        ),
        (
          'agenda_events',
          'agenda_events_evidence_fk',
          'evidence_id',
          'agenda_evidences'
        ),
        (
          'agenda_events',
          'agenda_events_lesson_fk',
          'lesson_id',
          'agenda_lessons'
        ),
        (
          'agenda_events',
          'agenda_events_objective_fk',
          'objective_id',
          'agenda_objectives'
        ),
        (
          'agenda_events',
          'agenda_events_class_fk',
          'class_id',
          'agenda_classes'
        ),

        (
          'agenda_evidences',
          'agenda_evidences_lesson_fk',
          'lesson_id',
          'agenda_lessons'
        ),
        (
          'agenda_evidences',
          'agenda_evidences_objective_fk',
          'objective_id',
          'agenda_objectives'
        ),
        (
          'agenda_evidences',
          'agenda_evidences_class_fk',
          'class_id',
          'agenda_classes'
        ),
        (
          'agenda_evidences',
          'agenda_evidences_reflection_fk',
          'reflection_id',
          'agenda_lesson_reflections'
        ),
        (
          'agenda_evidences',
          'agenda_evidences_academic_period_fk',
          'academic_period_id',
          'academic_periods'
        )
    ) AS relations(
      table_name,
      constraint_name,
      column_name,
      referenced_table
    )
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname =
        relation.constraint_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I
           ADD CONSTRAINT %I
           FOREIGN KEY (%I)
           REFERENCES public.%I(id)
           ON DELETE SET NULL
           NOT VALID',
        relation.table_name,
        relation.constraint_name,
        relation.column_name,
        relation.referenced_table
      );
    END IF;
  END LOOP;
END;
$$;


-- =========================================================
-- 12. ÍNDICES DO CICLO OPERACIONAL
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_agenda_planning_class
  ON public.agenda_planning(class_id);

CREATE INDEX IF NOT EXISTS idx_agenda_planning_school_year
  ON public.agenda_planning(school_year_id);

CREATE INDEX IF NOT EXISTS idx_agenda_planning_academic_period
  ON public.agenda_planning(academic_period_id);

CREATE INDEX IF NOT EXISTS idx_agenda_planning_source
  ON public.agenda_planning(source_planning_id);

CREATE INDEX IF NOT EXISTS idx_agenda_planning_template
  ON public.agenda_planning(is_template)
  WHERE is_template = true;


CREATE INDEX IF NOT EXISTS idx_agenda_tasks_planning
  ON public.agenda_tasks(planning_id);

CREATE INDEX IF NOT EXISTS idx_agenda_tasks_lesson
  ON public.agenda_tasks(lesson_id);

CREATE INDEX IF NOT EXISTS idx_agenda_tasks_objective
  ON public.agenda_tasks(objective_id);

CREATE INDEX IF NOT EXISTS idx_agenda_tasks_class
  ON public.agenda_tasks(class_id);

CREATE INDEX IF NOT EXISTS idx_agenda_tasks_evidence
  ON public.agenda_tasks(evidence_id);


CREATE INDEX IF NOT EXISTS idx_agenda_events_lesson
  ON public.agenda_events(lesson_id);

CREATE INDEX IF NOT EXISTS idx_agenda_events_objective
  ON public.agenda_events(objective_id);

CREATE INDEX IF NOT EXISTS idx_agenda_events_class
  ON public.agenda_events(class_id);


CREATE INDEX IF NOT EXISTS idx_agenda_evidences_lesson
  ON public.agenda_evidences(lesson_id);

CREATE INDEX IF NOT EXISTS idx_agenda_evidences_objective
  ON public.agenda_evidences(objective_id);

CREATE INDEX IF NOT EXISTS idx_agenda_evidences_class
  ON public.agenda_evidences(class_id);

CREATE INDEX IF NOT EXISTS idx_agenda_evidences_reflection
  ON public.agenda_evidences(reflection_id);

CREATE INDEX IF NOT EXISTS idx_agenda_evidences_academic_period
  ON public.agenda_evidences(academic_period_id);


CREATE INDEX IF NOT EXISTS idx_agenda_objectives_user
  ON public.agenda_objectives(user_id);

CREATE INDEX IF NOT EXISTS idx_agenda_objectives_organization
  ON public.agenda_objectives(organization_id);

CREATE INDEX IF NOT EXISTS idx_agenda_objectives_school
  ON public.agenda_objectives(school_id);

CREATE INDEX IF NOT EXISTS idx_agenda_objectives_class
  ON public.agenda_objectives(class_id);

CREATE INDEX IF NOT EXISTS idx_agenda_objectives_status
  ON public.agenda_objectives(status);

CREATE INDEX IF NOT EXISTS idx_agenda_objectives_dates
  ON public.agenda_objectives(
    start_date,
    end_date
  );

CREATE INDEX IF NOT EXISTS idx_agenda_objectives_active_scope
  ON public.agenda_objectives(
    organization_id,
    school_id,
    user_id
  )
  WHERE deleted_at IS NULL;


CREATE INDEX IF NOT EXISTS idx_agenda_lessons_user
  ON public.agenda_lessons(user_id);

CREATE INDEX IF NOT EXISTS idx_agenda_lessons_organization
  ON public.agenda_lessons(organization_id);

CREATE INDEX IF NOT EXISTS idx_agenda_lessons_school
  ON public.agenda_lessons(school_id);

CREATE INDEX IF NOT EXISTS idx_agenda_lessons_class
  ON public.agenda_lessons(class_id);

CREATE INDEX IF NOT EXISTS idx_agenda_lessons_planning
  ON public.agenda_lessons(planning_id);

CREATE INDEX IF NOT EXISTS idx_agenda_lessons_status
  ON public.agenda_lessons(status);

CREATE INDEX IF NOT EXISTS idx_agenda_lessons_date
  ON public.agenda_lessons(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_agenda_lessons_active_scope
  ON public.agenda_lessons(
    organization_id,
    school_id,
    user_id
  )
  WHERE deleted_at IS NULL;


CREATE UNIQUE INDEX IF NOT EXISTS uq_agenda_lesson_reflections_active_lesson
  ON public.agenda_lesson_reflections(lesson_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_lesson_reflections_user
  ON public.agenda_lesson_reflections(user_id);

CREATE INDEX IF NOT EXISTS idx_agenda_lesson_reflections_scope
  ON public.agenda_lesson_reflections(
    organization_id,
    school_id,
    user_id
  );


CREATE UNIQUE INDEX IF NOT EXISTS uq_agenda_planning_objectives_active
  ON public.agenda_planning_objectives(
    planning_id,
    objective_id
  )
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_planning_objectives_objective
  ON public.agenda_planning_objectives(objective_id);

CREATE INDEX IF NOT EXISTS idx_agenda_planning_objectives_scope
  ON public.agenda_planning_objectives(
    organization_id,
    school_id,
    user_id
  );


CREATE UNIQUE INDEX IF NOT EXISTS uq_agenda_lesson_objectives_active
  ON public.agenda_lesson_objectives(
    lesson_id,
    objective_id
  )
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_lesson_objectives_objective
  ON public.agenda_lesson_objectives(objective_id);

CREATE INDEX IF NOT EXISTS idx_agenda_lesson_objectives_scope
  ON public.agenda_lesson_objectives(
    organization_id,
    school_id,
    user_id
  );


-- =========================================================
-- 13. REGISTRO DOS NOVOS RECURSOS NA GOVERNANÇA
-- =========================================================

CREATE OR REPLACE FUNCTION public.agenda_resource_table_name(
  requested_resource_type text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_resource_type text;
BEGIN
  normalized_resource_type :=
    lower(
      btrim(
        requested_resource_type
      )
    );

  RETURN CASE normalized_resource_type
    WHEN 'event' THEN 'agenda_events'
    WHEN 'events' THEN 'agenda_events'
    WHEN 'agenda_event' THEN 'agenda_events'
    WHEN 'agenda_events' THEN 'agenda_events'

    WHEN 'task' THEN 'agenda_tasks'
    WHEN 'tasks' THEN 'agenda_tasks'
    WHEN 'agenda_task' THEN 'agenda_tasks'
    WHEN 'agenda_tasks' THEN 'agenda_tasks'

    WHEN 'planning' THEN 'agenda_planning'
    WHEN 'plannings' THEN 'agenda_planning'
    WHEN 'agenda_planning' THEN 'agenda_planning'

    WHEN 'evidence' THEN 'agenda_evidences'
    WHEN 'evidences' THEN 'agenda_evidences'
    WHEN 'agenda_evidence' THEN 'agenda_evidences'
    WHEN 'agenda_evidences' THEN 'agenda_evidences'

    WHEN 'class' THEN 'agenda_classes'
    WHEN 'classes' THEN 'agenda_classes'
    WHEN 'agenda_class' THEN 'agenda_classes'
    WHEN 'agenda_classes' THEN 'agenda_classes'

    WHEN 'objective' THEN 'agenda_objectives'
    WHEN 'objectives' THEN 'agenda_objectives'
    WHEN 'agenda_objective' THEN 'agenda_objectives'
    WHEN 'agenda_objectives' THEN 'agenda_objectives'

    WHEN 'lesson' THEN 'agenda_lessons'
    WHEN 'lessons' THEN 'agenda_lessons'
    WHEN 'agenda_lesson' THEN 'agenda_lessons'
    WHEN 'agenda_lessons' THEN 'agenda_lessons'

    WHEN 'lesson_reflection' THEN 'agenda_lesson_reflections'
    WHEN 'lesson_reflections' THEN 'agenda_lesson_reflections'
    WHEN 'reflection' THEN 'agenda_lesson_reflections'
    WHEN 'reflections' THEN 'agenda_lesson_reflections'
    WHEN 'agenda_lesson_reflections' THEN 'agenda_lesson_reflections'

    WHEN 'planning_objective' THEN 'agenda_planning_objectives'
    WHEN 'planning_objectives' THEN 'agenda_planning_objectives'
    WHEN 'agenda_planning_objectives' THEN 'agenda_planning_objectives'

    WHEN 'lesson_objective' THEN 'agenda_lesson_objectives'
    WHEN 'lesson_objectives' THEN 'agenda_lesson_objectives'
    WHEN 'agenda_lesson_objectives' THEN 'agenda_lesson_objectives'

    ELSE NULL
  END;
END;
$$;


CREATE OR REPLACE FUNCTION public.agenda_resource_owner_column(
  requested_table_name text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE requested_table_name
    WHEN 'agenda_classes' THEN 'teacher_id'

    WHEN 'agenda_events' THEN 'user_id'
    WHEN 'agenda_tasks' THEN 'user_id'
    WHEN 'agenda_planning' THEN 'user_id'
    WHEN 'agenda_evidences' THEN 'user_id'

    WHEN 'agenda_objectives' THEN 'user_id'
    WHEN 'agenda_lessons' THEN 'user_id'
    WHEN 'agenda_lesson_reflections' THEN 'user_id'

    WHEN 'agenda_planning_objectives' THEN 'user_id'
    WHEN 'agenda_lesson_objectives' THEN 'user_id'

    ELSE NULL
  END;
$$;


REVOKE ALL
ON FUNCTION public.agenda_resource_table_name(text)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.agenda_resource_owner_column(text)
FROM PUBLIC;


-- =========================================================
-- 14. TRIGGERS DE GOVERNANÇA, AUDITORIA E PROTEÇÃO
-- =========================================================

DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'agenda_objectives',
    'agenda_lessons',
    'agenda_lesson_reflections',
    'agenda_planning_objectives',
    'agenda_lesson_objectives'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I',
      'trg_' ||
        target_table ||
        '_governance',
      target_table
    );

    EXECUTE format(
      'CREATE TRIGGER %I
       BEFORE INSERT OR UPDATE
       ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION public.apply_agenda_record_governance()',
      'trg_' ||
        target_table ||
        '_governance',
      target_table
    );


    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I',
      'trg_' ||
        target_table ||
        '_audit',
      target_table
    );

    EXECUTE format(
      'CREATE TRIGGER %I
       AFTER INSERT OR UPDATE
       ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION public.audit_agenda_record_change()',
      'trg_' ||
        target_table ||
        '_audit',
      target_table
    );


    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I',
      'trg_' ||
        target_table ||
        '_block_hard_delete',
      target_table
    );

    EXECUTE format(
      'CREATE TRIGGER %I
       BEFORE DELETE
       ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION public.block_agenda_hard_delete()',
      'trg_' ||
        target_table ||
        '_block_hard_delete',
      target_table
    );
  END LOOP;
END;
$$;


-- =========================================================
-- 15. RLS DOS NOVOS RECURSOS
-- =========================================================

DO $$
DECLARE
  target_table text;
  existing_policy record;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'agenda_objectives',
    'agenda_lessons',
    'agenda_lesson_reflections',
    'agenda_planning_objectives',
    'agenda_lesson_objectives'
  ]
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I
       ENABLE ROW LEVEL SECURITY',
      target_table
    );

    FOR existing_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename =
          target_table
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        existing_policy.policyname,
        target_table
      );
    END LOOP;


    EXECUTE format(
      'CREATE POLICY %I
       ON public.%I
       FOR SELECT
       TO authenticated
       USING (
         public.can_view_agenda_record(
           user_id,
           organization_id,
           school_id
         )
       )',
      target_table ||
        '_governed_select',
      target_table
    );


    EXECUTE format(
      'CREATE POLICY %I
       ON public.%I
       FOR INSERT
       TO authenticated
       WITH CHECK (
         user_id = auth.uid()
         AND deleted_at IS NULL
       )',
      target_table ||
        '_owner_insert',
      target_table
    );


    EXECUTE format(
      'CREATE POLICY %I
       ON public.%I
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
       )',
      target_table ||
        '_governed_update',
      target_table
    );
  END LOOP;
END;
$$;


-- Não existe policy de DELETE.
-- Toda exclusão deve utilizar:
--
-- public.soft_delete_agenda_record()
--
-- Toda restauração deve utilizar:
--
-- public.restore_agenda_record()


-- =========================================================
-- 16. VISÃO INSTITUCIONAL NORMALIZADA
-- =========================================================

CREATE OR REPLACE VIEW public.agenda_institutional_records
WITH (
  security_invoker = true
)
AS
  SELECT
    'agenda_events'::text
      AS resource_type,

    record.id
      AS resource_id,

    record.title,

    record.status::text
      AS record_status,

    record.user_id
      AS owner_user_id,

    record.organization_id,
    record.school_id,

    record.deleted_at IS NOT NULL
      AS is_deleted,

    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,

    record.restored_at,
    record.restored_by,
    record.restore_reason,

    record.created_at,
    record.updated_at
  FROM public.agenda_events record


  UNION ALL


  SELECT
    'agenda_tasks'::text,
    record.id,
    record.title,
    record.status::text,
    record.user_id,
    record.organization_id,
    record.school_id,
    record.deleted_at IS NOT NULL,
    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,
    record.restored_at,
    record.restored_by,
    record.restore_reason,
    record.created_at,
    record.updated_at
  FROM public.agenda_tasks record


  UNION ALL


  SELECT
    'agenda_planning'::text,
    record.id,
    record.title,
    record.status::text,
    record.user_id,
    record.organization_id,
    record.school_id,
    record.deleted_at IS NOT NULL,
    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,
    record.restored_at,
    record.restored_by,
    record.restore_reason,
    record.created_at,
    record.updated_at
  FROM public.agenda_planning record


  UNION ALL


  SELECT
    'agenda_evidences'::text,
    record.id,
    record.title,
    record.evidence_type::text,
    record.user_id,
    record.organization_id,
    record.school_id,
    record.deleted_at IS NOT NULL,
    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,
    record.restored_at,
    record.restored_by,
    record.restore_reason,
    record.created_at,
    record.updated_at
  FROM public.agenda_evidences record


  UNION ALL


  SELECT
    'agenda_classes'::text,
    record.id,
    record.name,
    CASE
      WHEN record.active
        THEN 'active'
      ELSE 'inactive'
    END::text,
    record.teacher_id,
    record.organization_id,
    record.school_id,
    record.deleted_at IS NOT NULL,
    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,
    record.restored_at,
    record.restored_by,
    record.restore_reason,
    record.created_at,
    record.updated_at
  FROM public.agenda_classes record


  UNION ALL


  SELECT
    'agenda_objectives'::text,
    record.id,
    record.title,
    record.status::text,
    record.user_id,
    record.organization_id,
    record.school_id,
    record.deleted_at IS NOT NULL,
    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,
    record.restored_at,
    record.restored_by,
    record.restore_reason,
    record.created_at,
    record.updated_at
  FROM public.agenda_objectives record


  UNION ALL


  SELECT
    'agenda_lessons'::text,
    record.id,
    record.title,
    record.status::text,
    record.user_id,
    record.organization_id,
    record.school_id,
    record.deleted_at IS NOT NULL,
    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,
    record.restored_at,
    record.restored_by,
    record.restore_reason,
    record.created_at,
    record.updated_at
  FROM public.agenda_lessons record


  UNION ALL


  SELECT
    'agenda_lesson_reflections'::text,
    record.id,
    'Reflexão pós-aula'::text,
    record.status::text,
    record.user_id,
    record.organization_id,
    record.school_id,
    record.deleted_at IS NOT NULL,
    record.deleted_at,
    record.deleted_by,
    record.deletion_reason,
    record.restored_at,
    record.restored_by,
    record.restore_reason,
    record.created_at,
    record.updated_at
  FROM public.agenda_lesson_reflections record;


-- =========================================================
-- 17. PRIVILÉGIOS
-- =========================================================
--
-- Nesta fundação, usuários autenticados recebem somente
-- leitura das estruturas novas.
--
-- INSERT e UPDATE serão liberados apenas quando:
--
-- 1. Repository;
-- 2. Service;
-- 3. API Route;
-- 4. Hook;
-- 5. Component/Page;
--
-- estiverem implementados e validados.
-- =========================================================

REVOKE ALL
ON TABLE
  public.agenda_objectives,
  public.agenda_lessons,
  public.agenda_lesson_reflections,
  public.agenda_planning_objectives,
  public.agenda_lesson_objectives
FROM anon;


REVOKE INSERT, UPDATE, DELETE
ON TABLE
  public.agenda_objectives,
  public.agenda_lessons,
  public.agenda_lesson_reflections,
  public.agenda_planning_objectives,
  public.agenda_lesson_objectives
FROM authenticated;


GRANT SELECT
ON TABLE
  public.agenda_objectives,
  public.agenda_lessons,
  public.agenda_lesson_reflections,
  public.agenda_planning_objectives,
  public.agenda_lesson_objectives
TO authenticated;


GRANT ALL
ON TABLE
  public.agenda_objectives,
  public.agenda_lessons,
  public.agenda_lesson_reflections,
  public.agenda_planning_objectives,
  public.agenda_lesson_objectives
TO service_role;


REVOKE DELETE
ON TABLE
  public.agenda_objectives,
  public.agenda_lessons,
  public.agenda_lesson_reflections,
  public.agenda_planning_objectives,
  public.agenda_lesson_objectives
FROM authenticated, anon;


GRANT SELECT
ON public.agenda_institutional_records
TO authenticated, service_role;


-- =========================================================
-- 18. COMENTÁRIOS INSTITUCIONAIS
-- =========================================================

COMMENT ON TABLE public.agenda_objectives IS
  'Objetivos persistentes da Agenda Inteligente EDI, vinculáveis a planejamentos, aulas, tarefas, evidências e indicadores.';

COMMENT ON TABLE public.agenda_lessons IS
  'Aulas programadas e realizadas da Agenda Inteligente EDI, integradas a planejamentos, objetivos, evidências e reflexão pós-aula.';

COMMENT ON TABLE public.agenda_lesson_reflections IS
  'Reflexões pós-aula que registram execução, resultados, dificuldades, adaptações, necessidades e próxima ação.';

COMMENT ON TABLE public.agenda_planning_objectives IS
  'Relações auditáveis entre planejamentos e objetivos da Agenda Inteligente EDI.';

COMMENT ON TABLE public.agenda_lesson_objectives IS
  'Relações auditáveis entre aulas e objetivos da Agenda Inteligente EDI.';

COMMENT ON COLUMN public.agenda_planning.source_planning_id IS
  'Planejamento de origem utilizado em duplicações, cópias ou geração de modelos.';

COMMENT ON COLUMN public.agenda_planning.is_template IS
  'Indica se o planejamento pode ser reutilizado como modelo.';

COMMENT ON COLUMN public.agenda_tasks.original_due_date IS
  'Prazo anterior preservado quando a tarefa é reagendada.';

COMMENT ON COLUMN public.agenda_objectives.expected_indicator IS
  'Indicador esperado descrito pelo usuário. Indicadores estruturados usam public.indicators com entity_type agenda_objective e entity_id igual ao objetivo.';

COMMENT ON COLUMN public.agenda_objectives.expected_evidence IS
  'Descrição das evidências esperadas para acompanhamento do objetivo.';

COMMENT ON VIEW public.agenda_institutional_records IS
  'Visão normalizada dos registros operacionais da Agenda EDI, protegida pelas políticas RLS das tabelas de origem.';


-- =========================================================
-- 19. VALIDAÇÃO INTERNA DA MIGRATION
-- =========================================================

DO $$
DECLARE
  target_table text;
  row_security_enabled boolean;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'agenda_objectives',
    'agenda_lessons',
    'agenda_lesson_reflections',
    'agenda_planning_objectives',
    'agenda_lesson_objectives'
  ]
  LOOP
    IF to_regclass(
      format(
        'public.%I',
        target_table
      )
    ) IS NULL THEN
      RAISE EXCEPTION
        'A tabela public.% não foi criada corretamente.',
        target_table;
    END IF;

    SELECT
      relation.relrowsecurity
    INTO
      row_security_enabled
    FROM pg_class relation
    JOIN pg_namespace namespace
      ON namespace.oid =
        relation.relnamespace
    WHERE namespace.nspname =
      'public'
      AND relation.relname =
        target_table;

    IF coalesce(
      row_security_enabled,
      false
    ) = false THEN
      RAISE EXCEPTION
        'RLS não foi habilitada em public.%.',
        target_table;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger trigger_record
      JOIN pg_class relation
        ON relation.oid =
          trigger_record.tgrelid
      JOIN pg_namespace namespace
        ON namespace.oid =
          relation.relnamespace
      WHERE namespace.nspname =
        'public'
        AND relation.relname =
          target_table
        AND trigger_record.tgname =
          'trg_' ||
          target_table ||
          '_governance'
        AND trigger_record.tgisinternal =
          false
    ) THEN
      RAISE EXCEPTION
        'O trigger de governança não foi criado em public.%.',
        target_table;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger trigger_record
      JOIN pg_class relation
        ON relation.oid =
          trigger_record.tgrelid
      JOIN pg_namespace namespace
        ON namespace.oid =
          relation.relnamespace
      WHERE namespace.nspname =
        'public'
        AND relation.relname =
          target_table
        AND trigger_record.tgname =
          'trg_' ||
          target_table ||
          '_audit'
        AND trigger_record.tgisinternal =
          false
    ) THEN
      RAISE EXCEPTION
        'O trigger de auditoria não foi criado em public.%.',
        target_table;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger trigger_record
      JOIN pg_class relation
        ON relation.oid =
          trigger_record.tgrelid
      JOIN pg_namespace namespace
        ON namespace.oid =
          relation.relnamespace
      WHERE namespace.nspname =
        'public'
        AND relation.relname =
          target_table
        AND trigger_record.tgname =
          'trg_' ||
          target_table ||
          '_block_hard_delete'
        AND trigger_record.tgisinternal =
          false
    ) THEN
      RAISE EXCEPTION
        'O bloqueio de exclusão física não foi criado em public.%.',
        target_table;
    END IF;
  END LOOP;


  IF public.agenda_resource_table_name(
    'objective'
  ) <> 'agenda_objectives' THEN
    RAISE EXCEPTION
      'O recurso objective não foi registrado na governança.';
  END IF;


  IF public.agenda_resource_table_name(
    'lesson'
  ) <> 'agenda_lessons' THEN
    RAISE EXCEPTION
      'O recurso lesson não foi registrado na governança.';
  END IF;


  IF public.agenda_resource_table_name(
    'reflection'
  ) <> 'agenda_lesson_reflections' THEN
    RAISE EXCEPTION
      'O recurso reflection não foi registrado na governança.';
  END IF;
END;
$$;


COMMIT;