import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });

    if (!row?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer on file. Complete checkout first.' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const origin = siteOrigin();

    const session = await stripe.billingPortal.sessions.create({
      customer: row.stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'No portal URL' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[stripe/portal]', e);
    return NextResponse.json({ error: 'Portal session failed' }, { status: 500 });
  }
}
