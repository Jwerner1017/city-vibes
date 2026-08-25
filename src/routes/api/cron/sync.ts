import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cron/sync")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});

async function handle() {
  const { runScheduledSync } = await import("@/lib/sync.server");
  const result = await runScheduledSync();
  return Response.json(result);
}
