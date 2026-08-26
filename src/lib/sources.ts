import type { EventCategory, HolidayKey } from "./types";
import { VALID_CATEGORIES, VALID_HOLIDAYS } from "./constants";

export type TribeFeed = {
  name: string;
  url: string;
  lat: number;
  lng: number;
  address: string;
};

export type CitySource = {
  lat: number;
  lng: number;
  rss_urls?: string[];
  socrata?: { domain: string; dataset_id: string };
  tribe?: TribeFeed[];
  fallback?: boolean;
};

export const CITY_SOURCES: Record<string, CitySource> = {
  "Louisville,KY": {
    lat: 38.2527,
    lng: -85.7585,
    rss_urls: ["https://www.gotolouisville.com/rss/events/"],
    tribe: [
      {
        name: "Louisville Zoo",
        url: "https://louisvillezoo.org/wp-json/tribe/events/v1/events",
        lat: 38.2057,
        lng: -85.7624,
        address: "1100 Trevilian Way, Louisville, KY 40213",
      },
      {
        name: "Waterfront Park",
        url: "https://ourwaterfront.org/wp-json/tribe/events/v1/events",
        lat: 38.26,
        lng: -85.737,
        address: "129 E River Rd, Louisville, KY 40202",
      },
      {
        name: "Speed Art Museum",
        url: "https://www.speedmuseum.org/wp-json/tribe/events/v1/events",
        lat: 38.2178,
        lng: -85.7607,
        address: "2035 S 3rd St, Louisville, KY 40208",
      },
      {
        name: "Kentucky Shakespeare",
        url: "https://kyshakespeare.com/wp-json/tribe/events/v1/events",
        lat: 38.2296,
        lng: -85.7626,
        address: "Central Park, 1340 S 4th St, Louisville, KY 40208",
      },
      {
        name: "Kentucky Science Center",
        url: "https://kysciencecenter.org/wp-json/tribe/events/v1/events",
        lat: 38.2565,
        lng: -85.7595,
        address: "727 W Main St, Louisville, KY 40202",
      },
    ],
  },
  "New York City,NY": {
    lat: 40.7128,
    lng: -74.006,
    socrata: { domain: "data.cityofnewyork.us", dataset_id: "xtsw-fqvh" },
  },
  "Chicago,IL": {
    lat: 41.8781,
    lng: -87.6298,
    socrata: { domain: "data.cityofchicago.org", dataset_id: "v4dh-ypew" },
  },
};

export const UA = {
  "User-Agent": "CityVibes/1.0",
  Accept: "application/json, application/rss+xml, text/xml, */*",
};

export type IncomingEvent = {
  title: string;
  description?: string;
  date_start: string;
  date_end?: string;
  location_name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  holiday?: string;
  photos?: string[];
  is_free?: boolean;
  price_info?: string;
  age_min?: number;
  age_max?: number;
  website_url?: string | null;
  featured?: boolean;
  source?: string;
};

export function decodeHtml(s: string) {
  const named: Record<string, string> = {
    amp: "&",
    quot: '"',
    lt: "<",
    gt: ">",
    nbsp: " ",
    apos: "'",
  };
  return (s || "").replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_m, ent: string) => {
    if (ent[0] === "#") {
      const n =
        ent[1] === "x" || ent[1] === "X"
          ? parseInt(ent.slice(2), 16)
          : parseInt(ent.slice(1), 10);
      return Number.isFinite(n) ? String.fromCharCode(n) : _m;
    }
    return named[ent] || _m;
  });
}

