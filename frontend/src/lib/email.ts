import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export { resend };

// Admin email configuration
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@watchme.app';

// Email templates
export const EMAIL_TEMPLATES = {
  ADMIN_NEW_USER: 'admin-new-user',
  ADMIN_FIRST_ITEM: 'admin-first-item',
  ADMIN_FIRST_REVIEW: 'admin-first-review',
  ADMIN_REPEAT_VISIT: 'admin-repeat-visit',
  ADMIN_WEEKLY_REPORT: 'admin-weekly-report',
  ADMIN_MONTHLY_REPORT: 'admin-monthly-report',
} as const;

export type EmailTemplate = typeof EMAIL_TEMPLATES[keyof typeof EMAIL_TEMPLATES];

