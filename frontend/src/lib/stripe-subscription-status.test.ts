import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import {
  stripeSubscriptionStatusToDb,
  stripeSubscriptionToUserFields,
} from './stripe-subscription-status';

function makeStripeSubscription(
  overrides: Partial<Stripe.Subscription> = {}
): Stripe.Subscription {
  return {
    id: 'sub_test',
    object: 'subscription',
    status: 'active',
    cancel_at_period_end: false,
    items: {
      object: 'list',
      data: [
        {
          id: 'si_test',
          object: 'subscription_item',
          current_period_end: 1_900_000_000,
        } as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: '/v1/subscription_items',
    },
    ...overrides,
  } as Stripe.Subscription;
}

describe('stripeSubscriptionStatusToDb', () => {
  it('maps active and trialing to active', () => {
    expect(stripeSubscriptionStatusToDb('active')).toBe('active');
    expect(stripeSubscriptionStatusToDb('trialing')).toBe('active');
  });

  it('maps past_due and paused', () => {
    expect(stripeSubscriptionStatusToDb('past_due')).toBe('past_due');
    expect(stripeSubscriptionStatusToDb('paused')).toBe('past_due');
  });

  it('maps terminal or unpaid-like states to canceled', () => {
    expect(stripeSubscriptionStatusToDb('canceled')).toBe('canceled');
    expect(stripeSubscriptionStatusToDb('unpaid')).toBe('canceled');
    expect(stripeSubscriptionStatusToDb('incomplete')).toBe('canceled');
    expect(stripeSubscriptionStatusToDb('incomplete_expired')).toBe('canceled');
  });
});

describe('stripeSubscriptionToUserFields', () => {
  it('reads cancel_at_period_end and period end from subscription item', () => {
    const endUnix = 1_900_000_000;
    const fields = stripeSubscriptionToUserFields(
      makeStripeSubscription({
        cancel_at_period_end: true,
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test',
              object: 'subscription_item',
              current_period_end: endUnix,
            } as Stripe.SubscriptionItem,
          ],
          has_more: false,
          url: '/v1/subscription_items',
        },
      })
    );
    expect(fields.subscriptionStatus).toBe('active');
    expect(fields.cancelAtPeriodEnd).toBe(true);
    expect(fields.subscriptionPeriodEnd).toEqual(new Date(endUnix * 1000));
  });

  it('clears cancel flag when user resumes via Portal', () => {
    const fields = stripeSubscriptionToUserFields(
      makeStripeSubscription({ cancel_at_period_end: false })
    );
    expect(fields.cancelAtPeriodEnd).toBe(false);
  });

  it('maps deleted subscription status to canceled', () => {
    const fields = stripeSubscriptionToUserFields(
      makeStripeSubscription({ status: 'canceled', cancel_at_period_end: false })
    );
    expect(fields.subscriptionStatus).toBe('canceled');
    expect(fields.cancelAtPeriodEnd).toBe(false);
  });
});
