import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find preferences by unsubscribe token
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { unsubscribeToken: token },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!preferences) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching unsubscribe preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, ...updates } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find preferences by unsubscribe token
    const existingPreferences = await prisma.notificationPreferences.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!existingPreferences) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    // Update preferences
    const preferences = await prisma.notificationPreferences.update({
      where: { unsubscribeToken: token },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating unsubscribe preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
