import { and, eq } from 'drizzle-orm';
import { previsionsTresorerie } from '~~/server/database/schema';
import { previsionSchema } from '~~/server/utils/validation/prevision';

/** Met à jour un poste planifié (partiel). Écriture gated domaine `commerce`. */
export default defineEventHandler(async (event) => {
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const id = getRouterParam(event, 'id');
  uuidSchema.parse(id);
  const body = await readValidatedBody(event, previsionSchema.partial().parse);

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.libelle !== undefined) updates.libelle = body.libelle;
  if (body.montant !== undefined) updates.montant = body.montant.toFixed(2);
  if (body.type !== undefined) updates.type = body.type;
  if (body.recurrence !== undefined) updates.recurrence = body.recurrence;
  if (body.datePrevue !== undefined) updates.datePrevue = body.datePrevue;
  if (body.notes !== undefined) updates.notes = body.notes ?? null;

  const [updated] = await db
    .update(previsionsTresorerie)
    .set(updates)
    .where(and(eq(previsionsTresorerie.id, id as string), eq(previsionsTresorerie.userId, ownerId)))
    .returning();

  if (!updated) notFound('Poste introuvable');
  return { data: updated };
});
