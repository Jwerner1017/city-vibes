import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VALID_CATEGORIES = [
  "festival","outdoor","sports","arts","music","food","holiday","community",
  "education","attraction","trick_or_treat","fireworks","santa","easter","parade","other",
];
const VALID_HOLIDAYS = [
  "none","july_4th","halloween","christmas","easter","st_patricks","thanksgiving",
  "new_years","valentines","memorial_day","labor_day",
];

const UA = {
  "User-Agent": "CityVibes/1.0",
  Accept: "application/json, application/rss+xml, text/xml, */*",
};

type TribeFeed = { name: string; url: string; lat: number; lng: number; address: string };
type CitySource = {
  lat: number;
  lng: number;
  rss_urls?: string[];
  socrata?: { domain: string; dataset_id: string };
  tribe?: TribeFeed[];
  fallback?: boolean;
};

// Prefer structured feeds. Merge ALL of them — never first-feed-wins.
const CITY_SOURCES: Record<string, CitySource> = {
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
    ],
  },
  "New York City,NY": {
    lat: 40.7128, lng: -74.0060,
    socrata: { domain: "data.cityofnewyork.us", dataset_id: "xtsw-fqvh" },
  },
  "Chicago,IL": {
    lat: 41.8781, lng: -87.6298,
    socrata: { domain: "data.cityofchicago.org", dataset_id: "v4dh-ypew" },
  },
  "Philadelphia,PA": { lat: 39.9526, lng: -75.1652, rss_urls: ["https://phlcouncil.com/feed/"], fallback: true },
  "Houston,TX": { fallback: true, lat: 29.7604, lng: -95.3698 },
  "Phoenix,AZ": { fallback: true, lat: 33.4484, lng: -112.0740 },
  "San Antonio,TX": { fallback: true, lat: 29.4241, lng: -98.4936 },
  "San Diego,CA": { fallback: true, lat: 32.7157, lng: -117.1611 },
  "Dallas,TX": { fallback: true, lat: 32.7767, lng: -96.7970 },
  "San Jose,CA": { fallback: true, lat: 37.3382, lng: -121.8863 },
  "Austin,TX": { fallback: true, lat: 30.2672, lng: -97.7431 },
  "Jacksonville,FL": { fallback: true, lat: 30.3322, lng: -81.6557 },
  "Columbus,OH": { fallback: true, lat: 39.9612, lng: -82.9988 },
  "Indianapolis,IN": { fallback: true, lat: 39.7684, lng: -86.1581 },
  "Charlotte,NC": { fallback: true, lat: 35.2271, lng: -80.8431 },
  "Nashville,TN": { fallback: true, lat: 36.1627, lng: -86.7816 },
  "Memphis,TN": { fallback: true, lat: 35.1495, lng: -90.0490 },
  "Baltimore,MD": { fallback: true, lat: 39.2904, lng: -76.6122 },
  "Boston,MA": { fallback: true, lat: 42.3601, lng: -71.0589 },
  "Seattle,WA": { fallback: true, lat: 47.6062, lng: -122.3321 },
  "Denver,CO": { fallback: true, lat: 39.7392, lng: -104.9903 },
  "Portland,OR": { fallback: true, lat: 45.5051, lng: -122.6750 },
  "Las Vegas,NV": { fallback: true, lat: 36.1699, lng: -115.1398 },
  "Atlanta,GA": { fallback: true, lat: 33.7490, lng: -84.3880 },
  "Miami,FL": { fallback: true, lat: 25.7617, lng: -80.1918 },
  "Minneapolis,MN": { fallback: true, lat: 44.9778, lng: -93.2650 },
  "New Orleans,LA": { fallback: true, lat: 29.9511, lng: -90.0715 },
  "Tampa,FL": { fallback: true, lat: 27.9506, lng: -82.4572 },
  "Cincinnati,OH": { fallback: true, lat: 39.1031, lng: -84.5120 },
  "Pittsburgh,PA": { fallback: true, lat: 40.4406, lng: -79.9959 },
  "Kansas City,MO": { fallback: true, lat: 39.0997, lng: -94.5786 },
  "Cleveland,OH": { fallback: true, lat: 41.4993, lng: -81.6944 },
  "Raleigh,NC": { fallback: true, lat: 35.7796, lng: -78.6382 },
  "Virginia Beach,VA": { fallback: true, lat: 36.8529, lng: -75.9780 },
  "Omaha,NE": { fallback: true, lat: 41.2565, lng: -95.9345 },
  "Colorado Springs,CO": { fallback: true, lat: 38.8339, lng: -104.8214 },
  "Tulsa,OK": { fallback: true, lat: 36.1540, lng: -95.9928 },
  "Arlington,TX": { fallback: true, lat: 32.7357, lng: -97.1081 },
  "Sacramento,CA": { fallback: true, lat: 38.5816, lng: -121.4944 },
  "Salt Lake City,UT": { fallback: true, lat: 40.7608, lng: -111.8910 },
  "Albuquerque,NM": { fallback: true, lat: 35.0844, lng: -106.6504 },
  "Birmingham,AL": { fallback: true, lat: 33.5186, lng: -86.8104 },
  "Richmond,VA": { fallback: true, lat: 37.5407, lng: -77.4360 },
};

