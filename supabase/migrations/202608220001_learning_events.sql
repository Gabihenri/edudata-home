-- EDI Agenda Learning V2
-- Stores only structured feedback signals required for adaptive recommendations.
-- Operational records remain protected by the existing application/RLS model.

create table if not exists public.agenda_learning_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  school_id uuid,
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_id text,
  recommendation_type text,
  module text not null default 'agenda',
  context_type text,
  outcome text not null,
  executed boolean,
  result text,
  created_at timestamptz not null default now(),

  constraint agenda_learning_events_module_check
    check (module = 'agenda'),

  constraint agenda_learning_events_outcome_check
    check (
      outcome in (
        'accepted',
        'rejected',
        'ignored',
        'edited',
        'executed',
        'positive',
        'neutral',
        'negative'
      )
    ),

  constraint agenda_learning_events_result_check
    check (
      result is null or
      result in ('positive', 'neutral', 'negative')
    )
);

alter table public.agenda_learning_events enable row level security;

-- Learning feedback belongs to the authenticated user who generated it.
-- Organization/school analytics can later use controlled aggregation views
-- without exposing raw events between users.
drop policy if exists "Users can insert their own agenda learning events"
  on public.agenda_learning_events;

create policy "Users can insert their own agenda learning events"
  on public.agenda_learning_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own agenda learning events"
  on public.agenda_learning_events;

create policy "Users can view their own agenda learning events"
  on public.agenda_learning_events
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Raw learning events are append-only for regular users. This protects the
-- historical training signal from client-side modification or deletion.
revoke update on public.agenda_learning_events from authenticated;
revoke delete on public.agenda_learning_events from authenticated;

create index if not exists agenda_learning_events_scope_idx
  on public.agenda_learning_events (organization_id, school_id, user_id, created_at desc);

create index if not exists agenda_learning_events_recommendation_idx
  on public.agenda_learning_events (recommendation_id, created_at desc);

create index if not exists agenda_learning_events_type_result_idx
  on public.agenda_learning_events (recommendation_type, result, created_at desc);

comment on table public.agenda_learning_events is
  'Feedback estruturado da Agenda EDI para aprendizagem adaptativa e treinamento futuro.';

comment on column public.agenda_learning_events.outcome is
  'accepted, rejected, ignored, edited, executed, positive, neutral ou negative';

comment on column public.agenda_learning_events.result is
  'Resultado observado: positive, neutral ou negative.';
