-- Read-only diagnostic for historical institutional membership access windows.
-- Run manually against the intended database after reviewing the target environment.
-- This file intentionally contains SELECT statements only; it does not repair data
-- or validate/drop constraints.

-- 1. Summary: quantify invalid windows without exposing user identifiers.
select
  count(*) as total_memberships,
  count(*) filter (
    where access_starts_at is not null
      and access_ends_at is not null
      and access_ends_at < access_starts_at
  ) as invalid_access_windows,
  count(*) filter (
    where access_starts_at is null and access_ends_at is not null
  ) as end_only_windows,
  count(*) filter (
    where access_starts_at is not null and access_ends_at is null
  ) as start_only_windows,
  count(*) filter (
    where access_starts_at is null and access_ends_at is null
  ) as unbounded_windows
from public.organization_members;

-- 2. Inspect a bounded sample of invalid rows.
-- Membership and organization IDs are included for authorized investigation;
-- user_id and other personal data are deliberately omitted.
select
  id as membership_id,
  organization_id,
  access_starts_at,
  access_ends_at,
  status,
  created_at,
  updated_at
from public.organization_members
where access_starts_at is not null
  and access_ends_at is not null
  and access_ends_at < access_starts_at
order by updated_at desc nulls last, created_at desc nulls last
limit 100;

-- 3. Confirm whether the constraint exists and whether it has been validated.
select
  conname,
  convalidated,
  pg_get_constraintdef(oid) as constraint_definition
from pg_constraint
where conrelid = 'public.organization_members'::regclass
  and conname = 'organization_members_access_period_check';
