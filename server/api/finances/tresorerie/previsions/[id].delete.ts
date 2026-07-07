import { and, eq } from 'drizzle-orm';
import { previsionsTresorerie } from '~~/server/database/schema';

/** Supprime un poste planifié. Écriture gated domaine `commerce`. */
export default defineEventHandler(async (event) => {
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const id = getRouterParam(event, 'id');
  uuidSchema.parse(id);

  const [deleted] = await db
    .delete(previsionsTresorerie)
    .where(and(eq(previsionsTresorerie.id, id as string), eq(previsionsTresorerie.userId, ownerId)))
    .returning({ id: previsionsTresorerie.id });

  if (!deleted) notFound('Poste introuvable');
  return { data: { id: deleted.id } };
});
