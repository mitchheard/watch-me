import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe-server';
import { stripeSubscriptionToUserFields } from '@/lib/stripe-subscription-status';
import { sendProSubscriptionConfirmationEmail } from '@/lib/subscription-confirmation-email';

export const runtime = 'nodejs';

async function resolveUserIdFromSubscription(
  subscription: Stripe.Subscription
): Promise<string | null> {
  const fromMeta = subscription.metadata?.supabase_user_id?.trim();
  if (fromMeta) return fromMeta;

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) return null;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function applySubscriptionToUser(
  userId: string,
  customerId: string | null,
  subscriptionId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const { subscriptionStatus, subscriptionPeriodEnd, cancelAtPeriodEnd } =
    stripeSubscriptionToUserFields(subscription);

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    await prisma.user.create({
      data: {
        id: userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus,
        subscriptionPeriodEnd,
        cancelAtPeriodEnd,
      },
    });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId ?? existing.stripeCustomerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus,
      subscriptionPeriodEnd,
      cancelAtPeriodEnd,
    },
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const userId = session.metadata?.supabase_user_id?.trim();
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? null;
        const subRef = session.subscription;
        const subscriptionId =
          typeof subRef === 'string'
            ? subRef
            : subRef && typeof subRef === 'object' && 'id' in subRef
              ? subRef.id
              : null;

        if (!userId || !subscriptionId) {
          console.warn('[stripe/webhook] checkout.session.completed missing user or subscription');
          break;
        }

        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data'],
        });
        await applySubscriptionToUser(userId, customerId, subscriptionId, subscription);

        const { subscriptionPeriodEnd } = stripeSubscriptionToUserFields(subscription);
        const recipientEmail =
          session.customer_details?.email?.trim() ||
          session.customer_email?.trim() ||
          null;
        if (recipientEmail && subscriptionPeriodEnd) {
          try {
            await sendProSubscriptionConfirmationEmail(recipientEmail, subscriptionPeriodEnd);
          } catch (emailErr) {
            console.error('[stripe/webhook] confirmation email failed', emailErr);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserIdFromSubscription(subscription);
        if (!userId) {
          console.warn(`[stripe/webhook] ${event.type}: could not resolve user`);
          break;
        }
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id ?? null;
        await applySubscriptionToUser(userId, customerId, subscription.id, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserIdFromSubscription(subscription);
        if (!userId) break;

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
            subscriptionPeriodEnd: null,
            cancelAtPeriodEnd: false,
          },
        });
        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.error('[stripe/webhook] handler error', e);
    // Still return 200 so Stripe does not retry storm on app bugs; logged above.
  }

  return NextResponse.json({ received: true });
}
