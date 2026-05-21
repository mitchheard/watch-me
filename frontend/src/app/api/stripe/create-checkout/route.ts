import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe-server';
import { getSupabaseRouteUser } from '@/lib/supabase-route-auth';

function siteOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) return url.replace(/\/$/, '');
  return 'http://localhost:3000';
}

export async function POST() {
  try {
    const user = await getSupabaseRouteUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID?.trim();
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price not configured' }, { status: 503 });
    }

    const stripe = getStripe();
    const origin = siteOrigin();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?upgraded=true`,
      cancel_url: `${origin}/settings`,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'No checkout URL' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[stripe/create-checkout]', e);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
