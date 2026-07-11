import { describe, expect, it } from 'vitest';
import {
  FREE_WATCHLIST_ITEM_LIMIT,
  getSettingsSubscriptionPhase,
  hasProAccess,
  isPro,
} from './subscription';

describe('isPro', () => {
  it('returns true only for active status', () => {
    expect(isPro({ subscriptionStatus: 'active' })).toBe(true);
    expect(isPro({ subscriptionStatus: 'free' })).toBe(false);
    expect(isPro({ subscriptionStatus: 'canceled' })).toBe(false);
    expect(isPro({ subscriptionStatus: 'past_due' })).toBe(false);
    expect(isPro(null)).toBe(false);
    expect(isPro(undefined)).toBe(false);
  });

  it('returns true when active with cancelAtPeriodEnd (still Pro until period ends)', () => {
    expect(
      isPro({ subscriptionStatus: 'active', cancelAtPeriodEnd: true })
    ).toBe(true);
  });

  it('returns false when status is canceled even if cancelAtPeriodEnd was stale', () => {
    expect(
      isPro({ subscriptionStatus: 'canceled', cancelAtPeriodEnd: true })
    ).toBe(false);
  });
});

describe('hasProAccess (AVIDX-310)', () => {
  it('grants access to admins regardless of subscriptionStatus', () => {
    expect(
      hasProAccess({ subscriptionStatus: 'free', isAdmin: true })
    ).toBe(true);
    expect(
      hasProAccess({ subscriptionStatus: 'canceled', isAdmin: true })
    ).toBe(true);
  });

  it('grants access to paid Pro without isAdmin', () => {
    expect(
      hasProAccess({ subscriptionStatus: 'active', isAdmin: false })
    ).toBe(true);
  });

  it('denies free non-admin users', () => {
    expect(
      hasProAccess({ subscriptionStatus: 'free', isAdmin: false })
    ).toBe(false);
    expect(hasProAccess({ subscriptionStatus: 'free' })).toBe(false);
    expect(hasProAccess(null)).toBe(false);
  });
});

describe('getSettingsSubscriptionPhase', () => {
  it('returns free for non-Pro users', () => {
    expect(getSettingsSubscriptionPhase({ subscriptionStatus: 'free' })).toBe('free');
    expect(getSettingsSubscriptionPhase({ subscriptionStatus: 'canceled' })).toBe('free');
    expect(getSettingsSubscriptionPhase(null)).toBe('free');
  });

  it('returns pro for active renewing subscriptions', () => {
    expect(
      getSettingsSubscriptionPhase({
        subscriptionStatus: 'active',
        cancelAtPeriodEnd: false,
      })
    ).toBe('pro');
  });

  it('returns pro-canceling when active but set to cancel at period end', () => {
    expect(
      getSettingsSubscriptionPhase({
        subscriptionStatus: 'active',
        cancelAtPeriodEnd: true,
      })
    ).toBe('pro-canceling');
  });

  it('returns free after subscription deleted (canceled, flag cleared)', () => {
    expect(
      getSettingsSubscriptionPhase({
        subscriptionStatus: 'canceled',
        cancelAtPeriodEnd: false,
      })
    ).toBe('free');
  });
});

describe('FREE_WATCHLIST_ITEM_LIMIT', () => {
  it('matches AVIDX-107 free tier cap', () => {
    expect(FREE_WATCHLIST_ITEM_LIMIT).toBe(50);
  });
});
