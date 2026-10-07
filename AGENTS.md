# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source. The live app is the TanStack Start app in `src/routes/*.tsx` + `src/components/*.tsx` + `src/lib/*.ts`.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.ts`: the real Vite config (TanStack Start, PGLite, auth, Tailwind v4 via `@tailwindcss/vite`).
- `.env.local`: local-only environment values; never commit secrets.

## Stale scaffold files (important)

This repo was migrated from a Base44 JS scaffold to a TypeScript TanStack Start app.
Leftover `.js`/`.jsx` scaffold files still exist and **shadow** the real `.ts`/`.tsx`
files because Vite resolves `.js`/`.jsx` before `.ts`/`.tsx`. The following stale
files were removed because they broke startup; if similar pairs reappear, delete
the `.js`/`.jsx` one:

- `vite.config.js` (imported uninstalled `@base44/vite-plugin`; real config is `vite.config.ts`)
- `postcss.config.js` (referenced uninstalled `autoprefixer`; Tailwind v4 uses `@tailwindcss/vite`)
- `src/lib/constants.js`, `src/lib/utils.js` (missing exports / `window` at module scope)
- `src/components/ui/*.jsx` (old shadcn variants; real ones are the `.tsx`)

`src/pages/*.jsx` and several `src/components/*.jsx` are also dead scaffold code
(not imported by the TanStack Router app). They fail `npm run typecheck` but do
not affect `vite build` or the dev server.

## Working Notes

- Dev server: `npm run dev` (Vite on port 8080). Uses PGLite in-browser when
  `DATABASE_URL` is unset — no external database needed for local dev.
- `npm run build` runs `vite build` (Vercel/Nitro output) then `db:migrate`.
- Run the relevant checks from `package.json` before finishing code changes.
