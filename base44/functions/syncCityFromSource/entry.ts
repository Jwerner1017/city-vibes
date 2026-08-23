import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─── Constants ──────────────────────────────────────────────────────────────
const VALID_CATEGORIES = ["festival","outdoor","sports","arts","music","food","holiday","community","education","attraction","trick_or_treat","fireworks","santa","easter","parade","other"];
const VALID_HOLIDAYS   = ["none","july_4th","halloween","christmas","easter","st_patricks","thanksgiving","new_years","valentines","memorial_day","labor_day"];

// Expanded + documented city source map
// Prefer real structured feeds (RSS / Socrata) over pure LLM whenever possible.
const CITY_SOURCES: Record<string, any> = {
  "Louisville,KY": {
    rss_url: "https://www.gotolouisville.com/rss/events/",
    lat: 38.2527, lng: -85.7585,
  },
  "New York City,NY": {
    socrata: { domain: "data.cityofnewyork.us", dataset_id: "xtsw-fqvh" },
    lat: 40.7128, lng: -74.0060,
  },
  "Chicago,IL": {
    socrata: { domain: "data.cityofchicago.org", dataset_id: "v4dh-ypew" },
    lat: 41.8781, lng: -87.6298,
  },
  "Philadelphia,PA": {
    rss_url: "https://phlcouncil.com/feed/",
    fallback: true,
    lat: 39.9526, lng: -75.1652,
  },
  // Remaining cities currently rely on LLM until better structured feeds are added
  "Houston,TX":        { fallback: true, lat: 29.7604, lng: -95.3698 },
  "Phoenix,AZ":        { fallback: true, lat: 33.4484, lng: -112.0740 },
  "San Antonio,TX":    { fallback: true, lat: 29.4241, lng: -98.4936 },
  "San Diego,CA":      { fallback: true, lat: 32.7157, lng: -117.1611 },
  "Dallas,TX":         { fallback: true, lat: 32.7767, lng: -96.7970 },
  "San Jose,CA":       { fallback: true, lat: 37.3382, lng: -121.8863 },
  "Austin,TX":         { fallback: true, lat: 30.2672, lng: -97.7431 },
  "Jacksonville,FL":   { fallback: true, lat: 30.3322, lng: -81.6557 },
  "Columbus,OH":       { fallback: true, lat: 39.9612, lng: -82.9988 },
  "Indianapolis,IN":   { fallback: true, lat: 39.7684, lng: -86.1581 },
  "Charlotte,NC":      { fallback: true, lat: 35.2271, lng: -80.8431 },
  "Nashville,TN":      { fallback: true, lat: 36.1627, lng: -86.7816 },
  "Memphis,TN":        { fallback: true, lat: 35.1495, lng: -90.0490 },
  "Baltimore,MD":      { fallback: true, lat: 39.2904, lng: -76.6122 },
  "Boston,MA":         { fallback: true, lat: 42.3601, lng: -71.0589 },
  "Seattle,WA":        { fallback: true, lat: 47.6062, lng: -122.3321 },
  "Denver,CO":         { fallback: true, lat: 39.7392, lng: -104.9903 },
  "Portland,OR":       { fallback: true, lat: 45.5051, lng: -122.6750 },
  "Las Vegas,NV":      { fallback: true, lat: 36.1699, lng: -115.1398 },
  "Atlanta,GA":        { fallback: true, lat: 33.7490, lng: -84.3880 },
  "Miami,FL":          { fallback: true, lat: 25.7617, lng: -80.1918 },
  "Minneapolis,MN":    { fallback: true, lat: 44.9778, lng: -93.2650 },
  "New Orleans,LA":    { fallback: true, lat: 29.9511, lng: -90.0715 },
  "Tampa,FL":          { fallback: true, lat: 27.9506, lng: -82.4572 },
  "Cincinnati,OH":     { fallback: true, lat: 39.1031, lng: -84.5120 },
  "Pittsburgh,PA":     { fallback: true, lat: 40.4406, lng: -79.9959 },
  "Kansas City,MO":    { fallback: true, lat: 39.0997, lng: -94.5786 },
  "Cleveland,OH":      { fallback: true, lat: 41.4993, lng: -81.6944 },
  "Raleigh,NC":        { fallback: true, lat: 35.7796, lng: -78.6382 },
  "Virginia Beach,VA": { fallback: true, lat: 36.8529, lng: -75.9780 },
  "Omaha,NE":          { fallback: true, lat: 41.2565, lng: -95.9345 },
  "Colorado Springs,CO":{ fallback: true, lat: 38.8339, lng: -104.8214 },
  "Tulsa,OK":          { fallback: true, lat: 36.1540, lng: -95.9928 },
  "Arlington,TX":      { fallback: true, lat: 32.7357, lng: -97.1081 },
  "Sacramento,CA":     { fallback: true, lat: 38.5816, lng: -121.4944 },
  "Salt Lake City,UT": { fallback: true, lat: 40.7608, lng: -111.8910 },
  "Albuquerque,NM":    { fallback: true, lat: 35.0844, lng: -106.6504 },
  "Birmingham,AL":     { fallback: true, lat: 33.5186, lng: -86.8104 },
  "Richmond,VA":       { fallback: true, lat: 37.5407, lng: -77.4360 },
};

