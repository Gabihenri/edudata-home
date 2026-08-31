begin;
create extension if not exists pgtap with schema extensions;

-- EDI-QI: local database security contract.
-- No production data or remote Supabase branch is used.
select plan(8);

select has_table('public', 'agenda_events', 'Agenda events table exists');
select has_table('public', 'agenda_evidences', 'Agenda evidences table exists');

select is(
  (select relrowsecurity from pg_class where oid = 'public.agenda_events'::regclass),
  true,
  'Agenda events has RLS enabled'
);

select is(
  (select relrowsecurity from pg_class where oid = 'public.agenda_evidences'::regclass),
  true,
  'Agenda evidences has RLS enabled'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'agenda_events'
      and policyname = 'agenda_same_organization'
  ),
  'Agenda has organization-scoped RLS policy'
);

select ok(
  exists (
    select 1 from pg_proc
    where proname = 'can_view_agenda_record'
  ),
  'Agenda exposes an authorization function'
);

select ok(
  exists (
    select 1 from pg_proc
    where proname = 'can_update_agenda_record'
  ),
  'Agenda exposes an update authorization function'
);

select ok(
  exists (
    select 1 from pg_proc
    where proname = 'apply_agenda_record_governance'
  ),
  'Agenda exposes governance enforcement'
);

select * from finish();
rollback;
