-- Community hosting: trunk-or-treats and other community listings posted by the
-- people running them. Hosts get a private manage link (only its SHA-256 hash is
-- stored) so they can edit or cancel without an account. Reports are recorded
-- once per reporter; community listings hide themselves after enough of them,
-- and a host can bring a hidden listing back once by correcting it.
-- Additive and defaulted, so existing rows and queries are unaffected.

alter table events
  add column if not exists host_name text,
  add column if not exists neighborhood text,
  add column if not exists amenities_json text not null default '[]',
  add column if not exists edit_token_hash text,
  add column if not exists report_count integer not null default 0,
  add column if not exists restore_count integer not null default 0,
  add column if not exists updated_at timestamptz;

create unique index if not exists events_edit_token_hash_uidx
  on events (edit_token_hash) where edit_token_hash is not null;

create table if not exists event_reports (
  id serial primary key,
  event_id integer not null references events(id) on delete cascade,
  reporter_hash text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (event_id, reporter_hash)
);

create index if not exists event_reports_event_idx on event_reports (event_id);
