BEGIN;

-- =========================================================
-- EDUDATA IA — AGENDA INTELIGENTE EDI
-- MIGRATION 32 — MOTOR DE REGRAS EDI
--
-- O motor interpreta sinais operacionais já existentes no Core.
-- Ele não altera agenda, calendário ou registros automaticamente.
-- Cada regra produz uma ocorrência explicável para decisão humana.
-- =========================================================

DROP VIEW IF EXISTS public.agenda_edi_rule_evaluations;

CREATE VIEW public.agenda_edi_rule_evaluations
WITH (security_invoker = true)
AS

-- 1. Conflito de docente/turma
SELECT
  'conflict'::text AS rule_code,
  'critical'::text AS severity,
  conflict.event_id AS resource_id,
  conflict.user_id,
  conflict.organization_id,
  conflict.school_id,
  conflict.class_id,
  conflict.event_title AS title,
  'Conflito temporal detectado'::text AS rule_name,
  conflict.explanation,
  conflict.event_start_at AS reference_at,
  jsonb_build_object(
    'conflicting_event_id', conflict.conflicting_event_id,
    'conflicting_event_title', conflict.conflicting_event_title,
    'conflict_type', conflict.conflict_type
  ) AS context
FROM public.agenda_operational_conflicts conflict

UNION ALL

-- 2. Evento concluído sem evidência
SELECT
  'evidence_pending'::text,
  'high'::text,
  state.event_id,
  state.user_id,
  state.organization_id,
  state.school_id,
  state.class_id,
  state.title,
  'Evidência pendente'::text,
  'O evento foi concluído, mas ainda não possui evidência registrada.'::text,
  state.end_at,
  jsonb_build_object(
    'event_status', state.status,
    'evidence_count', state.evidence_count
  )
FROM public.agenda_operational_event_state state
WHERE state.operational_state = 'evidence_pending'

UNION ALL

-- 3. Tarefas/aulas atrasadas
SELECT
  'pending_overdue'::text,
  'high'::text,
  pending.resource_id,
  pending.user_id,
  pending.organization_id,
  pending.school_id,
  NULL::uuid,
  pending.title,
  'Pendência em atraso'::text,
  'Existe uma tarefa ou aula com prazo/data operacional vencida.'::text,
  pending.due_at,
  jsonb_build_object(
    'pending_type', pending.pending_type,
    'pending_reason', pending.pending_reason
  )
FROM public.agenda_operational_pending pending
WHERE pending.pending_reason = 'overdue'

UNION ALL

-- 4. Evento em fim de semana
SELECT
  'non_operational_weekday'::text,
  'medium'::text,
  event.id,
  event.user_id,
  event.organization_id,
  event.school_id,
  event.class_id,
  event.title,
  'Evento fora do período semanal usual'::text,
  'O evento está agendado para sábado ou domingo e merece revisão contextual.'::text,
  event.start_at,
  jsonb_build_object(
    'day_of_week', EXTRACT(ISODOW FROM event.start_at AT TIME ZONE 'America/Sao_Paulo')
  )
FROM public.agenda_events event
WHERE event.deleted_at IS NULL
  AND EXTRACT(ISODOW FROM event.start_at AT TIME ZONE 'America/Sao_Paulo') IN (6, 7)

UNION ALL

-- 5. Evento fora do horário operacional cadastrado da escola
SELECT
  'outside_school_hours'::text,
  'medium'::text,
  event.id,
  event.user_id,
  event.organization_id,
  event.school_id,
  event.class_id,
  event.title,
  'Fora do horário operacional da escola'::text,
  'O intervalo do evento não está contido em nenhum horário operacional ativo da escola para o dia da semana.'::text,
  event.start_at,
  jsonb_build_object(
    'event_start_at', event.start_at,
    'event_end_at', event.end_at
  )
FROM public.agenda_events event
WHERE event.deleted_at IS NULL
  AND event.school_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.school_operating_hours hours
    WHERE hours.school_id = event.school_id
      AND hours.deleted_at IS NULL
      AND hours.status = 'active'
      AND hours.is_operating_day = true
      AND hours.weekday = EXTRACT(ISODOW FROM event.start_at AT TIME ZONE 'America/Sao_Paulo')::integer
      AND ((event.start_at AT TIME ZONE 'America/Sao_Paulo')::time >= hours.start_time)
      AND (
        (COALESCE(event.end_at, event.start_at + interval '1 hour') AT TIME ZONE 'America/Sao_Paulo')::time
        <= hours.end_time
      )
  )

UNION ALL

-- 6. Evento em dia que suspende aulas
SELECT
  'calendar_suspension'::text,
  'critical'::text,
  event.id,
  event.user_id,
  event.organization_id,
  event.school_id,
  event.class_id,
  event.title,
  'Dia escolar com suspensão de aulas'::text,
  'O calendário institucional indica suspensão de aulas para a data do evento.'::text,
  event.start_at,
  jsonb_build_object(
    'calendar_event_ids', COALESCE(calendar_context.event_ids, '[]'::jsonb),
    'suspends_classes', true
  )
FROM public.agenda_events event
JOIN LATERAL (
  SELECT
    jsonb_agg(calendar.id) AS event_ids
  FROM public.institutional_calendar_events calendar
  WHERE calendar.deleted_at IS NULL
    AND calendar.status IN ('active', 'published')
    AND calendar.suspends_classes = true
    AND calendar.start_date <= (event.start_at AT TIME ZONE 'America/Sao_Paulo')::date
    AND COALESCE(calendar.end_date, calendar.start_date) >= (event.start_at AT TIME ZONE 'America/Sao_Paulo')::date
    AND (calendar.school_id IS NULL OR calendar.school_id = event.school_id)
    AND (calendar.organization_id IS NULL OR calendar.organization_id = event.organization_id)
) calendar_context ON jsonb_array_length(COALESCE(calendar_context.event_ids, '[]'::jsonb)) > 0
WHERE event.deleted_at IS NULL;

COMMENT ON VIEW public.agenda_edi_rule_evaluations IS
  'Motor de regras explicáveis da Agenda EDI. Somente avaliação; não executa alterações automáticas.';

REVOKE ALL ON public.agenda_edi_rule_evaluations FROM PUBLIC;
GRANT SELECT ON public.agenda_edi_rule_evaluations TO authenticated, service_role;

COMMIT;
