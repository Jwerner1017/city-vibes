import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import type {
  City,
  EventCategory,
  EventItem,
  HolidayKey,
  ManagedEvent,
  Neighborhood,
} from "@/lib/types";
import { boundingBox } from "@/lib/geo";
import { RADIUS_MILES, VALID_CATEGORIES } from "@/lib/constants";
import { coerceCategory, coerceHoliday, eventKey, isFamilyFriendly, toIso } from "@/lib/sources";
import { areasForCity, nearestArea } from "@/lib/areas";
import {
  HIDE_AFTER_REPORTS,
  MAX_RESTORES,
  POSTS_PER_CITY_PER_DAY,
  POSTS_PER_DEVICE_PER_DAY,
  POSTS_PER_NETWORK_PER_DAY,
  REPORT_REASONS,
  isWellFormedToken,
  validateHostInput,
  type HostInput,
  type HostValues,
} from "@/lib/hosting";

type EventRow = {
  id: number;
  city_id: number | null;
  title: string;
  description: string | null;
  date_start: string;
  date_end: string | null;
  location_name: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  category: string;
  holiday: string;
  photos_json: string;
  is_free: boolean;
  price_info: string | null;
  age_min: number;
  age_max: number;
  is_permanent: boolean;
  website_url: string | null;
  venue_hours: string | null;
  venue_phone: string | null;
  host_name: string | null;
  neighborhood: string | null;
  amenities_json: string | null;
  report_count?: number;
  restore_count?: number;
  status: string;
  featured: boolean;
  source: string | null;
};

type CityRow = {
  id: number;
  name: string;
  state: string;
  state_code: string;
  latitude: number;
  longitude: number;
  zoom: number;
  ranking: number;
  is_active: boolean;
  description: string | null;
  last_synced_at: string | null;
};

