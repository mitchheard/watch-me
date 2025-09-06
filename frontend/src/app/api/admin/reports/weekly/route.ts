import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAdminEmail } from '@/lib/adminNotifications';
import { EMAIL_TEMPLATES } from '@/lib/email';

export async function POST(_request: NextRequest) {
  try {
    console.log('📊 Starting weekly report generation...');
    
    // Get weekly stats
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    console.log('📅 Date range:', { now: now.toISOString(), weekAgo: weekAgo.toISOString() });

    const [totalUsers, newUsers, totalItems, newItems] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.watchItem.count(),
      prisma.watchItem.count({
        where: { createdAt: { gte: weekAgo } },
      }),
    ]);

    // Get popular content this week
    const popularContent = await prisma.watchItem.groupBy({
      by: ['title'],
      _count: { title: true },
      where: { createdAt: { gte: weekAgo } },
      orderBy: { _count: { title: 'desc' } },
      take: 5,
    });

    // Get user activity stats
    const userSessions = await prisma.userSession.findMany({
      where: { createdAt: { gte: weekAgo } },
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
        updatedAt: { gte: weekAgo }
      },
    });

    const reportData = {
      period: 'week',
      totalUsers,
      newUsers,
      totalItems,
      newItems,
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
        repeatVisitors,
      },
    };

    // Send email report
    console.log('📧 Sending weekly report email...', reportData);
    await sendAdminEmail(
      EMAIL_TEMPLATES.ADMIN_WEEKLY_REPORT,
      `📊 Weekly Report - ${now.toLocaleDateString()}`,
      reportData
    );
    console.log('✅ Weekly report email sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Weekly report sent successfully',
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    return NextResponse.json(
      { error: 'Failed to generate weekly report' },
      { status: 500 }
    );
  }
}
