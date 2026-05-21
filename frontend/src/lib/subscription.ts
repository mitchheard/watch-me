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
    },
  });
}

/** Pro access: active Stripe status only (includes cancel-at-period-end until period ends). */
export function isPro(subscription: { subscriptionStatus: string } | null | undefined) {
  return subscription?.subscriptionStatus === 'active';
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
