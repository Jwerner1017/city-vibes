import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

// Only these amounts (in dollars, as sent by src/pages/Donate.jsx) are accepted.
const ALLOWED_AMOUNTS: Record<string, number[]> = {
  one_time: [5, 10, 20],
  monthly: [2.99, 4.99, 9.99],
};

Deno.serve(async (req) => {
  try {
    // Return links come from the platform's own header, never from the caller.
    const appUrl = req.headers.get('X-Base44-App-Url');
    if (!appUrl) {
      console.error('[Checkout Error] X-Base44-App-Url header missing');
      return Response.json({ error: 'Checkout could not be started. Please try again.' }, { status: 500 });
    }
    const origin = new URL(appUrl).origin;

    // Guests can donate; a signed-in donor is recorded so the payment can unlock their badge.
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const body = await req.json();
    const { amount, type } = body;
    const tier_name = String(body.tier_name || '').slice(0, 40);

    if (!amount || !type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allowed = type === 'monthly' ? ALLOWED_AMOUNTS.monthly : ALLOWED_AMOUNTS.one_time;
    if (!allowed.includes(Number(amount))) {
      return Response.json({ error: 'Invalid donation amount' }, { status: 400 });
    }

    const amountInCents = Math.round(amount * 100);

    let sessionConfig: any = {
      payment_method_types: ['card'],
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
        type,
        tier_name: tier_name || 'One-time',
        user_id: user?.id || '',
      },
      success_url: `${origin}/donate?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/donate`,
    };

    if (type === 'monthly') {
      // Create a recurring price on the fly
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: amountInCents,
        recurring: { interval: 'month' },
        product_data: {
          name: `City Vibes ${tier_name || 'Monthly'} Support`,
        },
      });

      sessionConfig.mode = 'subscription';
      sessionConfig.subscription_data = { metadata: { base44_app_id: Deno.env.get('BASE44_APP_ID') || '' } };
      sessionConfig.line_items = [{ price: price.id, quantity: 1 }];
    } else {
      // One-time payment
      sessionConfig.mode = 'payment';
      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          unit_amount: amountInCents,
          product_data: {
            name: 'City Vibes Community Support',
            description: 'One-time donation to keep City Vibes running',
          },
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Recorded by the server as pending. Only the signed Stripe webhook marks it completed.
    if (user) {
      await base44.asServiceRole.entities.Donation.create({
        amount: Number(amount),
        type,
        tier_name: tier_name || 'One-time',
        status: 'pending',
        user_id: user.id,
        stripe_session_id: session.id,
      });
    }

    console.log(`[Checkout] Created session ${session.id} for ${type} $${amount}`);

    return Response.json({ url: session.url, session_id: session.id });

  } catch (error) {
    console.error('[Checkout Error]', error.message);
    return Response.json({ error: 'Checkout could not be started. Please try again.' }, { status: 500 });
  }
});