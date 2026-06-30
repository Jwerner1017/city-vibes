import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VALID_CATEGORIES = ["festival", "outdoor", "sports", "arts", "music", "food", "holiday", "community", "education", "attraction", "trick_or_treat", "fireworks", "santa", "easter", "parade", "other"];
const VALID_HOLIDAYS = ["none", "july_4th", "halloween", "christmas", "easter", "st_patricks", "thanksgiving", "new_years", "valentines", "memorial_day", "labor_day"];

// Process one city at a time to avoid timeouts
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') isAuthorized = true;
    } catch (_) {
      isAuthorized = true; // scheduled automation
    }
    if (!isAuthorized) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get payload: { city_name, city_state, city_lat, city_lng, city_id }
    const body = await req.json().catch(() => ({}));
    const { city_name, city_state, city_lat, city_lng } = body;

    if (!city_name || !city_state) {
      return Response.json({ error: 'city_name and city_state are required' }, { status: 400 });
    }

    // Get existing events for this city to avoid duplicates
    const existing = await base44.asServiceRole.entities.Event.filter(
      { location_name: { $regex: city_name, $options: 'i' } },
      '-date_start', 100
    );
    const existingTitles = new Set(existing.map(e => `${e.title?.toLowerCase().slice(0, 40)}|${e.date_start?.slice(0, 10)}`));

    // Use LLM with internet to find real upcoming family events for this city
    const today = new Date().toISOString().slice(0, 10);
    const prompt = `Find 10-15 real, upcoming family-friendly community events happening in ${city_name}, ${city_state} from ${today} through end of 2026.

Include festivals, outdoor events, parades, holiday events, farmers markets, arts events, community gatherings, sports events, food events, and seasonal attractions.

For each event return accurate details. Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Event Name",
    "description": "2-3 sentence description",
    "date_start": "2026-07-04T10:00:00",
    "date_end": "2026-07-04T22:00:00",
    "location_name": "Venue or Park Name",
    "address": "Full street address, ${city_name}, ${city_state}",
    "latitude": ${city_lat || 0},
    "longitude": ${city_lng || 0},
    "category": "festival|outdoor|sports|arts|music|food|holiday|community|education|attraction|parade|fireworks|other",
    "holiday": "none|july_4th|halloween|christmas|easter|st_patricks|thanksgiving|new_years|valentines|memorial_day|labor_day",
    "is_free": true,
    "price_info": "$10 adults or null if free",
    "age_min": 0,
    "age_max": 18,
    "website_url": "https://..."
  }
]

Rules:
- Only include REAL confirmed events, not guesses
- latitude/longitude should be the SPECIFIC venue location, not just the city center
- If the event has a known venue, use its actual coordinates
- Use ${city_lat} / ${city_lng} only as fallback if venue coords unknown
- category must be one of the exact values listed
- holiday must be one of the exact values listed
- Return ONLY the JSON array, no extra text`;

    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt + '\n\nIMPORTANT: Return a JSON object with key "events" containing the array.',
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

    // Validate and deduplicate
    const toCreate = [];
    for (const e of rawEvents) {
      if (!e.title || !e.date_start) continue;

      const key = `${e.title?.toLowerCase().slice(0, 40)}|${e.date_start?.slice(0, 10)}`;
      if (existingTitles.has(key)) continue;

      const category = VALID_CATEGORIES.includes(e.category) ? e.category : 'other';
      const holiday = VALID_HOLIDAYS.includes(e.holiday) ? e.holiday : 'none';
      const lat = (e.latitude && Math.abs(e.latitude) > 0.1) ? e.latitude : (city_lat || 0);
      const lng = (e.longitude && Math.abs(e.longitude) > 0.1) ? e.longitude : (city_lng || 0);

      toCreate.push({
        title: e.title,
        description: e.description || '',
        date_start: e.date_start,
        date_end: e.date_end || e.date_start,
        location_name: e.location_name || `${city_name} Community Event`,
        address: e.address || `${city_name}, ${city_state}`,
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

    return Response.json({
      city: `${city_name}, ${city_state}`,
      found: rawEvents.length,
      synced: toCreate.length,
      skipped_duplicates: rawEvents.length - toCreate.length,
      events: toCreate.map(e => e.title),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});