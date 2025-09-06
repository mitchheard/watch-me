# Watch Me - Notification System Documentation

## Overview

The Watch Me notification system provides comprehensive user activity tracking and admin alerts. It automatically monitors user behavior patterns and sends email notifications to administrators for key engagement milestones and activity patterns.

**Unified Interface**: All notification management is consolidated into a single `/notifications` page that adapts based on user role - regular users see personal notification preferences, while admin users see both personal preferences and all admin email notification settings.

## System Architecture

### Core Components

1. **Session Tracking** (`frontend/src/app/auth/callback/route.ts`)
   - Tracks every user login/session
   - Analyzes user behavior patterns
   - Triggers appropriate notifications

2. **Notification Engine** (`frontend/src/lib/adminNotifications.ts`)
   - Manages notification creation and sending
   - Handles email template generation
   - Stores notifications in database

3. **Email Service** (`frontend/src/lib/email.ts`)
   - Lazy-loaded Resend client
   - Email template definitions
   - Admin email configuration

4. **Database Storage**
   - `UserSession` - Tracks user login sessions
   - `AdminNotification` - Stores all admin notifications
   - `EmailLog` - Logs email delivery status

## Current Notifications

### 🎉 New User Signup
- **Trigger**: First-time user registration
- **Email Subject**: "🎉 New User Signup - Watch Me"
- **Data Tracked**: User ID, email, signup timestamp
- **Location**: Auth callback when new user detected

### 📝 User Added First Item
- **Trigger**: User adds their very first item to watchlist
- **Email Subject**: "📝 User Added First Item - Watch Me"
- **Data Tracked**: User ID, email, item title, item type, date added
- **Location**: `frontend/src/app/api/watchlist/route.ts` (POST method)

### ⭐ User Left First Review
- **Trigger**: User leaves their very first rating/review
- **Email Subject**: "⭐ User Left First Review - Watch Me"
- **Data Tracked**: User ID, email, item title, rating, review date
- **Location**: `frontend/src/app/api/watchlist/route.ts` (PUT method)

### 🔄 User Repeat Visit
- **Trigger**: User visits 3+ times within 7 days
- **Email Subject**: "🔄 User Repeat Visit - Watch Me"
- **Data Tracked**: User ID, email, visit count, first visit, last visit
- **Location**: Auth callback session analysis

### 🎯 User Returned After Inactivity
- **Trigger**: User returns after 7+ days of inactivity
- **Email Subject**: "🎯 User Returned After Inactivity - Watch Me"
- **Data Tracked**: User ID, email, days since last visit, last visit, current visit
- **Location**: Auth callback session analysis

### 📊 Weekly Activity Report
- **Trigger**: Every Monday at 9 AM (via cron job)
- **Email Subject**: "📊 Weekly Activity Report - Watch Me"
- **Data Tracked**: New users, new items, popular content, user engagement
- **Location**: `frontend/src/app/api/admin/notifications/schedule/route.ts`

### 📈 Monthly Growth Report
- **Trigger**: 1st of every month at 9 AM (via cron job)
- **Email Subject**: "📈 Monthly Growth Report - Watch Me"
- **Data Tracked**: Monthly stats, growth metrics, user trends
- **Location**: `frontend/src/app/api/admin/notifications/schedule/route.ts`

## How It Works

### Session Tracking Flow

1. **User Login**: User authenticates via Supabase
2. **Session Creation**: New `UserSession` record created in database
3. **Pattern Analysis**: System analyzes last 10 user sessions
4. **Notification Triggers**: Checks for various engagement patterns
5. **Email Sending**: Sends appropriate admin notifications
6. **Database Logging**: Stores notification records

### Notification Triggers

#### New User Detection
```typescript
// Check if user exists in database
const existingUser = await prisma.user.findUnique({
  where: { id: userId }
});

if (!existingUser) {
  // Trigger new user notification
  await notifyNewUser(userId, userEmail);
}
```

#### Repeat Visit Detection
```typescript
// Count visits in last 7 days
const weekAgo = new Date(currentTime.getTime() - (7 * 24 * 60 * 60 * 1000));
const visitsThisWeek = userSessions.filter(
  session => session.createdAt >= weekAgo
).length;

if (visitsThisWeek >= 3) {
  // Trigger repeat visit notification
  await notifyRepeatVisit(userId, userEmail, visitsThisWeek, firstVisit, currentTime);
}
```

#### Inactivity Return Detection
```typescript
// Calculate days since last visit
const daysSinceLastVisit = Math.floor(
  (currentTime.getTime() - lastSession.createdAt.getTime()) / (1000 * 60 * 60 * 24)
);

if (daysSinceLastVisit >= 7) {
  // Trigger user returned notification
  await notifyUserReturned(userId, userEmail, daysSinceLastVisit, lastVisit, currentTime);
}
```

