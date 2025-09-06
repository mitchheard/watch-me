import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminNotification } from '@/lib/adminNotifications';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (type) where.type = type;
    if (isRead !== null) where.isRead = isRead === 'true';

    const [notifications, total] = await Promise.all([
      prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminNotification.count({ where }),
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, message, data } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message' },
        { status: 400 }
      );
    }

    const notification = await createAdminNotification({
      type,
      title,
      message,
      data,
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error creating admin notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isRead } = body;

    if (!id || typeof isRead !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: id, isRead' },
        { status: 400 }
      );
    }

    const notification = await prisma.adminNotification.update({
      where: { id },
      data: { isRead },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error updating admin notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

