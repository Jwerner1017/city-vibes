import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cron/sync")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

async function handle({ request }: { request: Request }) {
  // Fail closed: Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" when it is set.
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return Response.json({ error: "cron not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${secret}`)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { runScheduledSync } = await import("@/lib/sync.server");
  const result = await runScheduledSync({ fromCron: true, forceLouisville: true });
  return Response.json(result);
}
