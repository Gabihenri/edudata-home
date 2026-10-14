begin;

select plan(15);

select has_table('public', 'organizations', 'institutional organizations table exists');
select has_table('public', 'organization_members', 'institutional membership table exists');
select has_table('public', 'eios_institutional_policies', 'institutional policies table exists');
select has_table('public', 'eios_score_governance', 'score governance table exists');
select has_table('public', 'eios_policy_audit_events', 'policy audit table exists');

select has_column('public', 'organization_members', 'user_id', 'membership is linked to an auth user');
select has_column('public', 'organization_members', 'status', 'membership status is available');
select has_column('public', 'organization_members', 'can_manage_products', 'product governance permission is available');
select has_column('public', 'organization_members', 'can_audit', 'audit permission is available');

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

select * from finish();

rollback;
