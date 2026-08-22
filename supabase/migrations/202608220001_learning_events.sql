-- EDI Agenda Learning V2
-- Stores only structured feedback signals required for adaptive recommendations.
-- Operational records remain protected by the existing application/RLS model.

create table if not exists public.agenda_learning_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  school_id uuid,
  user_id uuid,
  recommendation_id text,
  recommendation_type text,
  module text not null default 'agenda',
  context_type text,
  outcome text not null,
  executed boolean,
  result text,
  created_at timestamptz not null default now()
);

alter table public.agenda_learning_events enable row level security;

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
