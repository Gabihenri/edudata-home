-- Agenda Inteligente EDI: fonte oficial de tarefas e governança de status.
-- Não altera migrations anteriores. Cada mudança de status é auditável.

create extension if not exists pgcrypto;

create table if not exists public.agenda_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  source_type text not null default 'manual',
  source_reference text,
  priority text not null default 'medium',
  due_at timestamptz,
  status text not null default 'pending',
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id) on delete set null,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint agenda_tasks_status_check check (status in ('pending','in_progress','completed','cancelled')),
  constraint agenda_tasks_priority_check check (priority in ('low','medium','high','critical')),
  constraint agenda_tasks_completion_check check ((status <> 'completed') or (completed_at is not null and completed_by is not null)),
  constraint agenda_tasks_cancellation_check check ((status <> 'cancelled') or (cancelled_at is not null and cancelled_by is not null))
);

create index if not exists agenda_tasks_user_status_idx
  on public.agenda_tasks(user_id, status, due_at) where archived_at is null;

create table if not exists public.agenda_task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.agenda_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid not null references auth.users(id) on delete restrict,
  reason text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint agenda_task_status_history_status_check check (
    new_status in ('pending','in_progress','completed','cancelled')
    and (previous_status is null or previous_status in ('pending','in_progress','completed','cancelled'))
  )
);

create index if not exists agenda_task_status_history_task_time_idx
  on public.agenda_task_status_history(task_id, occurred_at desc);

create or replace function public.set_agenda_task_status(
  p_task_id uuid,
  p_new_status text,
  p_reason text default null
)
returns public.agenda_tasks
language plpgsql
security invoker
as $$
declare
  v_task public.agenda_tasks;
  v_previous_status text;
  v_actor uuid := auth.uid();
begin
  if p_new_status not in ('pending','in_progress','completed','cancelled') then
    raise exception 'Invalid task status: %', p_new_status;
  end if;

  select * into v_task from public.agenda_tasks
  where id = p_task_id and user_id = v_actor and archived_at is null
  for update;

  if not found then
    raise exception 'Task not found or access denied';
  end if;

  v_previous_status := v_task.status;

  if v_previous_status in ('completed','cancelled') and p_new_status <> v_previous_status then
    raise exception 'Closed tasks cannot be reopened without a governed workflow';
  end if;

  if v_previous_status = p_new_status then
    return v_task;
  end if;

  update public.agenda_tasks set
    status = p_new_status,
    completed_at = case when p_new_status = 'completed' then now() else completed_at end,
    completed_by = case when p_new_status = 'completed' then v_actor else completed_by end,
    cancelled_at = case when p_new_status = 'cancelled' then now() else cancelled_at end,
    cancelled_by = case when p_new_status = 'cancelled' then v_actor else cancelled_by end,
    cancellation_reason = case when p_new_status = 'cancelled' then coalesce(p_reason, cancellation_reason) else cancellation_reason end,
    updated_at = now()
  where id = p_task_id
  returning * into v_task;

  insert into public.agenda_task_status_history (
    task_id, user_id, previous_status, new_status, changed_by, reason
  ) values (
    v_task.id, v_task.user_id, v_previous_status, p_new_status, v_actor, p_reason
  );

  return v_task;
end;
$$;

alter table public.agenda_tasks enable row level security;
alter table public.agenda_task_status_history enable row level security;

create policy "agenda_tasks_owner_select" on public.agenda_tasks for select using (auth.uid() = user_id);
create policy "agenda_tasks_owner_insert" on public.agenda_tasks for insert with check (auth.uid() = user_id);
create policy "agenda_tasks_owner_update" on public.agenda_tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "agenda_task_status_history_owner_select" on public.agenda_task_status_history for select using (auth.uid() = user_id);
create policy "agenda_task_status_history_owner_insert" on public.agenda_task_status_history for insert with check (auth.uid() = user_id and auth.uid() = changed_by);
