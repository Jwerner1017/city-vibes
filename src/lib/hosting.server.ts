import { createHash, randomBytes } from "node:crypto";
import { getCookie, getRequestHeader, getRequestIP, setCookie } from "@tanstack/react-start/server";
import type { Sql } from "@/lib/db";

export function newManageToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(`manage:${token}`).digest("hex");
}

function digest(label: string, value: string): string {
  return createHash("sha256").update(`${label}:${value}`).digest("hex").slice(0, 32);
}

const DEVICE_COOKIE = "cv_device";
/** This many devices on one network in a day means it's shared (proxy, school, church Wi-Fi). */
const SHARED_NETWORK_DEVICES = 10;

/**
 * The visitor's network. On Vercel only headers Vercel itself sets are used
 * (it overwrites them, so clients can't forge them); elsewhere — Base44
 * preview, local dev — the proxy chain is the best signal there is.
 */
function networkIp(): string | undefined {
  try {
    const real = getRequestHeader("x-real-ip")?.trim();
    if (process.env.VERCEL) {
      const vercel = getRequestHeader("x-vercel-forwarded-for")?.split(",")[0]?.trim();
      return vercel || real || undefined;
    }
    return real || getRequestIP({ xForwardedFor: true }) || undefined;
  } catch {
    return undefined;
  }
}

/** A random per-browser id in an httpOnly cookie. Raw ids and IPs are never stored. */
function deviceId(): string {
  try {
    const existing = getCookie(DEVICE_COOKIE);
    if (existing && /^[A-Za-z0-9_-]{22}$/.test(existing)) return existing;
    const id = randomBytes(16).toString("base64url");
    setCookie(DEVICE_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 400 * 24 * 60 * 60,
    });
    return id;
  } catch {
    return "unknown";
  }
}

export type Visitor = {
  device: string;
  network: string;
  /** Many devices share this network today, so it says little about who is asking. */
  sharedNetwork: boolean;
  /** Who counts as "one reporter": the network when it's personal, else the device. */
  reporter: string;
};

/**
 * Identifies the visitor for quotas and report counting. If the app sits behind
 * a proxy that makes everyone look like one address, network limits switch off
 * for that address instead of locking out the whole city.
 */
export async function visitor(sql: Sql): Promise<Visitor> {
  const device = digest("device", deviceId());
  const network = digest("client", networkIp() || "unknown");
  const day = today();
  await sql`
    insert into sync_state (key, value_int, updated_at)
    values (${`seen|${day}|${network}|${device}`}, 1, now())
    on conflict (key) do update set updated_at = now()
  `;
  const seen = Number(
    (
      await sql<{ c: number }>`
        select count(*)::int as c from sync_state where key like ${`seen|${day}|${network}|%`}
      `
    )[0]?.c ?? 0,
  );
  const sharedNetwork = seen >= SHARED_NETWORK_DEVICES;
  return { device, network, sharedNetwork, reporter: sharedNetwork ? device : network };
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
      where (key like 'quota|%' or key like 'seen|%') and updated_at < now() - interval '3 days'
    `;
  }
  return used <= limit;
}

/**
 * Per-device and per-network daily limits for one action. The network limit is
 * skipped on shared networks; the city-wide caps in queries.ts still apply.
 */
export async function takeVisitorQuota(
  sql: Sql,
  who: Visitor,
  action: string,
  limits: { device: number; network: number },
): Promise<boolean> {
  const deviceOk = await takeDailyQuota(sql, `${action}|d|${who.device}`, limits.device);
  if (!deviceOk) return false;
  if (who.sharedNetwork) return true;
  return takeDailyQuota(sql, `${action}|n|${who.network}`, limits.network);
}