### Email Template System

Each notification type has a corresponding HTML email template:

- **Template Functions**: `generateNewUserEmailHTML()`, `generateFirstItemEmailHTML()`, etc.
- **Styling**: Consistent HTML/CSS styling across all templates
- **Data Binding**: Dynamic content insertion from notification data
- **Unsubscribe Links**: Placeholder for future unsubscribe functionality

### Database Schema

#### UserSession Table
```sql
model UserSession {
  id        Int      @id @default(autoincrement())
  userId    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

#### AdminNotification Table
```sql
model AdminNotification {
  id          String   @id @default(cuid())
  type        String   // 'user_activity', 'weekly_summary', 'system_alert'
  title       String
  message     String
  data        Json?    // Additional data for the notification
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([type])
  @@index([isRead])
  @@index([createdAt])
}
```

## Configuration

### Environment Variables

- `RESEND_API_KEY` - Email service API key
- `ADMIN_EMAIL` - Admin email address for notifications
- `DATABASE_URL` - Database connection string

### Email Configuration

- **From Address**: `Watch Me <noreply@gowatchme.app>`
- **Service**: Resend (lazy-loaded to prevent build-time errors)
- **Templates**: HTML-based with inline CSS styling

## Admin Panel Integration

### Unified Notification Management
- **All Notifications**: `/notifications` - Unified page for both user and admin notifications
- **Admin Section**: Only visible to admin users, includes all 7 admin email notifications
- **User Section**: Personal notification preferences for all users
- **Inline Schedules**: Schedule information displayed directly with each notification
- **Toggle Controls**: Configurable settings for scheduled reports (Weekly/Monthly digests)

### User Notification Settings
- **User Settings**: `/notifications` - Users can manage their notification preferences
- **Admin Override**: Admin users see additional admin notification section
- **Unsubscribe**: `/unsubscribe` - Unsubscribe page (temporarily disabled)

## Scheduled Reports

### Weekly Report (Monday 9 AM)
- **Endpoint**: `/api/admin/notifications/schedule` (POST)
- **Data**: New users, new items, popular content, engagement metrics
- **Frequency**: Every Monday at 9 AM

### Monthly Report (1st of Month 9 AM)
- **Endpoint**: `/api/admin/notifications/schedule` (POST)
- **Data**: Monthly growth, user trends, system metrics
- **Frequency**: 1st of every month at 9 AM

## API Endpoints

### Unified Notifications
- `GET /api/user/notifications/preferences` - Get user preferences (includes admin preferences for admin users)
- `PUT /api/user/notifications/preferences` - Update user preferences (includes admin preferences for admin users)

### Admin Reports
- `POST /api/admin/notifications/schedule` - Trigger scheduled reports

### Reports
- `GET /api/admin/reports/weekly` - Generate weekly report
- `GET /api/admin/reports/monthly` - Generate monthly report

## Error Handling

### Non-Critical Failures
- Notification sending failures are logged but don't interrupt user flow
- Database errors are caught and logged
- Email service errors are handled gracefully

### Logging
- All notification attempts are logged to console
- Success/failure status is tracked
- Error details are preserved for debugging

## Future Enhancements

### Planned Features
1. **Unsubscribe System**: Token-based unsubscribe links
2. **Email Templates**: Rich HTML templates with branding
3. **Notification Preferences**: Granular admin control over notification types
4. **User Engagement Scoring**: Advanced analytics for user behavior
5. **Real-time Notifications**: WebSocket-based real-time admin alerts

### Technical Improvements
1. **Rate Limiting**: Prevent notification spam
2. **Batch Processing**: Efficient bulk notification handling
3. **Template Engine**: Dynamic email template system
4. **Analytics Dashboard**: Visual notification and engagement metrics

## Troubleshooting

### Common Issues

1. **Missing API Key**: Ensure `RESEND_API_KEY` is set in environment
2. **Email Not Sending**: Check Resend service status and API limits
3. **Database Errors**: Verify database connection and schema migrations
4. **Build Failures**: Ensure lazy loading of email service is working

### Debug Mode
- Enable console logging for detailed notification flow
- Check database `AdminNotification` table for stored notifications
- Verify `UserSession` records are being created properly

## Security Considerations

- **Admin Email**: Protected by environment variable
- **User Data**: Only necessary data is included in notifications
- **API Keys**: Securely stored in environment variables
- **Database Access**: Proper user isolation and access controls

---

*Last Updated: September 2024*
*Version: 1.0*
