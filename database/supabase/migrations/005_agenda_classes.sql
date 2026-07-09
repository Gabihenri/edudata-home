create table if not exists public.agenda_classes (
    id uuid primary key default gen_random_uuid(),

    name text not null,
    school_year text,
    grade text,
    subject text,

    students_count integer default 0,

    school_id uuid,
    teacher_id uuid,

    active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_agenda_classes_teacher
on public.agenda_classes(teacher_id);

create index if not exists idx_agenda_classes_school
on public.agenda_classes(school_id);

create index if not exists idx_agenda_classes_subject
on public.agenda_classes(subject);

create index if not exists idx_agenda_classes_active
on public.agenda_classes(active);