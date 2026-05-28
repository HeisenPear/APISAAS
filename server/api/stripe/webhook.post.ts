import { eq } from 'drizzle-orm';
import { profils, alertes } from '~~/server/database/schema';
import { useStripe } from '~~/server/utils/stripe';
import { planFromPriceId } from '~~/server/utils/stripe-plans';
import type Stripe from 'stripe';

export default defineEventHandler(async (event) => {
  const stripe = useStripe();
  const config = useRuntimeConfig();
  // readRawBody peut retourner Buffer | string | null selon le Content-Type.
  // Stripe SDK exige Buffer | string strict — on assert explicitement.
  const body = await readRawBody(event);
  const signature = getHeader(event, 'stripe-signature');

  if (!body || (typeof body !== 'string' && !Buffer.isBuffer(body))) {
    setResponseStatus(event, 400);
    return { error: 'Invalid or missing body' };
  }
  if (!signature) {
    setResponseStatus(event, 400);
    return { error: 'Missing stripe-signature header' };
  }

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, signature, config.stripeWebhookSecret);
  } catch (err) {
    // Log la raison precise — utile en debug Stripe (signature expired, secret mismatch…)
    console.error('[stripe webhook] signature verification failed', String(err));
    setResponseStatus(event, 400);
    return { error: 'Invalid signature' };
  }

  // TODO race-condition (separe) : ajouter une colonne profils.lastStripeEventAt,
  // skip les events plus vieux que ce timestamp pour eviter qu'un subscription.updated
  // out-of-order override un checkout.session.completed plus recent.
  // Cf. https://stripe.com/docs/webhooks/best-practices#event-ordering

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined;
      const isTrial = session.metadata?.isTrial === 'true';

      if (userId && session.subscription && plan) {
        const now = new Date();
        await db
          .update(profils)
          .set({
            plan,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
            // Trial : activer + marquer comme utilisé → empêche un second trial
            trialActive: isTrial,
            trialStartedAt: isTrial ? now : undefined,
            trialEndsAt: isTrial ? new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) : undefined,
            trialUsed: isTrial ? true : undefined,
            updatedAt: now,
          })
          .where(eq(profils.id, userId));
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const status = subscription.status;

        if (status === 'active') {
          const priceId = subscription.items.data[0]?.price?.id;
          const plan = priceId
            ? (planFromPriceId(priceId) ??
              (subscription.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined))
            : (subscription.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined);

          if (plan) {
            // Passage de trial → payant : désactiver le trial, conserver le plan
            await db
              .update(profils)
              .set({ plan, trialActive: false, updatedAt: new Date() })
              .where(eq(profils.id, userId));
          }
        }

        if (status === 'trialing') {
          // Abonnement en trial (ex: reprise après webhook delayed)
          const priceId = subscription.items.data[0]?.price?.id;
          const plan = priceId
            ? (planFromPriceId(priceId) ??
              (subscription.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined))
            : (subscription.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined);

          if (plan) {
            const trialEnd = subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : undefined;
            await db
              .update(profils)
              .set({
                plan,
                trialActive: true,
                trialUsed: true,
                trialEndsAt: trialEnd,
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

    case 'customer.subscription.trial_will_end': {
      // Stripe envoie cet event 3 jours avant la fin du trial
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toLocaleDateString('fr-FR')
          : 'bientôt';
        await db.insert(alertes).values({
          userId,
          type: 'info',
          titre: 'Votre essai se termine dans 3 jours',
          message: `Votre essai Pro se termine le ${trialEnd}. Votre carte sera débitée automatiquement. Vous pouvez annuler depuis les paramètres.`,
          priorite: 'haute',
          actionUrl: '/parametres/facturation',
          lue: false,
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = stripeEvent.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      if (customerId) {
        const profilRow = await db.query.profils.findFirst({
          where: eq(profils.stripeCustomerId, customerId),
        });

        if (profilRow) {
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
