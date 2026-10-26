-- Explicit Data API grants for tables introduced by the EDI-QI migrations.
-- RLS policies remain the row-level security boundary.

revoke all on table public.agenda_tasks from anon, authenticated;
grant select, insert, update on table public.agenda_tasks to authenticated;
grant all on table public.agenda_tasks to service_role;

revoke all on table public.agenda_task_status_history from anon, authenticated;
grant select, insert on table public.agenda_task_status_history to authenticated;
grant all on table public.agenda_task_status_history to service_role;

revoke all on table public.agenda_learning_events from anon, authenticated;
grant select, insert on table public.agenda_learning_events to authenticated;
grant all on table public.agenda_learning_events to service_role;

revoke all on function public.set_agenda_task_status(uuid, text, text) from public, anon;
grant execute on function public.set_agenda_task_status(uuid, text, text) to authenticated, service_role;
