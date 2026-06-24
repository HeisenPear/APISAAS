import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { reinesElevage } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';

const schema = z.object({
  rucheId: z.string().uuid().nullable().optional(),
  ligneeId: z.string().uuid().nullable().optional(),
  identifiant: z.string().max(100).trim().nullable().optional(),
  couleurMarquage: z.enum(['blanc', 'jaune', 'rouge', 'vert', 'bleu']).nullable().optional(),
  anneeNaissance: z.coerce.number().int().nullable().optional(),
  dateIntroduction: z.string().datetime().nullable().optional(),
  origine: z.enum(['elevage_propre', 'achat', 'capture_essaim']).nullable().optional(),
  fournisseur: z.string().max(255).trim().nullable().optional(),
  estInsemine: z.boolean().optional(),
  stationFecondation: z.string().max(255).trim().nullable().optional(),
  estActive: z.boolean().optional(),
  dateRemplacement: z.string().datetime().nullable().optional(),
  causeRemplacement: z.string().max(500).trim().nullable().optional(),
  notes: z.string().max(2000).trim().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);
  const body = await readValidatedBody(event, schema.parse);

  const updates: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.dateIntroduction !== undefined)
    updates.dateIntroduction = body.dateIntroduction ? new Date(body.dateIntroduction) : null;
  if (body.dateRemplacement !== undefined)
    updates.dateRemplacement = body.dateRemplacement ? new Date(body.dateRemplacement) : null;

  const [row] = await db
    .update(reinesElevage)
    .set(updates)
    .where(and(eq(reinesElevage.id, id!), eq(reinesElevage.userId, ownerId)))
    .returning();
  if (!row) notFound('Reine introuvable');
  return { data: row };
});
