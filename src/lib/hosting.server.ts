import { createHash, randomBytes } from "node:crypto";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import type { Sql } from "@/lib/db";

export function newManageToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(`manage:${token}`).digest("hex");
}

/**
 * A stable, non-reversible id for the device's network — used to count posts
 * and keep one person from filing the same report three times. Raw IPs are
 * never stored.
 */
export function clientKey(): string {
  let ip: string | undefined;
  try {
    // Vercel sets x-real-ip itself; client-sent values never reach us there.
    ip = getRequestHeader("x-real-ip") || getRequestIP({ xForwardedFor: true }) || undefined;
  } catch {
    ip = undefined;
  }
  return createHash("sha256")
    .update(`client:${ip || "unknown"}`)
    .digest("hex")
    .slice(0, 32);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Counts one use of `bucket` for today and reports whether it is still under
 * `limit`. Backed by sync_state so it works on Neon and PGLite alike.
 */
export async function takeDailyQuota(sql: Sql, bucket: string, limit: number): Promise<boolean> {
  const key = `quota|${bucket}|${today()}`;
  const rows = await sql<{ value_int: number }>`
    insert into sync_state (key, value_int, updated_at)
    values (${key}, 1, now())
    on conflict (key) do update set value_int = sync_state.value_int + 1, updated_at = now()
    returning value_int
  `;
  const used = Number(rows[0]?.value_int ?? 0);
  if (used === 1) {
    // First use of a new day's bucket: sweep counters nobody needs anymore.
    await sql`
      delete from sync_state
      where key like 'quota|%' and updated_at < now() - interval '3 days'
    `;
  }
  return used <= limit;
}
