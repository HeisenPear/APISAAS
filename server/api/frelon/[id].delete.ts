import { eq, and } from 'drizzle-orm';
import { signalementsFrelon } from '~~/server/database/schema';

/** DELETE /api/frelon/[id] — supprime un signalement de l'espace. */
export default defineEventHandler(async (event) => {
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(signalementsFrelon)
    .where(and(eq(signalementsFrelon.id, id), eq(signalementsFrelon.userId, ownerId)))
    .returning({ id: signalementsFrelon.id });

  if (!deleted) return notFound('Signalement introuvable');
  return { ok: true };
});
