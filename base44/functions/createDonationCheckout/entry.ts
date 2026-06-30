import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

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

    const amountInCents = Math.round(amount * 100);

    let sessionConfig: any = {
      payment_method_types: ['card'],
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
        type,
        tier_name: tier_name || 'One-time',
      },
      success_url: success_url || 'https://localvibes.app/donate?success=true',
      cancel_url: cancel_url || 'https://localvibes.app/donate',
    };

    if (type === 'monthly') {
      // Create a recurring price on the fly
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: amountInCents,
        recurring: { interval: 'month' },
        product_data: {
          name: `Local Vibes ${tier_name || 'Monthly'} Support`,
        },
      });

      sessionConfig.mode = 'subscription';
      sessionConfig.line_items = [{ price: price.id, quantity: 1 }];
    } else {
      // One-time payment
      sessionConfig.mode = 'payment';
      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          unit_amount: amountInCents,
          product_data: {
            name: 'Local Vibes Community Support',
            description: 'One-time donation to keep Local Vibes running',
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