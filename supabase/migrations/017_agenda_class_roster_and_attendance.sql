create table if not exists public.agenda_class_students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  full_name text not null,
  enrollment_code text,
  sequence_number integer,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists agenda_class_students_user_class_idx
  on public.agenda_class_students(user_id, class_id, active);

create unique index if not exists agenda_class_students_sequence_unique
  on public.agenda_class_students(user_id, class_id, sequence_number)
  where archived_at is null and sequence_number is not null;

create table if not exists public.agenda_attendance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  student_id uuid not null references public.agenda_class_students(id) on delete cascade,
  lesson_date date not null,
  status text not null check (status in ('present','absent','justified','late','not_recorded')),
  notes text,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  archived_at timestamptz
);

create unique index if not exists agenda_attendance_unique_entry
  on public.agenda_attendance_entries(user_id, class_id, student_id, lesson_date)
  where archived_at is null;

alter table public.agenda_class_students enable row level security;
alter table public.agenda_attendance_entries enable row level security;

create policy "agenda_class_students_owner_select"
  on public.agenda_class_students for select
  using (auth.uid() = user_id);
create policy "agenda_class_students_owner_insert"
  on public.agenda_class_students for insert
  with check (auth.uid() = user_id);
create policy "agenda_class_students_owner_update"
  on public.agenda_class_students for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "agenda_attendance_owner_select"
  on public.agenda_attendance_entries for select
  using (auth.uid() = user_id);
create policy "agenda_attendance_owner_insert"
  on public.agenda_attendance_entries for insert
  with check (auth.uid() = user_id and auth.uid() = recorded_by);
create policy "agenda_attendance_owner_update"
  on public.agenda_attendance_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
