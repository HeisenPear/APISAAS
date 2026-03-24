import { eq } from 'drizzle-orm';
import { profils, alertes } from '~~/server/database/schema';
import { useStripe } from '~~/server/utils/stripe';
import { planFromPriceId } from '~~/server/utils/stripe-plans';
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
      const planFromMeta = session.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined;

      if (userId && session.subscription) {
        // Résoudre le plan depuis metadata ou depuis le price_id
        const plan = planFromMeta;
        if (!plan && session.line_items) {
          // Essayer de résoudre depuis les items si disponible
        }

        if (plan) {
          await db
            .update(profils)
            .set({
              plan,
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
              trialActive: false, // Désactiver le trial si actif
              updatedAt: new Date(),
            })
            .where(eq(profils.id, userId));
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const status = subscription.status;

        if (status === 'active') {
          // Extraire le plan depuis le price_id de l'abonnement
          const priceId = subscription.items.data[0]?.price?.id;
          const plan = priceId
            ? (planFromPriceId(priceId) ??
              (subscription.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined))
            : (subscription.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined);

          if (plan) {
            await db
              .update(profils)
              .set({
                plan,
                trialActive: false,
                updatedAt: new Date(),
              })
              .where(eq(profils.id, userId));
          }
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
            trialActive: false,
            updatedAt: new Date(),
          })
          .where(eq(profils.id, userId));

        await db.insert(alertes).values({
          userId,
          type: 'info',
          titre: 'Abonnement annulé',
          message:
            'Votre abonnement a été annulé. Vous êtes repassé au plan Découverte. Vos données sont préservées.',
          priorite: 'haute',
          actionUrl: '/tarifs',
          lue: false,
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = stripeEvent.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      if (customerId) {
        // Retrouver l'utilisateur par stripe_customer_id
        const profilRow = await db.query.profils.findFirst({
          where: eq(profils.stripeCustomerId, customerId),
        });

        if (profilRow) {
          // Ne pas downgrader immédiatement, Stripe retry pendant ~3 semaines
          await db.insert(alertes).values({
            userId: profilRow.id,
            type: 'info',
            titre: 'Échec du paiement',
            message:
              'Le paiement de votre abonnement a échoué. Veuillez mettre à jour vos informations de paiement pour éviter la suspension de votre compte.',
            priorite: 'critique',
            actionUrl: '/parametres/facturation',
            lue: false,
          });
        }
      }
      break;
    }
  }

  return { received: true };
});