function parseList(raw: string | null | undefined): string[] {
  try {
    const list = JSON.parse(raw || "[]") as unknown;
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function mapEvent(row: EventRow): EventItem {
  const photos = parseList(row.photos_json);
  return {
    id: Number(row.id),
    city_id: row.city_id == null ? null : Number(row.city_id),
    title: row.title,
    description: row.description,
    date_start: new Date(row.date_start).toISOString(),
    date_end: row.date_end ? new Date(row.date_end).toISOString() : null,
    location_name: row.location_name,
    address: row.address,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    category: coerceCategory(row.category, row.title),
    holiday: coerceHoliday(row.holiday, row.title, String(row.date_start)),
    photos,
    is_free: Boolean(row.is_free),
    price_info: row.price_info,
    age_min: Number(row.age_min ?? 0),
    age_max: Number(row.age_max ?? 18),
    is_permanent: Boolean(row.is_permanent),
    website_url: row.website_url,
    venue_hours: row.venue_hours ?? null,
    venue_phone: row.venue_phone ?? null,
    host_name: row.host_name ?? null,
    neighborhood: row.neighborhood ?? null,
    amenities: parseList(row.amenities_json),
    status: (row.status as EventItem["status"]) || "approved",
    featured: Boolean(row.featured),
    source: row.source,
  };
}

function mapCity(row: CityRow): City {
  return {
    id: Number(row.id),
    name: row.name,
    state: row.state,
    state_code: row.state_code,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    zoom: Number(row.zoom),
    ranking: Number(row.ranking),
    is_active: Boolean(row.is_active),
    description: row.description,
    last_synced_at: row.last_synced_at ? String(row.last_synced_at) : null,
  };
}

export const bootstrapApp = createServerFn({ method: "GET" }).handler(async () => {
  const { ensureSeeded } = await import("./sync.server");
  await ensureSeeded();
  const sql = await getSql();
  const cityRows = await sql<CityRow>`
    select * from cities where is_active = true order by ranking asc, name asc
  `;
  return { cities: cityRows.map(mapCity) };
});

export const listEvents = createServerFn({ method: "GET" })
  .validator(
    (input: {
      cityId: number;
      lat: number;
      lng: number;
      category?: EventCategory | null;
      holiday?: HolidayKey | null;
      is_free?: boolean | null;
      age_min?: number | null;
      age_max?: number | null;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { ensureSeeded } = await import("./sync.server");
    await ensureSeeded();
    const sql = await getSql();
    const box = boundingBox(data.lat, data.lng, RADIUS_MILES);
    // Filter before the limit: with hundreds of synced listings, filtering after
    // it silently dropped late-season events (Halloween showed 3 of dozens).
    // Long-past one-offs are skipped; the calendar can still look back ~6 weeks.
    const category = data.category ?? null;
    const holiday = data.holiday ?? null;
    const isFree = typeof data.is_free === "boolean" ? data.is_free : null;
    const rows = await sql<EventRow>`
      select * from events
      where status = 'approved'
        and venue_closed = false
        and latitude between ${box.minLat} and ${box.maxLat}
        and longitude between ${box.minLng} and ${box.maxLng}
        and (is_permanent or coalesce(date_end, date_start) >= now() - interval '45 days')
        and (${category}::text is null or category = ${category}::text)
        and (${holiday}::text is null or holiday = ${holiday}::text)
        and (${isFree}::boolean is null or is_free = ${isFree}::boolean)
      order by featured desc, is_permanent asc, date_start asc
      limit 500
    `;
    let events = rows.map(mapEvent);
    if (data.category) events = events.filter((e) => e.category === data.category);
    if (data.holiday) events = events.filter((e) => e.holiday === data.holiday);
    if (data.is_free === true) events = events.filter((e) => e.is_free);
    if (data.is_free === false) events = events.filter((e) => !e.is_free);
    if (data.age_min != null && data.age_max != null) {
      events = events.filter((e) => e.age_min <= data.age_max! && e.age_max >= data.age_min!);
    }
    return events;
  });

export const getEvent = createServerFn({ method: "GET" })
  .validator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<EventRow>`
      select * from events
      where id = ${data.id}
        and status not in ('hidden', 'rejected')
        -- A reported listing its host then cancelled stays out of view too.
        and not (status = 'cancelled' and report_count >= ${HIDE_AFTER_REPORTS})
      limit 1
    `;
    if (!rows[0]) return null;
    return mapEvent(rows[0]);
  });

export const listNeighborhoods = createServerFn({ method: "GET" })
  .validator((input: { cityId: number }) => input)
  .handler(async ({ data }) => {
    const { ensureSeeded } = await import("./sync.server");
    await ensureSeeded();
    const sql = await getSql();
    const rows = await sql<Neighborhood>`
      select id, name, description, city_id, latitude, longitude, radius_miles, vibe, is_active
      from neighborhoods
      where city_id = ${data.cityId} and is_active = true
      order by name asc
    `;
    return rows.map((n) => ({
      ...n,
      id: Number(n.id),
      city_id: Number(n.city_id),
      latitude: Number(n.latitude),
      longitude: Number(n.longitude),
      radius_miles: Number(n.radius_miles),
      is_active: Boolean(n.is_active),
    }));
  });

export const runSync = createServerFn({ method: "POST" })
  .validator((input: { cityId?: number; forceLouisville?: boolean }) => input ?? {})
  .handler(async ({ data }) => {
    const { runScheduledSync } = await import("./sync.server");
    return runScheduledSync({
      cityId: data?.cityId,
      forceLouisville: data?.forceLouisville,
    });
  });

type CityLite = {
  id: number;
  name: string;
  state_code: string;
  latitude: number;
  longitude: number;
};

async function cityById(cityId: number): Promise<CityLite | null> {
  const sql = await getSql();
  const rows = await sql<CityLite>`
    select id, name, state_code, latitude, longitude from cities where id = ${cityId} limit 1
  `;
  const c = rows[0];
  return c
    ? { ...c, id: Number(c.id), latitude: Number(c.latitude), longitude: Number(c.longitude) }
    : null;
}

/** Narrows untrusted JSON from the browser to the HostInput shape; content is checked later. */
function asHostInput(input: unknown): HostInput {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  return {
    cityId: Number(o.cityId),
    kind: o.kind === "trunk_or_treat" ? "trunk_or_treat" : "event",
    title: str(o.title) ?? "",
    description: str(o.description),
    host_name: str(o.host_name),
    date_start: str(o.date_start) ?? "",
    date_end: str(o.date_end) ?? null,
    location_name: str(o.location_name),
    address: str(o.address),
    latitude: Number(o.latitude),
    longitude: Number(o.longitude),
    neighborhood: str(o.neighborhood),
    category: str(o.category),
    is_free: o.is_free !== false,
    website_url: str(o.website_url),
    amenities: Array.isArray(o.amenities) ? o.amenities.filter((a) => typeof a === "string") : [],
  };
}

function checkHostInput(input: HostInput, city: CityLite): HostValues {
  const result = validateHostInput(input, city, {
    now: Date.now(),
    maxMiles: RADIUS_MILES,
    validCategories: VALID_CATEGORIES,
  });
  if (!result.ok) throw new Error(result.error);
  const v = result.value;
  if (!isFamilyFriendly(v.title, `${v.description} ${v.host_name ?? ""}`)) {
    throw new Error("City Vibes only lists family-friendly events.");
  }
  return v;
}

function holidayFor(v: HostValues): HolidayKey {
  if (v.category === "trick_or_treat") return "halloween";
  return coerceHoliday(undefined, `${v.title} ${v.description}`, v.date_start);
}

function tokenOrThrow(token: unknown): string {
  if (!isWellFormedToken(token)) throw new Error("That manage link isn't valid.");
  return token;
}

/** Looks up an address for the host form and suggests the area it belongs to. */
export const geocodeAddress = createServerFn({ method: "POST" })
  .validator((input: { cityId: number; address: string }) => ({
    cityId: Number(input?.cityId),
    address: String(input?.address ?? "").slice(0, 300),
  }))
  .handler(async ({ data }) => {
    const { takeVisitorQuota, visitor } = await import("./hosting.server");
    const { geocode } = await import("./geocode.server");
    const city = await cityById(data.cityId);
    if (!city) return { ok: false as const, error: "Pick a city first." };
    if (data.address.trim().length < 4) {
      return { ok: false as const, error: "Type a street address or place name." };
    }
    const sql = await getSql();
    const who = await visitor(sql);
    if (!(await takeVisitorQuota(sql, who, "geocode", { device: 80, network: 240 }))) {
      return { ok: false as const, error: "Too many lookups today — drop the pin by hand." };
    }
    const hit = await geocode(data.address, city, RADIUS_MILES);
    if (!hit) {
      return {
        ok: false as const,
        error: `Couldn't find that in the ${city.name} area. Drag the pin to the spot.`,
      };
    }
    return {
      ok: true as const,
      latitude: hit.latitude,
      longitude: hit.longitude,
      matched: hit.matched,
      area: nearestArea(areasForCity(city.name, city.state_code), hit.latitude, hit.longitude),
    };
  });

/**
 * Publishes a community listing (any event, or a hosted trunk-or-treat). Returns
 * a one-time manage token; only its hash is stored, so it can't be recovered.
 */
export const createCommunityEvent = createServerFn({ method: "POST" })
  .validator(asHostInput)
  .handler(async ({ data }) => {
    const { hashToken, newManageToken, takeDailyQuota, takeVisitorQuota, visitor } =
      await import("./hosting.server");
    const city = await cityById(data.cityId);
    if (!city) throw new Error("Pick a city first.");
    const v = checkHostInput(data, city);

    const sql = await getSql();
    const who = await visitor(sql);
    if (
      !(await takeVisitorQuota(sql, who, "post", {
        device: POSTS_PER_DEVICE_PER_DAY,
        network: POSTS_PER_NETWORK_PER_DAY,
      }))
    ) {
      throw new Error("You've posted the most listings allowed today. Try again tomorrow.");
    }
    if (!(await takeDailyQuota(sql, `post|city|${city.id}`, POSTS_PER_CITY_PER_DAY))) {
      throw new Error("Today's community listings are full. Try again tomorrow.");
    }

    const token = newManageToken();
    const key = `community|${eventKey(v.title, v.date_start)}|${hashToken(token).slice(0, 16)}`;
    const rows = await sql<{ id: number }>`
      insert into events (
        city_id, title, description, date_start, date_end, location_name, address,
        latitude, longitude, category, holiday, photos_json, is_free,
        age_min, age_max, is_permanent, website_url, status, featured, source, event_key,
        host_name, neighborhood, amenities_json, edit_token_hash
      ) values (
        ${city.id}, ${v.title}, ${v.description}, ${v.date_start}, ${v.date_end},
        ${v.location_name}, ${v.address}, ${v.latitude}, ${v.longitude},
        ${v.category}, ${holidayFor(v)}, '[]', ${v.is_free},
        0, 18, false, ${v.website_url}, 'approved', false, 'community', ${key},
        ${v.host_name}, ${v.neighborhood}, ${JSON.stringify(v.amenities)}, ${hashToken(token)}
      )
      returning id
    `;
    return { id: Number(rows[0].id), manageToken: token };
  });

async function findManaged(token: string): Promise<EventRow | null> {
  const { hashToken } = await import("./hosting.server");
  const sql = await getSql();
  const rows = await sql<EventRow>`
    select * from events
    where edit_token_hash = ${hashToken(token)} and source = 'community'
    limit 1
  `;
  return rows[0] ?? null;
}

/** The listing behind a manage link, for the host's edit screen. */
export const getManagedEvent = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => ({ token: tokenOrThrow(input?.token) }))
  .handler(async ({ data }): Promise<ManagedEvent | null> => {
    const row = await findManaged(data.token);
    if (!row) return null;
    return {
      ...mapEvent(row),
      restores_left: Math.max(0, MAX_RESTORES - Number(row.restore_count ?? 0)),
    };
  });

