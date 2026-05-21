import type Stripe from 'stripe';

/**
 * Maps Stripe subscription lifecycle to Watch Me `User.subscriptionStatus`.
 * Keep aligned with webhook + portal; used by tests only for pure mapping.
 */
export function stripeSubscriptionStatusToDb(
  status: Stripe.Subscription.Status
): 'active' | 'canceled' | 'past_due' | 'free' {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'past_due' || status === 'paused') return 'past_due';
  return 'canceled';
}

export function stripeSubscriptionCurrentPeriodEnd(
  subscription: Stripe.Subscription
): Date | null {
  const endUnix = subscription.items?.data?.[0]?.current_period_end;
  if (endUnix == null || !Number.isFinite(endUnix)) return null;
  return new Date(endUnix * 1000);
}

/** Fields written by the Stripe webhook when a subscription is created or updated. */
export function stripeSubscriptionToUserFields(subscription: Stripe.Subscription) {
  return {
    subscriptionStatus: stripeSubscriptionStatusToDb(subscription.status),
    subscriptionPeriodEnd: stripeSubscriptionCurrentPeriodEnd(subscription),
    cancelAtPeriodEnd: subscription.cancel_at_period_end === true,
  };
}
