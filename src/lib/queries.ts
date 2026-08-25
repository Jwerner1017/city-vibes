import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import type { City, EventCategory, EventItem, HolidayKey, Neighborhood } from "@/lib/types";
import { boundingBox } from "@/lib/geo";
import { RADIUS_MILES } from "@/lib/constants";
import { coerceCategory, coerceHoliday, eventKey, toIso } from "@/lib/sources";

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

function mapEvent(row: EventRow): EventItem {
  let photos: string[] = [];
  try {
    photos = JSON.parse(row.photos_json || "[]") as string[];
    if (!Array.isArray(photos)) photos = [];
  } catch {
    photos = [];
  }
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
    const rows = await sql<EventRow>`
      select * from events
      where status = 'approved'
        and latitude between ${box.minLat} and ${box.maxLat}
        and longitude between ${box.minLng} and ${box.maxLng}
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
    const rows = await sql<EventRow>`select * from events where id = ${data.id} limit 1`;
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

export const createCommunityEvent = createServerFn({ method: "POST" })
  .validator(
    (input: {
      cityId: number;
      title: string;
      description: string;
      date_start: string;
      location_name: string;
      address: string;
      latitude: number;
      longitude: number;
      category: string;
      is_free: boolean;
      website_url?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const title = data.title.trim().slice(0, 200);
    const description = data.description.trim().slice(0, 1000);
    if (title.length < 3) throw new Error("Give the event a name.");
    if (!data.date_start) throw new Error("Pick a date.");
    const sql = await getSql();
    const today = new Date().toISOString().slice(0, 10);
    const countRow = await sql<{ c: number }>`
      select count(*)::int as c from events
      where source = 'community' and created_at::date = ${today}::date
    `;
    if ((countRow[0]?.c ?? 0) >= 25) {
      throw new Error("Today's community listings are full. Try again tomorrow.");
    }
    const dateStart = toIso(data.date_start);
    const key = `community|${eventKey(title, dateStart)}|${Date.now()}`;
    const category = coerceCategory(data.category, `${title} ${description}`);
    const holiday = coerceHoliday(undefined, `${title} ${description}`, dateStart);
    const rows = await sql<{ id: number }>`
      insert into events (
        city_id, title, description, date_start, date_end, location_name, address,
        latitude, longitude, category, holiday, photos_json, is_free,
        age_min, age_max, is_permanent, website_url, status, featured, source, event_key
      ) values (
        ${data.cityId}, ${title}, ${description}, ${dateStart}, ${dateStart},
        ${data.location_name.slice(0, 200)}, ${data.address.slice(0, 300)},
        ${data.latitude}, ${data.longitude}, ${category}, ${holiday}, '[]', ${data.is_free},
        0, 18, false, ${data.website_url || null}, 'approved', false, 'community', ${key}
      )
      returning id
    `;
    return { id: Number(rows[0].id) };
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
      const exists = await sql<{ id: number }>`select id from events where event_key = ${key} limit 1`;
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
