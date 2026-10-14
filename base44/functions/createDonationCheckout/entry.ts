import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

// Only these amounts (in dollars, as sent by src/pages/Donate.jsx) are accepted.
const ALLOWED_AMOUNTS: Record<string, number[]> = {
  one_time: [5, 10, 20],
  monthly: [2.99, 4.99, 9.99],
};
const ALLOWED_ORIGINS = ['https://city-vibes.us', 'https://www.city-vibes.us'];
const DEFAULT_ORIGIN = 'https://city-vibes.us';

// Only allow redirects back to city-vibes.us; anything else falls back to the default.
function safeUrl(candidate: unknown, fallbackPath: string): string {
  if (typeof candidate === 'string') {
    try {
      const u = new URL(candidate);
      if (ALLOWED_ORIGINS.includes(u.origin)) return u.toString();
    } catch (_) { /* fall through */ }
  }
  return `${DEFAULT_ORIGIN}${fallbackPath}`;
}

Deno.serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const body = await req.json();
    const { amount, type, tier_name, success_url, cancel_url } = body;

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
      },
      success_url: safeUrl(success_url, '/donate?success=true'),
      cancel_url: safeUrl(cancel_url, '/donate'),
    };

    if (type === 'monthly') {
      // Prefer a fixed Price from env (if configured); otherwise inline price_data.
      // No prices.create call, so no new Price object is created per checkout.
      const priceEnv: Record<string, string> = {
        '2.99': 'STRIPE_PRICE_DONATION_MONTHLY_299',
        '4.99': 'STRIPE_PRICE_DONATION_MONTHLY_499',
        '9.99': 'STRIPE_PRICE_DONATION_MONTHLY_999',
      };
      const fixedPrice = Deno.env.get(priceEnv[String(Number(amount))] || '');
      sessionConfig.mode = 'subscription';
      sessionConfig.line_items = [fixedPrice
        ? { price: fixedPrice, quantity: 1 }
        : {
            price_data: {
              currency: 'usd',
              unit_amount: amountInCents,
              recurring: { interval: 'month' },
              product_data: { name: `City Vibes ${tier_name || 'Monthly'} Support` },
            },
            quantity: 1,
          }];
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

    console.log(`[Checkout] Created session ${session.id} for ${type} $${amount}`);

    return Response.json({ url: session.url, session_id: session.id });

  } catch (error) {
    console.error('[Checkout Error]', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});