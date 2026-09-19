BEGIN;

-- =========================================================
-- EDUDATA IA — AGENDA INTELIGENTE EDI
-- MIGRATION 31 — INTELIGÊNCIA OPERACIONAL
--
-- Objetivo:
-- transformar a Agenda em uma camada operacional que detecta
-- conflitos, pendências, carga, lacunas de evidência e horários
-- potenciais para reagendamento, sem criar entidades paralelas
-- de professores, disponibilidade ou grade institucional.
--
-- Princípios:
-- 1. não remover dados;
-- 2. não duplicar o Core;
-- 3. consultas governadas por RLS;
-- 4. recomendações não executam alterações automaticamente;
-- 5. toda decisão operacional continua humana.
-- =========================================================


-- =========================================================
-- 1. ÍNDICES OPERACIONAIS
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_agenda_events_operational_user_time
  ON public.agenda_events(user_id, start_at, end_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_events_operational_class_time
  ON public.agenda_events(class_id, start_at, end_at)
  WHERE deleted_at IS NULL
    AND class_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_lessons_operational_user_time
  ON public.agenda_lessons(user_id, scheduled_date, start_time, end_time)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_tasks_operational_due
  ON public.agenda_tasks(user_id, due_date)
  WHERE deleted_at IS NULL;


-- =========================================================
-- 2. CONFLITOS TEMPORAIS DA AGENDA
--
-- Um conflito é detectado quando dois eventos ativos:
-- - pertencem ao mesmo usuário; OU
-- - compartilham a mesma turma;
-- e seus intervalos se sobrepõem.
--
-- A view não bloqueia o cadastro. Ela fornece inteligência
-- explicável para a interface e para os serviços.
-- =========================================================

DROP VIEW IF EXISTS public.agenda_operational_conflicts;

CREATE VIEW public.agenda_operational_conflicts
WITH (security_invoker = true)
AS
SELECT
  left_event.id AS event_id,
  right_event.id AS conflicting_event_id,

  CASE
    WHEN left_event.user_id = right_event.user_id
      THEN 'teacher_overlap'
    WHEN left_event.class_id IS NOT NULL
      AND left_event.class_id = right_event.class_id
      THEN 'class_overlap'
    ELSE 'temporal_overlap'
  END AS conflict_type,

  left_event.user_id,
  left_event.organization_id,
  left_event.school_id,
  left_event.class_id,

  left_event.title AS event_title,
  right_event.title AS conflicting_event_title,

  left_event.start_at AS event_start_at,
  left_event.end_at AS event_end_at,
  right_event.start_at AS conflicting_start_at,
  right_event.end_at AS conflicting_end_at,

  CASE
    WHEN left_event.user_id = right_event.user_id
      THEN 'O mesmo docente possui dois eventos sobrepostos.'
    WHEN left_event.class_id IS NOT NULL
      AND left_event.class_id = right_event.class_id
      THEN 'A mesma turma possui dois eventos sobrepostos.'
    ELSE 'Existem eventos sobrepostos no mesmo contexto operacional.'
  END AS explanation

FROM public.agenda_events left_event
JOIN public.agenda_events right_event
  ON left_event.id < right_event.id
 AND left_event.deleted_at IS NULL
 AND right_event.deleted_at IS NULL
 AND left_event.start_at < COALESCE(
   right_event.end_at,
   right_event.start_at + interval '1 hour'
 )
 AND right_event.start_at < COALESCE(
   left_event.end_at,
   left_event.start_at + interval '1 hour'
 )
 AND (
   left_event.user_id = right_event.user_id
   OR (
     left_event.class_id IS NOT NULL
     AND left_event.class_id = right_event.class_id
   )
 );

COMMENT ON VIEW public.agenda_operational_conflicts IS
  'Conflitos temporais explicáveis da Agenda EDI. A consulta respeita RLS e não executa alterações automaticamente.';


-- =========================================================
-- 3. ESTADO OPERACIONAL DOS EVENTOS
--
-- Consolida evento + evidências + tarefas + conflitos.
-- Permite à UI responder:
-- "O que está planejado, realizado, evidenciado e pendente?"
-- =========================================================

DROP VIEW IF EXISTS public.agenda_operational_event_state;

CREATE VIEW public.agenda_operational_event_state
WITH (security_invoker = true)
AS
SELECT
  event.id AS event_id,
  event.title,
  event.event_type,
  event.status,
  event.priority,
  event.start_at,
  event.end_at,
  event.user_id,
  event.organization_id,
  event.school_id,
  event.class_id,
  event.lesson_id,
  event.objective_id,

  COALESCE(evidence_summary.evidence_count, 0) AS evidence_count,
  COALESCE(task_summary.task_count, 0) AS task_count,

  EXISTS (
    SELECT 1
    FROM public.agenda_operational_conflicts conflict
    WHERE conflict.event_id = event.id
       OR conflict.conflicting_event_id = event.id
  ) AS has_conflict,

  CASE
    WHEN event.deleted_at IS NOT NULL
      THEN 'deleted'
    WHEN EXISTS (
      SELECT 1
      FROM public.agenda_operational_conflicts conflict
      WHERE conflict.event_id = event.id
         OR conflict.conflicting_event_id = event.id
    )
      THEN 'conflict'
    WHEN lower(COALESCE(event.status, '')) IN (
      'concluido',
      'concluída',
      'concluida',
      'realizado',
      'realizada',
      'completed'
    )
      AND COALESCE(evidence_summary.evidence_count, 0) = 0
      THEN 'evidence_pending'
    ELSE 'ok'
  END AS operational_state

FROM public.agenda_events event

LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS evidence_count
  FROM public.agenda_evidences evidence
  WHERE evidence.event_id = event.id
    AND evidence.deleted_at IS NULL
) evidence_summary ON true

LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS task_count
  FROM public.agenda_tasks task
  WHERE task.event_id = event.id
    AND task.deleted_at IS NULL
) task_summary ON true

WHERE event.deleted_at IS NULL;

COMMENT ON VIEW public.agenda_operational_event_state IS
  'Estado operacional consolidado do evento: conflito, evidência pendente ou operação regular.';


-- =========================================================
-- 4. CENTRAL DE PENDÊNCIAS
--
-- Unifica pendências de tarefas, aulas e evidências.
-- =========================================================

DROP VIEW IF EXISTS public.agenda_operational_pending;

CREATE VIEW public.agenda_operational_pending
WITH (security_invoker = true)
AS

SELECT
  'task'::text AS pending_type,
  task.id AS resource_id,
  task.title,
  task.user_id,
  task.organization_id,
  task.school_id,
  task.due_date AS due_at,
  CASE
    WHEN task.due_date IS NOT NULL
      AND task.due_date < now()
      THEN 'overdue'
    WHEN lower(COALESCE(task.priority, '')) IN (
      'urgente',
      'critical',
      'high',
      'alta'
    )
      THEN 'high_priority'
    ELSE 'pending'
  END AS pending_reason
FROM public.agenda_tasks task
WHERE task.deleted_at IS NULL
  AND lower(COALESCE(task.status, '')) NOT IN (
    'concluida',
    'concluído',
    'concluido',
    'finalizada',
    'finalizado',
    'cancelada',
    'cancelado',
    'completed',
    'cancelled'
  )

UNION ALL

SELECT
  'lesson'::text,
  lesson.id,
  lesson.title,
  lesson.user_id,
  lesson.organization_id,
  lesson.school_id,
  CASE
    WHEN lesson.scheduled_date IS NULL
      THEN NULL
    WHEN lesson.end_time IS NULL
      THEN lesson.scheduled_date::timestamptz
    ELSE (
      lesson.scheduled_date
      + lesson.end_time
    )::timestamptz
  END,
  CASE
    WHEN lesson.scheduled_date < CURRENT_DATE
      AND lower(COALESCE(lesson.status, '')) NOT IN (
        'realizada',
        'cancelada'
      )
      THEN 'overdue'
    ELSE 'lesson_pending'
  END
FROM public.agenda_lessons lesson
WHERE lesson.deleted_at IS NULL
  AND lower(COALESCE(lesson.status, '')) NOT IN (
    'realizada',
    'cancelada'
  )

UNION ALL

