import { and, eq, isNull, lt, or } from 'drizzle-orm';
import { profils, alertes, codesPromo, acquisitionsPromo } from '~~/server/database/schema';
import { useStripe } from '~~/server/utils/stripe';
import { planFromPriceId } from '~~/server/utils/stripe-plans';
import { useServerPostHog } from '~~/server/utils/posthog';
import type Stripe from 'stripe';

/**
 * UPDATE atomique du profil qui ignore les événements Stripe obsolètes.
 *
 * Pourquoi : Stripe ne garantit pas l'ordre de livraison des webhooks.
 * Un `customer.subscription.updated` peut arriver APRÈS un
 * `checkout.session.completed` plus récent avec un `event.created` antérieur.
 * Sans protection, le 1er écraserait le 2ème → profil incohérent.
 *
 * Solution : WHERE clause atomique qui n'update que si
 *   lastStripeEventAt IS NULL  OR  lastStripeEventAt < eventCreated
 * Pas de race entre SELECT et UPDATE — c'est Postgres qui arbitre.
 *
 * Le timestamp est mis à jour dans la même requête pour borner le prochain.
 */
async function updateProfilWithEventGuard(
  userId: string,
  eventCreatedSec: number,
  updates: Partial<typeof profils.$inferInsert>,
): Promise<void> {
  const eventAt = new Date(eventCreatedSec * 1000);
  await db
    .update(profils)
    .set({ ...updates, lastStripeEventAt: eventAt, updatedAt: new Date() })
    .where(
      and(
        eq(profils.id, userId),
        or(isNull(profils.lastStripeEventAt), lt(profils.lastStripeEventAt, eventAt)),
      ),
    );
}

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

  // Protection ordering : tous les UPDATE qui modifient le profil passent par
  // updateProfilWithEventGuard() qui ne met à jour que si stripeEvent.created
  // est plus récent que profils.lastStripeEventAt. Empêche un webhook arrivé
  // en retard d'écraser un état plus récent.

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined;
      const isTrial = session.metadata?.isTrial === 'true';

      if (!userId) {
        console.error('[stripe webhook] checkout.session.completed missing userId metadata', {
          sessionId: session.id,
        });
      }

      if (userId && session.subscription && plan) {
        const now = new Date();
        await updateProfilWithEventGuard(userId, stripeEvent.created, {
          plan,
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
          // Trial : activer + marquer comme utilisé → empêche un second trial
          trialActive: isTrial,
          trialStartedAt: isTrial ? now : undefined,
          trialEndsAt: isTrial ? new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) : undefined,
          trialUsed: isTrial ? true : undefined,
        });

        useServerPostHog().capture({
          distinctId: userId,
          event: isTrial ? 'trial_started' : 'subscription_started',
          properties: {
            plan,
            cycle: (session.metadata?.cycle ?? 'monthly') as string,
            is_trial: isTrial,
          },
        });
      }

      // Acquisition via code promo (sponsoring) : trace qui a payé avec quel code
      const promotionCodeId =
        typeof session.discounts?.[0]?.promotion_code === 'string'
          ? session.discounts[0].promotion_code
          : null;
      if (userId && plan && promotionCodeId) {
        const [codeRow] = await db
          .select({ id: codesPromo.id })
          .from(codesPromo)
          .where(eq(codesPromo.stripePromotionCodeId, promotionCodeId))
          .limit(1);
        if (codeRow) {
          await db
            .insert(acquisitionsPromo)
            .values({
              codePromoId: codeRow.id,
              userId,
              plan,
              montantRemiseCents: session.total_details?.amount_discount ?? 0,
              stripeSessionId: session.id,
            })
            .onConflictDoNothing({ target: acquisitionsPromo.stripeSessionId });

          useServerPostHog().capture({
            distinctId: userId,
            event: 'acquisition_promo',
            properties: { plan, codePromoId: codeRow.id },
          });
        } else {
          // Code promo créé manuellement dans Stripe (hors admin Apigo) : remise
          // bien appliquée au client mais non traçable côté Apigo → on le signale.
          console.warn('[stripe webhook] promotion code utilisé mais absent de codes_promo', {
            promotionCodeId,
            sessionId: session.id,
          });
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
          const priceId = subscription.items.data[0]?.price?.id;
          const plan = priceId
            ? (planFromPriceId(priceId) ??
              (subscription.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined))
            : (subscription.metadata?.plan as 'starter' | 'pro' | 'expert' | undefined);

          if (plan) {
            // Passage de trial → payant : désactiver le trial, conserver le plan
            await updateProfilWithEventGuard(userId, stripeEvent.created, {
              plan,
              trialActive: false,
            });
          }
        }

        // ─── ÉCHEC DE PAIEMENT ─────────────────────────────────────────
        // Deux états, deux traitements DÉLIBÉRÉS — ne pas les confondre.
        //
        // `past_due` : le prélèvement a échoué et Stripe RELANCE la carte,
        // pendant deux à trois semaines. On ne touche à RIEN. Une carte
        // expirée ne doit pas couper son rucher à un apiculteur qui réglera
        // dès la première relance. Il est prévenu par l'alerte posée sur
        // `invoice.payment_failed`, et il garde tout pendant qu'il corrige.
        //
        // `unpaid` : Stripe a ÉPUISÉ ses relances et cesse de collecter.
        // Ce n'est plus un incident bancaire, c'est un abonnement qui ne se
        // paie plus. On repasse en Découverte.
        //
        // On NE vide PAS `stripeSubscriptionId` ici, contrairement à
        // `subscription.deleted` : l'abonnement existe toujours chez Stripe et
        // peut reprendre si le client met sa carte à jour. L'effacer
        // couperait ce retour en arrière.
        if (status === 'unpaid') {
          await updateProfilWithEventGuard(userId, stripeEvent.created, {
            plan: 'decouverte',
            trialActive: false,
          });

          // Jamais de blocage sans porte de sortie : l'alerte dit ce qui s'est
          // passé, que rien n'est perdu, et où aller pour rétablir.
          await db.insert(alertes).values({
            userId,
            type: 'info',
            titre: 'Abonnement suspendu — paiement non abouti',
            message:
              'Après plusieurs tentatives, le paiement de votre abonnement n’a pas abouti. Vous êtes repassé au plan Découverte. Vos données sont intégralement préservées : mettez à jour votre moyen de paiement et vous retrouverez tout, là où vous l’aviez laissé.',
            priorite: 'critique',
            actionUrl: '/parametres/abonnement',
            lue: false,
          });

          useServerPostHog().capture({
            distinctId: userId,
            event: 'subscription_unpaid',
            properties: { source: 'stripe_webhook' },
          });
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
            await updateProfilWithEventGuard(userId, stripeEvent.created, {
              plan,
              trialActive: true,
              trialUsed: true,
              trialEndsAt: trialEnd,
            });
          }
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await updateProfilWithEventGuard(userId, stripeEvent.created, {
          plan: 'decouverte',
          stripeSubscriptionId: null,
          trialActive: false,
        });

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

        // Calculer l'ancienneté pour PostHog
        const profilRow = await db.query.profils.findFirst({
          where: eq(profils.id, userId),
          columns: { createdAt: true },
        });
        const ancienneteJours = profilRow?.createdAt
          ? Math.floor((Date.now() - profilRow.createdAt.getTime()) / 86_400_000)
          : undefined;

        useServerPostHog().capture({
          distinctId: userId,
          event: 'subscription_canceled',
          properties: {
            source: 'stripe_webhook',
            anciennete_jours: ancienneteJours,
          },
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
          actionUrl: '/parametres/abonnement',
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
            actionUrl: '/parametres/abonnement',
            lue: false,
          });
        }
      }
      break;
    }
  }

  return { received: true };
});
