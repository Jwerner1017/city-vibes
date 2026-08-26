import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cron/sync")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get("x-vercel-cron") === "1";
}

async function handle({ request }: { request: Request }) {
  if (!cronAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { runScheduledSync } = await import("@/lib/sync.server");
  const result = await runScheduledSync({ fromCron: true, forceLouisville: true });
  return Response.json(result);
}