SELECT
  'evidence'::text,
  event.id,
  event.title,
  event.user_id,
  event.organization_id,
  event.school_id,
  event.end_at,
  'evidence_pending'
FROM public.agenda_events event
WHERE event.deleted_at IS NULL
  AND lower(COALESCE(event.status, '')) IN (
    'concluido',
    'concluída',
    'concluida',
    'realizado',
    'realizada',
    'completed'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.agenda_evidences evidence
    WHERE evidence.event_id = event.id
      AND evidence.deleted_at IS NULL
  );

COMMENT ON VIEW public.agenda_operational_pending IS
  'Central governada de pendências operacionais da Agenda EDI.';


-- =========================================================
-- 5. CARGA OPERACIONAL
--
-- Não é avaliação de desempenho.
-- É uma visão quantitativa da ocupação da Agenda.
-- =========================================================

DROP VIEW IF EXISTS public.agenda_operational_workload;

CREATE VIEW public.agenda_operational_workload
WITH (security_invoker = true)
AS
SELECT
  event.user_id,
  event.organization_id,
  event.school_id,

  date_trunc(
    'week',
    event.start_at AT TIME ZONE 'America/Sao_Paulo'
  )::date AS week_reference,

  COUNT(*)::integer AS event_count,

  COALESCE(
    SUM(
      EXTRACT(
        EPOCH FROM (
          COALESCE(
            event.end_at,
            event.start_at + interval '1 hour'
          )
          - event.start_at
        )
      ) / 3600.0
    ),
    0
  )::numeric(10,2) AS estimated_hours,

  COUNT(*) FILTER (
    WHERE lower(COALESCE(event.event_type, '')) IN (
      'substitution',
      'substituicao',
      'substituição'
    )
  )::integer AS substitution_event_count

FROM public.agenda_events event
WHERE event.deleted_at IS NULL
GROUP BY
  event.user_id,
  event.organization_id,
  event.school_id,
  date_trunc('week', event.start_at)::date;

COMMENT ON VIEW public.agenda_operational_workload IS
  'Carga quantitativa de eventos por docente e semana. Não constitui avaliação de desempenho.';


-- =========================================================
-- 6. SUGESTÃO DE HORÁRIOS PARA REAGENDAMENTO
--
-- Gera alternativas livres para um evento, sem alterar o evento.
-- Considera:
-- - duração do evento;
-- - ocupação do próprio docente;
-- - segunda a sexta;
-- - janela operacional padrão 08:00–20:00.
--
-- A decisão final continua humana.
-- =========================================================

DROP FUNCTION IF EXISTS public.agenda_reschedule_candidates(
  uuid,
  date,
  integer
);

