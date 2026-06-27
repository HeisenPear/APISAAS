import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { signalementsFrelon } from '~~/server/database/schema';

const bodySchema = z.object({ vote: z.enum(['confirme', 'infirme', 'detruit']) });

/**
 * POST /api/frelon/[id]/vote — vote communautaire (confirme / infirme / détruit).
 * Anti-fraude : 1 vote par compte (upsert), et on NE PEUT PAS voter son propre
 * signalement (pas d'auto-validation). Recalcule score + statut + réputation.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);
  const { vote } = await readValidatedBody(event, bodySchema.parse);

  const [sig] = await db
    .select({ auteurId: signalementsFrelon.auteurId })
    .from(signalementsFrelon)
    .where(eq(signalementsFrelon.id, id))
    .limit(1);
  if (!sig) return notFound('Signalement introuvable');

  if (sig.auteurId === user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Vote interdit',
      message: 'Vous ne pouvez pas voter votre propre signalement.',
    });
  }

  await appliquerVote(id, user.id, vote);
  return { ok: true };
});
