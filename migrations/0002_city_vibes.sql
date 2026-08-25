-- City Vibes: shared city events, neighborhoods, and sync bookkeeping.
-- Unowned rows (no user_id) — world-readable discovery data.

create table if not exists cities (
  id serial primary key,
  name text not null,
  state text not null,
  state_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  zoom integer not null default 11,
  ranking integer not null default 100,
  is_active boolean not null default true,
  description text,
  last_synced_at timestamptz,
  unique (name, state_code)
);

create table if not exists events (
  id serial primary key,
  city_id integer references cities(id) on delete set null,
  title text not null,
  description text,
  date_start timestamptz not null,
  date_end timestamptz,
  location_name text,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  category text not null default 'other',
  holiday text not null default 'none',
  photos_json text not null default '[]',
  is_free boolean not null default true,
  price_info text,
  age_min integer not null default 0,
  age_max integer not null default 18,
  is_permanent boolean not null default false,
  website_url text,
  status text not null default 'approved',
  featured boolean not null default false,
  source text,
  event_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists events_event_key_uidx on events (event_key) where event_key is not null;
create index if not exists events_city_date_idx on events (city_id, date_start);
create index if not exists events_status_idx on events (status);
create index if not exists events_holiday_idx on events (holiday);

create table if not exists neighborhoods (
  id serial primary key,
  name text not null,
  description text,
  city_id integer references cities(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  radius_miles double precision not null default 2,
  vibe text,
  is_active boolean not null default true
);

create index if not exists neighborhoods_city_idx on neighborhoods (city_id);

create table if not exists sync_state (
  key text primary key,
  value_int integer not null default 0,
  value_text text,
  updated_at timestamptz not null default now()
);
