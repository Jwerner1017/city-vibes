-- Venue freshness: permanent listings (convention centers, expo halls, art
-- museums, parks) are re-verified against their own websites, so a moved link,
-- a published hours change, or a closure shows up on the next sync.
-- Additive and defaulted, so existing rows and queries are unaffected.

alter table events
  add column if not exists venue_hours text,
  add column if not exists venue_phone text,
  add column if not exists venue_checked_at timestamptz,
  add column if not exists venue_fail_count integer not null default 0,
  add column if not exists venue_closed boolean not null default false;

create index if not exists events_venue_check_idx
  on events (city_id, venue_checked_at)
  where is_permanent = true;