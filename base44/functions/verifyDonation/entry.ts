import Stripe from 'npm:stripe@14.21.0';
import { secrets } from 'base44:runtime';

// Public by design: the long random Stripe session id from the return link is the check.
// Asks Stripe whether that checkout was paid. Reads only, changes nothing.
export default async function(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = String(body.session_id || '');
    if (!/^cs_(live|test)_[A-Za-z0-9]{20,200}$/.test(sessionId)) {
      return Response.json({ error: 'session_id is required' }, { status: 400 });
    }
    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });
    const session = await stripe.checkout.sessions.retrieve(sessionId)
      .catch((e) => (e.statusCode === 404 ? null : Promise.reject(e)));
    const meta = session?.metadata || {};
    const ours = Boolean(session) && meta.base44_app_id === secrets.get('BASE44_APP_ID');
    const paid = ours && session.payment_status === 'paid';
    return Response.json({ paid, badge: paid && Boolean(meta.user_id) });
  } catch (error) {
    console.error('[verifyDonation]', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}