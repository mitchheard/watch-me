import { resend } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import {
  PRO_SUBSCRIPTION_DISCLOSURE,
  PRO_SUBSCRIPTION_PRICE_LABEL,
} from '@/lib/subscription-arl';

export const PRO_SUBSCRIPTION_CONFIRMATION_TEMPLATE = 'pro_subscription_confirmation';

function siteOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) return url.replace(/\/$/, '');
  return 'http://localhost:3000';
}

function formatRenewalDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function buildProSubscriptionConfirmationHtml(renewalDate: Date): string {
  const cancelUrl = `${siteOrigin()}/settings`;
  const renewalLabel = formatRenewalDate(renewalDate);

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; color: #1e293b;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">You're on Watch Me Pro</h1>
      <p style="margin: 0 0 12px;">Thanks for subscribing. Here are your subscription terms:</p>
      <p style="margin: 0 0 12px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <strong>${PRO_SUBSCRIPTION_PRICE_LABEL}</strong>, automatically renews annually until canceled.
      </p>
      <p style="margin: 0 0 12px;">Your next renewal date is <strong>${renewalLabel}</strong>.</p>
      <p style="margin: 0 0 16px;">${PRO_SUBSCRIPTION_DISCLOSURE}</p>
      <p style="margin: 0;">
        <a href="${cancelUrl}" style="color: #2563eb;">Cancel or manage your subscription in Settings</a>
      </p>
    </div>
  `.trim();
}

export async function sendProSubscriptionConfirmationEmail(
  to: string,
  renewalDate: Date
): Promise<void> {
  const subject = 'Your Watch Me Pro subscription is active';
  const html = buildProSubscriptionConfirmationHtml(renewalDate);

  try {
    await resend().emails.send({
      from: 'Watch Me <noreply@gowatchme.app>',
      to: [to],
      subject,
      html,
    });

    await prisma.emailLog.create({
      data: {
        to,
        subject,
        template: PRO_SUBSCRIPTION_CONFIRMATION_TEMPLATE,
        status: 'sent',
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[subscription-confirmation-email] failed', error);
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        template: PRO_SUBSCRIPTION_CONFIRMATION_TEMPLATE,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}
