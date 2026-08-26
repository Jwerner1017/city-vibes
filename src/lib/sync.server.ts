import { getSql } from "@/lib/db";
import {
  CITY_SOURCES,
  coerceCategory,
  coerceHoliday,
  eventKey,
  fetchSocrata,
  fetchTribe,
  isFeaturedTitle,
  louisvilleAnchors,
  parseRSS,
  startOfToday,
  toIso,
  UA,
  type IncomingEvent,
} from "@/lib/sources";
import { fetchLfpl } from "@/lib/lfpl";
import { louisvilleSeasonal } from "@/lib/louisville-seasonal";
import {
  LOUISVILLE_ATTRACTIONS,
  SEED_CITIES,
  SEED_NEIGHBORHOODS,
} from "@/lib/cities-data";
import type { City, SyncResult } from "@/lib/types";

type Sql = Awaited<ReturnType<typeof getSql>>;

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

const STALE_MS = 4 * 60 * 60 * 1000;
const OTHER_BATCH_SIZE = 2;
const MIN_GAP_MS = 8 * 60 * 1000;

let inFlight: Promise<SyncResult> | null = null;

export async function ensureSeeded() {
  const sql = await getSql();
  const existing = await sql<{ c: number }>`select count(*)::int as c from cities`;
  if ((existing[0]?.c ?? 0) > 0) return;

  for (const c of SEED_CITIES) {
    await sql`
      insert into cities (name, state, state_code, latitude, longitude, zoom, ranking, is_active, description)
      values (${c.name}, ${c.state}, ${c.state_code}, ${c.latitude}, ${c.longitude}, ${c.zoom}, ${c.ranking}, true, ${c.description})
      on conflict (name, state_code) do nothing
    `;
  }

  const cities = await sql<CityRow>`select * from cities`;
  const byKey = new Map(cities.map((c) => [`${c.name}|${c.state_code}`, c]));

  for (const n of SEED_NEIGHBORHOODS) {
    const city = byKey.get(`${n.city}|${n.state_code}`);
    if (!city) continue;
    await sql`
      insert into neighborhoods (name, description, city_id, latitude, longitude, radius_miles, vibe, is_active)
      values (${n.name}, ${n.description}, ${city.id}, ${n.latitude}, ${n.longitude}, ${n.radius_miles}, ${n.vibe}, true)
    `;
  }

  const louisville = byKey.get("Louisville|KY");
  if (louisville) {
    await upsertAttractions(sql, louisville);
    for (const ev of louisvilleAnchors(louisville.latitude, louisville.longitude)) {
      await upsertOne(
        sql,
        louisville,
        ev,
        eventKey(ev.title, toIso(ev.date_start)),
        false,
      );
    }
  }

  await sql`
    insert into sync_state (key, value_int) values ('city_batch', 0)
    on conflict (key) do nothing
  `;
}

async function upsertAttractions(sql: Sql, city: CityRow) {
  const now = new Date();
  const far = new Date(now.getTime() + 400 * 86_400_000);
  for (const a of LOUISVILLE_ATTRACTIONS) {
    const key = eventKey(a.title, "permanent");
    const incoming: IncomingEvent = {
      title: a.title,
      description: a.description,
      date_start: now.toISOString(),
      date_end: far.toISOString(),
      location_name: a.title,
      address: a.address,
      latitude: a.latitude,
      longitude: a.longitude,
      category: a.category,
      is_free: a.is_free,
      price_info: a.price_info,
      age_min: a.age_min,
      age_max: a.age_max,
      website_url: a.website_url,
      featured: a.featured,
      source: "attraction",
    };
    await upsertOne(sql, city, incoming, key, true);
  }
}

function pickJob(hourUtc: number): { name: string; louisville: "if_stale" | "always"; others: number } {
  // 11:00 UTC ≈ 7am Eastern — morning lineup (zoo, visitor bureau)
  if (hourUtc === 11) return { name: "morning-louisville", louisville: "always", others: 0 };
  // 16:00 UTC ≈ 12pm Eastern — keep the rest of the map fresh
  if (hourUtc === 16) return { name: "midday-batch", louisville: "if_stale", others: OTHER_BATCH_SIZE };
  // 22:00 UTC ≈ 6pm Eastern — tonight's refresh
  if (hourUtc === 22) return { name: "evening-tonight", louisville: "always", others: 0 };
  return { name: "on-demand", louisville: "if_stale", others: 1 };
}

