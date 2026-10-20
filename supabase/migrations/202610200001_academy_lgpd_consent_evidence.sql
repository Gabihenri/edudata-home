-- Preserve evidence of privacy-policy consent for new Academy enrollments.
-- Existing rows are deliberately marked as having no recorded evidence; this
-- migration must not infer consent retroactively.
create table if not exists public.matriculas_na_academia (
  id uuid primary key default gen_random_uuid(),
  course_slug text not null,
  name text not null,
  email text not null,
  phone text,
  school_name text,
  role text,
  status text not null default 'novo'
    check (status in ('novo', 'contatado', 'matriculado', 'cancelado')),
  source text not null default 'academy',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matriculas_na_academia
  add column if not exists lgpd_consent boolean not null default false,
  add column if not exists privacy_consent_at timestamptz,
  add column if not exists privacy_notice_version text;

comment on column public.matriculas_na_academia.lgpd_consent is
  'Records whether the submitter explicitly accepted the privacy notice at enrollment time. Legacy rows default to false because no consent evidence was persisted.';
comment on column public.matriculas_na_academia.privacy_consent_at is
  'Server-side timestamp when explicit privacy consent was recorded.';
comment on column public.matriculas_na_academia.privacy_notice_version is
  'Identifier of the privacy notice version shown at consent time; nullable until a governed version is defined.';