export function stripHtml(html: string) {
  return decodeHtml((html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()).slice(
    0,
    800,
  );
}

export function normalizeTitle(title: string) {
  return (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isFamilyFriendly(title: string, description: string) {
  const t = `${title} ${description}`.toLowerCase();
  const blocked = [
    "21+",
    "21 +",
    "adults only",
    "adult-only",
    "adult only",
    "bar crawl",
    "nightclub",
    "strip club",
    "nsfw",
    "18+",
  ];
  return !blocked.some((x) => t.includes(x));
}

export function inferCategory(text: string): EventCategory {
  const lower = text.toLowerCase();
  if (
    lower.includes("trunk or treat") ||
    lower.includes("trunk-or-treat") ||
    lower.includes("trick or treat") ||
    lower.includes("trick-or-treat") ||
    lower.includes("boo at the zoo")
  )
    return "trick_or_treat";
  if (lower.includes("fish fry") || lower.includes("fish-fry")) return "food";
  if (lower.includes("storytime") || lower.includes("story time") || lower.includes("lapsit"))
    return "education";
  if (lower.includes("firework") || lower.includes("july 4") || lower.includes("fourth of july"))
    return "fireworks";
  if (lower.includes("festival") || lower.includes("fair") || lower.includes("derby"))
    return "festival";
  if (lower.includes("parade")) return "parade";
  if (
    lower.includes("concert") ||
    lower.includes("music") ||
    lower.includes("band") ||
    lower.includes("wfpk")
  )
    return "music";
  if (
    lower.includes("art") ||
    lower.includes("gallery") ||
    lower.includes("museum") ||
    lower.includes("cinema")
  )
    return "arts";
  if (
    lower.includes("food") ||
    lower.includes("taste") ||
    lower.includes("farmers market") ||
    lower.includes("culinary")
  )
    return "food";
  if (
    lower.includes("sport") ||
    lower.includes("race") ||
    lower.includes("marathon") ||
    lower.includes("5k") ||
    lower.includes("bats")
  )
    return "sports";
  if (
    lower.includes("outdoor") ||
    lower.includes("park") ||
    lower.includes("trail") ||
    lower.includes("zoo") ||
    lower.includes("waterfront")
  )
    return "outdoor";
  if (
    lower.includes("holiday") ||
    lower.includes("christmas") ||
    lower.includes("halloween") ||
    lower.includes("easter")
  )
    return "holiday";
  if (
    lower.includes("education") ||
    lower.includes("workshop") ||
    lower.includes("class") ||
    lower.includes("lecture")
  )
    return "education";
  if (lower.includes("tour") || lower.includes("attraction") || lower.includes("exhibit"))
    return "attraction";
  return "community";
}

export function inferHoliday(text: string, startDate?: string): HolidayKey {
  const lower = text.toLowerCase();
  const month = startDate ? new Date(startDate).getMonth() + 1 : 0;
  if (
    lower.includes("july 4") ||
    lower.includes("fourth of july") ||
    lower.includes("independence day")
  )
    return "july_4th";
  if (
    lower.includes("halloween") ||
    lower.includes("trick or treat") ||
    lower.includes("trunk or treat") ||
    lower.includes("haunted") ||
    lower.includes("spooky") ||
    lower.includes("boo at the zoo") ||
    lower.includes("jack o'lantern") ||
    lower.includes("jack-o-lantern")
  )
    return "halloween";
  if (
    lower.includes("christmas") ||
    lower.includes("holiday lights") ||
    lower.includes("santa") ||
    lower.includes("winter wonder")
  )
    return "christmas";
  if (lower.includes("easter") || lower.includes("egg hunt")) return "easter";
  if (lower.includes("st. patrick") || lower.includes("st patrick") || lower.includes("irish"))
    return "st_patricks";
  if (lower.includes("thanksgiving") || lower.includes("turkey trot")) return "thanksgiving";
  if (lower.includes("new year")) return "new_years";
  if (lower.includes("valentine")) return "valentines";
  if (lower.includes("memorial day")) return "memorial_day";
  if (lower.includes("labor day") || lower.includes("worldfest")) return "labor_day";
  if (lower.includes("firework") && month === 7) return "july_4th";
  return "none";
}

export function isFeaturedTitle(title: string) {
  const t = title.toLowerCase();
  return [
    "thunder over louisville",
    "kentucky derby",
    "derby festival",
    "worldfest",
    "state fair",
    "st. james",
    "st james court",
    "wild lights",
    "lights of the zoo",
    "forecastle",
    "bourbon & beyond",
    "waterfront wednesdays",
    "state fair",
    "boo at the zoo",
    "jack o'lantern",
    "fish fry guide",
  ].some((x) => t.includes(x));
}

export function toIso(raw: unknown) {
  if (!raw) return new Date().toISOString();
  const d = new Date(String(raw));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function eventKey(title: string, dateStart: string) {
  const day = (dateStart || "").toString().slice(0, 10);
  return `${normalizeTitle(title)}|${day}`;
}

export function coerceCategory(value: string | undefined, blob: string): EventCategory {
  if (value && (VALID_CATEGORIES as string[]).includes(value)) return value as EventCategory;
  return inferCategory(blob);
}

export function coerceHoliday(value: string | undefined, blob: string, dateStart?: string): HolidayKey {
  if (value && (VALID_HOLIDAYS as string[]).includes(value)) return value as HolidayKey;
  return inferHoliday(blob, dateStart);
}

function firstSaturday(year: number, monthIndex: number) {
  const d = new Date(year, monthIndex, 1);
  const day = d.getDay();
  const add = (6 - day + 7) % 7;
  d.setDate(1 + add);
  return d;
}

export function louisvilleAnchors(cityLat: number, cityLng: number): IncomingEvent[] {
  const y = new Date().getFullYear();
  const derby = firstSaturday(y, 4);
  const thunder = new Date(derby);
  thunder.setDate(derby.getDate() - 14);
  const labor = (() => {
    const d = new Date(y, 8, 1);
    const add = (1 - d.getDay() + 7) % 7;
    d.setDate(1 + add);
    return d;
  })();
  const july4 = new Date(y, 6, 4, 21, 0, 0);
  const stJames = firstSaturday(y, 9);
  const today = startOfToday();

  const mk = (
    title: string,
    start: Date,
    days: number,
    extra: Omit<IncomingEvent, "title" | "date_start" | "date_end">,
  ): IncomingEvent => ({
    title,
    date_start: start.toISOString(),
    date_end: new Date(start.getTime() + days * 86_400_000).toISOString(),
    featured: true,
    is_free: extra.is_free !== false,
    ...extra,
  });

  return [
    mk("Thunder Over Louisville", thunder, 0, {
      description:
        "Kentucky Derby Festival opening ceremony — one of the largest annual fireworks displays in North America, over the Ohio River.",
      location_name: "Waterfront Park",
      address: "129 E River Rd, Louisville, KY 40202",
      latitude: 38.26,
      longitude: -85.737,
      category: "fireworks",
      website_url: "https://kdf.org/thunder-over-louisville/",
      is_free: true,
      source: "anchor",
    }),
    mk("Kentucky Derby Festival", new Date(thunder), 16, {
      description:
        "Two weeks of festivals, fireworks, balloon glow, marathons, and community events leading up to the Kentucky Derby.",
      location_name: "Louisville",
      address: "Louisville, KY",
      latitude: cityLat,
      longitude: cityLng,
      category: "festival",
      website_url: "https://kdf.org/",
      is_free: true,
      source: "anchor",
    }),
    mk("Kentucky Derby", derby, 0, {
      description: "The Run for the Roses at Churchill Downs — the most famous two minutes in sports.",
      location_name: "Churchill Downs",
      address: "700 Central Ave, Louisville, KY 40208",
      latitude: 38.202,
      longitude: -85.77,
      category: "sports",
      website_url: "https://www.kentuckyderby.com/",
      is_free: false,
      price_info: "Tickets required",
      source: "anchor",
    }),
    mk("Independence Day Fireworks at Waterfront Park", july4, 0, {
      description:
        "Louisville's Fourth of July celebration with family activities and fireworks over the Ohio River.",
      location_name: "Waterfront Park",
      address: "129 E River Rd, Louisville, KY 40202",
      latitude: 38.26,
      longitude: -85.737,
      category: "fireworks",
      holiday: "july_4th",
      website_url: "https://louisvilleky.gov/government/city-events",
      is_free: true,
      source: "anchor",
    }),
    mk("WorldFest", labor, 3, {
      description:
        "Louisville's international festival at Waterfront Park — food, music, and cultures from around the world over Labor Day weekend.",
      location_name: "Waterfront Park",
      address: "129 E River Rd, Louisville, KY 40202",
      latitude: 38.26,
      longitude: -85.737,
      category: "festival",
      holiday: "labor_day",
      website_url: "https://louisvilleky.gov/government/city-events/worldfest",
      is_free: true,
      source: "anchor",
    }),
    mk("St. James Court Art Fair", stJames, 1, {
      description:
        "One of the top-ranked art fairs in the U.S., filling Old Louisville's St. James and Belgravia Courts with hundreds of artists.",
      location_name: "St. James Court",
      address: "St. James Court, Louisville, KY 40208",
      latitude: 38.229,
      longitude: -85.762,
      category: "arts",
      website_url: "https://www.stjamescourtartfair.com/",
      is_free: true,
      source: "anchor",
    }),
  ].filter((e) => new Date(e.date_end || e.date_start) >= today);
}

export function parseRSS(
  xml: string,
  cityName: string,
  stateCode: string,
  cityLat: number,
  cityLng: number,
): IncomingEvent[] {
  const events: IncomingEvent[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const getField = (tag: string) => {
      const m = item.match(
        new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`),
      );
      return m ? m[1].trim() : "";
    };
    const title = decodeHtml(getField("title"));
    const description = stripHtml(getField("description"));
    const link = getField("link");
    const rawDate =
      getField("startdate") ||
      getField("event:startdate") ||
      getField("dc:date") ||
      getField("pubDate");
    if (!title || title === "CRM Import") continue;
    if (!isFamilyFriendly(title, description)) continue;
    let dateStart: Date;
    try {
      dateStart = rawDate ? new Date(rawDate) : new Date();
    } catch {
      dateStart = new Date();
    }
    if (Number.isNaN(dateStart.getTime()) || dateStart < startOfToday()) continue;
    events.push({
      title,
      description: description || `${title} in ${cityName}.`,
      date_start: dateStart.toISOString(),
      date_end: new Date(dateStart.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      location_name: cityName,
      address: `${cityName}, ${stateCode}`,
      latitude: cityLat,
      longitude: cityLng,
      website_url: link || null,
      is_free: /free|no charge/i.test(`${title} ${description}`),
      source: "rss",
    });
  }
  return events;
}

export async function fetchSocrata(
  domain: string,
  datasetId: string,
  cityName: string,
  stateCode: string,
  cityLat: number,
  cityLng: number,
): Promise<IncomingEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  const url = `https://${domain}/resource/${datasetId}.json?$limit=80&$order=start_date ASC&$where=start_date >= '${today}'`;
  const res = await fetch(url, { headers: { ...UA, "X-App-Token": "cityvibes" } });
  if (!res.ok) throw new Error(`Socrata ${res.status}`);
  const data = (await res.json()) as Array<Record<string, string>>;
  return (data || [])
    .map((e) => ({
      title: decodeHtml(e.event_name || e.name || e.title || "Community Event"),
      description: stripHtml(e.event_description || e.description || ""),
      date_start: e.start_date || e.start_datetime,
      date_end: e.end_date || e.end_datetime,
      location_name: e.location || e.park_name || cityName,
      address: e.address || `${cityName}, ${stateCode}`,
      latitude: parseFloat(e.latitude || e.lat || String(cityLat)) || cityLat,
      longitude: parseFloat(e.longitude || e.lng || String(cityLng)) || cityLng,
      website_url: e.url || e.event_url || null,
      is_free: true,
      source: "socrata",
    }))
    .filter(
      (e) =>
        e.title &&
        e.date_start &&
        new Date(e.date_start) >= startOfToday() &&
        isFamilyFriendly(e.title, e.description),
    );
}

export async function fetchTribe(feed: TribeFeed): Promise<IncomingEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  const events: IncomingEvent[] = [];
  let next: string | null = `${feed.url}?per_page=50&status=publish&start_date=${today}`;
  let pages = 0;
  while (next && pages < 3) {
    pages += 1;
    const res = await fetch(next, { headers: UA });
    if (!res.ok) throw new Error(`${feed.name} tribe ${res.status}`);
    const data = (await res.json()) as {
      events?: Array<Record<string, unknown>>;
      next_rest_url?: string;
    };
    for (const ze of data.events || []) {
      const title = decodeHtml(String(ze.title || `${feed.name} Event`));
      const description = stripHtml(String(ze.description || ze.excerpt || ""));
      if (!isFamilyFriendly(title, description)) continue;
      const startDate = String(ze.start_date || ze.date || "");
      if (!startDate || new Date(startDate) < startOfToday()) continue;
      const imageObj = ze.image as { url?: string } | undefined;
      const image = imageObj?.url || (typeof ze.featured_image === "string" ? ze.featured_image : null);
      const venue = ze.venue as
        | {
            venue?: string;
            address?: string;
            city?: string;
            stateprovince?: string;
            zip?: string;
            geo_lat?: string;
            geo_lng?: string;
          }
        | undefined;
      const venueName = venue?.venue || feed.name;
      const venueAddress = venue?.address
        ? `${venue.address}, ${venue.city || ""} ${venue.stateprovince || ""} ${venue.zip || ""}`
            .replace(/\s+/g, " ")
            .trim()
        : feed.address;
      const lat = parseFloat(venue?.geo_lat || "") || feed.lat;
      const lng = parseFloat(venue?.geo_lng || "") || feed.lng;
      events.push({
        title,
        description,
        date_start: startDate,
        date_end: String(ze.end_date || startDate),
        location_name: venueName,
        address: venueAddress,
        latitude: lat,
        longitude: lng,
        website_url: typeof ze.url === "string" ? ze.url : null,
        photos: image ? [image] : [],
        is_free: /free/i.test(`${title} ${description}`) && !/\$\d/.test(description),
        source: `tribe:${feed.name}`,
      });
    }
    next = data.next_rest_url || null;
  }
  return events;
}
