import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe-server';
import { getSupabaseRouteUser } from '@/lib/supabase-route-auth';
import {
  isValidSubscriptionConsent,
  PRO_SUBSCRIPTION_DISCLOSURE,
} from '@/lib/subscription-arl';

function siteOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) return url.replace(/\/$/, '');
  return 'http://localhost:3000';
}

export async function POST(request: Request) {
  try {
    const user = await getSupabaseRouteUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!isValidSubscriptionConsent(body)) {
      return NextResponse.json({ error: 'Consent required' }, { status: 400 });
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID?.trim();
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price not configured' }, { status: 503 });
    }

    await prisma.subscriptionConsent.create({
      data: {
        userId: user.id,
        termsText: PRO_SUBSCRIPTION_DISCLOSURE,
        consented: true,
      },
    });

    const stripe = getStripe();
    const origin = siteOrigin();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/account?upgraded=true`,
      cancel_url: `${origin}/account`,
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
