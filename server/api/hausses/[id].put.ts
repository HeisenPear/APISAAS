import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { hausses } from '~~/server/database/schema';

const updateHausseSchema = z.object({
  rucheId: z.string().uuid().nullable().optional(),
  statut: z.enum(['disponible', 'en_service', 'en_stock', 'hors_service']).optional(),
  nombreCadres: z.number().int().min(1).max(20).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateHausseSchema.parse);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.rucheId !== undefined) updateData.rucheId = body.rucheId;
  if (body.statut !== undefined) updateData.statut = body.statut;
  if (body.nombreCadres !== undefined) updateData.nombreCadres = body.nombreCadres;
  if (body.notes !== undefined) updateData.notes = body.notes;

  const [updated] = await db
    .update(hausses)
    .set(updateData)
    .where(and(eq(hausses.id, id), eq(hausses.userId, user.id)))
    .returning();

  if (!updated) return notFound('Hausse introuvable');

  return { data: updated };
});
