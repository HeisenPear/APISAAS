import { eq, and, lte } from 'drizzle-orm';
import { profils, alertes } from '~~/server/database/schema';
import { assertCronAuth } from '~~/server/utils/cron-helpers';

export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const now = new Date();

  // 1. Recuperer les IDs des trials expires en une seule requete
  const expired = await db
    .select({ id: profils.id })
    .from(profils)
    .where(and(eq(profils.trialActive, true), lte(profils.trialEndsAt, now)));

  if (expired.length === 0) {
    return { expired: 0 };
  }

  // 2. UPDATE en masse via une seule requete WHERE (trialActive=true AND trialEndsAt<=now)
  //    Bien plus efficace que N updates separes — passe de O(N) a O(1) cote DB.
  await db
    .update(profils)
    .set({ plan: 'decouverte', trialActive: false, updatedAt: now })
    .where(and(eq(profils.trialActive, true), lte(profils.trialEndsAt, now)));

  // 3. INSERT batch des alertes — une seule requete pour tous les users
  const alertesValues = expired.map((u) => ({
    userId: u.id,
    type: 'info' as const,
    titre: 'Votre essai Pro est termine',
    message:
      'Votre essai gratuit de 14 jours est termine. Vos donnees sont preservees. Passez au plan Starter ou Pro pour continuer.',
    priorite: 'haute' as const,
    actionUrl: '/tarifs',
    lue: false,
  }));

  await db.insert(alertes).values(alertesValues);

  return { expired: expired.length };
});
