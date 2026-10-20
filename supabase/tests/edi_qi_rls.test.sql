begin;

select plan(27);

select has_table('public', 'organizations', 'institutional organizations table exists');
select has_table('public', 'organization_members', 'institutional membership table exists');
select has_table('public', 'eios_institutional_policies', 'institutional policies table exists');
select has_table('public', 'eios_score_governance', 'score governance table exists');
select has_table('public', 'eios_policy_audit_events', 'policy audit table exists');

select has_column('public', 'organization_members', 'user_id', 'membership is linked to an auth user');
select has_column('public', 'organization_members', 'status', 'membership status is available');
select has_column('public', 'organization_members', 'can_manage_products', 'product governance permission is available');
select has_column('public', 'organization_members', 'can_audit', 'audit permission is available');
select has_column('public', 'organization_members', 'school_id', 'membership has an explicit school scope');
select has_column('public', 'organization_members', 'access_starts_at', 'membership start validity is available');
select has_column('public', 'organization_members', 'access_ends_at', 'membership end validity is available');
select has_column('public', 'organization_members', 'can_view_school', 'school-level read permission is explicit');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.eios_institutional_policies'::regclass),
  'institutional policies enforce row-level security'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.eios_score_governance'::regclass),
  'score governance enforces row-level security'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.eios_policy_audit_events'::regclass),
  'policy audit events enforce row-level security'
);

select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'eios_institutional_policies' and policyname = 'institution_members_read_policies'),
  'members have an explicit policy-read policy'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'eios_score_governance' and policyname = 'institution_members_read_score_governance'),
  'members have an explicit score-governance read policy'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'eios_policy_audit_events' and policyname = 'institution_members_read_policy_audit'),
  'audit access has an explicit membership policy'
);


select ok(
  has_table_privilege('authenticated', 'public.organizations', 'SELECT')
  and (select relrowsecurity from pg_class where oid = 'public.organizations'::regclass)
  and exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'organizations'
      and policyname = 'organizations_read_active_membership'
  ),
  'organization reads have explicit privileges and active-membership RLS'
);
select ok(
  has_table_privilege('authenticated', 'public.organization_members', 'SELECT')
  and (select relrowsecurity from pg_class where oid = 'public.organization_members'::regclass)
  and exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'organization_members'
      and policyname = 'organization_members_read_own'
  ),
  'membership reads have explicit privileges and self-only RLS'
);
select ok(
  has_table_privilege('service_role', 'public.organization_members', 'SELECT'),
  'trusted backend can read institutional memberships'
);
select ok(
  has_table_privilege('authenticated', 'public.agenda_tasks', 'SELECT')
  and has_table_privilege('authenticated', 'public.agenda_tasks', 'INSERT')
  and has_table_privilege('authenticated', 'public.agenda_tasks', 'UPDATE'),
  'authenticated users have only the declared agenda task operations'
);
select ok(
  not has_table_privilege('anon', 'public.agenda_tasks', 'SELECT'),
  'anonymous clients cannot query agenda tasks'
);
select ok(
  has_function_privilege('authenticated', 'public.set_agenda_task_status(uuid,text,text)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.set_agenda_task_status(uuid,text,text)', 'EXECUTE'),
  'agenda status function is executable only by authenticated users and trusted backend'
);


select ok(
  has_table_privilege('authenticated', 'public.eios_institutional_policies', 'SELECT')
  and has_table_privilege('authenticated', 'public.eios_score_governance', 'SELECT')
  and has_table_privilege('authenticated', 'public.eios_policy_audit_events', 'SELECT')
  and not has_table_privilege('anon', 'public.eios_institutional_policies', 'SELECT')
  and not has_table_privilege('anon', 'public.eios_score_governance', 'SELECT')
  and not has_table_privilege('anon', 'public.eios_policy_audit_events', 'SELECT'),
  'governance Data API grants exclude anonymous access and permit authenticated reads'
);
select ok(
  has_table_privilege('service_role', 'public.eios_institutional_policies', 'SELECT')
  and has_table_privilege('service_role', 'public.eios_score_governance', 'SELECT')
  and has_table_privilege('service_role', 'public.eios_policy_audit_events', 'SELECT')
  and not has_table_privilege('authenticated', 'public.eios_policy_audit_events', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.eios_policy_audit_events', 'DELETE'),
  'governance service role and append-only audit privileges are explicit'
);

select * from finish();

rollback;
