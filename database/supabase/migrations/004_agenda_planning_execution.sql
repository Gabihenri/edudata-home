-- Etapa 1: Planejamento Inteligente orientado por período e execução.
-- Mantém compatibilidade com os planejamentos já existentes.

alter table public.agenda_planning
  add column if not exists planning_period_type text not null default 'personalizado',
  add column if not exists planning_start_date date,
  add column if not exists planning_end_date date,
  add column if not exists planned_lessons integer,
  add column if not exists completed_lessons integer not null default 0;

alter table public.agenda_planning
  drop constraint if exists agenda_planning_period_type_check;

alter table public.agenda_planning
  add constraint agenda_planning_period_type_check
  check (
    planning_period_type in (
      'semanal',
      'mensal',
      'bimestral',
      'trimestral',
      'semestral',
      'anual',
      'personalizado'
    )
  );

alter table public.agenda_planning
  drop constraint if exists agenda_planning_planned_lessons_check;

alter table public.agenda_planning
  add constraint agenda_planning_planned_lessons_check
  check (planned_lessons is null or planned_lessons > 0);

alter table public.agenda_planning
  drop constraint if exists agenda_planning_completed_lessons_check;

alter table public.agenda_planning
  add constraint agenda_planning_completed_lessons_check
  check (completed_lessons >= 0);

alter table public.agenda_planning
  drop constraint if exists agenda_planning_period_dates_check;

alter table public.agenda_planning
  add constraint agenda_planning_period_dates_check
  check (
    planning_start_date is null
    or planning_end_date is null
    or planning_end_date >= planning_start_date
  );

create index if not exists idx_agenda_planning_period_dates
  on public.agenda_planning (
    planning_start_date,
    planning_end_date
  );

-- O percentual não é persistido como fonte de verdade.
-- Deve ser calculado a partir de aulas previstas, aulas realizadas
-- e do calendário/impactos letivos nas camadas de serviço e analytics.
