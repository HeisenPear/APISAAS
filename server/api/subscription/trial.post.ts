import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const profilRow = await db.query.profils.findFirst({
    where: eq(profils.id, user.id),
  });

  if (!profilRow) notFound('Profil introuvable');

  if (profilRow.plan !== 'decouverte') {
    throw badRequest('Le trial est réservé au plan Découverte');
  }

  if (profilRow.trialUsed) {
    throw badRequest('Vous avez déjà utilisé votre essai gratuit Pro 2 mois');
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  await db
    .update(profils)
    .set({
      plan: 'pro',
      trialActive: true,
      trialStartedAt: now,
      trialEndsAt: endsAt,
      trialUsed: true,
      updatedAt: now,
    })
    .where(eq(profils.id, user.id));

  return {
    success: true,
    trial: {
      active: true,
      startsAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
    },
  };
});
