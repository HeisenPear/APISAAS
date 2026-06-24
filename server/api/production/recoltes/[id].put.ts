import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { recoltes, ruchers, ruches } from '~~/server/database/schema';

const photoEntrySchema = z.object({
  url: z.string(),
  path: z.string(),
  name: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
  caption: z.string().optional(),
});

const updateRecolteSchema = z.object({
  rucherId: z.string().uuid().nullish(),
  rucheId: z.string().uuid().nullish(),
  dateRecolte: z.coerce.date().optional(),
  typeMiel: z.string().min(1).max(200).trim().nullish(),
  quantiteKg: z.coerce.number().min(0).nullish(),
  humidite: z.coerce.number().min(0).max(100).nullish(),
  nombreHausses: z.number().int().min(0).nullish(),
  numeroLot: z.string().max(100).trim().nullish(),
  notes: z.string().max(5000).trim().nullish(),
  photos: z.array(photoEntrySchema).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = uuidSchema.parse(getRouterParam(event, 'id'));
  const body = await readValidatedBody(event, updateRecolteSchema.parse);

  // Check ownership
  const [existing] = await db
    .select({ id: recoltes.id })
    .from(recoltes)
    .where(and(eq(recoltes.id, id), eq(recoltes.userId, ownerId)))
    .limit(1);

  if (!existing) notFound('Recolte introuvable');

  // Verify rucher ownership if changing
  if (body.rucherId) {
    const [rucher] = await db
      .select({ id: ruchers.id })
      .from(ruchers)
      .where(and(eq(ruchers.id, body.rucherId), eq(ruchers.userId, ownerId)))
      .limit(1);
    if (!rucher) badRequest('Rucher introuvable ou non autorise');
  }

  // Verify ruche ownership if changing
  if (body.rucheId) {
    const [ruche] = await db
      .select({ id: ruches.id })
      .from(ruches)
      .where(and(eq(ruches.id, body.rucheId), eq(ruches.userId, ownerId)))
      .limit(1);
    if (!ruche) badRequest('Ruche introuvable ou non autorisee');
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (body.dateRecolte !== undefined) updateData.dateRecolte = body.dateRecolte;
  if (body.rucherId !== undefined) updateData.rucherId = body.rucherId;
  if (body.rucheId !== undefined) updateData.rucheId = body.rucheId;
  if (body.typeMiel !== undefined) updateData.typeMiel = body.typeMiel;
  if (body.quantiteKg !== undefined) updateData.quantiteKg = body.quantiteKg?.toString() ?? null;
  if (body.humidite !== undefined) updateData.humidite = body.humidite?.toString() ?? null;
  if (body.nombreHausses !== undefined) updateData.nombreHausses = body.nombreHausses;
  if (body.numeroLot !== undefined) updateData.numeroLot = body.numeroLot;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.photos !== undefined) updateData.photos = body.photos;

  const [updated] = await db
    .update(recoltes)
    .set(updateData)
    .where(and(eq(recoltes.id, id), eq(recoltes.userId, ownerId)))
    .returning();

  if (!updated) internalError('Erreur lors de la mise a jour');

  return { data: updated };
});
