import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Stateful rolling-batch orchestrator.
// Each scheduled run processes BATCH_SIZE cities using syncCityFromSource,
// which tries RSS → Socrata → LLM for each city.
// Batch state (which city index we're on) is persisted in the DB.

const BATCH_SIZE = 3;

// Delegate to syncCityFromSource (RSS → Socrata → LLM pipeline)
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
    source: result?.source ?? 'unknown',
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