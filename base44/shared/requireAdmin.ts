// Fails closed: only a resolved admin user passes. Returns an error Response, or null when authorized.
// Any other identity failure rejects, so the caller's catch returns 500 without doing any work.
export async function requireAdmin(base44) {
  const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}