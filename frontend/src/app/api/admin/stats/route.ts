import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // week, month, all

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get user stats
    const [totalUsers, newUsers, totalItems, newItems] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.watchlistItemList.count(),
      prisma.watchlistItemList.count({
        where: { addedAt: { gte: startDate } },
      }),
    ]);

    // Get popular content
    const popularContent = await prisma.watchlistItem.groupBy({
      by: ['title'],
      _count: { title: true },
      orderBy: { _count: { title: 'desc' } },
      take: 5,
    });

    // Get user activity stats
    const userSessions = await prisma.userSession.findMany({
      where: { createdAt: { gte: startDate } },
      include: { user: true },
    });

    // Group sessions by user to find repeat visitors
    const userVisitCounts = userSessions.reduce((acc, session) => {
      acc[session.userId] = (acc[session.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const repeatVisitors = Object.values(userVisitCounts).filter(count => count > 1).length;

    // Get rating stats
    const ratingStats = await prisma.watchlistItemList.groupBy({
      by: ['rating'],
      _count: { rating: true },
      where: { rating: { not: null } },
    });

    const stats = {
      period,
      users: {
        total: totalUsers,
        new: newUsers,
        repeatVisitors,
      },
      items: {
        total: totalItems,
        new: newItems,
      },
      popularContent: popularContent.map(item => ({
        title: item.title,
        count: item._count.title,
      })),
      ratings: ratingStats.map(stat => ({
        rating: stat.rating,
        count: stat._count.rating,
      })),
      engagement: {
        itemsPerUser: totalUsers > 0 ? (totalItems / totalUsers).toFixed(2) : '0',
        newUsersRate: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : '0',
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

