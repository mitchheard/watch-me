import { prisma } from '@/lib/prisma';

/** Free-tier cap for default watchlist items (AVIDX-107). */
export const FREE_WATCHLIST_ITEM_LIMIT = 50;

export async function getUserSubscription(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscriptionPeriodEnd: true,
      cancelAtPeriodEnd: true,
      isAdmin: true,
    },
  });
}

/** Paid Pro: active Stripe status only (includes cancel-at-period-end until period ends). */
export function isPro(subscription: { subscriptionStatus: string } | null | undefined) {
  return subscription?.subscriptionStatus === 'active';
}

/**
 * Feature entitlement: founder/admin OR paid Pro (AVIDX-310).
 * Independent of Stripe — does not imply a real subscription for billing UI.
 */
export function hasProAccess(
  user:
    | { subscriptionStatus: string; isAdmin?: boolean }
    | null
    | undefined
): boolean {
  if (user?.isAdmin) return true;
  return isPro(user);
}

export type SettingsSubscriptionPhase = 'free' | 'pro' | 'pro-canceling';

/** Settings UI: free, renewing Pro, or Pro scheduled to cancel (AVIDX-269). */
export function getSettingsSubscriptionPhase(
  subscription:
    | { subscriptionStatus: string; cancelAtPeriodEnd?: boolean }
    | null
    | undefined
): SettingsSubscriptionPhase {
  if (!isPro(subscription)) return 'free';
  if (subscription?.cancelAtPeriodEnd) return 'pro-canceling';
  return 'pro';
}
