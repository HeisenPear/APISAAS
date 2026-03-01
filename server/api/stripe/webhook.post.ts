import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { useStripe } from '~~/server/utils/stripe';
import type Stripe from 'stripe';

export default defineEventHandler(async (event) => {
  const stripe = useStripe();
  const config = useRuntimeConfig();
  const body = await readRawBody(event);
  const signature = getHeader(event, 'stripe-signature');

  if (!body || !signature) {
    setResponseStatus(event, 400);
    return { error: 'Missing body or signature' };
  }

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, signature, config.stripeWebhookSecret);
  } catch {
    setResponseStatus(event, 400);
    return { error: 'Invalid signature' };
  }

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined;

      if (userId && plan && session.subscription) {
        await db
          .update(profils)
          .set({
            plan,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
            updatedAt: new Date(),
          })
          .where(eq(profils.id, userId));
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      const plan = subscription.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined;

      if (userId) {
        const status = subscription.status;
        if (status === 'active' && plan) {
          await db
            .update(profils)
            .set({ plan, updatedAt: new Date() })
            .where(eq(profils.id, userId));
        } else if (status === 'past_due' || status === 'unpaid') {
          // Keep current plan but could add a warning flag
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await db
          .update(profils)
          .set({
            plan: 'decouverte',
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(profils.id, userId));
      }
      break;
    }
  }

  return { received: true };
});
