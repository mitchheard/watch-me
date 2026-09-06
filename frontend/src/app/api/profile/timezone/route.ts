import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseRouteUser } from '@/lib/supabase-route-auth';
import { parseIanaTimeZone, shouldRefreshStoredTimezone } from '@/lib/user-timezone';

export async function POST(request: Request) {
  try {
    const user = await getSupabaseRouteUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const timezone = parseIanaTimeZone(
      body && typeof body === 'object' ? (body as { timezone?: unknown }).timezone : null
    );
    if (!timezone) {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }

    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { timezone: true, timezoneUpdatedAt: true },
    });

    if (!row) {
      return NextResponse.json({ timezone, updated: false });
    }

    if (!shouldRefreshStoredTimezone(row.timezone, row.timezoneUpdatedAt)) {
      return NextResponse.json({ timezone: row.timezone, updated: false });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { timezone, timezoneUpdatedAt: new Date() },
    });

    return NextResponse.json({ timezone, updated: true });
  } catch (error) {
    console.error('Failed to update timezone:', error);
    return NextResponse.json({ error: 'Failed to update timezone' }, { status: 500 });
  }
}
