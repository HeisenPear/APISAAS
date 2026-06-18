import { eq, and, lte } from 'drizzle-orm';
import { profils, alertes } from '~~/server/database/schema';
import { assertCronAuth } from '~~/server/utils/cron-helpers';
import { sendTrialExpiredEmail } from '~~/server/utils/email';

export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const now = new Date();

  // 1. Recuperer les profils des trials expires (email + prenom pour l'email)
  const expired = await db
    .select({ id: profils.id, email: profils.email, prenom: profils.prenom })
    .from(profils)
    .where(and(eq(profils.trialActive, true), lte(profils.trialEndsAt, now)));

  if (expired.length === 0) return { expired: 0 };

  // 2. UPDATE en masse
  await db
    .update(profils)
    .set({ plan: 'decouverte', trialActive: false, updatedAt: now })
    .where(and(eq(profils.trialActive, true), lte(profils.trialEndsAt, now)));

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
