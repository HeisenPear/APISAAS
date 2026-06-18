import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { demandesDemo } from '~~/server/database/schema';

const bodySchema = z.object({
  statut: z.enum(['nouveau', 'contacte', 'planifie', 'realise', 'annule']).optional(),
  notes: z.string().max(5000).nullable().optional(),
  /** Date du rdv confirmé (ISO) ou null pour l'effacer */
  rdvAt: z.string().datetime().nullable().optional(),
});

/** Met à jour une demande de démo : statut, notes internes, date de rdv. Admin. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, bodySchema.parse);

  const patch: Partial<typeof demandesDemo.$inferInsert> = { updatedAt: new Date() };
  if (body.statut !== undefined) patch.statut = body.statut;
  if (body.notes !== undefined) patch.notes = body.notes;
  if (body.rdvAt !== undefined) patch.rdvAt = body.rdvAt ? new Date(body.rdvAt) : null;

  const [updated] = await db
    .update(demandesDemo)
    .set(patch)
    .where(eq(demandesDemo.id, id))
    .returning();
  if (!updated) notFound('Demande introuvable');

  return { data: updated };
});
