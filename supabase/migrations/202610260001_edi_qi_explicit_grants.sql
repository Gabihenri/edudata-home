-- Explicit Data API grants for tables introduced by the EDI-QI migrations.
-- This migration follows the timestamped migrations that create these tables.
-- RLS policies remain the row-level security boundary.

-- Agenda task workflow: regular users may read/create/update tasks, but cannot
-- delete tasks or mutate/delete their status history.
revoke all on table public.agenda_tasks from anon, authenticated;
grant select, insert, update on table public.agenda_tasks to authenticated;
grant all on table public.agenda_tasks to service_role;

revoke all on table public.agenda_task_status_history from anon, authenticated;
grant select, insert on table public.agenda_task_status_history to authenticated;
grant all on table public.agenda_task_status_history to service_role;

-- Raw learning feedback is append-only for regular users.
revoke all on table public.agenda_learning_events from anon, authenticated;
grant select, insert on table public.agenda_learning_events to authenticated;
grant all on table public.agenda_learning_events to service_role;

revoke all on function public.set_agenda_task_status(uuid, text, text) from public, anon;
grant execute on function public.set_agenda_task_status(uuid, text, text) to authenticated, service_role;

-- Institutional governance: members can read under RLS; audit events remain
-- append-only for authenticated clients. The trusted backend has explicit reads.
revoke all on table public.eios_institutional_policies from anon, authenticated;
grant select on table public.eios_institutional_policies to authenticated;
grant all on table public.eios_institutional_policies to service_role;

revoke all on table public.eios_score_governance from anon, authenticated;
grant select on table public.eios_score_governance to authenticated;
grant all on table public.eios_score_governance to service_role;

revoke all on table public.eios_policy_audit_events from anon, authenticated;
grant select, insert on table public.eios_policy_audit_events to authenticated;
grant all on table public.eios_policy_audit_events to service_role;

-- Class roster and attendance have explicit CRUD limits; RLS restricts rows
-- to the authenticated owner and DELETE is intentionally unavailable.
revoke all on table public.agenda_class_students from anon, authenticated;
grant select, insert, update on table public.agenda_class_students to authenticated;
grant all on table public.agenda_class_students to service_role;

revoke all on table public.agenda_attendance_entries from anon, authenticated;
grant select, insert, update on table public.agenda_attendance_entries to authenticated;
grant all on table public.agenda_attendance_entries to service_role;
