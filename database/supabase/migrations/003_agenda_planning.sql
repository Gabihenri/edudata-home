create table if not exists public.agenda_planning (
    id uuid primary key default gen_random_uuid(),

    title text not null,
    description text,

    subject text,
    class_name text,

    objective text,
    methodology text,
    resources text,
    evaluation text,

    planned_date date,

    status text not null default 'rascunho',

    school_id uuid,
    user_id uuid,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_agenda_planning_date
on public.agenda_planning(planned_date);

create index if not exists idx_agenda_planning_status
on public.agenda_planning(status);

create index if not exists idx_agenda_planning_user
on public.agenda_planning(user_id);

create index if not exists idx_agenda_planning_school
on public.agenda_planning(school_id);