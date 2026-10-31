-- EDI-QI: regressão real de RLS do Core institucional e da Agenda.
-- Executado pelo workflow EDI-QI Local Database em Supabase local.
-- Fixtures isoladas em transação; nenhum dado persistente ou remoto é alterado.

begin;

select plan(20);

-- Dois usuários e quatro organizações para provar isolamento e janela de acesso.
insert into auth.users (
  id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'edi-qi-a@example.test', '', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'edi-qi-b@example.test', '', '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.organizations (id, name, status, organization_type)
values
  ('20000000-0000-4000-8000-000000000001', 'EDI-QI Org A', 'active', 'school'),
  ('20000000-0000-4000-8000-000000000002', 'EDI-QI Org B', 'active', 'school'),
  ('20000000-0000-4000-8000-000000000003', 'EDI-QI Org A Expired', 'active', 'school'),
  ('20000000-0000-4000-8000-000000000004', 'EDI-QI Org A Suspended', 'active', 'school');

insert into public.organization_members (
  organization_id, user_id, role, status, joined_at,
  access_starts_at, access_ends_at, can_audit
) values
  ('20000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   'professor', 'active', now(), now() - interval '1 day', null, true),
  ('20000000-0000-4000-8000-000000000003',
   '10000000-0000-4000-8000-000000000001',
   'professor', 'active', now(), now() - interval '2 days',
   now() - interval '1 day', false),
  ('20000000-0000-4000-8000-000000000004',
   '10000000-0000-4000-8000-000000000001',
   'professor', 'suspended', now(), null, null, false),
  ('20000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000002',
   'professor', 'active', now(), null, null, false);

insert into public.agenda_class_students (
  id, user_id, class_id, full_name
) values
  ('40000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   '30000000-0000-4000-8000-000000000001', 'EDI-QI Student A'),
  ('40000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000002',
   '30000000-0000-4000-8000-000000000002', 'EDI-QI Student B');

insert into public.agenda_attendance_entries (
  id, user_id, class_id, student_id, lesson_date, status, recorded_by
) values
  ('50000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001',
   '30000000-0000-4000-8000-000000000001',
   '40000000-0000-4000-8000-000000000001',
   current_date, 'present', '10000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000002',
   '30000000-0000-4000-8000-000000000002',
   '40000000-0000-4000-8000-000000000002',
   current_date, 'absent', '10000000-0000-4000-8000-000000000002');

insert into public.eios_institutional_policies (
  id, organization_id, code, name, policy_type, status, created_by, updated_by
) values
  ('60000000-0000-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001',
   'EDI-QI-A', 'EDI-QI policy A', 'pedagogical', 'active',
   '10000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000002',
   'EDI-QI-B', 'EDI-QI policy B', 'pedagogical', 'active',
   '10000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000002');

insert into public.eios_score_governance (
  id, organization_id, policy_id, score_type, score_code, score_name,
  created_by, updated_by
) values
  ('70000000-0000-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001',
   '60000000-0000-4000-8000-000000000001',
   'learning', 'EDI-QI-SCORE-A', 'EDI-QI score A',
   '10000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001'),
  ('70000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000002',
   '60000000-0000-4000-8000-000000000002',
   'learning', 'EDI-QI-SCORE-B', 'EDI-QI score B',
   '10000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000002');

insert into public.eios_policy_audit_events (
  id, organization_id, event_type, actor_user_id
) values
  ('80000000-0000-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001',
   'EDI_QI_TEST', '10000000-0000-4000-8000-000000000001'),
  ('80000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000002',
   'EDI_QI_TEST', '10000000-0000-4000-8000-000000000002');

select ok(
  (select count(*) = 7
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname = any (array[
       'organizations',
       'organization_members',
       'agenda_class_students',
       'agenda_attendance_entries',
       'eios_institutional_policies',
       'eios_score_governance',
       'eios_policy_audit_events'
     ])
     and c.relrowsecurity),
  'RLS is enabled on all seven institutional, agenda, and governance tables'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);

select is(
  (select count(*)::integer from public.organization_members),
  3,
  'User A reads only their own memberships, including suspended and expired records'
);
select is(
  (select count(*)::integer from public.organizations),
  1,
  'User A reads only organizations with an active membership inside its access window'
);
select is(
  (select count(*)::integer from public.agenda_class_students),
  1,
  'User A reads only their own class students'
);
select is(
  (select count(*)::integer from public.agenda_attendance_entries),
  1,
  'User A reads only their own attendance entries'
);
select is(
  (select count(*)::integer from public.eios_institutional_policies),
  1,
  'User A reads only policies from their organization'
);
select is(
  (select count(*)::integer from public.eios_score_governance),
  1,
  'User A reads only score governance from their organization'
);
select is(
  (select count(*)::integer from public.eios_policy_audit_events),
  1,
  'User A with can_audit reads audit events only from their organization'
);

select throws_ok(
  $$
    insert into public.agenda_class_students (user_id, class_id, full_name)
    values (
      '10000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000002',
      'EDI-QI cross-user insert'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "agenda_class_students"',
  'User A cannot insert a student owned by User B'
);
select throws_ok(
  $$
    insert into public.agenda_attendance_entries (
      user_id, class_id, student_id, lesson_date, status, recorded_by
    ) values (
      '10000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000002',
      current_date, 'present',
      '10000000-0000-4000-8000-000000000001'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "agenda_attendance_entries"',
  'User A cannot insert attendance for User B'
);
with changed as (
  update public.agenda_class_students
     set full_name = 'EDI-QI unauthorized update'
   where id = '40000000-0000-4000-8000-000000000002'
   returning id
)
select is(
  (select count(*)::integer from changed),
  0,
  'User A cannot update a student owned by User B'
);
select lives_ok(
  $$
    insert into public.eios_institutional_policies (
      organization_id, code, name, policy_type, status, created_by, updated_by
    ) values (
      '20000000-0000-4000-8000-000000000001',
      'EDI-QI-CAPABILITY-A',
      'EDI-QI capability-authorized policy',
      'pedagogical',
      'draft',
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001'
    )
  $$,
  'An active member with can_audit can manage institutional policies through the capability'
);

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);

select is(
  (select count(*)::integer from public.organization_members),
  1,
  'User B reads only their own membership'
);
select is(
  (select count(*)::integer from public.organizations),
  1,
  'User B reads only their own active organization'
);
select is(
  (select count(*)::integer from public.agenda_class_students),
  1,
  'User B reads only their own class students'
);
select is(
  (select count(*)::integer from public.agenda_attendance_entries),
  1,
  'User B reads only their own attendance entries'
);
select is(
  (select count(*)::integer from public.eios_institutional_policies),
  1,
  'User B reads only policies from their organization'
);
select is(
  (select count(*)::integer from public.eios_policy_audit_events),
  0,
  'User B without can_audit cannot read institutional audit events'
);
select is(
  (select count(*)::integer from public.eios_score_governance),
  1,
  'User B reads only score governance from their organization'
);
select throws_ok(
  $$
    insert into public.eios_institutional_policies (
      organization_id, code, name, policy_type, status, created_by, updated_by
    ) values (
      '20000000-0000-4000-8000-000000000002',
      'EDI-QI-CAPABILITY-B',
      'EDI-QI unauthorized policy',
      'pedagogical',
      'draft',
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000002'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "eios_institutional_policies"',
  'User B without governance capabilities cannot manage institutional policies'
);

select * from finish();
rollback;
