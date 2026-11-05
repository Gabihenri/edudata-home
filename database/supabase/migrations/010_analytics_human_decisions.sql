-- EduData Analytics: decisões humanas rastreáveis
-- O banco preserva o histórico de revisão sem automatizar decisões pedagógicas.

create table if not exists public.analytics_human_decisions (
  id uuid primary key default gen_random_uuid(),
  signal_id text not null,
  status text not null check (status in ('under_review', 'needs_evidence', 'forwarded', 'archived')),
  justification text,
  source_analysis_id text,
  evidence_snapshot jsonb not null default '{}'::jsonb,
  intervention_id uuid null,
  decided_at timestamptz not null default now(),
  decided_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint analytics_human_decisions_justification_check check (
    status = 'under_review' or char_length(trim(coalesce(justification, ''))) >= 12
  )
);

create index if not exists analytics_human_decisions_signal_id_idx
  on public.analytics_human_decisions (signal_id, decided_at desc);

create index if not exists analytics_human_decisions_decided_by_idx
  on public.analytics_human_decisions (decided_by, decided_at desc);

alter table public.analytics_human_decisions enable row level security;

-- Usuários autenticados podem registrar apenas decisões em seu próprio nome.
create policy "analytics_human_decisions_insert_own"
  on public.analytics_human_decisions
  for insert
  to authenticated
  with check (auth.uid() = decided_by);

-- O histórico pertence ao responsável que tomou a decisão.
-- Visões institucionais devem ser adicionadas posteriormente por políticas de função/escopo.
create policy "analytics_human_decisions_select_own"
  on public.analytics_human_decisions
  for select
  to authenticated
  using (auth.uid() = decided_by);

-- O registro é tratado como histórico auditável: não há update ou delete direto pelo cliente.

comment on table public.analytics_human_decisions is
  'Histórico auditável de decisões humanas sobre sinais produzidos pela EduData Analytics.';

comment on column public.analytics_human_decisions.evidence_snapshot is
  'Snapshot das métricas e evidências consideradas no momento da decisão.';
