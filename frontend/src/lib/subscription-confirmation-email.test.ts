import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PRO_SUBSCRIPTION_DISCLOSURE, PRO_SUBSCRIPTION_PRICE_LABEL } from './subscription-arl';

const { sendMock, emailLogCreate } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  emailLogCreate: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  resend: () => ({
    emails: { send: sendMock },
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailLog: { create: emailLogCreate },
  },
}));

import {
  buildProSubscriptionConfirmationHtml,
  PRO_SUBSCRIPTION_CONFIRMATION_TEMPLATE,
  sendProSubscriptionConfirmationEmail,
} from './subscription-confirmation-email';

describe('buildProSubscriptionConfirmationHtml', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://watchme.test');
  });

  it('includes price, renewal date, disclosure, and cancel link', () => {
    const renewalDate = new Date('2027-05-17T12:00:00.000Z');
    const html = buildProSubscriptionConfirmationHtml(renewalDate);
    expect(html).toContain(PRO_SUBSCRIPTION_PRICE_LABEL);
    expect(html).toContain(renewalDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
    expect(html).toContain(PRO_SUBSCRIPTION_DISCLOSURE);
    expect(html).toContain('https://watchme.test/account');
  });
});

describe('sendProSubscriptionConfirmationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendMock.mockResolvedValue({ id: 'email-1' });
    emailLogCreate.mockResolvedValue({});
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://watchme.test');
  });

  it('sends via Resend and logs success', async () => {
    const renewalDate = new Date('2027-05-17T00:00:00.000Z');
    await sendProSubscriptionConfirmationEmail('user@example.com', renewalDate);

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['user@example.com'],
        subject: 'Your Watch Me Pro subscription is active',
      })
    );
    expect(emailLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        to: 'user@example.com',
        template: PRO_SUBSCRIPTION_CONFIRMATION_TEMPLATE,
        status: 'sent',
      }),
    });
  });
});
