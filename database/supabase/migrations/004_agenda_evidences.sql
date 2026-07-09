create table if not exists public.agenda_evidences (
    id uuid primary key default gen_random_uuid(),

    title text not null,
    description text,

    evidence_type text not null default 'texto',

    file_url text,
    external_url text,

    planning_id uuid references public.agenda_planning(id) on delete set null,
    event_id uuid references public.agenda_events(id) on delete set null,

    school_id uuid,
    user_id uuid,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_agenda_evidences_type
on public.agenda_evidences(evidence_type);

create index if not exists idx_agenda_evidences_user
on public.agenda_evidences(user_id);

create index if not exists idx_agenda_evidences_school
on public.agenda_evidences(school_id);

create index if not exists idx_agenda_evidences_event
on public.agenda_evidences(event_id);