export async function runScheduledSync(opts?: {
  forceLouisville?: boolean;
  cityId?: number;
  fromCron?: boolean;
}): Promise<SyncResult> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      await ensureSeeded();
      const sql = await getSql();

      if (opts?.cityId) {
        const city = (
          await sql<CityRow>`select * from cities where id = ${opts.cityId} limit 1`
        )[0];
        if (!city) return { cities: [], next_batch: 0, reason: "city_not_found" };
        const one = await syncCity(sql, city);
        return { cities: [one], next_batch: 0, job: "single-city" };
      }

      const last = (
        await sql<{ updated_at: string }>`
          select updated_at from sync_state where key = 'last_run' limit 1
        `
      )[0];
      if (last?.updated_at && !opts?.forceLouisville && !opts?.fromCron) {
        const age = Date.now() - new Date(last.updated_at).getTime();
        if (age >= 0 && age < MIN_GAP_MS) {
          return { skipped: true, reason: "too_soon", cities: [], next_batch: 0 };
        }
      }

      const hourUtc = new Date().getUTCHours();
      const job = pickJob(hourUtc);
      const allCities = await sql<CityRow>`
        select * from cities where is_active = true order by ranking asc, name asc
      `;
      const louisville = allCities.find((c) => c.name === "Louisville" && c.state_code === "KY");
      const others = allCities.filter((c) => c !== louisville);

      const batchRow = (
        await sql<{ value_int: number }>`
          select value_int from sync_state where key = 'city_batch' limit 1
        `
      )[0];
      const currentBatch = batchRow?.value_int ?? 0;
      const totalBatches = Math.max(1, Math.ceil(others.length / OTHER_BATCH_SIZE));
      const start = (currentBatch % totalBatches) * OTHER_BATCH_SIZE;
      const othersToRun =
        job.others > 0 ? others.slice(start, start + job.others) : [];

      const results: SyncResult["cities"] = [];

      const louStale =
        !louisville?.last_synced_at ||
        Date.now() - new Date(louisville.last_synced_at).getTime() > STALE_MS;
      const shouldLou =
        opts?.forceLouisville ||
        job.louisville === "always" ||
        (job.louisville === "if_stale" && louStale);

      if (louisville && shouldLou) {
        results.push(await syncCity(sql, louisville));
      }

      for (const city of othersToRun) {
        results.push(await syncCity(sql, city));
      }

      const nextBatch =
        job.others > 0 ? (currentBatch + 1) % totalBatches : currentBatch;
      await sql`
        insert into sync_state (key, value_int, updated_at)
        values ('city_batch', ${nextBatch}, now())
        on conflict (key) do update set value_int = ${nextBatch}, updated_at = now()
      `;
      await sql`
        insert into sync_state (key, value_int, value_text, updated_at)
        values ('last_run', 1, ${job.name}, now())
        on conflict (key) do update set value_text = ${job.name}, updated_at = now()
      `;

      return {
        job: job.name,
        cities: results,
        next_batch: nextBatch,
      };
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

async function syncCity(sql: Sql, city: CityRow): Promise<SyncResult["cities"][number]> {
  const cityKey = `${city.name},${city.state_code}`;
  const source = CITY_SOURCES[cityKey] ?? {
    fallback: true,
    lat: city.latitude,
    lng: city.longitude,
  };
  const cityLat = source.lat || city.latitude;
  const cityLng = source.lng || city.longitude;
  const sourceCounts: Record<string, number> = {};
  const merged: IncomingEvent[] = [];
  const addFrom = (label: string, list: IncomingEvent[]) => {
    sourceCounts[label] = list.length;
    merged.push(...list);
  };

  try {
    const rssList = source.rss_urls ?? [];
    for (const rssUrl of rssList) {
      try {
        const res = await fetch(rssUrl, { headers: UA, signal: AbortSignal.timeout(12_000) });
        if (res.ok) {
          addFrom(`rss`, parseRSS(await res.text(), city.name, city.state_code, cityLat, cityLng));
        }
      } catch (err) {
        sourceCounts.rss_error = (sourceCounts.rss_error || 0) + 1;
        console.warn(`[${cityKey}] RSS failed`, err);
      }
    }

    if (source.socrata) {
      try {
        addFrom(
          "socrata",
          await fetchSocrata(
            source.socrata.domain,
            source.socrata.dataset_id,
            city.name,
            city.state_code,
            cityLat,
            cityLng,
          ),
        );
      } catch (err) {
        console.warn(`[${cityKey}] Socrata failed`, err);
      }
    }

    if (source.tribe?.length) {
      for (const feed of source.tribe) {
        try {
          addFrom(`tribe:${feed.name}`, await fetchTribe(feed));
        } catch (err) {
          console.warn(`[${cityKey}] ${feed.name} failed`, err);
        }
      }
    }

    if (cityKey === "Louisville,KY") {
      addFrom("anchors", louisvilleAnchors(cityLat, cityLng));
      addFrom("seasonal", louisvilleSeasonal());
      try {
        addFrom("lfpl", await fetchLfpl());
      } catch (err) {
        console.warn(`[${cityKey}] LFPL failed`, err);
      }
      await upsertAttractions(sql, city);
    }

    let synced = 0;
    let updated = 0;
    const seen = new Set<string>();
    const windowEnd = new Date(Date.now() + 150 * 86_400_000);
    const now = startOfToday();

    for (const raw of merged) {
      if (!raw.title || !raw.date_start) continue;
      const key = eventKey(raw.title, toIso(raw.date_start));
      if (seen.has(key)) continue;
      seen.add(key);
      const eventDate = new Date(toIso(raw.date_start));
      const eventEnd = new Date(toIso(raw.date_end || raw.date_start));
      const holiday = coerceHoliday(
        raw.holiday,
        `${raw.title} ${raw.description || ""}`,
        raw.date_start,
      );
      if (eventEnd < now) continue;
      if (holiday === "none" && eventDate > windowEnd) continue;
      const result = await upsertOne(sql, city, raw, key, false);
      if (result === "created") synced += 1;
      if (result === "updated") updated += 1;
    }

    await pruneExpired(sql, city.id);

    await sql`update cities set last_synced_at = now() where id = ${city.id}`;

    return {
      city: `${city.name}, ${city.state_code}`,
      synced,
      updated,
      found: merged.length,
      sources: sourceCounts,
    };
  } catch (err) {
    return {
      city: `${city.name}, ${city.state_code}`,
      synced: 0,
      updated: 0,
      found: 0,
      sources: sourceCounts,
      error: err instanceof Error ? err.message : "sync failed",
    };
  }
}

