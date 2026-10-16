import { distanceMiles } from "./geo.ts";
import { AMENITY_KEYS, type AmenityKey } from "./areas.ts";
import { safeHttpUrl } from "./safe-url.ts";

/**
 * Rules for listings posted by the people hosting them (trunk-or-treats and
 * other community events). Pure so the same checks run in tests and on the
 * server; the server functions in queries.ts are the only writers.
 */

export type HostKind = "event" | "trunk_or_treat";

export type HostInput = {
  cityId: number;
  kind: HostKind;
  title: string;
  description?: string;
  host_name?: string;
  date_start: string;
  date_end?: string | null;
  location_name?: string;
  address?: string;
  latitude: number;
  longitude: number;
  neighborhood?: string;
  category?: string;
  is_free?: boolean;
  website_url?: string;
  amenities?: string[];
};

export type HostValues = {
  title: string;
  description: string;
  host_name: string | null;
  date_start: string;
  date_end: string;
  location_name: string;
  address: string;
  latitude: number;
  longitude: number;
  neighborhood: string | null;
  category: string;
  is_free: boolean;
  website_url: string | null;
  amenities: AmenityKey[];
};

export const REPORT_REASONS = [
  { key: "wrong_info", label: "Wrong time or place" },
  { key: "cancelled", label: "It's cancelled" },
  { key: "duplicate", label: "Duplicate listing" },
  { key: "spam", label: "Spam or ad" },
  { key: "inappropriate", label: "Not family-friendly" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["key"];

/** Distinct reporters needed before a community listing hides itself. */
export const HIDE_AFTER_REPORTS = 3;
/**
 * Times a host can bring a hidden listing back by saving a correction. One
 * undoes a pile-on against a real trunk-or-treat; spam that gets reported
 * again stays down.
 */
export const MAX_RESTORES = 1;
/** Community listings one device can post per day. */
export const POSTS_PER_DEVICE_PER_DAY = 5;
/** Community listings one (non-shared) network can post per day. */
export const POSTS_PER_NETWORK_PER_DAY = 15;
/** Community listings one city can take per day (spam backstop). */
export const POSTS_PER_CITY_PER_DAY = 150;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MAX_LENGTH_MS = 14 * DAY;
const MAX_AHEAD_MS = 400 * DAY;

type Result = { ok: true; value: HostValues } | { ok: false; error: string };

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function cleanMultiline(value: unknown, max: number): string {
  return typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, max)
    : "";
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function validateHostInput(
  input: HostInput,
  city: { name: string; latitude: number; longitude: number },
  opts: { now: number; maxMiles: number; validCategories: readonly string[] },
): Result {
  const trunk = input.kind === "trunk_or_treat";

  const title = clean(input.title, 200);
  if (title.length < 3) return { ok: false, error: "Give it a name people will recognize." };

  const host = clean(input.host_name, 120);
  if (trunk && host.length < 2) {
    return { ok: false, error: "Say who's hosting — a church, school, business, or street." };
  }

  const start = parseDate(input.date_start);
  if (!start) return { ok: false, error: "Pick a date and start time." };
  if (start.getTime() < opts.now - 12 * HOUR) {
    return { ok: false, error: "That start time already passed." };
  }
  if (start.getTime() > opts.now + MAX_AHEAD_MS) {
    return { ok: false, error: "That date is more than a year out." };
  }

  let end = parseDate(input.date_end ?? null);
  if (input.date_end && !end) return { ok: false, error: "That end time doesn't look right." };
  if (trunk && !end)
    return { ok: false, error: "Add an end time so families know when to show up." };
  if (!end) end = start;
  if (end.getTime() < start.getTime()) {
    return { ok: false, error: "The end time is before the start time." };
  }
  if (end.getTime() - start.getTime() > MAX_LENGTH_MS) {
    return { ok: false, error: "Listings can run two weeks at most." };
  }

  const lat = Number(input.latitude);
  const lng = Number(input.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { ok: false, error: "Find the address on the map first." };
  }
  if (distanceMiles(city.latitude, city.longitude, lat, lng) > opts.maxMiles) {
    return { ok: false, error: `That spot is outside the ${city.name} area.` };
  }

  const rawUrl = typeof input.website_url === "string" ? input.website_url.trim() : "";
  const website = safeHttpUrl(rawUrl);
  if (rawUrl && !website)
    return { ok: false, error: "Links need to start with http:// or https://." };

  // Only the trunk-or-treat form makes trick_or_treat listings: the manage page
  // reopens them in that form, which needs a host and an end time.
  const requested = String(input.category);
  const category = trunk
    ? "trick_or_treat"
    : requested === "trick_or_treat"
      ? "holiday"
      : opts.validCategories.includes(requested)
        ? requested
        : "community";

  const amenities = Array.isArray(input.amenities)
    ? AMENITY_KEYS.filter((k) => input.amenities!.includes(k))
    : [];

  const address = clean(input.address, 300);
  const placeName = clean(input.location_name, 200) || host || address || city.name;

  return {
    ok: true,
    value: {
      title,
      description: cleanMultiline(input.description, 1000),
      host_name: host || null,
      date_start: start.toISOString(),
      date_end: end.toISOString(),
      location_name: placeName,
      address,
      latitude: lat,
      longitude: lng,
      neighborhood: clean(input.neighborhood, 80) || null,
      category,
      is_free: input.is_free !== false,
      website_url: website,
      amenities,
    },
  };
}

/** Manage tokens: 32 random bytes, URL-safe. Only the SHA-256 hash is stored. */
export function isWellFormedToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{40,64}$/.test(token);
}