function decodeHtml(s: string) {
  const named: Record<string, string> = {
    amp: "&", quot: '"', lt: "<", gt: ">", nbsp: " ", apos: "'",
  };
  return (s || "").replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, ent: string) => {
    if (ent[0] === "#") {
      const n = ent[1] === "x" || ent[1] === "X" ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(n) ? String.fromCharCode(n) : m;
    }
    return named[ent] || m;
  });
}

function stripHtml(html: string) {
  return decodeHtml((html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()).slice(0, 800);
}

function normalizeTitle(title: string) {
  return (title || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
}

function eventKey(title: string, dateStart: string) {
  return `${normalizeTitle(title)}|${String(dateStart || "").slice(0, 10)}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIso(raw: unknown) {
  if (!raw) return new Date().toISOString();
  const d = new Date(String(raw));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function isFamilyFriendly(title: string, description: string) {
  const t = `${title} ${description}`.toLowerCase();
  return !["21+", "21 +", "adults only", "adult-only", "adult only", "bar crawl", "nightclub", "strip club", "nsfw", "18+"]
    .some((x) => t.includes(x));
}

function inferCategory(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("trick or treat") || lower.includes("trunk or treat") || lower.includes("trick-or-treat")) return "trick_or_treat";
  if (lower.includes("firework") || lower.includes("july 4") || lower.includes("fourth of july")) return "fireworks";
  if (lower.includes("festival") || lower.includes("fair") || lower.includes("derby")) return "festival";
  if (lower.includes("parade")) return "parade";
  if (lower.includes("concert") || lower.includes("music") || lower.includes("band") || lower.includes("wfpk")) return "music";
  if (lower.includes("art") || lower.includes("gallery") || lower.includes("museum") || lower.includes("cinema")) return "arts";
  if (lower.includes("food") || lower.includes("fish fry") || lower.includes("farmers market") || lower.includes("picnic") || lower.includes("taste")) return "food";
  if (lower.includes("sport") || lower.includes("race") || lower.includes("marathon") || lower.includes("5k") || lower.includes("bats")) return "sports";
  if (lower.includes("outdoor") || lower.includes("park") || lower.includes("trail") || lower.includes("zoo") || lower.includes("waterfront")) return "outdoor";
  if (lower.includes("holiday") || lower.includes("christmas") || lower.includes("halloween") || lower.includes("easter") || lower.includes("santa")) return "holiday";
  if (lower.includes("education") || lower.includes("workshop") || lower.includes("class") || lower.includes("lecture")) return "education";
  if (lower.includes("tour") || lower.includes("attraction") || lower.includes("exhibit")) return "attraction";
  return "community";
}

function inferHoliday(text: string, startDate?: string) {
  const lower = text.toLowerCase();
  const month = startDate ? new Date(startDate).getMonth() + 1 : 0;
  if (lower.includes("july 4") || lower.includes("fourth of july") || lower.includes("independence day")) return "july_4th";
  if (lower.includes("halloween") || lower.includes("trick or treat") || lower.includes("trunk or treat") || lower.includes("haunted") || lower.includes("spooky")) return "halloween";
  if (lower.includes("christmas") || lower.includes("holiday lights") || lower.includes("santa") || lower.includes("winter wonder")) return "christmas";
  if (lower.includes("easter") || lower.includes("egg hunt")) return "easter";
  if (lower.includes("st. patrick") || lower.includes("st patrick") || lower.includes("irish")) return "st_patricks";
  if (lower.includes("thanksgiving") || lower.includes("turkey trot")) return "thanksgiving";
  if (lower.includes("new year")) return "new_years";
  if (lower.includes("valentine")) return "valentines";
  if (lower.includes("memorial day")) return "memorial_day";
  if (lower.includes("labor day") || lower.includes("worldfest")) return "labor_day";
  if (lower.includes("firework") && month === 7) return "july_4th";
  return "none";
}

function isFeaturedTitle(title: string) {
  const t = title.toLowerCase();
  return [
    "thunder over louisville", "kentucky derby", "derby festival", "worldfest",
    "state fair", "st. james", "st james court", "wild lights", "lights of the zoo",
    "forecastle", "bourbon & beyond", "waterfront wednesdays",
  ].some((x) => t.includes(x));
}

function coerceCategory(value: string | undefined, blob: string) {
  return VALID_CATEGORIES.includes(value || "") ? value : inferCategory(blob);
}

function coerceHoliday(value: string | undefined, blob: string, dateStart?: string) {
  return VALID_HOLIDAYS.includes(value || "") ? value : inferHoliday(blob, dateStart);
}

function firstSaturday(year: number, monthIndex: number) {
  const d = new Date(year, monthIndex, 1);
  const add = (6 - d.getDay() + 7) % 7;
  d.setDate(1 + add);
  return d;
}

function louisvilleAnchors(cityLat: number, cityLng: number) {
  const y = new Date().getFullYear();
  const derby = firstSaturday(y, 4);
  const thunder = new Date(derby);
  thunder.setDate(derby.getDate() - 14);
  const labor = (() => {
    const d = new Date(y, 8, 1);
    d.setDate(1 + ((1 - d.getDay() + 7) % 7));
    return d;
  })();
  const july4 = new Date(y, 6, 4, 21, 0, 0);
  const stJames = firstSaturday(y, 9);
  const today = startOfToday();
  const mk = (title: string, start: Date, days: number, extra: Record<string, unknown>) => ({
    title,
    date_start: start.toISOString(),
    date_end: new Date(start.getTime() + days * 86_400_000).toISOString(),
    featured: true,
    is_free: extra.is_free !== false,
    source: "anchor",
    ...extra,
  });
  return [
    mk("Thunder Over Louisville", thunder, 0, {
      description: "Kentucky Derby Festival opening ceremony — one of the largest annual fireworks displays in North America, over the Ohio River.",
      location_name: "Waterfront Park",
      address: "129 E River Rd, Louisville, KY 40202",
      latitude: 38.26, longitude: -85.737, category: "fireworks",
      website_url: "https://kdf.org/thunder-over-louisville/", is_free: true,
    }),
    mk("Kentucky Derby Festival", new Date(thunder), 16, {
      description: "Two weeks of festivals, fireworks, balloon glow, marathons, and community events leading up to the Kentucky Derby.",
      location_name: "Louisville", address: "Louisville, KY",
      latitude: cityLat, longitude: cityLng, category: "festival",
      website_url: "https://kdf.org/", is_free: true,
    }),
    mk("Kentucky Derby", derby, 0, {
      description: "The Run for the Roses at Churchill Downs — the most famous two minutes in sports.",
      location_name: "Churchill Downs", address: "700 Central Ave, Louisville, KY 40208",
      latitude: 38.202, longitude: -85.77, category: "sports",
      website_url: "https://www.kentuckyderby.com/", is_free: false, price_info: "Tickets required",
    }),
    mk("Independence Day Fireworks at Waterfront Park", july4, 0, {
      description: "Louisville's Fourth of July celebration with family activities and fireworks over the Ohio River.",
      location_name: "Waterfront Park", address: "129 E River Rd, Louisville, KY 40202",
      latitude: 38.26, longitude: -85.737, category: "fireworks", holiday: "july_4th",
      website_url: "https://louisvilleky.gov/government/city-events", is_free: true,
    }),
    mk("WorldFest", labor, 3, {
      description: "Louisville's international festival at Waterfront Park — food, music, and cultures from around the world over Labor Day weekend.",
      location_name: "Waterfront Park", address: "129 E River Rd, Louisville, KY 40202",
      latitude: 38.26, longitude: -85.737, category: "festival", holiday: "labor_day",
      website_url: "https://louisvilleky.gov/government/city-events/worldfest", is_free: true,
    }),
    mk("St. James Court Art Fair", stJames, 1, {
      description: "One of the top-ranked art fairs in the U.S., filling Old Louisville's St. James and Belgravia Courts with hundreds of artists.",
      location_name: "St. James Court", address: "St. James Court, Louisville, KY 40208",
      latitude: 38.229, longitude: -85.762, category: "arts",
      website_url: "https://www.stjamescourtartfair.com/", is_free: true,
    }),
  ].filter((e) => new Date(String(e.date_end || e.date_start)) >= today);
}

function parseRSS(xml: string, cityName: string, cityState: string, cityLat: number, cityLng: number) {
  const events: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const getField = (tag: string) => {
      const m = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`));
      return m ? m[1].trim() : "";
    };
    const title = decodeHtml(getField("title"));
    const description = stripHtml(getField("description"));
    const link = getField("link");
    const rawDate = getField("startdate") || getField("event:startdate") || getField("dc:date") || getField("pubDate");
    if (!title || title === "CRM Import") continue;
    if (!isFamilyFriendly(title, description)) continue;
    const dateStart = rawDate ? new Date(rawDate) : new Date();
    if (Number.isNaN(dateStart.getTime()) || dateStart < startOfToday()) continue;
    events.push({
      title,
      description: description || `${title} in ${cityName}.`,
      date_start: dateStart.toISOString(),
      date_end: new Date(dateStart.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      location_name: cityName,
      address: `${cityName}, ${cityState}`,
      latitude: cityLat,
      longitude: cityLng,
      website_url: link || null,
      is_free: /free|no charge/i.test(`${title} ${description}`),
      source: "rss",
    });
  }
  return events;
}

