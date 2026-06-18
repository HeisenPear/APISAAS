import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { useStripe } from '~~/server/utils/stripe';
import { planFromPriceId } from '~~/server/utils/stripe-plans';

type Plan = 'decouverte' | 'starter' | 'pro' | 'expert';

/**
 * Réconcilie le plan d'un utilisateur depuis Stripe (filet de sécurité quand un
 * webhook a été manqué : abonnement payé mais `profils.plan` resté à découverte).
 * Lit l'abonnement actif côté Stripe et met à jour plan + subscriptionId + trial.
 * Admin uniquement.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [user] = await db
    .select({ id: profils.id, customer: profils.stripeCustomerId })
    .from(profils)
    .where(eq(profils.id, id))
    .limit(1);
  if (!user) notFound('Utilisateur introuvable');
  if (!user.customer) {
    return { data: { synced: false, reason: 'Aucun client Stripe associé à ce profil.' } };
  }

  const stripe = useStripe();
  const subs = await stripe.subscriptions.list({
    customer: user.customer,
    status: 'all',
    limit: 10,
  });
  // Statuts « entitlés » : on garde le plan tant que Stripe n'a pas réellement
  // résilié. past_due / unpaid = relance en cours (carte refusée) — rétrograder
  // ici couperait l'accès à un client qui a payé, pour un incident transitoire.
  // On préfère un abonnement franchement actif/en essai s'il en existe un.
  const ENTITLED = ['active', 'trialing', 'past_due', 'unpaid'];
  const actif =
    subs.data.find((s) => s.status === 'active' || s.status === 'trialing') ??
    subs.data.find((s) => ENTITLED.includes(s.status));

  // Aucun abonnement actif → on rétrograde proprement en découverte.
  if (!actif) {
    await db
      .update(profils)
      .set({
        plan: 'decouverte',
        stripeSubscriptionId: null,
        trialActive: false,
        updatedAt: new Date(),
      })
      .where(eq(profils.id, id));
    return {
      data: { synced: true, plan: 'decouverte', reason: 'Aucun abonnement actif côté Stripe.' },
    };
  }

  const priceId = actif.items.data[0]?.price?.id;
  const plan: Plan | null =
    (priceId ? planFromPriceId(priceId) : null) ?? ((actif.metadata?.plan as Plan) || null);

  if (!plan) {
    return {
      data: {
        synced: false,
        reason: `Abonnement actif trouvé (${actif.id}) mais le plan est indéterminé (tarif ${priceId ?? '?'} non reconnu). Réglez le plan manuellement.`,
      },
    };
  }

  const trialing = actif.status === 'trialing';
  await db
    .update(profils)
    .set({
      plan,
      stripeSubscriptionId: actif.id,
      stripeCustomerId: user.customer,
      trialActive: trialing,
      updatedAt: new Date(),
    })
    .where(eq(profils.id, id));

  return { data: { synced: true, plan, trialActive: trialing, stripeSubscriptionId: actif.id } };
});
