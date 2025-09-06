import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create notification preferences for the user
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: user.id },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: user.id,
          emailEnabled: true,
          welcomeEmailSent: false,
          weeklyDigestEnabled: false,
          monthlyDigestEnabled: false,
          newSeasonAlerts: true,
          friendActivityAlerts: true,
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      emailEnabled,
      weeklyDigestEnabled,
      monthlyDigestEnabled,
      newSeasonAlerts,
      friendActivityAlerts 
    } = body;

    // Update or create notification preferences for the user
    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId: user.id },
      update: {
        emailEnabled,
        weeklyDigestEnabled,
        monthlyDigestEnabled,
        newSeasonAlerts,
        friendActivityAlerts,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        emailEnabled: emailEnabled ?? true,
        welcomeEmailSent: false,
        weeklyDigestEnabled: weeklyDigestEnabled ?? false,
        monthlyDigestEnabled: monthlyDigestEnabled ?? false,
        newSeasonAlerts: newSeasonAlerts ?? true,
        friendActivityAlerts: friendActivityAlerts ?? true,
      },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
