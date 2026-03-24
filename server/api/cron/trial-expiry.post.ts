import { eq, and, lte } from 'drizzle-orm';
import { profils, alertes } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  // Vérifier que la requête vient du cron Vercel
  const authHeader = getHeader(event, 'authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.NUXT_CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, message: 'Non autorisé' });
  }

  const now = new Date();

  // Trouver les trials expirés
  const expired = await db
    .select({ id: profils.id })
    .from(profils)
    .where(and(eq(profils.trialActive, true), lte(profils.trialEndsAt, now)));

  let count = 0;
  for (const user of expired) {
    await db
      .update(profils)
      .set({
        plan: 'decouverte',
        trialActive: false,
        updatedAt: now,
      })
      .where(eq(profils.id, user.id));

    await db.insert(alertes).values({
      userId: user.id,
      type: 'info',
      titre: 'Votre essai Pro est terminé',
      message:
        'Votre essai gratuit de 14 jours est terminé. Vos données sont préservées. Passez au plan Starter ou Pro pour continuer.',
      priorite: 'haute',
      actionUrl: '/tarifs',
      lue: false,
    });

    count++;
  }

  return { expired: count };
});
