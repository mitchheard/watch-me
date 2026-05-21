import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseRouteUser } from '@/lib/supabase-route-auth';
import { isPro } from '@/lib/subscription';

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
    },
  });

  return NextResponse.json({
    subscriptionStatus: row.subscriptionStatus,
    subscriptionPeriodEnd: row.subscriptionPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    isPro: isPro(row),
  });
}
