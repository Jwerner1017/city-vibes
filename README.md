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

## Production

The Grok publish step provisions Neon (`DATABASE_URL`) because this app ships
SQL migrations and `deploy.database` is on. First visitor seeds Louisville;
Vercel cron keeps the calendars fresh:

- 11:00 UTC — Louisville morning (≈ 7am Eastern)
- 16:00 UTC — rolling other-city batch
- 22:00 UTC — Louisville evening / tonight

Set optional `CRON_SECRET` on the host if you want the sync URL locked down.
Vercel Cron already sends `x-vercel-cron: 1`.

## Layout

- `src/routes` — Discover, event detail, seasons, neighborhoods, saved, create
- `src/lib/sync.server.ts` — merge RSS + Tribe venue APIs + anchors
- `src/lib/sources.ts` — feed URLs
- `migrations/` — cities, events, neighborhoods, sync_state

## Stack

TanStack Start, React 19, Tailwind v4, Leaflet, PGLite / Neon.