async function fetchSocrata(domain: string, datasetId: string, cityLat: number, cityLng: number, cityName: string, cityState: string) {
  const today = new Date().toISOString().slice(0, 10);
  const url = `https://${domain}/resource/${datasetId}.json?$limit=80&$order=start_date ASC&$where=start_date >= '${today}'`;
  const res = await fetch(url, { headers: { ...UA, "X-App-Token": "cityvibes" } });
  if (!res.ok) throw new Error(`Socrata ${res.status}`);
  const data = await res.json();
  return (data || [])
    .map((e: any) => ({
      title: decodeHtml(e.event_name || e.name || e.title || "Community Event"),
      description: stripHtml(e.event_description || e.description || ""),
      date_start: e.start_date || e.start_datetime,
      date_end: e.end_date || e.end_datetime,
      location_name: e.location || e.park_name || cityName,
      address: e.address || `${cityName}, ${cityState}`,
      latitude: parseFloat(e.latitude || e.lat || cityLat) || cityLat,
      longitude: parseFloat(e.longitude || e.lng || cityLng) || cityLng,
      website_url: e.url || e.event_url || null,
      is_free: true,
      source: "socrata",
    }))
    .filter((e: any) => e.title && e.date_start && new Date(e.date_start) >= startOfToday() && isFamilyFriendly(e.title, e.description));
}

