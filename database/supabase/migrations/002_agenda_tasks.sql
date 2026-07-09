create table if not exists public.agenda_tasks (
    id uuid primary key default gen_random_uuid(),

    title text not null,
    description text,

    status text not null default 'pendente',
    priority text not null default 'media',

    due_date timestamptz,

    event_id uuid references public.agenda_events(id) on delete set null,

    school_id uuid,
    user_id uuid,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_agenda_tasks_status
on public.agenda_tasks(status);

create index if not exists idx_agenda_tasks_priority
on public.agenda_tasks(priority);

create index if not exists idx_agenda_tasks_due_date
on public.agenda_tasks(due_date);

create index if not exists idx_agenda_tasks_user
on public.agenda_tasks(user_id);