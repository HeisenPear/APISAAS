import { eq, and } from 'drizzle-orm';
import { signalementsFrelon } from '~~/server/database/schema';

/** DELETE /api/frelon/[id] — l'AUTEUR supprime son propre signalement. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(signalementsFrelon)
    .where(and(eq(signalementsFrelon.id, id), eq(signalementsFrelon.auteurId, user.id)))
    .returning({ id: signalementsFrelon.id });

  if (!deleted) return notFound('Signalement introuvable ou non supprimable');
  return { ok: true };
});
