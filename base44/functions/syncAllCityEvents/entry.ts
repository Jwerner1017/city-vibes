import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VALID_CATEGORIES = ["festival","outdoor","sports","arts","music","food","holiday","community","education","attraction","trick_or_treat","fireworks","santa","easter","parade","other"];
const VALID_HOLIDAYS = ["none","july_4th","halloween","christmas","easter","st_patricks","thanksgiving","new_years","valentines","memorial_day","labor_day"];

async function syncOneCity(base44, city) {
  const cityName = city.name;
  const cityState = city.state_code;
  const cityLat = city.latitude;
  const cityLng = city.longitude;

  // Check existing to avoid duplicates
  const existing = await base44.asServiceRole.entities.Event.filter(
    { address: { $regex: cityName, $options: 'i' } },
    '-date_start', 50
  );
  const existingKeys = new Set(existing.map(e => `${e.title?.toLowerCase().slice(0, 40)}|${e.date_start?.slice(0, 10)}`));

  // Prune events outside the rolling 90-day window (annual holiday events kept)
  const pruneNow = new Date();
  const pruneWindowEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  for (const ev of existing) {
    if ((ev.holiday || 'none') !== 'none') continue;
    const d = new Date(ev.date_start);
    if (d < pruneNow || d > pruneWindowEnd) {
      try { await base44.asServiceRole.entities.Event.delete(ev.id); } catch (_) {}
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const windowEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const prompt = `Find 10 real upcoming family-friendly community events in ${cityName}, ${cityState} from ${today} through ${windowEnd} (next 90 days only).
Include festivals, outdoor events, parades, holiday events, farmers markets, arts events, community gatherings, food events, seasonal attractions.
Return a JSON object with key "events" containing an array. Each event:
{
  "title": string,
  "description": "2-3 sentences",
  "date_start": "YYYY-MM-DDTHH:MM:SS",
  "date_end": "YYYY-MM-DDTHH:MM:SS",
  "location_name": "venue name",
  "address": "full address, ${cityName}, ${cityState}",
  "latitude": number (venue coords, not city center if possible),
  "longitude": number,
  "category": one of [festival,outdoor,sports,arts,music,food,holiday,community,education,attraction,parade,fireworks,other],
  "holiday": one of [none,july_4th,halloween,christmas,easter,st_patricks,thanksgiving,new_years,valentines,memorial_day,labor_day],
  "is_free": boolean,
  "price_info": string or null,
  "age_min": 0,
  "age_max": 18,
  "website_url": string
}
Only include REAL confirmed events. Use ${cityLat}/${cityLng} as fallback coords only.`;

  const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
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
              title: { type: "string" },
              description: { type: "string" },
              date_start: { type: "string" },
              date_end: { type: "string" },
              location_name: { type: "string" },
              address: { type: "string" },
              latitude: { type: "number" },
              longitude: { type: "number" },
              category: { type: "string" },
              holiday: { type: "string" },
              is_free: { type: "boolean" },
              price_info: { type: "string" },
              age_min: { type: "number" },
              age_max: { type: "number" },
              website_url: { type: "string" }
            }
          }
        }
      }
    }
  });

  const rawEvents = Array.isArray(llmResult) ? llmResult : (llmResult?.events || []);
  const toCreate = [];
  const windowEndDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const nowDate = new Date();

  for (const e of rawEvents) {
    if (!e.title || !e.date_start) continue;
    const category = VALID_CATEGORIES.includes(e.category) ? e.category : 'other';
    const holiday = VALID_HOLIDAYS.includes(e.holiday) ? e.holiday : 'none';
    const eventDate = new Date(e.date_start);
    if (holiday === 'none' && (eventDate < nowDate || eventDate > windowEndDate)) continue;
    const key = `${e.title?.toLowerCase().slice(0, 40)}|${e.date_start?.slice(0, 10)}`;
    if (existingKeys.has(key)) continue;
    const lat = (e.latitude && Math.abs(e.latitude) > 0.1) ? e.latitude : cityLat;
    const lng = (e.longitude && Math.abs(e.longitude) > 0.1) ? e.longitude : cityLng;
    toCreate.push({
      title: e.title,
      description: e.description || '',
      date_start: e.date_start,
      date_end: e.date_end || e.date_start,
      location_name: e.location_name || `${cityName} Community Event`,
      address: e.address || `${cityName}, ${cityState}`,
      latitude: lat,
      longitude: lng,
      category,
      holiday,
      photos: [],
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
      is_sample: false,
    });
  }

  if (toCreate.length > 0) {
    await base44.asServiceRole.entities.Event.bulkCreate(toCreate);
  }

  return { city: `${cityName}, ${cityState}`, found: rawEvents.length, synced: toCreate.length };
}

// Process one batch of cities at a time
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') isAuthorized = true;
    } catch (_) {
      isAuthorized = true;
    }
    if (!isAuthorized) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { batch = 0, batch_size = 3, city_name: filterCity } = body;

    const allCities = await base44.asServiceRole.entities.City.filter({ is_active: true }, 'ranking', 200);

    let citiesToProcess;
    if (filterCity) {
      citiesToProcess = allCities.filter(c => c.name.toLowerCase() === filterCity.toLowerCase());
    } else {
      const start = batch * batch_size;
      citiesToProcess = allCities.slice(start, start + batch_size);
    }

    if (citiesToProcess.length === 0) {
      return Response.json({ message: 'No cities in this batch', batch, total_cities: allCities.length });
    }

    const results = [];
    for (const city of citiesToProcess) {
      try {
        const r = await syncOneCity(base44, city);
        results.push(r);
      } catch (err) {
        results.push({ city: `${city.name}, ${city.state_code}`, error: err.message });
      }
    }

    const totalBatches = Math.ceil(allCities.length / batch_size);
    const totalSynced = results.reduce((sum, r) => sum + (r.synced || 0), 0);

    return Response.json({
      batch,
      total_batches: totalBatches,
      cities_processed: results.length,
      total_events_synced: totalSynced,
      next_batch: batch + 1 < totalBatches ? batch + 1 : null,
      results,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});