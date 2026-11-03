# City Vibes

Everything happening in one city — music, art, the zoo, fish frys, trunk-or-treats, holiday parades — so locals and tourists stop hunting across Facebook groups and a pile of one-off apps.

Louisville is first. Other cities ride the same feed.

## What it does

- Pulls live calendars (zoo, Waterfront Park, Speed Art, GoToLouisville, plus community posts)
- Map, calendar, and list — grouped by Tonight / Tomorrow / the rest of the week
- Search, filters (free, outdoor, food, music), neighborhood guide, seasonal hubs
- Save on the device. No account required.
- Community “add an event” for the listings the official feeds miss

## Run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:8080`. First load seeds Louisville attractions, then syncs live calendars in the background.

```bash
npm run build
npm run typecheck
```

## Production (Base44)

`npm run build` writes a Cloudflare Workers bundle (`.output/server`, with
`.wrangler/deploy/config.json` pointing at it). That is the full-stack format
Base44 hosting deploys.

- **Database:** set `DATABASE_URL` to a Postgres connection string. Without it
  the app falls back to an in-memory database that only runs in local dev; on
  Base44 hosting every page fails with a "DATABASE_URL is not set" error.
  `npm run build` applies `migrations/` when `DATABASE_URL` is set at build time.
- **Health check:** open `/api/health`. `"persistent": true` means a real
  database. If `database_created_at` changes between visits, data is being wiped.
- **Fresh calendars:** each city re-syncs on the first visit after 4 hours.
  To also sync on a schedule, set `CRON_SECRET` and call `/api/cron/sync` with
  `Authorization: Bearer <CRON_SECRET>`.

## Layout

- `src/routes` — Discover, event detail, seasons, neighborhoods, saved, create
- `src/lib/sync.server.ts` — merge RSS + Tribe venue APIs + anchors
- `src/lib/sources.ts` — feed URLs
- `migrations/` — cities, events, neighborhoods, sync_state

## Stack

TanStack Start, React 19, Tailwind v4, Leaflet, Postgres (PGLite in local dev).
