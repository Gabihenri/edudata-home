-- Explicit Data API privileges for existing deployments.
-- Keep institutional identity tables backend-only: they currently have no
-- row-scoped browser policies, so do not grant anon/authenticated access.
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_members from anon, authenticated;
grant select, insert, update, delete on table public.organizations to service_role;
grant select, insert, update, delete on table public.organization_members to service_role;

-- Agenda tasks are directly used by signed-in users and are protected by
-- owner-only RLS policies in 202608280001_agenda_tasks_governance.sql.
alter table public.agenda_tasks enable row level security;
alter table public.agenda_task_status_history enable row level security;

revoke all on table public.agenda_tasks from anon;
revoke all on table public.agenda_task_status_history from anon;
grant select, insert, update on table public.agenda_tasks to authenticated;
grant select, insert on table public.agenda_task_status_history to authenticated;
grant all on table public.agenda_tasks to service_role;
grant all on table public.agenda_task_status_history to service_role;

-- Restrict function execution explicitly; the function is SECURITY INVOKER
-- and must continue to respect caller privileges and RLS.
revoke all on function public.set_agenda_task_status(uuid, text, text) from public, anon;
grant execute on function public.set_agenda_task_status(uuid, text, text) to authenticated, service_role;
