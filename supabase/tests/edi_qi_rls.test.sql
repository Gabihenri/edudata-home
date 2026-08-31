begin;
create extension if not exists pgtap with schema extensions;

-- EDI-QI: local database security contract.
-- Structural contract follows the current governed Agenda policies.
select plan(9);

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
      and policyname = 'agenda_events_governed_select'
  ),
  'Agenda SELECT uses governed authorization'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'agenda_events'
      and policyname = 'agenda_events_governed_update'
  ),
  'Agenda UPDATE uses governed authorization'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'agenda_events'
      and policyname = 'agenda_events_owner_insert'
  ),
  'Agenda INSERT is owner-scoped'
);

select ok(
  exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'can_view_agenda_record'
  ),
  'Agenda exposes view authorization function'
);

select ok(
  exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'can_update_agenda_record'
  ),
  'Agenda exposes update authorization function'
);

select * from finish();
rollback;
