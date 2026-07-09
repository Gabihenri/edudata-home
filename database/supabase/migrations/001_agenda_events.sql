create extension if not exists pgcrypto;

create table if not exists public.agenda_events (
    id uuid primary key default gen_random_uuid(),

    title text not null,
    description text,

    event_type text not null default 'pedagogico',

    start_at timestamptz not null,
    end_at timestamptz,

    status text not null default 'planejado',
    priority text not null default 'media',

    school_id uuid,
    user_id uuid,

    planning_id uuid,
    evidence_id uuid,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_agenda_events_start
on public.agenda_events(start_at);

create index if not exists idx_agenda_events_user
on public.agenda_events(user_id);

create index if not exists idx_agenda_events_school
on public.agenda_events(school_id);

create index if not exists idx_agenda_events_status
on public.agenda_events(status);

create index if not exists idx_agenda_events_type
on public.agenda_events(event_type);