CREATE OR REPLACE FUNCTION public.agenda_reschedule_candidates(
  requested_event_id uuid,
  requested_start_date date DEFAULT CURRENT_DATE,
  requested_days integer DEFAULT 14
)
RETURNS TABLE (
  candidate_start_at timestamptz,
  candidate_end_at timestamptz,
  duration_minutes integer,
  conflict_free boolean,
  explanation text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH source_event AS (
    SELECT
      event.id,
      event.user_id,
      GREATEST(
        1,
        CEIL(
          EXTRACT(
            EPOCH FROM (
              COALESCE(
                event.end_at,
                event.start_at + interval '1 hour'
              )
              - event.start_at
            )
          ) / 60.0
        )
      )::integer AS duration_minutes
    FROM public.agenda_events event
    WHERE event.id = requested_event_id
      AND event.deleted_at IS NULL
  ),
  slots AS (
    SELECT
      (
        day_value::date
        + time_value
      )::timestamptz AS candidate_start_at
    FROM generate_series(
      requested_start_date::timestamptz,
      (
        requested_start_date
        + LEAST(GREATEST(requested_days, 1), 30) - 1
      )::timestamptz,
      interval '1 day'
    ) day_value
    CROSS JOIN generate_series(
      time '08:00',
      time '19:30',
      interval '30 minutes'
    ) time_value
    WHERE EXTRACT(ISODOW FROM day_value) BETWEEN 1 AND 5
  )
  SELECT
    slot.candidate_start_at,
    slot.candidate_start_at
      + make_interval(mins => source.duration_minutes)
      AS candidate_end_at,
    source.duration_minutes,
    NOT EXISTS (
      SELECT 1
      FROM public.agenda_events existing
      WHERE existing.deleted_at IS NULL
        AND existing.user_id = source.user_id
        AND existing.id <> source.id
        AND existing.start_at < (
          slot.candidate_start_at
          + make_interval(mins => source.duration_minutes)
        )
        AND (
          COALESCE(
            existing.end_at,
            existing.start_at + interval '1 hour'
          )
          > slot.candidate_start_at
        )
    ) AS conflict_free,
    CASE
      WHEN NOT EXISTS (
        SELECT 1
        FROM public.agenda_events existing
        WHERE existing.deleted_at IS NULL
          AND existing.user_id = source.user_id
          AND existing.id <> source.id
          AND existing.start_at < (
            slot.candidate_start_at
            + make_interval(mins => source.duration_minutes)
          )
          AND (
            COALESCE(
              existing.end_at,
              existing.start_at + interval '1 hour'
            )
            > slot.candidate_start_at
          )
      )
        THEN 'Horário livre na Agenda do docente.'
      ELSE 'Conflito com outro evento do docente.'
    END AS explanation
  FROM source_event source
  CROSS JOIN slots slot
  WHERE slot.candidate_start_at
      + make_interval(mins => source.duration_minutes)
    <= slot.candidate_start_at::date + time '20:00'
  ORDER BY
    slot.candidate_start_at;
$$;

COMMENT ON FUNCTION public.agenda_reschedule_candidates(
  uuid,
  date,
  integer
) IS
  'Gera horários potenciais para reagendamento sem executar alteração automática.';


-- =========================================================
-- 7. VISÃO DE COBERTURA OPERACIONAL
--
-- Permite observar quantos eventos foram planejados,
-- realizados e evidenciados em determinado período.
-- =========================================================

DROP VIEW IF EXISTS public.agenda_operational_coverage;

CREATE VIEW public.agenda_operational_coverage
WITH (security_invoker = true)
AS
SELECT
  event.user_id,
  event.organization_id,
  event.school_id,

  date_trunc(
    'week',
    event.start_at AT TIME ZONE 'America/Sao_Paulo'
  )::date AS week_reference,

  COUNT(*)::integer AS planned_events,

  COUNT(*) FILTER (
    WHERE lower(COALESCE(event.status, '')) IN (
      'concluido',
      'concluída',
      'concluida',
      'realizado',
      'realizada',
      'completed'
    )
  )::integer AS completed_events,

  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1
      FROM public.agenda_evidences evidence
      WHERE evidence.event_id = event.id
        AND evidence.deleted_at IS NULL
    )
  )::integer AS evidenced_events,

  ROUND(
    (
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1
          FROM public.agenda_evidences evidence
          WHERE evidence.event_id = event.id
            AND evidence.deleted_at IS NULL
        )
      )::numeric
      / NULLIF(COUNT(*), 0)
    ) * 100,
    2
  ) AS evidence_coverage_percent

FROM public.agenda_events event
WHERE event.deleted_at IS NULL
GROUP BY
  event.user_id,
  event.organization_id,
  event.school_id,
  date_trunc('week', event.start_at)::date;

COMMENT ON VIEW public.agenda_operational_coverage IS
  'Cobertura semanal de planejamento, execução e evidência da Agenda EDI.';


-- =========================================================
-- 8. PRIVILÉGIOS
-- =========================================================

REVOKE ALL ON FUNCTION public.agenda_reschedule_candidates(
  uuid,
  date,
  integer
)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.agenda_reschedule_candidates(
  uuid,
  date,
  integer
)
TO authenticated;

GRANT SELECT ON public.agenda_operational_conflicts
TO authenticated, service_role;

GRANT SELECT ON public.agenda_operational_event_state
TO authenticated, service_role;

GRANT SELECT ON public.agenda_operational_pending
TO authenticated, service_role;

GRANT SELECT ON public.agenda_operational_workload
TO authenticated, service_role;

GRANT SELECT ON public.agenda_operational_coverage
TO authenticated, service_role;


COMMIT;
