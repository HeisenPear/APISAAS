import { eq, and, lte, isNull } from 'drizzle-orm';
import { profils, alertes } from '~~/server/database/schema';
import { assertCronAuth } from '~~/server/utils/cron-helpers';
import { sendTrialExpiredEmail } from '~~/server/utils/email';

export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const now = new Date();

  // Filtre : essais expirés MAIS SANS abonnement Stripe.
  //
  // Un essai adossé à Stripe (nouvelle cohorte : carte captée à l'inscription,
  // `trial_period_days`) NE doit JAMAIS être rétrogradé ici : à la fin du trial
  // Stripe débite la carte et bascule l'abonnement `trialing → active`, ce que
  // gère le webhook (customer.subscription.updated / .deleted / invoice.*).
  // Si on le rétrogradait en aveugle, un client qui vient de PAYER pourrait
  // perdre son accès Pro quand le webhook tarde ou est manqué.
  // Seuls les ANCIENS essais sans carte (stripeSubscriptionId IS NULL) doivent
  // expirer via ce cron → Découverte.
  const expiredFilter = and(
    eq(profils.trialActive, true),
    lte(profils.trialEndsAt, now),
    isNull(profils.stripeSubscriptionId),
  );

  // 1. Recuperer les profils des trials expires (email + prenom pour l'email)
  const expired = await db
    .select({ id: profils.id, email: profils.email, prenom: profils.prenom })
    .from(profils)
    .where(expiredFilter);

  if (expired.length === 0) return { expired: 0 };

  // 2. UPDATE en masse
  await db
    .update(profils)
    .set({ plan: 'decouverte', trialActive: false, updatedAt: now })
    .where(expiredFilter);

  // 3. Alertes in-app + emails en parallèle
  const alertesValues = expired.map((u) => ({
    userId: u.id,
    type: 'info' as const,
    titre: 'Votre essai Pro est terminé',
    message:
      'Votre essai gratuit est terminé. Vos données sont préservées. Passez au plan Starter ou Pro pour continuer.',
    priorite: 'haute' as const,
    actionUrl: '/tarifs',
    lue: false,
  }));

  await Promise.all([
    db.insert(alertes).values(alertesValues),
    ...expired.map((u) => sendTrialExpiredEmail(u.email, u.prenom || 'Apiculteur').catch(() => {})),
  ]);

  return { expired: expired.length };
});
