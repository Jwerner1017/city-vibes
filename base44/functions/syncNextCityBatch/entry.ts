import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Stateful batch processor: stores current batch index in a special marker event
// Each run processes 2 cities, then advances the batch counter
// Set up as a scheduled automation every 30 minutes to cover all cities over time

const BATCH_SIZE = 2;
const VALID_CATEGORIES = ["festival","outdoor","sports","arts","music","food","holiday","community","education","attraction","trick_or_treat","fireworks","santa","easter","parade","other"];
const VALID_HOLIDAYS = ["none","july_4th","halloween","christmas","easter","st_patricks","thanksgiving","new_years","valentines","memorial_day","labor_day"];

async function syncOneCity(base44, city) {
  const cityName = city.name;
  const cityState = city.state_code;
  const cityLat = city.latitude;
  const cityLng = city.longitude;

  const existing = await base44.asServiceRole.entities.Event.filter(
    { address: { $regex: cityName, $options: 'i' } },
    '-date_start', 50
  );
  const existingKeys = new Set(existing.map(e => `${e.title?.toLowerCase().slice(0,40)}|${e.date_start?.slice(0,10)}`));

  const today = new Date().toISOString().slice(0,10);

  const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Find 10 real upcoming family-friendly community events in ${cityName}, ${cityState} from ${today} through December 2026.
Include festivals, outdoor events, parades, holiday events, farmers markets, arts events, community gatherings, food events, seasonal attractions.
Return a JSON object with key "events". Each event must have:
title, description (2-3 sentences), date_start (YYYY-MM-DDTHH:MM:SS), date_end, location_name (venue name),
address (full address in ${cityName} ${cityState}), latitude (venue specific), longitude (venue specific),
category (one of: festival,outdoor,sports,arts,music,food,holiday,community,education,attraction,parade,fireworks,other),
holiday (one of: none,july_4th,halloween,christmas,easter,st_patricks,thanksgiving,new_years,valentines,memorial_day,labor_day),
is_free (boolean), price_info (string or null), age_min (0), age_max (18), website_url (string).
Only REAL confirmed events. Fallback coords: ${cityLat},${cityLng}.`,
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

  for (const e of rawEvents) {
    if (!e.title || !e.date_start) continue;
    const key = `${e.title?.toLowerCase().slice(0,40)}|${e.date_start?.slice(0,10)}`;
    if (existingKeys.has(key)) continue;
    toCreate.push({
      title: e.title,
      description: e.description || '',
      date_start: e.date_start,
      date_end: e.date_end || e.date_start,
      location_name: e.location_name || `${cityName} Community Event`,
      address: e.address || `${cityName}, ${cityState}`,
      latitude: (e.latitude && Math.abs(e.latitude) > 0.1) ? e.latitude : cityLat,
      longitude: (e.longitude && Math.abs(e.longitude) > 0.1) ? e.longitude : cityLng,
      category: VALID_CATEGORIES.includes(e.category) ? e.category : 'other',
      holiday: VALID_HOLIDAYS.includes(e.holiday) ? e.holiday : 'none',
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

  return { city: `${cityName}, ${cityState}`, synced: toCreate.length };
}

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

    const allCities = await base44.asServiceRole.entities.City.filter({ is_active: true }, 'ranking', 200);
    const totalCities = allCities.length;

    // Get or set current batch from body (for manual runs) or use stored progress
    // Store batch progress in a scratch Event record with title "__sync_batch_state__"
    let currentBatch = body.batch ?? null;

    if (currentBatch === null) {
      const stateRecords = await base44.asServiceRole.entities.Event.filter(
        { title: '__sync_batch_state__' }, '-created_date', 1
      );
      if (stateRecords.length > 0) {
        currentBatch = (stateRecords[0].going_count || 0);
      } else {
        currentBatch = 0;
      }
    }

    const start = currentBatch * BATCH_SIZE;
    const citiesToProcess = allCities.slice(start, start + BATCH_SIZE);
    const totalBatches = Math.ceil(totalCities / BATCH_SIZE);

    if (citiesToProcess.length === 0) {
      // Reset to 0 for next cycle
      currentBatch = 0;
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

    // Advance batch counter — store in state record
    const nextBatch = (currentBatch + 1) >= totalBatches ? 0 : currentBatch + 1;
    const stateRecords = await base44.asServiceRole.entities.Event.filter(
      { title: '__sync_batch_state__' }, '-created_date', 1
    );
    if (stateRecords.length > 0) {
      await base44.asServiceRole.entities.Event.update(stateRecords[0].id, { going_count: nextBatch });
    } else {
      await base44.asServiceRole.entities.Event.create({
        title: '__sync_batch_state__',
        date_start: new Date().toISOString(),
        latitude: 0,
        longitude: 0,
        category: 'other',
        status: 'rejected', // hidden from users
        going_count: nextBatch,
      });
    }

    const totalSynced = results.reduce((sum, r) => sum + (r.synced || 0), 0);

    return Response.json({
      batch: currentBatch,
      next_batch: nextBatch,
      total_batches: totalBatches,
      cities_processed: results.length,
      total_events_synced: totalSynced,
      progress: `${Math.round(((currentBatch + 1) / totalBatches) * 100)}%`,
      results,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});