export const updateCommunityEvent = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    return { token: tokenOrThrow(o.token), listing: asHostInput(o) };
  })
  .handler(async ({ data }) => {
    const { takeVisitorQuota, visitor } = await import("./hosting.server");
    const row = await findManaged(data.token);
    if (!row) throw new Error("That manage link doesn't match a listing.");
    if (row.status === "cancelled") throw new Error("This listing was cancelled.");
    const city = await cityById(Number(row.city_id));
    if (!city) throw new Error("That city is no longer listed.");

    const kind = row.category === "trick_or_treat" ? "trunk_or_treat" : "event";
    const v = checkHostInput({ ...data.listing, cityId: city.id, kind }, city);

    const sql = await getSql();
    const who = await visitor(sql);
    if (!(await takeVisitorQuota(sql, who, "edit", { device: 60, network: 200 }))) {
      throw new Error("Too many edits today. Try again tomorrow.");
    }
    // A hidden listing comes back once when its host corrects it; its old
    // reports are cleared so the same neighbors can flag it again if needed.
    const restoring = row.status === "hidden" && Number(row.restore_count ?? 0) < MAX_RESTORES;
    if (restoring) await sql`delete from event_reports where event_id = ${row.id}`;
    await sql`
      update events set
        status = case when ${restoring}::boolean then 'approved' else status end,
        report_count = case when ${restoring}::boolean then 0 else report_count end,
        restore_count = restore_count + case when ${restoring}::boolean then 1 else 0 end,
        title = ${v.title}, description = ${v.description},
        date_start = ${v.date_start}, date_end = ${v.date_end},
        location_name = ${v.location_name}, address = ${v.address},
        latitude = ${v.latitude}, longitude = ${v.longitude},
        category = ${v.category}, holiday = ${holidayFor(v)}, is_free = ${v.is_free},
        website_url = ${v.website_url}, host_name = ${v.host_name},
        neighborhood = ${v.neighborhood}, amenities_json = ${JSON.stringify(v.amenities)},
        updated_at = now()
      where id = ${row.id}
    `;
    return { id: Number(row.id), restored: restoring };
  });

