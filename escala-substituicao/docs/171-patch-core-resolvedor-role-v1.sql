-- Core canonical role resolver compatibility patch
-- Applied to Supabase project ihchzfndmdwtoabttkil on 2026-10-08.
-- Review into the formal migration chain before production promotion.

create or replace function public.resolve_canonical_role(p_user_id uuid default auth.uid())
returns table(resolved boolean, role_code text, actor_user_id uuid, organization_id uuid, school_id uuid, membership_id uuid, source text, hierarchy_level integer, resolution_code text, resolution_version text)
language plpgsql stable security definer
set search_path to pg_catalog, public, auth
as $$
-- See deployed definition in Supabase; this file records the controlled patch.
$$;

-- Security boundary:
-- revoke execute on function public.resolve_canonical_role(uuid) from public, anon;
-- grant execute on function public.resolve_canonical_role(uuid) to authenticated;

-- Consumer functions migrated in the same controlled change:
-- current_identity_role
-- can_access_identity_product
-- can_view_agenda_record_as
-- can_manage_agenda_record_as
-- current_user_is_academic_calendar_platform_admin
-- current_user_can_manage_academic_calendar
-- resolve_support_requester_context
