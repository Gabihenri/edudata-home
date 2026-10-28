-- Read-only compatibility audit for the institutional schema.
-- Run only against a database where the operator is authorized to inspect metadata.
-- This script does not read user-level records or modify schema/data.

-- 1. Required organization columns and their nullability/defaults.
select
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  case when c.column_name in (
    'id', 'name', 'short_name', 'organization_type', 'document', 'email',
    'phone', 'website', 'logo_url', 'address', 'city', 'state', 'zip_code',
    'country', 'status', 'created_at', 'updated_at'
  ) then 'application contract' else 'other' end as contract_scope
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'organizations'
order by c.ordinal_position;

-- 2. Required membership columns and their nullability/defaults.
select
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'organization_members'
order by c.ordinal_position;

-- 3. Foreign keys currently installed on the two shared institutional tables.
select
  n.nspname as schema_name,
  t.relname as table_name,
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as definition,
  con.convalidated as validated
from pg_constraint con
join pg_class t on t.oid = con.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname in ('organizations', 'organization_members')
  and con.contype = 'f'
order by t.relname, con.conname;

-- 4. Check constraints on the shared institutional tables.
select
  t.relname as table_name,
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as definition,
  con.convalidated as validated
from pg_constraint con
join pg_class t on t.oid = con.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname in ('organizations', 'organization_members')
  and con.contype = 'c'
order by t.relname, con.conname;

-- 5. Presence of repository-required organization columns.
-- Returns one row per expected column, including missing columns.
with expected(column_name) as (
  values
    ('id'), ('name'), ('short_name'), ('organization_type'), ('document'),
    ('email'), ('phone'), ('website'), ('logo_url'), ('address'), ('city'),
    ('state'), ('zip_code'), ('country'), ('status'), ('created_at'), ('updated_at')
)
select
  e.column_name,
  (c.column_name is not null) as present
from expected e
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = 'organizations'
 and c.column_name = e.column_name
order by e.column_name;

-- 6. Presence of critical membership columns used by governance and validity checks.
with expected(column_name) as (
  values
    ('id'), ('organization_id'), ('user_id'), ('role'), ('status'),
    ('hierarchy_level'), ('scope_type'), ('school_id'), ('department'),
    ('knowledge_area'), ('team_code'), ('reports_to_user_id'), ('approved_by'),
    ('approved_at'), ('access_starts_at'), ('access_ends_at'),
    ('can_view_team'), ('can_view_school'), ('can_view_network'),
    ('can_manage_users'), ('can_manage_products'), ('can_audit'),
    ('can_access_private_content'), ('onboarding_completed'), ('metadata'),
    ('created_at'), ('updated_at')
)
select
  e.column_name,
  (c.column_name is not null) as present
from expected e
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = 'organization_members'
 and c.column_name = e.column_name
order by e.column_name;
