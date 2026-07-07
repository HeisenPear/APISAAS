import { eq } from 'drizzle-orm';
import { demandesDemo } from '~~/server/database/schema';

/** Supprime une demande de démo. Admin uniquement. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(demandesDemo)
    .where(eq(demandesDemo.id, id))
    .returning({ id: demandesDemo.id });
  if (!deleted) notFound('Demande introuvable');

  return { success: true };
});
