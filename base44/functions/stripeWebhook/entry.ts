import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import Stripe from 'npm:stripe@14.21.0';
import { secrets } from 'base44:runtime';

const PAID_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'];

// The only place a donation is marked completed: a Stripe-signed event for a paid
// session whose amount matches the donation the server recorded at checkout.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const signature = req.headers.get('stripe-signature');
    if (!signature) return Response.json({ error: 'Missing signature' }, { status: 400 });

    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secrets.get('STRIPE_WEBHOOK_SECRET'));
    } catch (err) {
      console.error('[stripeWebhook] signature check failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (!PAID_EVENTS.includes(event.type)) return Response.json({ received: true });
    const session = event.data.object;
    const meta = session.metadata || {};
    if (meta.base44_test_checkout === 'true' || meta.base44_app_id !== secrets.get('BASE44_APP_ID')) {
      return Response.json({ received: true });
    }
    if (session.payment_status !== 'paid') return Response.json({ received: true });

    const Donations = base44.asServiceRole.entities.Donation;
    const [donation] = await Donations.filter({ stripe_session_id: session.id });
    if (!donation) return Response.json({ received: true }); // guest donation: nothing to unlock

    if (session.currency !== 'usd' || session.amount_total !== Math.round(donation.amount * 100)) {
      console.error(`[stripeWebhook] amount mismatch on ${session.id}: paid ${session.amount_total} ${session.currency}`);
      return Response.json({ received: true });
    }
    if (donation.status !== 'completed') {
      await Donations.update(donation.id, { status: 'completed' });
      console.log(`[stripeWebhook] donation ${donation.id} completed`);
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error('[stripeWebhook]', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}