// Normalize title for better deduplication
function normalizeTitle(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

// ─── Parse RSS XML into event records ───────────────────────────────────────
function parseRSS(xml: string, cityName: string, cityState: string, cityLat: number, cityLng: number) {
  const events: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const getField = (tag: string) => {
      const m = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`));
      return m ? m[1].trim() : '';
    };

    const title = getField('title')
      .replace(/&/g, '&')
      .replace(/"/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/</g, '<')
      .replace(/>/g, '>');

    let description = getField('description')
      .replace(/<[^>]+>/g, '')
      .replace(/&/g, '&')
      .replace(/"/g, '"')
      .substring(0, 500);

    const link = getField('link');
    // Prefer explicit event date fields when present; fall back to pubDate
    const rawDate = getField('startdate') || getField('event:startdate') || getField('dc:date') || getField('pubDate');

    if (!title || title === 'CRM Import') continue;

    let dateStart: Date;
    try {
      dateStart = rawDate ? new Date(rawDate) : new Date();
    } catch {
      dateStart = new Date();
    }

    // Skip past events
    if (dateStart < new Date()) continue;

    const lower = (title + ' ' + description).toLowerCase();
    let category = 'community';
    if (lower.includes('festival') || lower.includes('fair')) category = 'festival';
    else if (lower.includes('firework') || lower.includes('july 4') || lower.includes('fourth of july')) category = 'fireworks';
    else if (lower.includes('parade')) category = 'parade';
    else if (lower.includes('concert') || lower.includes('music') || lower.includes('band')) category = 'music';
    else if (lower.includes('art') || lower.includes('gallery') || lower.includes('museum')) category = 'arts';
    else if (lower.includes('food') || lower.includes('taste') || lower.includes('culinary')) category = 'food';
    else if (lower.includes('sport') || lower.includes('race') || lower.includes('marathon') || lower.includes('5k')) category = 'sports';
    else if (lower.includes('outdoor') || lower.includes('park') || lower.includes('trail')) category = 'outdoor';
    else if (lower.includes('holiday') || lower.includes('christmas') || lower.includes('halloween') || lower.includes('easter')) category = 'holiday';
    else if (lower.includes('education') || lower.includes('workshop') || lower.includes('class') || lower.includes('lecture')) category = 'education';
    else if (lower.includes('tour') || lower.includes('attraction') || lower.includes('exhibit')) category = 'attraction';

    let holiday = 'none';
    if (lower.includes('july 4') || lower.includes('fourth of july') || lower.includes('independence day')) holiday = 'july_4th';
    else if (lower.includes('halloween') || lower.includes('trick or treat') || lower.includes('haunted')) holiday = 'halloween';
    else if (lower.includes('christmas') || lower.includes('holiday market') || lower.includes('santa')) holiday = 'christmas';
    else if (lower.includes('easter') || lower.includes('egg hunt')) holiday = 'easter';
    else if (lower.includes("st. patrick") || lower.includes("st patrick") || lower.includes('irish')) holiday = 'st_patricks';
    else if (lower.includes('thanksgiving') || lower.includes('turkey trot')) holiday = 'thanksgiving';
    else if (lower.includes('new year')) holiday = 'new_years';
    else if (lower.includes('valentine')) holiday = 'valentines';
    else if (lower.includes('memorial day')) holiday = 'memorial_day';
    else if (lower.includes('labor day')) holiday = 'labor_day';

    events.push({
      title,
      description: description || `${title} in ${cityName}.`,
      date_start: dateStart.toISOString(),
      date_end: new Date(dateStart.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      location_name: cityName,
      address: `${cityName}, ${cityState}`,
      latitude: cityLat,
      longitude: cityLng,
      category,
      holiday,
      photos: [],
      is_free: lower.includes('free') || lower.includes('no charge'),
      price_info: null,
      age_min: 0,
      age_max: 18,
      is_permanent: false,
      website_url: link || null,
      status: 'approved',
      going_count: 0,
      save_count: 0,
      featured: false,
      source: 'rss',
    });
  }
  return events;
}

// ─── Fetch from Socrata Open Data ───────────────────────────────────────────
async function fetchSocrata(domain: string, datasetId: string, cityLat: number, cityLng: number, cityName: string, cityState: string) {
  const today = new Date().toISOString().slice(0, 10);
  const url = `https://${domain}/resource/${datasetId}.json?$limit=50&$order=start_date ASC&$where=start_date >= '${today}'`;
  const res = await fetch(url, { headers: { 'X-App-Token': 'localvibes' } });
  if (!res.ok) throw new Error(`Socrata ${res.status}`);
  const data = await res.json();

  return data.map((e: any) => {
    const title = (e.event_name || e.name || e.title || 'Community Event').replace(/&/g, '&');
    const lower = title.toLowerCase();
    let category = 'community';
    if (lower.includes('festival')) category = 'festival';
    else if (lower.includes('parade')) category = 'parade';
    else if (lower.includes('concert') || lower.includes('music')) category = 'music';
    else if (lower.includes('art')) category = 'arts';
    else if (lower.includes('food')) category = 'food';
    else if (lower.includes('sport') || lower.includes('race')) category = 'sports';

    return {
      title,
      description: (e.event_description || e.description || `${title} in ${cityName}`).substring(0, 500),
      date_start: e.start_date || e.start_datetime || new Date().toISOString(),
      date_end: e.end_date || e.end_datetime || null,
      location_name: e.location || e.park_name || cityName,
      address: e.address || `${cityName}, ${cityState}`,
      latitude: parseFloat(e.latitude || e.lat || cityLat) || cityLat,
      longitude: parseFloat(e.longitude || e.lng || cityLng) || cityLng,
      category,
      holiday: 'none',
      photos: [],
      is_free: true,
      price_info: null,
      age_min: 0,
      age_max: 18,
      is_permanent: false,
      website_url: e.url || e.event_url || null,
      status: 'approved',
      going_count: 0,
      save_count: 0,
      featured: false,
      source: 'socrata',
    };
  }).filter((e: any) => e.title && new Date(e.date_start) > new Date());
}

// ─── LLM fallback ───────────────────────────────────────────────────────────
async function fetchViaLLM(base44: any, city: any) {
  const { name, state_code, latitude, longitude } = city;
  const today = new Date().toISOString().slice(0, 10);
  const windowEnd = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Find 10 real upcoming family-friendly community events in ${name}, ${state_code} from ${today} through ${windowEnd} (next 120 days only).
Include festivals, outdoor, parades, holiday, farmers markets, arts, community, food, seasonal attractions.
Return JSON object with key "events". Each event:
{ title, description (2-3 sentences), date_start (YYYY-MM-DDTHH:MM:SS), date_end, location_name, address (full, ${name} ${state_code}), latitude (venue), longitude (venue), category (festival/outdoor/sports/arts/music/food/holiday/community/education/attraction/parade/fireworks/other), holiday (none/july_4th/halloween/christmas/easter/st_patricks/thanksgiving/new_years/valentines/memorial_day/labor_day), is_free (bool), price_info, age_min:0, age_max:18, website_url }
Real confirmed events only. Fallback coords: ${latitude},${longitude}.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
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
              website_url: { type: "string" }
            }
          }
        }
      }
    }
  });

  const rawEvents = Array.isArray(llmResult) ? llmResult : (llmResult?.events || []);
  return rawEvents.map((e: any) => ({
    ...e,
    category: VALID_CATEGORIES.includes(e.category) ? e.category : 'other',
    holiday: VALID_HOLIDAYS.includes(e.holiday) ? e.holiday : 'none',
    latitude: (e.latitude && Math.abs(e.latitude) > 0.1) ? e.latitude : latitude,
    longitude: (e.longitude && Math.abs(e.longitude) > 0.1) ? e.longitude : longitude,
    photos: [],
    status: 'approved',
    going_count: 0,
    save_count: 0,
    featured: false,
    source: 'llm',
  }));
}