export const cancelCommunityEvent = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => ({ token: tokenOrThrow(input?.token) }))
  .handler(async ({ data }) => {
    const row = await findManaged(data.token);
    if (!row) throw new Error("That manage link doesn't match a listing.");
    const sql = await getSql();
    await sql`update events set status = 'cancelled', updated_at = now() where id = ${row.id}`;
    return { id: Number(row.id) };
  });

/**
 * Neighbors flag a listing. Each reporter (their network, or their device on a
 * shared network) counts once per listing; community listings hide after
 * HIDE_AFTER_REPORTS distinct reports. Official feeds are only logged, so nobody
 * can knock the zoo off the map.
 */
export const reportEvent = createServerFn({ method: "POST" })
  .validator((input: { id: number; reason: string }) => {
    const reason = String(input?.reason ?? "");
    if (!REPORT_REASONS.some((r) => r.key === reason)) throw new Error("Pick a reason.");
    return { id: Number(input?.id), reason };
  })
  .handler(async ({ data }) => {
    const { takeVisitorQuota, visitor } = await import("./hosting.server");
    const sql = await getSql();
    const event = (
      await sql<{ id: number; source: string | null; status: string }>`
        select id, source, status from events where id = ${data.id} limit 1
      `
    )[0];
    if (!event || event.status !== "approved") return { ok: true as const, hidden: false };

    const who = await visitor(sql);
    const reporter = who.reporter;
    if (!(await takeVisitorQuota(sql, who, "report", { device: 20, network: 40 }))) {
      throw new Error("Too many reports today. Thanks for looking out.");
    }
    await sql`
      insert into event_reports (event_id, reporter_hash, reason)
      values (${event.id}, ${reporter}, ${data.reason})
      on conflict (event_id, reporter_hash) do nothing
    `;
    const count = Number(
      (
        await sql<{ c: number }>`
          select count(*)::int as c from event_reports where event_id = ${event.id}
        `
      )[0]?.c ?? 0,
    );
    const hide = event.source === "community" && count >= HIDE_AFTER_REPORTS;
    await sql`
      update events set report_count = ${count},
        status = case when ${hide}::boolean then 'hidden' else status end
      where id = ${event.id}
    `;
    return { ok: true as const, hidden: hide };
  });

