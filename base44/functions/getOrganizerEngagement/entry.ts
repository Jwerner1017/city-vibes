import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Returns going/saved totals for the signed-in organizer's own events. Counts only, never who interacted.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const page = await base44.asServiceRole.entities.Event.filter(
      { created_by_id: user.id },
      { sort: '-date_start', limit: 100, fields: ['id'] },
    );
    const ids = (page?.items ?? page ?? []).map((e) => e.id);
    const counts = {};
    if (!ids.length) return Response.json({ counts });

    const [going, saved] = await Promise.all(
      ['going', 'saved'].map((type) =>
        base44.asServiceRole.entities.UserInteraction.aggregate({
          query: { event_id: { $in: ids }, type },
          groupBy: 'event_id',
        }),
      ),
    );
    for (const id of ids) counts[id] = { going: 0, saved: 0 };
    for (const row of going?.rows ?? []) if (counts[row.event_id]) counts[row.event_id].going = row.count;
    for (const row of saved?.rows ?? []) if (counts[row.event_id]) counts[row.event_id].saved = row.count;

    return Response.json({ counts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}