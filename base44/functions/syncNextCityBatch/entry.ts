import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Louisville always runs first (home city / densest sources).
// Then a rolling batch of other cities so the rest of the map stays fresh.
const OTHER_BATCH_SIZE = 2;

async function syncOneCity(base44, city) {
  const result = await base44.asServiceRole.functions.invoke('syncCityFromSource', {
    city_name: city.name,
    city_state: city.state_code,
    city_lat: city.latitude,
    city_lng: city.longitude,
  });
  return {
    city: `${city.name}, ${city.state_code}`,
    synced: result?.synced ?? 0,
    updated: result?.updated ?? 0,
    found: result?.found ?? 0,
    sources: result?.sources ?? null,
  };
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
    const louisville = allCities.find((c) => c.name === 'Louisville' && (c.state_code === 'KY' || c.state_code === 'Kentucky'));
    const others = allCities.filter((c) => c !== louisville);
    const totalOthers = others.length;

    let currentBatch = body.batch ?? null;
    if (currentBatch === null) {
      const stateRecords = await base44.asServiceRole.entities.Event.filter(
        { title: '__sync_batch_state__' }, '-created_date', 1
      );
      currentBatch = stateRecords.length > 0 ? (stateRecords[0].going_count || 0) : 0;
    }

    const start = currentBatch * OTHER_BATCH_SIZE;
    const othersToProcess = others.slice(start, start + OTHER_BATCH_SIZE);
    const totalBatches = Math.max(1, Math.ceil(totalOthers / OTHER_BATCH_SIZE));

    const results = [];

    if (louisville) {
      try {
        results.push(await syncOneCity(base44, louisville));
      } catch (err) {
        results.push({ city: 'Louisville, KY', error: err.message });
      }
    }

    for (const city of othersToProcess) {
      try {
        results.push(await syncOneCity(base44, city));
      } catch (err) {
        results.push({ city: `${city.name}, ${city.state_code}`, error: err.message });
      }
    }

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
        status: 'rejected',
        going_count: nextBatch,
      });
    }

    const totalSynced = results.reduce((sum, r) => sum + (r.synced || 0), 0);
    const totalUpdated = results.reduce((sum, r) => sum + (r.updated || 0), 0);

    return Response.json({
      batch: currentBatch,
      next_batch: nextBatch,
      total_batches: totalBatches,
      louisville_always: true,
      cities_processed: results.length,
      total_events_synced: totalSynced,
      total_events_updated: totalUpdated,
      progress: `${Math.round(((currentBatch + 1) / totalBatches) * 100)}%`,
      results,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