export const grokDiscover = createServerFn({ method: "POST" })
  .validator((input: { cityId: number }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Grok is not available here yet." };

    const sql = await getSql();
    const last = (
      await sql<{ updated_at: string }>`
        select updated_at from sync_state where key = ${"grok_" + data.cityId} limit 1
      `
    )[0];
    if (last?.updated_at) {
      const age = Date.now() - new Date(last.updated_at).getTime();
      if (age >= 0 && age < 12 * 60 * 60 * 1000) {
        return {
          ok: false as const,
          error: "Already asked Grok for this city today. Live sources are still updating.",
        };
      }
    }

    const city = (
      await sql<{
        id: number;
        name: string;
        state_code: string;
        latitude: number;
        longitude: number;
      }>`
        select id, name, state_code, latitude, longitude from cities where id = ${data.cityId} limit 1
      `
    )[0];
    if (!city) return { ok: false as const, error: "City not found." };

    const existing = await sql<{ title: string }>`
      select title from events
      where city_id = ${city.id} and date_start >= now()
      order by date_start asc limit 40
    `;
    const already = existing.map((e) => e.title).join("; ");
    const today = new Date().toISOString().slice(0, 10);
    const windowEnd = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 1800,
        messages: [
          {
            role: "system",
            content:
              "You find real, currently scheduled, family-friendly public events. Return JSON only.",
          },
          {
            role: "user",
            content: `Find 12 REAL upcoming family-friendly events in ${city.name}, ${city.state_code} from ${today} through ${windowEnd}.
Skip anything already in this list: ${already || "(none yet)"}.
Cover parks, libraries, waterfront, zoo, museums, farmers markets, holiday festivals, parades, free outdoor concerts, community festivals.
Skip nightlife and 21+. Confirmed public events only.
Return JSON: {"events":[{ "title": string, "description": string, "date_start": "YYYY-MM-DDTHH:MM:SS", "date_end": string, "location_name": string, "address": string, "latitude": number, "longitude": number, "category": string, "holiday": string, "is_free": boolean, "price_info": string, "website_url": string }]}
Fallback coords: ${city.latitude},${city.longitude}.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return { ok: false as const, error: `Grok returned ${res.status}` };
    const body = (await res.json()) as { choices: { message: { content: string } }[] };
    const text = body.choices[0]?.message.content ?? "{}";
    let parsed: { events?: IncomingLite[] } = {};
    try {
      parsed = JSON.parse(text) as { events?: IncomingLite[] };
    } catch {
      return { ok: false as const, error: "Could not read Grok's list." };
    }
    const list = Array.isArray(parsed.events) ? parsed.events : [];
    let created = 0;
    for (const raw of list.slice(0, 12)) {
      if (!raw?.title || !raw.date_start) continue;
      const title = String(raw.title).slice(0, 200);
      const description = String(raw.description || "").slice(0, 1000);
      const dateStart = toIso(raw.date_start);
      const key = eventKey(title, dateStart);
      const exists = await sql<{
        id: number;
      }>`select id from events where event_key = ${key} limit 1`;
      if (exists[0]) continue;
      const category = coerceCategory(raw.category, `${title} ${description}`);
      const holiday = coerceHoliday(raw.holiday, `${title} ${description}`, dateStart);
      await sql`
        insert into events (
          city_id, title, description, date_start, date_end, location_name, address,
          latitude, longitude, category, holiday, photos_json, is_free, price_info,
          age_min, age_max, is_permanent, website_url, status, featured, source, event_key
        ) values (
          ${city.id}, ${title}, ${description}, ${dateStart}, ${toIso(raw.date_end || raw.date_start)},
          ${String(raw.location_name || city.name).slice(0, 200)},
          ${String(raw.address || `${city.name}, ${city.state_code}`).slice(0, 300)},
          ${Number(raw.latitude) || city.latitude}, ${Number(raw.longitude) || city.longitude},
          ${category}, ${holiday}, '[]', ${raw.is_free !== false}, ${raw.price_info || null},
          0, 18, false, ${raw.website_url || null}, 'approved', false, 'grok', ${key}
        )
      `;
      created += 1;
    }
    await sql`
      insert into sync_state (key, value_int, updated_at)
      values (${"grok_" + data.cityId}, ${created}, now())
      on conflict (key) do update set value_int = ${created}, updated_at = now()
    `;
    return { ok: true as const, created };
  });

type IncomingLite = {
  title?: string;
  description?: string;
  date_start?: string;
  date_end?: string;
  location_name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  holiday?: string;
  is_free?: boolean;
  price_info?: string;
  website_url?: string;
};