async function pruneExpired(sql: Sql, cityId: number) {
  await sql`
    delete from events
    where city_id = ${cityId}
      and is_permanent = false
      and holiday = 'none'
      and source is distinct from 'community'
      and date_end < now() - interval '1 day'
  `;
}

async function upsertOne(
  sql: Sql,
  city: CityRow,
  raw: IncomingEvent,
  key: string,
  isPermanent: boolean,
): Promise<"created" | "updated" | "skipped"> {
  const title = String(raw.title || "").slice(0, 200);
  const description = String(raw.description || `${title} in ${city.name}.`).slice(0, 1000);
  const blob = `${title} ${description}`;
  const category = coerceCategory(raw.category, blob);
  const holiday = coerceHoliday(raw.holiday, blob, raw.date_start);
  const dateStart = toIso(raw.date_start);
  const dateEnd = toIso(raw.date_end || raw.date_start);
  const photos = JSON.stringify((raw.photos || []).filter(Boolean).slice(0, 6));
  const featured = Boolean(raw.featured) || isFeaturedTitle(title);
  const lat = Number(raw.latitude) || city.latitude;
  const lng = Number(raw.longitude) || city.longitude;
  const location = String(raw.location_name || city.name).slice(0, 200);
  const address = String(raw.address || `${city.name}, ${city.state_code}`).slice(0, 300);
  const website = raw.website_url || null;
  const source = raw.source || "sync";

  const existing = (
    await sql<{ id: number; description: string | null; website_url: string | null; photos_json: string; featured: boolean; location_name: string | null }>`
      select id, description, website_url, photos_json, featured, location_name
      from events where event_key = ${key} limit 1
    `
  )[0];

  if (existing) {
    const longerDesc =
      description.length > (existing.description || "").length ? description : existing.description;
    const photosKeep =
      (raw.photos?.length ?? 0) > 0 && (existing.photos_json === "[]" || !existing.photos_json)
        ? photos
        : existing.photos_json;
    await sql`
      update events set
        description = ${longerDesc},
        date_start = ${dateStart},
        date_end = ${dateEnd},
        website_url = coalesce(${website}, website_url),
        photos_json = ${photosKeep},
        featured = ${featured || existing.featured},
        location_name = ${location !== city.name ? location : existing.location_name},
        latitude = ${lat},
        longitude = ${lng}
      where id = ${existing.id}
    `;
    return "updated";
  }

  await sql`
    insert into events (
      city_id, title, description, date_start, date_end, location_name, address,
      latitude, longitude, category, holiday, photos_json, is_free, price_info,
      age_min, age_max, is_permanent, website_url, status, featured, source, event_key
    ) values (
      ${city.id}, ${title}, ${description}, ${dateStart}, ${dateEnd}, ${location}, ${address},
      ${lat}, ${lng}, ${category}, ${holiday}, ${photos}, ${raw.is_free !== false}, ${raw.price_info ?? null},
      ${raw.age_min ?? 0}, ${raw.age_max ?? 18}, ${isPermanent}, ${website}, 'approved', ${featured}, ${source}, ${key}
    )
  `;
  return "created";
}

export function toCity(row: CityRow): City {
  return {
    id: row.id,
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
