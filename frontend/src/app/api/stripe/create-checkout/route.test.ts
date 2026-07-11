import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PRO_SUBSCRIPTION_DISCLOSURE } from '@/lib/subscription-arl';

const { getSupabaseRouteUser, subscriptionConsentCreate, checkoutSessionsCreate } = vi.hoisted(
  () => ({
    getSupabaseRouteUser: vi.fn(),
    subscriptionConsentCreate: vi.fn(),
    checkoutSessionsCreate: vi.fn(),
  })
);

vi.mock('@/lib/supabase-route-auth', () => ({
  getSupabaseRouteUser,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    subscriptionConsent: { create: subscriptionConsentCreate },
  },
}));

vi.mock('@/lib/stripe-server', () => ({
  getStripe: () => ({
    checkout: { sessions: { create: checkoutSessionsCreate } },
  }),
}));

import { POST } from './route';

describe('POST /api/stripe/create-checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_test');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://watchme.test');
    getSupabaseRouteUser.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
    subscriptionConsentCreate.mockResolvedValue({ id: 'consent-1' });
    checkoutSessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.test/session' });
  });

  it('returns 400 when consent is missing', async () => {
    const res = await POST(
      new Request('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ consented: false, termsText: PRO_SUBSCRIPTION_DISCLOSURE }),
      })
    );
    expect(res.status).toBe(400);
    expect(subscriptionConsentCreate).not.toHaveBeenCalled();
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it('records consent and creates checkout session when consent is valid', async () => {
    const res = await POST(
      new Request('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consented: true,
          termsText: PRO_SUBSCRIPTION_DISCLOSURE,
        }),
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe('https://checkout.stripe.test/session');

    expect(subscriptionConsentCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        termsText: PRO_SUBSCRIPTION_DISCLOSURE,
        consented: true,
      },
    });
    expect(checkoutSessionsCreate).toHaveBeenCalled();
  });
});
