import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: handle,
    },
  },
});

// "persistent: false" means the in-memory database: everything posted is lost on restart.
// If "database_created_at" keeps changing between visits, the data is being wiped.
async function handle() {
  const { dbSource, getSql } = await import("@/lib/db");
  const persistent = dbSource === "neon";
  const database = persistent ? "postgres" : "in-memory";
  try {
    const sql = await getSql();
    const [created] = await sql<{ at: string | null }>`
      select min(applied_at)::text as at from _migrations
    `;
    const [counts] = await sql<{ events: number; community: number }>`
      select count(*)::int as events,
             count(*) filter (where source = 'community')::int as community
      from events
    `;
    return Response.json({
      ok: true,
      database,
      persistent,
      database_created_at: created?.at ?? null,
      events: counts?.events ?? 0,
      community_posts: counts?.community ?? 0,
    });
  } catch (err) {
    console.error("[health] database check failed", err);
    return Response.json(
      {
        ok: false,
        database,
        persistent,
        // Postgres errors can name the host or user, so this public page stays generic.
        error: persistent
          ? "Could not reach the database. Check DATABASE_URL and the server logs."
          : err instanceof Error
            ? err.message
            : "database check failed",
      },
      { status: 503 },
    );
  }
}
