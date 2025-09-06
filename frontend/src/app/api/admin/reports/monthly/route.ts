import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAdminEmail } from '@/lib/adminNotifications';
import { EMAIL_TEMPLATES } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Get monthly stats
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [totalUsers, newUsers, totalItems, newItems, previousMonthUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: monthAgo } },
      }),
      prisma.watchItem.count(),
      prisma.watchItem.count({
        where: { createdAt: { gte: monthAgo } },
      }),
      prisma.user.count({
        where: { 
          createdAt: { gte: twoMonthsAgo, lt: monthAgo }
        },
      }),
    ]);

    // Calculate growth rate
    const growthRate = previousMonthUsers > 0 
      ? (((newUsers - previousMonthUsers) / previousMonthUsers) * 100).toFixed(1)
      : '0';

    // Get popular content this month
    const popularContent = await prisma.watchItem.groupBy({
      by: ['title'],
      _count: { title: true },
      where: { createdAt: { gte: monthAgo } },
      orderBy: { _count: { title: 'desc' } },
      take: 10,
    });

    // Get user activity stats
    const userSessions = await prisma.userSession.findMany({
      where: { createdAt: { gte: monthAgo } },
      include: { user: true },
    });

    // Group sessions by user to find repeat visitors
    const userVisitCounts = userSessions.reduce((acc, session) => {
      acc[session.userId] = (acc[session.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const repeatVisitors = Object.values(userVisitCounts).filter(count => count > 1).length;

    // Get rating stats
    const ratingStats = await prisma.watchItem.groupBy({
      by: ['rating'],
      _count: { rating: true },
      where: { 
        rating: { not: null },
        updatedAt: { gte: monthAgo }
      },
    });

    // Calculate engagement metrics
    const activeUsers = Object.keys(userVisitCounts).length;
    const engagement = {
      itemsPerUser: totalUsers > 0 ? (totalItems / totalUsers).toFixed(2) : '0',
      newUsersRate: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : '0',
      repeatVisitors,
      activeUsers,
      activityRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0',
    };

    const reportData = {
      period: 'month',
      totalUsers,
      newUsers,
      totalItems,
      newItems,
      growthRate,
      popularContent: popularContent.map(item => ({
        title: item.title,
        count: item._count.title,
      })),
      ratings: ratingStats.map(stat => ({
        rating: stat.rating,
        count: stat._count.rating,
      })),
      engagement,
    };

    // Send email report
    await sendAdminEmail(
      EMAIL_TEMPLATES.ADMIN_MONTHLY_REPORT,
      `📈 Monthly Report - ${now.toLocaleDateString()}`,
      reportData
    );

    return NextResponse.json({
      success: true,
      message: 'Monthly report sent successfully',
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return NextResponse.json(
      { error: 'Failed to generate monthly report' },
      { status: 500 }
    );
  }
}
