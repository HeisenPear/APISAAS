import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { ordonnances } from '~~/server/database/schema';

const schema = z.object({
  veterinaireId: z.string().uuid().optional().nullable(),
  datePrescription: z.string().datetime().optional(),
  medicament: z.string().min(1).max(255).trim().optional(),
  substance: z.string().max(255).trim().optional(),
  posologie: z.string().max(1000).trim().optional(),
  dureeTraitementJours: z.number().int().min(1).optional().nullable(),
  delaiAttenteAvantRecolteJours: z.number().int().min(0).optional(),
  ruchesConcernees: z.array(z.string().uuid()).optional().nullable(),
  documentUrl: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().max(2000).trim().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  const body = await readValidatedBody(event, schema.parse);

  const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.datePrescription) updateData.datePrescription = new Date(body.datePrescription);

  const [updated] = await db
    .update(ordonnances)
    .set(updateData)
    .where(and(eq(ordonnances.id, id!), eq(ordonnances.userId, user.id)))
    .returning();

  if (!updated) throw createError({ statusCode: 404, message: 'Ordonnance non trouvée' });
  return { data: updated };
});
