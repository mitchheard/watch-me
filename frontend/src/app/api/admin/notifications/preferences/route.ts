import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TODO: Move this to env or a Profile table
const ADMIN_USER_ID = '464661fa-7ae1-406f-9975-dec0ccbc94aa';

export async function GET(_request: NextRequest) {
  try {
    // Get or create notification preferences for admin user
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: ADMIN_USER_ID },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: ADMIN_USER_ID,
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
    const body = await request.json();
    const { 
      emailEnabled,
      weeklyDigestEnabled,
      monthlyDigestEnabled,
      newSeasonAlerts,
      friendActivityAlerts 
    } = body;

    // Update or create notification preferences for admin user
    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId: ADMIN_USER_ID },
      update: {
        emailEnabled,
        weeklyDigestEnabled,
        monthlyDigestEnabled,
        newSeasonAlerts,
        friendActivityAlerts,
        updatedAt: new Date(),
      },
      create: {
        userId: ADMIN_USER_ID,
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
