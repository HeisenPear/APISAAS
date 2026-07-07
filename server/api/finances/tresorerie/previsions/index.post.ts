import { previsionsTresorerie } from '~~/server/database/schema';
import { previsionSchema } from '~~/server/utils/validation/prevision';

/** Crée un poste planifié. Écriture gated domaine `commerce`. */
export default defineEventHandler(async (event) => {
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const body = await readValidatedBody(event, previsionSchema.parse);

  const [created] = await db
    .insert(previsionsTresorerie)
    .values({
      userId: ownerId,
      libelle: body.libelle,
      montant: body.montant.toFixed(2),
      type: body.type,
      recurrence: body.recurrence,
      datePrevue: body.datePrevue,
      notes: body.notes ?? null,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: created };
});
