-- Extend the minimal institutional membership contract required by Agenda authorization.
-- Forward-only and idempotent: existing deployments retain their data and existing columns.
-- This migration does not grant access by itself and does not change remote policy state.

alter table public.organization_members
  add column if not exists school_id uuid,
  add column if not exists access_starts_at timestamptz,
  add column if not exists access_ends_at timestamptz,
  add column if not exists can_view_school boolean not null default false;

alter table public.organization_members
  drop constraint if exists organization_members_access_period_check;

alter table public.organization_members
  add constraint organization_members_access_period_check
  check (
    access_ends_at is null
    or access_starts_at is null
    or access_ends_at >= access_starts_at
  );

create index if not exists organization_members_user_org_school_status_idx
  on public.organization_members(user_id, organization_id, school_id, status);
