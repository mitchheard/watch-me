import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWeeklyReport, sendMonthlyReport } from '@/lib/adminNotifications';

// TODO: Move this to env or a Profile table
const ADMIN_USER_ID = '464661fa-7ae1-406f-9975-dec0ccbc94aa';

export async function POST(_request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (you can add API key verification here)
    const authHeader = _request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = now.getDate();
    const hour = now.getHours();

    // Check if it's Monday at 9 AM (weekly report)
    const isMonday9AM = dayOfWeek === 1 && hour === 9;
    
    // Check if it's the 1st of the month at 9 AM (monthly report)
    const isFirstOfMonth9AM = dayOfMonth === 1 && hour === 9;

    if (!isMonday9AM && !isFirstOfMonth9AM) {
      return NextResponse.json({ 
        message: 'No scheduled reports to send at this time',
        currentTime: now.toISOString(),
        dayOfWeek,
        dayOfMonth,
        hour
      });
    }

    // Get admin notification preferences
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: ADMIN_USER_ID },
    });

    if (!preferences) {
      return NextResponse.json({ 
        error: 'Admin notification preferences not found' 
      }, { status: 404 });
    }

    const results = [];

    // Send weekly report if enabled and it's Monday 9 AM
    if (isMonday9AM && preferences.weeklyDigestEnabled) {
      try {
        const weeklyResult = await sendWeeklyReport();
        results.push({
          type: 'weekly',
          success: true,
          result: weeklyResult
        });
      } catch (error) {
        console.error('Error sending weekly report:', error);
        results.push({
          type: 'weekly',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Send monthly report if enabled and it's 1st of month 9 AM
    if (isFirstOfMonth9AM && preferences.monthlyDigestEnabled) {
      try {
        const monthlyResult = await sendMonthlyReport();
        results.push({
          type: 'monthly',
          success: true,
          result: monthlyResult
        });
      } catch (error) {
        console.error('Error sending monthly report:', error);
        results.push({
          type: 'monthly',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Create admin notification for the scheduled reports
    if (results.length > 0) {
      await prisma.adminNotification.create({
        data: {
          type: 'scheduled_report',
          title: 'Scheduled Reports Sent',
          message: `Automated reports sent: ${results.map(r => r.type).join(', ')}`,
          data: {
            results: results.map(r => ({
              type: r.type,
              success: r.success,
              error: r.error || null
            })),
            sentAt: now.toISOString(),
            preferences: {
              weeklyDigestEnabled: preferences.weeklyDigestEnabled,
              monthlyDigestEnabled: preferences.monthlyDigestEnabled
            }
          }
        }
      });
    }

    return NextResponse.json({
      message: 'Scheduled reports processed',
      currentTime: now.toISOString(),
      results,
      preferences: {
        weeklyDigestEnabled: preferences.weeklyDigestEnabled,
        monthlyDigestEnabled: preferences.monthlyDigestEnabled
      }
    });

  } catch (error) {
    console.error('Error processing scheduled reports:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled reports' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing/manual triggering
export async function GET(_request: NextRequest) {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();
    const hour = now.getHours();

    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: ADMIN_USER_ID },
    });

    return NextResponse.json({
      currentTime: now.toISOString(),
      dayOfWeek,
      dayOfMonth,
      hour,
      isMonday9AM: dayOfWeek === 1 && hour === 9,
      isFirstOfMonth9AM: dayOfMonth === 1 && hour === 9,
      preferences: preferences ? {
        weeklyDigestEnabled: preferences.weeklyDigestEnabled,
        monthlyDigestEnabled: preferences.monthlyDigestEnabled
      } : null
    });
  } catch (error) {
    console.error('Error checking schedule status:', error);
    return NextResponse.json(
      { error: 'Failed to check schedule status' },
      { status: 500 }
    );
  }
}