async function fetchTribe(feed: TribeFeed) {
  const today = new Date().toISOString().slice(0, 10);
  const events: any[] = [];
  let next: string | null = `${feed.url}?per_page=50&status=publish&start_date=${today}`;
  let pages = 0;
  while (next && pages < 3) {
    pages += 1;
    const res = await fetch(next, { headers: UA });
    if (!res.ok) throw new Error(`${feed.name} tribe ${res.status}`);
    const data = await res.json();
    for (const ze of data.events || []) {
      const title = decodeHtml(String(ze.title || `${feed.name} Event`));
      const description = stripHtml(String(ze.description || ze.excerpt || ""));
      if (!isFamilyFriendly(title, description)) continue;
      const startDate = String(ze.start_date || ze.date || "");
      if (!startDate || new Date(startDate) < startOfToday()) continue;
      const image = ze.image?.url || (typeof ze.featured_image === "string" ? ze.featured_image : null);
      const venue = ze.venue;
      const venueName = venue?.venue || feed.name;
      const venueAddress = venue?.address
        ? `${venue.address}, ${venue.city || ""} ${venue.stateprovince || ""} ${venue.zip || ""}`.replace(/\s+/g, " ").trim()
        : feed.address;
      events.push({
        title,
        description,
        date_start: startDate,
        date_end: String(ze.end_date || startDate),
        location_name: venueName,
        address: venueAddress,
        latitude: parseFloat(venue?.geo_lat || "") || feed.lat,
        longitude: parseFloat(venue?.geo_lng || "") || feed.lng,
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

async function fetchViaLLM(base44: any, city: any, mode: "fallback" | "community") {
  const { name, state_code, latitude, longitude } = city;
  const today = new Date().toISOString().slice(0, 10);
  const windowEnd = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const focus = mode === "community"
    ? `Focus on neighborhood / community events that official tourism calendars miss: fish frys, church picnics, trunk-or-treats, trick-or-treat routes, holiday parades, farmers markets, free concerts in the park, library events, zoo after-hours, and seasonal fairs.`
    : `Include festivals, outdoor, parades, holiday, farmers markets, arts, community, food, seasonal attractions.`;
  const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Find 10 real upcoming family-friendly community events in ${name}, ${state_code} from ${today} through ${windowEnd} (next 120 days only).
${focus}
Return JSON object with key "events". Each event:
{ title, description (2-3 sentences), date_start (YYYY-MM-DDTHH:MM:SS), date_end, location_name, address (full, ${name} ${state_code}), latitude (venue), longitude (venue), category (festival/outdoor/sports/arts/music/food/holiday/community/education/attraction/parade/fireworks/trick_or_treat/other), holiday (none/july_4th/halloween/christmas/easter/st_patricks/thanksgiving/new_years/valentines/memorial_day/labor_day), is_free (bool), price_info, age_min:0, age_max:18, website_url }
Real confirmed events only. Fallback coords: ${latitude},${longitude}.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      required: ["events"],
      properties: {
        events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" }, description: { type: "string" },
              date_start: { type: "string" }, date_end: { type: "string" },
              location_name: { type: "string" }, address: { type: "string" },
              latitude: { type: "number" }, longitude: { type: "number" },
              category: { type: "string" }, holiday: { type: "string" },
              is_free: { type: "boolean" }, price_info: { type: "string" },
              age_min: { type: "number" }, age_max: { type: "number" },
              website_url: { type: "string" },
            },
          },
        },
      },
    },
  });
  const rawEvents = Array.isArray(llmResult) ? llmResult : (llmResult?.events || []);
  return rawEvents
    .filter((e: any) => e?.title && isFamilyFriendly(e.title, e.description || ""))
    .map((e: any) => ({
      ...e,
      source: mode === "community" ? "llm:community" : "llm",
    }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === "admin") isAuthorized = true;
    } catch (_) { isAuthorized = true; }
    if (!isAuthorized) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { city_id } = body;

    let city: any;
    if (city_id) {
      city = (await base44.asServiceRole.entities.City.filter({ id: city_id }))[0];
    } else if (body.city_name && body.city_state) {
      const cities = await base44.asServiceRole.entities.City.filter({
        name: body.city_name,
        state_code: body.city_state,
      });
      city = cities[0] || {
        name: body.city_name,
        state_code: body.city_state,
        latitude: body.city_lat,
        longitude: body.city_lng,
      };
    }
    if (!city) return Response.json({ error: "City not found" }, { status: 404 });

    const cityKey = `${city.name},${city.state_code}`;
    const source = CITY_SOURCES[cityKey] || { fallback: true, lat: city.latitude, lng: city.longitude };
    const cityLat = source.lat || city.latitude;
    const cityLng = source.lng || city.longitude;

    const sourceCounts: Record<string, number> = {};
    const merged: any[] = [];
    const addFrom = (label: string, list: any[]) => {
      sourceCounts[label] = list.length;
      merged.push(...list);
    };

    for (const rssUrl of source.rss_urls || []) {
      try {
        const res = await fetch(rssUrl, { headers: UA });
        if (res.ok) addFrom("rss", parseRSS(await res.text(), city.name, city.state_code, cityLat, cityLng));
      } catch (err: any) {
        console.warn(`[${cityKey}] RSS failed: ${err.message}`);
      }
    }

    if (source.socrata) {
      try {
        addFrom("socrata", await fetchSocrata(source.socrata.domain, source.socrata.dataset_id, cityLat, cityLng, city.name, city.state_code));
      } catch (err: any) {
        console.warn(`[${cityKey}] Socrata failed: ${err.message}`);
      }
    }

    for (const feed of source.tribe || []) {
      try {
        addFrom(`tribe:${feed.name}`, await fetchTribe(feed));
      } catch (err: any) {
        console.warn(`[${cityKey}] ${feed.name} failed: ${err.message}`);
      }
    }

    if (cityKey === "Louisville,KY") {
      addFrom("anchors", louisvilleAnchors(cityLat, cityLng));
    }

    const structuredCount = merged.length;
    if (structuredCount === 0 || source.fallback) {
      try {
        addFrom("llm", await fetchViaLLM(base44, { ...city, latitude: cityLat, longitude: cityLng }, "fallback"));
      } catch (err: any) {
        console.warn(`[${cityKey}] LLM fallback failed: ${err.message}`);
      }
    } else if (cityKey === "Louisville,KY") {
      try {
        addFrom("llm:community", await fetchViaLLM(base44, { ...city, latitude: cityLat, longitude: cityLng }, "community"));
      } catch (err: any) {
        console.warn(`[${cityKey}] community LLM failed: ${err.message}`);
      }
    }

    const existing = await base44.asServiceRole.entities.Event.filter(
      { address: { $regex: city.name, $options: "i" } },
      "-date_start",
      400,
    );
    const byKey = new Map<string, any>();
    for (const ev of existing) {
      if (ev.title === "__sync_batch_state__") continue;
      byKey.set(eventKey(ev.title, ev.date_start), ev);
    }

    const windowEnd = new Date(Date.now() + 150 * 24 * 60 * 60 * 1000);
    const now = startOfToday();
    const toCreate: any[] = [];
    let updated = 0;
    const seen = new Set<string>();

    for (const raw of merged) {
      if (!raw.title || !raw.date_start) continue;
      const dateStart = toIso(raw.date_start);
      const key = eventKey(raw.title, dateStart);
      if (seen.has(key)) continue;
      seen.add(key);

      const blob = `${raw.title} ${raw.description || ""}`;
      const holiday = coerceHoliday(raw.holiday, blob, dateStart);
      const eventDate = new Date(dateStart);
      if (holiday === "none" && (eventDate < now || eventDate > windowEnd)) continue;

      const record = {
        title: String(raw.title).substring(0, 200),
        description: String(raw.description || `${raw.title} in ${city.name}.`).substring(0, 1000),
        date_start: dateStart,
        date_end: toIso(raw.date_end || raw.date_start),
        location_name: String(raw.location_name || city.name).substring(0, 200),
        address: String(raw.address || `${city.name}, ${city.state_code}`).substring(0, 300),
        latitude: parseFloat(raw.latitude) || cityLat,
        longitude: parseFloat(raw.longitude) || cityLng,
        category: coerceCategory(raw.category, blob),
        holiday,
        photos: Array.isArray(raw.photos) ? raw.photos.filter(Boolean).slice(0, 6) : [],
        is_free: raw.is_free !== false,
        price_info: raw.price_info || null,
        age_min: raw.age_min ?? 0,
        age_max: raw.age_max ?? 18,
        is_permanent: false,
        website_url: raw.website_url || null,
        status: "approved",
        featured: Boolean(raw.featured) || isFeaturedTitle(raw.title),
        source: raw.source || "sync",
      };

      const prev = byKey.get(key);
      if (prev) {
        const patch: Record<string, unknown> = {};
        if ((record.description || "").length > (prev.description || "").length) patch.description = record.description;
        if (record.website_url && !prev.website_url) patch.website_url = record.website_url;
        if (record.photos.length > 0 && (!prev.photos || prev.photos.length === 0)) patch.photos = record.photos;
        if (record.featured && !prev.featured) patch.featured = true;
        if (record.location_name && record.location_name !== city.name) patch.location_name = record.location_name;
        if (record.source && !prev.source) patch.source = record.source;
        patch.date_start = record.date_start;
        patch.date_end = record.date_end;
        patch.latitude = record.latitude;
        patch.longitude = record.longitude;
        try {
          await base44.asServiceRole.entities.Event.update(prev.id, patch);
          updated += 1;
        } catch (_) {}
        continue;
      }

      toCreate.push(record);
      byKey.set(key, record);
    }

    if (toCreate.length > 0) {
      await base44.asServiceRole.entities.Event.bulkCreate(toCreate);
    }

    try {
      const pruneNow = new Date();
      for (const ev of existing) {
        if (ev.title === "__sync_batch_state__") continue;
        if (ev.is_permanent) continue;
        if ((ev.holiday || "none") !== "none") continue;
        if (ev.featured) continue;
        const d = new Date(ev.date_end || ev.date_start);
        if (d < pruneNow) {
          try { await base44.asServiceRole.entities.Event.delete(ev.id); } catch (_) {}
        }
      }
    } catch (pruneErr: any) {
      console.warn("Prune step failed:", pruneErr.message);
    }

    return Response.json({
      city: cityKey,
      found: merged.length,
      structured: structuredCount,
      synced: toCreate.length,
      updated,
      skipped: merged.length - toCreate.length - updated,
      sources: sourceCounts,
    });
  } catch (error: any) {
    console.error("[syncCityFromSource]", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
