import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseRouteUser } from '@/lib/supabase-route-auth';
import { hasProAccess, isPro } from '@/lib/subscription';

export async function GET() {
  const user = await getSupabaseRouteUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const row = await prisma.user.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email },
    update: {},
    select: {
      subscriptionStatus: true,
      subscriptionPeriodEnd: true,
      cancelAtPeriodEnd: true,
      isAdmin: true,
    },
  });

  return NextResponse.json({
    subscriptionStatus: row.subscriptionStatus,
    subscriptionPeriodEnd: row.subscriptionPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    isAdmin: row.isAdmin,
    /** Paid Stripe Pro only — Settings billing UI. */
    isPro: isPro(row),
    /** Feature entitlement (admin OR paid Pro). */
    hasProAccess: hasProAccess(row),
  });
}
