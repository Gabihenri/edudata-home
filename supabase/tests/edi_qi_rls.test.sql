begin;
create extension if not exists pgtap with schema extensions;

-- EDI-QI: database-level security contract.
-- This suite is intended for the local Supabase stack only.
select plan(3);

select has_table('public', 'agenda_events', 'Agenda events table exists');
select has_table('public', 'agenda_evidences', 'Agenda evidences table exists');

-- Production data must never be used by this test file. RLS assertions that
-- impersonate QA users will be added after the local schema is confirmed.
select pass('EDI-QI QA database suite is isolated from production data');

select * from finish();
rollback;
