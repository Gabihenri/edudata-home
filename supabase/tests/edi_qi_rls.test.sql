begin;
create extension if not exists pgtap with schema extensions;

-- EDI-QI: structural + behavioral RLS contract for Agenda.
select plan(17);

select has_table('public', 'agenda_events', 'Agenda events table exists');
select has_table('public', 'agenda_evidences', 'Agenda evidences table exists');
select is((select relrowsecurity from pg_class where oid = 'public.agenda_events'::regclass), true, 'Agenda events has RLS enabled');
select is((select relrowsecurity from pg_class where oid = 'public.agenda_evidences'::regclass), true, 'Agenda evidences has RLS enabled');
select ok(exists (select 1 from pg_policies where schemaname='public' and tablename='agenda_events' and policyname='agenda_events_governed_select'), 'Agenda SELECT uses governed authorization');
select ok(exists (select 1 from pg_policies where schemaname='public' and tablename='agenda_events' and policyname='agenda_events_governed_update'), 'Agenda UPDATE uses governed authorization');
select ok(exists (select 1 from pg_policies where schemaname='public' and tablename='agenda_events' and policyname='agenda_events_owner_insert'), 'Agenda INSERT is owner-scoped');
select ok(exists (select 1 from pg_proc where pronamespace='public'::regnamespace and proname='can_view_agenda_record'), 'Agenda exposes view authorization function');
select ok(exists (select 1 from pg_proc where pronamespace='public'::regnamespace and proname='can_update_agenda_record'), 'Agenda exposes update authorization function');

select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000a1','role','authenticated')::text, true);
select is(auth.uid(), '00000000-0000-0000-0000-0000000000a1'::uuid, 'Professor A JWT context resolves to A');
select ok(public.can_view_agenda_record(auth.uid()), 'Professor A can view own record');
select ok(public.can_update_agenda_record(auth.uid()), 'Professor A can update own record');

select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000b2','role','authenticated')::text, true);
select is(auth.uid(), '00000000-0000-0000-0000-0000000000b2'::uuid, 'Professor B JWT context resolves to B');
select ok(not public.can_view_agenda_record('00000000-0000-0000-0000-0000000000a1'::uuid), 'Professor B cannot view A record without an authorized relationship');
select ok(not public.can_update_agenda_record('00000000-0000-0000-0000-0000000000a1'::uuid), 'Professor B cannot update A record without an authorized relationship');

-- Same organization alone does not grant cross-user access.
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000c3','role','authenticated')::text, true);
select ok(not public.can_view_agenda_record_as(auth.uid(), '00000000-0000-0000-0000-0000000000d4'::uuid, '00000000-0000-0000-0000-0000000000e5'::uuid, null), 'Unrelated manager cannot view peer without explicit responsibility scope');

select * from finish();
rollback;