// ─── Main handler ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') isAuthorized = true;
    } catch (_) { isAuthorized = true; }
    if (!isAuthorized) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { city_id } = body;

    // Fetch city record
    let city;
    if (city_id) {
      const cities = await base44.asServiceRole.entities.City.filter({ id: city_id });
      city = cities[0];
    } else if (body.city_name && body.city_state) {
      const cities = await base44.asServiceRole.entities.City.filter({
        name: body.city_name,
        state_code: body.city_state,
      });
      city = cities[0] || { name: body.city_name, state_code: body.city_state, latitude: body.city_lat, longitude: body.city_lng };
    }

    if (!city) return Response.json({ error: 'City not found' }, { status: 404 });

    // Prune events outside the rolling 120-day window (keep holiday events)
    try {
      const nowDate = new Date();
      const windowEndDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);
      const cityEvents = await base44.asServiceRole.entities.Event.filter(
        { address: { $regex: city.name, $options: 'i' } }, '-date_start', 300
      );
      for (const ev of cityEvents) {
        const holidayVal = ev.holiday || 'none';
        if (holidayVal !== 'none') continue;
        const d = new Date(ev.date_start);
        if (d < nowDate || d > windowEndDate) {
          try {
            await base44.asServiceRole.entities.Event.delete(ev.id);
          } catch (_) {}
        }
      }
    } catch (pruneErr) {
      console.warn('Prune step failed:', pruneErr.message);
    }

    const cityKey = `${city.name},${city.state_code}`;
    const source = CITY_SOURCES[cityKey] || { fallback: true, lat: city.latitude, lng: city.longitude };
    const cityLat = source.lat || city.latitude;
    const cityLng = source.lng || city.longitude;

    // Stronger deduplication key: normalized title + date + optional URL
    const existing = await base44.asServiceRole.entities.Event.filter(
      { address: { $regex: city.name, $options: 'i' } },
      '-date_start', 150
    );
    const existingKeys = new Set(
      existing.map((e: any) => {
        const norm = normalizeTitle(e.title);
        const day = e.date_start?.slice(0, 10) || '';
        const urlPart = e.website_url ? `|${e.website_url}` : '';
        return `${norm}|${day}${urlPart}`;
      })
    );

    let rawEvents: any[] = [];
    let sourceUsed = 'llm';

    // 1. RSS
    if (source.rss_url) {
      try {
        console.log(`[${cityKey}] Fetching RSS: ${source.rss_url}`);
        const res = await fetch(source.rss_url, { headers: { 'User-Agent': 'CityVibes/1.0' } });
        if (res.ok) {
          const xml = await res.text();
          rawEvents = parseRSS(xml, city.name, city.state_code, cityLat, cityLng);
          sourceUsed = 'rss';
          console.log(`[${cityKey}] RSS returned ${rawEvents.length} future events`);
        }
      } catch (err) {
        console.warn(`[${cityKey}] RSS failed: ${err.message}`);
      }
    }

    // 2. Socrata
    if (rawEvents.length === 0 && source.socrata) {
      try {
        console.log(`[${cityKey}] Fetching Socrata: ${source.socrata.domain}/${source.socrata.dataset_id}`);
        rawEvents = await fetchSocrata(source.socrata.domain, source.socrata.dataset_id, cityLat, cityLng, city.name, city.state_code);
        sourceUsed = 'socrata';
        console.log(`[${cityKey}] Socrata returned ${rawEvents.length} events`);
      } catch (err) {
        console.warn(`[${cityKey}] Socrata failed: ${err.message}`);
      }
    }

    // 3. LLM fallback
    if (rawEvents.length === 0) {
      console.log(`[${cityKey}] Using LLM web-search fallback`);
      rawEvents = await fetchViaLLM(base44, { ...city, latitude: cityLat, longitude: cityLng });
      sourceUsed = 'llm';
      console.log(`[${cityKey}] LLM returned ${rawEvents.length} events`);
    }

    // Deduplicate + window filter
    const windowEndDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);
    const nowDate = new Date();
    const toCreate = [];

    for (const e of rawEvents) {
      if (!e.title || !e.date_start) continue;

      const holidayVal = VALID_HOLIDAYS.includes(e.holiday) ? e.holiday : 'none';
      const eventDate = new Date(e.date_start);
      if (holidayVal === 'none' && (eventDate < nowDate || eventDate > windowEndDate)) continue;

      const norm = normalizeTitle(e.title);
      const day = e.date_start?.slice(0, 10) || '';
      const urlPart = e.website_url ? `|${e.website_url}` : '';
      const key = `${norm}|${day}${urlPart}`;

      if (existingKeys.has(key)) continue;
      existingKeys.add(key); // prevent intra-batch duplicates

      toCreate.push({
        title: String(e.title).substring(0, 200),
        description: String(e.description || '').substring(0, 1000),
        date_start: e.date_start,
        date_end: e.date_end || e.date_start,
        location_name: String(e.location_name || city.name).substring(0, 200),
        address: String(e.address || `${city.name}, ${city.state_code}`).substring(0, 300),
        latitude: parseFloat(e.latitude) || cityLat,
        longitude: parseFloat(e.longitude) || cityLng,
        category: VALID_CATEGORIES.includes(e.category) ? e.category : 'other',
        holiday: holidayVal,
        photos: e.photos || [],
        is_free: e.is_free !== false,
        price_info: e.price_info || null,
        age_min: e.age_min ?? 0,
        age_max: e.age_max ?? 18,
        is_permanent: false,
        website_url: e.website_url || null,
        status: 'approved',
        going_count: 0,
        save_count: 0,
        featured: false,
        // Note: source field is stored if your Event entity supports it;
        // otherwise it is ignored by the backend.
      });
    }

    if (toCreate.length > 0) {
      await base44.asServiceRole.entities.Event.bulkCreate(toCreate);
    }

    return Response.json({
      city: cityKey,
      source: sourceUsed,
      found: rawEvents.length,
      synced: toCreate.length,
      skipped: rawEvents.length - toCreate.length,
    });

  } catch (error) {
    console.error('[syncCityFromSource]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
