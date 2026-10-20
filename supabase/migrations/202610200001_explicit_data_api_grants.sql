-- Explicit Data API privileges for existing deployments.
-- Authenticated users may read only their own membership and organizations
-- where they have a currently valid active membership. Writes remain backend-only.
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

revoke all on table public.organizations from anon;
revoke all on table public.organization_members from anon;
grant select on table public.organizations to authenticated;
grant select on table public.organization_members to authenticated;
grant select, insert, update, delete on table public.organizations to service_role;
grant select, insert, update, delete on table public.organization_members to service_role;

drop policy if exists organization_members_read_own on public.organization_members;
create policy organization_members_read_own
  on public.organization_members for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists organizations_read_active_membership on public.organizations;
create policy organizations_read_active_membership
  on public.organizations for select to authenticated
  using (
    exists (
      select 1
      from public.organization_members member
      where member.organization_id = organizations.id
        and member.user_id = (select auth.uid())
        and member.status = 'active'
        and (member.access_starts_at is null or member.access_starts_at <= now())
        and (member.access_ends_at is null or member.access_ends_at >= now())
    )
  );


-- Institutional governance tables: grant only operations supported by their
-- RLS policies. The audit log has no UPDATE/DELETE policy by design.
revoke all on table public.eios_institutional_policies from anon;
revoke all on table public.eios_score_governance from anon;
revoke all on table public.eios_policy_audit_events from anon;
grant select, insert, update, delete on table public.eios_institutional_policies to authenticated;
grant select, insert, update, delete on table public.eios_score_governance to authenticated;
grant select, insert on table public.eios_policy_audit_events to authenticated;
grant all on table public.eios_institutional_policies to service_role;
grant all on table public.eios_score_governance to service_role;
grant all on table public.eios_policy_audit_events to service_role;

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
