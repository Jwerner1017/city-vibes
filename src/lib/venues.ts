// Keeps the permanent venue listings honest.
//
// Two layers, cheapest first:
//   1. refreshVenues() — re-reads each venue's own website (no credentials),
//      repairs links that moved, and picks up published hours, phone, and
//      social image. A 404/410 on three separate checks retires the listing.
//   2. researchVenuesWithGrok() — with an XAI_API_KEY configured, asks Grok
//      once a week to re-confirm the whole list (still open, current hours and
//      prices) and to name major family venues the city is still missing.
//
// Both are throttled and capped so a page-load sync stays fast.

import type { Sql } from "@/lib/db";
import { coerceCategory, eventKey, normalizeTitle } from "@/lib/sources";

type VenueCheckTarget = {
  id: number;
  title: string;
  description: string | null;
  website_url: string | null;
  photos_json: string | null;
  venue_fail_count: number;
  venue_closed: boolean;
};

type LdNode = Record<string, unknown>;

type VenueCheck = {
  /** The site answered and was readable. */
  checked: boolean;
  /** 404/410 — strong evidence the page is retired. */
  gone: boolean;
  moved_to: string | null;
  image: string | null;
  hours: string | null;
  phone: string | null;
  description: string | null;
};

export type VenueRefresh = { checked: number; updated: number; closed: number };
export type VenueAiRefresh = { verified: number; updated: number; added: number } | null;

const FETCH_TIMEOUT_MS = 6000;
const CHECKS_PER_RUN = 4;
const CLOSE_AFTER_FAILURES = 3;
const AI_MIN_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const AI_TIMEOUT_MS = 25_000;
const NEW_VENUE_LIMIT = 8;
const CURATED_DESCRIPTION_MIN = 80;
const PERMANENT_WINDOW_DAYS = 400;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const OG_IMAGE_PATTERNS = [
  /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
  /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
];

const DESCRIPTION_PATTERNS = [
  /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
];

const CANONICAL_PATTERNS = [
  /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
  /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
];

/** schema.org types that describe a place a family can visit. */
const VENUE_LD_TYPES = [
  "museum",
  "artgallery",
  "eventvenue",
  "conventioncenter",
  "touristattraction",
  "civicstructure",
  "performingartstheater",
  "sportsactivitylocation",
  "stadiumorarena",
  "amusementpark",
  "zoo",
  "aquarium",
  "park",
  "library",
  "landmarksorhistoricalbuildings",
  "localbusiness",
  "organization",
];

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function decodeEntities(s: string) {
  const named: Record<string, string> = {
    amp: "&",
    quot: '"',
    lt: "<",
    gt: ">",
    nbsp: " ",
    apos: "'",
  };
  return s
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_m, ent: string) => {
      if (ent[0] === "#") {
        const n =
          ent[1] === "x" || ent[1] === "X"
            ? parseInt(ent.slice(2), 16)
            : parseInt(ent.slice(1), 10);
        return Number.isFinite(n) ? String.fromCharCode(n) : _m;
      }
      return named[ent] ?? _m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = re.exec(html);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return null;
}

function bareHost(host: string) {
  return host.replace(/^www\./i, "").toLowerCase();
}

function cleanUrl(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || !/^https?:\/\//i.test(raw)) return null;
  try {
    return new URL(raw).toString().slice(0, 400);
  } catch {
    return null;
  }
}

function flattenLd(item: unknown): LdNode[] {
  if (!item || typeof item !== "object") return [];
  const node = item as LdNode;
  const out: LdNode[] = [node];
  if (Array.isArray(node["@graph"])) {
    for (const child of node["@graph"]) out.push(...flattenLd(child));
  }
  return out;
}

function jsonLdNodes(html: string): LdNode[] {
  const out: LdNode[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    const list = Array.isArray(parsed) ? parsed : [parsed];
    for (const entry of list) out.push(...flattenLd(entry));
  }
  return out;
}

function typeNames(node: LdNode): string[] {
  const t = node["@type"];
  const list = Array.isArray(t) ? t : [t];
  return list
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.toLowerCase());
}

function pickVenueNode(nodes: LdNode[]): LdNode | null {
  const typed = nodes.find((n) => typeNames(n).some((t) => VENUE_LD_TYPES.includes(t)));
  if (typed) return typed;
  return (
    nodes.find(
      (n) =>
        typeof n.name === "string" &&
        (n.telephone || n.openingHours || n.openingHoursSpecification),
    ) ?? null
  );
}

