-- Hosted Postgres like Supabase publishes tables in the public schema through
-- its REST API. Turning on row level security with no policies blocks that API,
-- while the app's own connection (the tables' owner) is unaffected.

alter table cities enable row level security;
alter table events enable row level security;
alter table neighborhoods enable row level security;
alter table sync_state enable row level security;
alter table event_reports enable row level security;
alter table _migrations enable row level security;
