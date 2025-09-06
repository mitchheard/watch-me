import { prisma } from './prisma';
import { resend, ADMIN_EMAIL, EMAIL_TEMPLATES } from './email';

export interface AdminNotificationData {
  type: 'user_activity' | 'weekly_summary' | 'system_alert';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NewUserData {
  userId: string;
  email: string;
  createdAt: Date;
}

export interface FirstItemData {
  userId: string;
  userEmail: string;
  itemTitle: string;
  itemType: string;
  addedAt: Date;
}

export interface FirstReviewData {
  userId: string;
  userEmail: string;
  itemTitle: string;
  rating: string;
  reviewedAt: Date;
}

export interface RepeatVisitData {
  userId: string;
  userEmail: string;
  visitCount: number;
  firstVisit: Date;
  lastVisit: Date;
}

// Create admin notification in database
export async function createAdminNotification(data: AdminNotificationData) {
  return await prisma.adminNotification.create({
    data: {
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data ? JSON.parse(JSON.stringify(data.data)) : undefined,
    },
  });
}

// Send admin email notification
export async function sendAdminEmail(
  template: string,
  subject: string,
  data: Record<string, unknown>
) {
  console.log('🔔 Attempting to send admin email:', { template, subject, to: ADMIN_EMAIL });
  
  try {
    const result = await resend.emails.send({
      from: 'Watch Me <noreply@gowatchme.app>',
      to: [ADMIN_EMAIL],
      subject,
      html: await generateEmailHTML(template, data),
    });

    console.log('✅ Email sent successfully:', result);

    // Log email in database
    await prisma.emailLog.create({
      data: {
        to: ADMIN_EMAIL,
        subject,
        template,
        status: 'sent',
        sentAt: new Date(),
      },
    });

    return result;
  } catch (error) {
    console.error('❌ Failed to send admin email:', error);
    
    // Log failed email
    await prisma.emailLog.create({
      data: {
        to: ADMIN_EMAIL,
        subject,
        template,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
}

// Generate unsubscribe link for admin emails (temporarily disabled)
async function _generateUnsubscribeLink(): Promise<string> {
  try {
    // Get admin user preferences to get unsubscribe token
    const adminPreferences = await prisma.notificationPreferences.findUnique({
      where: { userId: ADMIN_USER_ID },
    });

    if (adminPreferences?.unsubscribeToken) {
      const baseUrl = process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'http://localhost:3000';
      return `${baseUrl}/unsubscribe?token=${adminPreferences.unsubscribeToken}`;
    }
  } catch (error) {
    console.error('Error generating unsubscribe link:', error);
  }
  
  // Fallback to a generic unsubscribe page
  const baseUrl = process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'http://localhost:3000';
  return `${baseUrl}/unsubscribe`;
}

// Generate HTML email content
async function generateEmailHTML(template: string, data: Record<string, unknown>): Promise<string> {
  // TODO: Re-enable unsubscribe links once unsubscribeToken field is added to database
  const unsubscribeLink = '#'; // Temporarily disabled
  
  switch (template) {
    case EMAIL_TEMPLATES.ADMIN_NEW_USER:
      return generateNewUserEmailHTML(data, unsubscribeLink);
    case EMAIL_TEMPLATES.ADMIN_FIRST_ITEM:
      return generateFirstItemEmailHTML(data, unsubscribeLink);
    case EMAIL_TEMPLATES.ADMIN_FIRST_REVIEW:
      return generateFirstReviewEmailHTML(data, unsubscribeLink);
    case EMAIL_TEMPLATES.ADMIN_REPEAT_VISIT:
      return generateRepeatVisitEmailHTML(data, unsubscribeLink);
    case EMAIL_TEMPLATES.ADMIN_WEEKLY_REPORT:
      return generateWeeklyReportEmailHTML(data, unsubscribeLink);
    case EMAIL_TEMPLATES.ADMIN_MONTHLY_REPORT:
      return generateMonthlyReportEmailHTML(data, unsubscribeLink);
    default:
      return '<p>Admin notification</p>';
  }
}

function generateNewUserEmailHTML(data: NewUserData, unsubscribeLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">🎉 New User Signup!</h2>
      <p>A new user has joined Watch Me!</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>User ID:</strong> ${data.userId}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Signup Time:</strong> ${data.createdAt.toLocaleString()}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This is an automated notification from Watch Me.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        <a href="${unsubscribeLink}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from these emails</a>
      </p>
    </div>
  `;
}

function generateFirstItemEmailHTML(data: FirstItemData, unsubscribeLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">📝 User Added First Item!</h2>
      <p>A user has added their first item to their watchlist!</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>User:</strong> ${data.userEmail}</p>
        <p><strong>Item:</strong> ${data.itemTitle}</p>
        <p><strong>Type:</strong> ${data.itemType}</p>
        <p><strong>Added:</strong> ${data.addedAt.toLocaleString()}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This is an automated notification from Watch Me.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        <a href="${unsubscribeLink}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from these emails</a>
      </p>
    </div>
  `;
}

function generateFirstReviewEmailHTML(data: FirstReviewData, unsubscribeLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">⭐ User Left First Review!</h2>
      <p>A user has left their first rating/review!</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>User:</strong> ${data.userEmail}</p>
        <p><strong>Item:</strong> ${data.itemTitle}</p>
        <p><strong>Rating:</strong> ${data.rating}</p>
        <p><strong>Reviewed:</strong> ${data.reviewedAt.toLocaleString()}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This is an automated notification from Watch Me.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        <a href="${unsubscribeLink}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from these emails</a>
      </p>
    </div>
  `;
}

function generateRepeatVisitEmailHTML(data: RepeatVisitData, unsubscribeLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">🔄 User Repeat Visit!</h2>
      <p>A user has visited the app multiple times this week!</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>User:</strong> ${data.userEmail}</p>
        <p><strong>Visit Count:</strong> ${data.visitCount}</p>
        <p><strong>First Visit:</strong> ${data.firstVisit.toLocaleString()}</p>
        <p><strong>Last Visit:</strong> ${data.lastVisit.toLocaleString()}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This is an automated notification from Watch Me.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        <a href="${unsubscribeLink}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from these emails</a>
      </p>
    </div>
  `;
}

function generateWeeklyReportEmailHTML(data: Record<string, unknown>, unsubscribeLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">📊 Weekly Activity Report</h2>
      <p>Here's your weekly Watch Me activity summary:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Total Users:</strong> ${data.totalUsers}</p>
        <p><strong>New Users This Week:</strong> ${data.newUsers}</p>
        <p><strong>Total Items Added:</strong> ${data.totalItems}</p>
        <p><strong>Items Added This Week:</strong> ${data.newItems}</p>
        <p><strong>Most Popular Content:</strong> ${data.popularContent.map(item => `${item.title} (${item.count})`).join(', ')}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This is an automated weekly report from Watch Me.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        <a href="${unsubscribeLink}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from these emails</a>
      </p>
    </div>
  `;
}

function generateMonthlyReportEmailHTML(data: Record<string, unknown>, unsubscribeLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">📈 Monthly Growth Report</h2>
      <p>Here's your monthly Watch Me growth summary:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Total Users:</strong> ${data.totalUsers}</p>
        <p><strong>New Users This Month:</strong> ${data.newUsers}</p>
        <p><strong>Growth Rate:</strong> ${data.growthRate}%</p>
        <p><strong>Total Items Added:</strong> ${data.totalItems}</p>
        <p><strong>Items Added This Month:</strong> ${data.newItems}</p>
        <p><strong>Most Popular Content:</strong> ${data.popularContent.map(item => `${item.title} (${item.count})`).join(', ')}</p>
        <p><strong>User Engagement:</strong> ${data.engagement}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This is an automated monthly report from Watch Me.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        <a href="${unsubscribeLink}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from these emails</a>
      </p>
    </div>
  `;
}

// Helper functions for specific admin notifications
export async function notifyNewUser(userId: string, email: string) {
  const data: NewUserData = {
    userId,
    email,
    createdAt: new Date(),
  };

  // Create database notification
  await createAdminNotification({
    type: 'user_activity',
    title: 'New User Signup',
    message: `New user ${email} has joined Watch Me`,
    data,
  });

  // Send email notification
  await sendAdminEmail(
    EMAIL_TEMPLATES.ADMIN_NEW_USER,
    '🎉 New User Signup - Watch Me',
    data
  );
}

export async function notifyFirstItem(userId: string, userEmail: string, itemTitle: string, itemType: string) {
  const data: FirstItemData = {
    userId,
    userEmail,
    itemTitle,
    itemType,
    addedAt: new Date(),
  };

  // Create database notification
  await createAdminNotification({
    type: 'user_activity',
    title: 'User Added First Item',
    message: `${userEmail} added their first item: ${itemTitle}`,
    data,
  });

  // Send email notification
  await sendAdminEmail(
    EMAIL_TEMPLATES.ADMIN_FIRST_ITEM,
    '📝 User Added First Item - Watch Me',
    data
  );
}

export async function notifyFirstReview(userId: string, userEmail: string, itemTitle: string, rating: string) {
  const data: FirstReviewData = {
    userId,
    userEmail,
    itemTitle,
    rating,
    reviewedAt: new Date(),
  };

  // Create database notification
  await createAdminNotification({
    type: 'user_activity',
    title: 'User Left First Review',
    message: `${userEmail} left their first review for ${itemTitle}`,
    data,
  });

  // Send email notification
  await sendAdminEmail(
    EMAIL_TEMPLATES.ADMIN_FIRST_REVIEW,
    '⭐ User Left First Review - Watch Me',
    data
  );
}

export async function notifyRepeatVisit(userId: string, userEmail: string, visitCount: number, firstVisit: Date, lastVisit: Date) {
  const data: RepeatVisitData = {
    userId,
    userEmail,
    visitCount,
    firstVisit,
    lastVisit,
  };

  // Create database notification
  await createAdminNotification({
    type: 'user_activity',
    title: 'User Repeat Visit',
    message: `${userEmail} has visited ${visitCount} times this week`,
    data,
  });

  // Send email notification
  await sendAdminEmail(
    EMAIL_TEMPLATES.ADMIN_REPEAT_VISIT,
    '🔄 User Repeat Visit - Watch Me',
    data
  );
}

// Send weekly report to admin
export async function sendWeeklyReport() {
  try {
    console.log('📊 Sending weekly report...');
    
    // Get weekly stats
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [currentWeekStats, previousWeekStats, popularContent] = await Promise.all([
      // Current week stats
      prisma.watchItem.count({
        where: {
          createdAt: { gte: weekAgo }
        }
      }),
      // Previous week stats
      prisma.watchItem.count({
        where: {
          createdAt: { gte: twoWeeksAgo, lt: weekAgo }
        }
      }),
      // Most popular content this week
      prisma.watchItem.groupBy({
        by: ['title'],
        where: {
          createdAt: { gte: weekAgo }
        },
        _count: {
          title: true
        },
        orderBy: {
          _count: {
            title: 'desc'
          }
        },
        take: 5
      })
    ]);

    const data = {
      currentWeekItems: currentWeekStats,
      previousWeekItems: previousWeekStats,
      growth: currentWeekStats - previousWeekStats,
      popularContent: popularContent.map(item => `${item.title} (${item._count.title})`).join(', '),
      weekStart: weekAgo.toISOString().split('T')[0],
      weekEnd: now.toISOString().split('T')[0]
    };

    await sendAdminEmail(
      EMAIL_TEMPLATES.ADMIN_WEEKLY_REPORT,
      '📊 Weekly Activity Report - Watch Me',
      data
    );

    console.log('✅ Weekly report sent successfully');
  } catch (error) {
    console.error('❌ Failed to send weekly report:', error);
    throw error;
  }
}

// Send monthly report to admin
export async function sendMonthlyReport() {
  try {
    console.log('📈 Sending monthly report...');
    
    // Get monthly stats
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [currentMonthStats, previousMonthStats, popularContent] = await Promise.all([
      // Current month stats
      prisma.watchItem.count({
        where: {
          createdAt: { gte: monthAgo }
        }
      }),
      // Previous month stats
      prisma.watchItem.count({
        where: {
          createdAt: { gte: twoMonthsAgo, lt: monthAgo }
        }
      }),
      // Most popular content this month
      prisma.watchItem.groupBy({
        by: ['title'],
        where: {
          createdAt: { gte: monthAgo }
        },
        _count: {
          title: true
        },
        orderBy: {
          _count: {
            title: 'desc'
          }
        },
        take: 5
      })
    ]);

    const data = {
      currentMonthItems: currentMonthStats,
      previousMonthItems: previousMonthStats,
      growth: currentMonthStats - previousMonthStats,
      popularContent: popularContent.map(item => `${item.title} (${item._count.title})`).join(', '),
      monthStart: monthAgo.toISOString().split('T')[0],
      monthEnd: now.toISOString().split('T')[0]
    };

    await sendAdminEmail(
      EMAIL_TEMPLATES.ADMIN_MONTHLY_REPORT,
      '📈 Monthly Growth Report - Watch Me',
      data
    );

    console.log('✅ Monthly report sent successfully');
  } catch (error) {
    console.error('❌ Failed to send monthly report:', error);
    throw error;
  }
}