function schemaDay(value: unknown): string {
  const raw = Array.isArray(value) ? value.join("/") : value;
  return String(raw ?? "").replace(/^https?:\/\/schema\.org\//i, "");
}

function formatHours(node: LdNode): string | null {
  const spec = node.openingHoursSpecification;
  if (Array.isArray(spec)) {
    const parts: string[] = [];
    for (const entry of spec) {
      if (!entry || typeof entry !== "object") continue;
      const item = entry as LdNode;
      const day = schemaDay(item.dayOfWeek);
      const opens = typeof item.opens === "string" ? item.opens : "";
      const closes = typeof item.closes === "string" ? item.closes : "";
      const window = opens && closes ? `${opens}-${closes}` : opens || closes;
      parts.push([day, window].filter(Boolean).join(" "));
    }
    const joined = parts.filter(Boolean).join("; ");
    if (joined) return joined.slice(0, 180);
  }
  const raw = node.openingHours;
  if (Array.isArray(raw)) {
    const joined = raw.filter((x): x is string => typeof x === "string").join("; ");
    if (joined) return joined.slice(0, 180);
  }
  if (typeof raw === "string" && raw.trim()) return raw.trim().slice(0, 180);
  return null;
}

async function checkVenue(row: VenueCheckTarget): Promise<VenueCheck> {
  const empty: VenueCheck = {
    checked: false,
    gone: false,
    moved_to: null,
    image: null,
    hours: null,
    phone: null,
    description: null,
  };
  const stored = row.website_url;
  if (!stored) return { ...empty, checked: true };

  try {
    const res = await fetch(stored, {
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.status === 404 || res.status === 410) return { ...empty, gone: true };
    // 403/429/5xx means the site is blocking or busy — never read as a closure.
    if (!res.ok) return empty;

    const html = (await res.text()).slice(0, 500_000);
    const base = res.url || stored;

    const canonicalRaw = metaContent(html, CANONICAL_PATTERNS);
    let resolved = base;
    if (canonicalRaw) {
      try {
        resolved = new URL(canonicalRaw, base).toString();
      } catch {
        // Keep the redirect target when a canonical tag is malformed.
      }
    }

    let movedTo: string | null = null;
    try {
      const from = new URL(stored);
      const to = new URL(resolved);
      if (bareHost(from.host) !== bareHost(to.host)) {
        movedTo = `${to.origin}${to.pathname === "/" ? "" : to.pathname}`;
      }
    } catch {
      movedTo = null;
    }

    const imageRaw = metaContent(html, OG_IMAGE_PATTERNS);
    let image: string | null = null;
    if (imageRaw) {
      try {
        image = new URL(imageRaw, base).toString().slice(0, 500);
      } catch {
        image = null;
      }
    }

    const node = pickVenueNode(jsonLdNodes(html));
    const phone = node && typeof node.telephone === "string" ? node.telephone : null;
    const description = metaContent(html, DESCRIPTION_PATTERNS);

    return {
      checked: true,
      gone: false,
      moved_to: movedTo,
      image,
      hours: node ? formatHours(node) : null,
      phone: phone ? phone.slice(0, 60) : null,
      description: description ? description.slice(0, 1000) : null,
    };
  } catch {
    // Timeout, DNS or TLS failure — leave the row exactly as it was.
    return empty;
  }
}

function parsePhotos(json: string | null): string[] {
  try {
    const parsed = JSON.parse(json || "[]");
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Re-checks the venues whose details are oldest, capped per run so a sync
 * triggered by a page load never becomes a long request.
 */
export async function refreshVenues(sql: Sql, cityId: number): Promise<VenueRefresh> {
  const rows = await sql`
    select id, title, description, website_url, photos_json, venue_fail_count, venue_closed
    from events
    where city_id = ${cityId}
      and is_permanent = true
      and (venue_checked_at is null or venue_checked_at < now() - interval '3 days')
    order by venue_checked_at asc nulls first, id asc
    limit ${CHECKS_PER_RUN}
  `;

  const targets: VenueCheckTarget[] = rows.map((row) => ({
    id: num(row.id) ?? 0,
    title: String(row.title ?? ""),
    description: str(row.description),
    website_url: str(row.website_url),
    photos_json: str(row.photos_json),
    venue_fail_count: num(row.venue_fail_count) ?? 0,
    venue_closed: row.venue_closed === true,
  }));
  if (targets.length === 0) return { checked: 0, updated: 0, closed: 0 };

  const results = await Promise.allSettled(targets.map((row) => checkVenue(row)));
  let updated = 0;
  let closed = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const row = targets[i];
    const settled = results[i];
    const check = settled.status === "fulfilled" ? settled.value : null;

    if (!check || (!check.checked && !check.gone)) {
      // Unreachable: stamp the attempt so the queue keeps rotating, and never
      // treat a blocked fetch as evidence that a venue closed.
      await sql`update events set venue_checked_at = now() where id = ${row.id}`;
      continue;
    }

    if (check.gone) {
      const failures = row.venue_fail_count + 1;
      const isClosed = failures >= CLOSE_AFTER_FAILURES;
      await sql`
        update events
        set venue_fail_count = ${failures}, venue_closed = ${isClosed}, venue_checked_at = now()
        where id = ${row.id}
      `;
      if (isClosed && !row.venue_closed) closed += 1;
      continue;
    }

    const photos = parsePhotos(row.photos_json);
    const nextPhotos = photos.length > 0 ? photos : check.image ? [check.image] : [];
    const current = (row.description || "").trim();
    // Curated copy wins; only the auto-generated stub is replaced.
    const description =
      current.length >= CURATED_DESCRIPTION_MIN
        ? current
        : check.description || current || null;
    const website = check.moved_to ?? row.website_url;

    await sql`
      update events
      set website_url = ${website},
          photos_json = ${JSON.stringify(nextPhotos)},
          description = ${description},
          venue_hours = coalesce(${check.hours}, venue_hours),
          venue_phone = coalesce(${check.phone}, venue_phone),
          venue_fail_count = 0,
          venue_closed = false,
          venue_checked_at = now()
      where id = ${row.id}
    `;
    updated += 1;
  }

  return { checked: targets.length, updated, closed };
}

type AiVenuePatch = {
  title?: string;
  still_open?: boolean;
  website_url?: string;
  address?: string;
  price_info?: string;
  hours?: string;
};

type AiNewVenue = {
  title?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  is_free?: boolean;
  price_info?: string;
  hours?: string;
  website_url?: string;
};

type AiPayload = { venues?: AiVenuePatch[]; new_venues?: AiNewVenue[] };

/**
 * Weekly verification of the whole permanent list plus discovery of major
 * family venues the city is still missing. Returns null when no XAI key is
 * configured or the weekly window has not elapsed.
 */
export async function researchVenuesWithGrok(
  sql: Sql,
  cityId: number,
): Promise<VenueAiRefresh> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;

  const stateKey = `venue_ai_${cityId}`;
  const lastRows = await sql`
    select updated_at from sync_state where key = ${stateKey} limit 1
  `;
  const lastAt = str(lastRows[0]?.updated_at);
  if (lastAt) {
    const age = Date.now() - new Date(lastAt).getTime();
    if (age >= 0 && age < AI_MIN_INTERVAL_MS) return null;
  }

  const cityRows = await sql`
    select id, name, state_code, latitude, longitude
    from cities where id = ${cityId} limit 1
  `;
  const city = cityRows[0];
  if (!city) return null;
  const cityName = String(city.name ?? "");
  const cityState = String(city.state_code ?? "");
  const cityLat = num(city.latitude) ?? 0;
  const cityLng = num(city.longitude) ?? 0;

  const venueRows = await sql`
    select title, address, website_url, category
    from events
    where city_id = ${cityId} and is_permanent = true and venue_closed = false
    order by title asc
    limit 60
  `;
  if (venueRows.length === 0) return null;

  const listed: string[] = [];
  const known = new Map<string, string>();
  for (const row of venueRows) {
    const title = String(row.title ?? "");
    if (!title) continue;
    known.set(normalizeTitle(title), title);
    listed.push(
      `- ${title} | ${str(row.address) ?? ""} | ${str(row.website_url) ?? ""} | ${String(row.category ?? "")}`,
    );
  }
  if (listed.length === 0) return null;

  // Claim the weekly slot before the call so a failure never retries every sync.
  await sql`
    insert into sync_state (key, value_int, updated_at) values (${stateKey}, 0, now())
    on conflict (key) do update set value_int = 0, updated_at = now()
  `;

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Today is ${today}. These permanent venues are listed in ${cityName}, ${cityState}:
${listed.join("\n")}

For each venue above, confirm from its official website whether it is still open to the public, and confirm or correct its website, street address, general admission price, and public opening hours.

Then list up to ${NEW_VENUE_LIMIT} major permanent family venues in ${cityName} that are MISSING from the list: convention centers, expo centers and fairgrounds, art museums, science and history museums, aquariums, zoos, botanical gardens, historic homes, performing arts centers, arenas, and large public parks.

Only real, currently operating places. No restaurants, no temporary events, no hotels.
Return JSON: {"venues":[{"title":string,"still_open":boolean,"website_url":string,"address":string,"price_info":string,"hours":string}],"new_venues":[{"title":string,"description":string,"address":string,"latitude":number,"longitude":number,"category":string,"is_free":boolean,"price_info":string,"hours":string,"website_url":string}]}
category must be one of: festival, outdoor, sports, arts, music, food, holiday, community, education, attraction (use "attraction" for convention and expo centers). Fallback coordinates: ${cityLat},${cityLng}.`;

  let payload: AiPayload = {};
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 2500,
        messages: [
          {
            role: "system",
            content:
              "You verify real, permanently open family-friendly venues. Return JSON only.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[venues] Grok venue research returned ${res.status}`);
      return null;
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    payload = JSON.parse(body.choices?.[0]?.message?.content || "{}") as AiPayload;
  } catch (err) {
    console.warn("[venues] Grok venue research failed", err);
    return null;
  }

  let updated = 0;
  for (const patch of Array.isArray(payload.venues) ? payload.venues.slice(0, 60) : []) {
    const dbTitle = known.get(normalizeTitle(String(patch?.title ?? "")));
    if (!dbTitle) continue;
    const stillOpen = patch.still_open !== false;
    const website = cleanUrl(patch.website_url);
    const address = patch.address ? String(patch.address).slice(0, 300) : null;
    const price = patch.price_info ? String(patch.price_info).slice(0, 200) : null;
    const hours = patch.hours ? String(patch.hours).slice(0, 180) : null;
    if (stillOpen && !website && !address && !price && !hours) continue;
    await sql`
      update events
      set website_url = coalesce(${website}, website_url),
          address = coalesce(${address}, address),
          price_info = coalesce(${price}, price_info),
          venue_hours = coalesce(${hours}, venue_hours),
          venue_closed = ${!stillOpen},
          venue_checked_at = now()
      where city_id = ${cityId} and is_permanent = true and title = ${dbTitle}
    `;
    updated += 1;
  }

  let added = 0;
  const candidates = Array.isArray(payload.new_venues)
    ? payload.new_venues.slice(0, NEW_VENUE_LIMIT)
    : [];
  for (const candidate of candidates) {
    const title = String(candidate?.title ?? "").trim().slice(0, 200);
    if (title.length < 3) continue;
    const key = normalizeTitle(title);
    if (known.has(key)) continue;
    known.set(key, title);

    const description = String(
      candidate.description || `${title} in ${cityName}.`,
    ).slice(0, 1000);
    const now = new Date();
    const far = new Date(now.getTime() + PERMANENT_WINDOW_DAYS * 86_400_000);
    const category = coerceCategory(candidate.category, `${title} ${description}`);
    await sql`
      insert into events (
        city_id, title, description, date_start, date_end, location_name, address,
        latitude, longitude, category, holiday, photos_json, is_free, price_info,
        age_min, age_max, is_permanent, website_url, status, featured, source, event_key,
        venue_hours
      ) values (
        ${cityId}, ${title}, ${description}, ${now.toISOString()}, ${far.toISOString()},
        ${title}, ${String(candidate.address || `${cityName}, ${cityState}`).slice(0, 300)},
        ${Number(candidate.latitude) || cityLat}, ${Number(candidate.longitude) || cityLng},
        ${category}, 'none', '[]', ${candidate.is_free !== false},
        ${candidate.price_info ? String(candidate.price_info).slice(0, 200) : null},
        0, 18, true, ${cleanUrl(candidate.website_url)}, 'approved', false,
        'attraction-ai', ${eventKey(title, "permanent")},
        ${candidate.hours ? String(candidate.hours).slice(0, 180) : null}
      )
      on conflict do nothing
    `;
    added += 1;
  }

  if (added > 0) {
    await sql`
      insert into sync_state (key, value_int, updated_at) values (${stateKey}, ${added}, now())
      on conflict (key) do update set value_int = ${added}, updated_at = now()
    `;
  }

  return { verified: listed.length, updated, added };
}