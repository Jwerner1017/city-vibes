import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Deletes non-permanent events 24 hours after they end (or after they start, if no end time).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const queries = [
      { is_permanent: false, date_end: { $lt: cutoff } },
      { is_permanent: false, date_end: { $exists: false }, date_start: { $lt: cutoff } },
    ];

    let deleted = 0;
    for (const query of queries) {
      // Delete in small id batches so a large backlog never times out
      for (let i = 0; i < 10; i++) {
        const page = await base44.asServiceRole.entities.Event.filter(query, { limit: 100, fields: ['id'] });
        const ids = (page?.items ?? page ?? []).map((e) => e.id);
        if (!ids.length) break;
        await base44.asServiceRole.entities.Event.deleteMany({ id: { $in: ids } });
        deleted += ids.length;
        if (ids.length < 100) break;
      }
    }

    return Response.json({ ok: true, cutoff, deleted });
  } catch (error) {
    console.error('cleanupExpiredEvents failed:', error);
    return Response.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}