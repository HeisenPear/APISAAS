import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { inspections, ruches } from '~~/server/database/schema';

const updateInspectionSchema = z
  .object({
    rucheId: z.string().uuid().optional(),
    dateVisite: z.coerce.date().optional(),
    type: z.string().min(1).max(100).trim().optional(),
    meteo: z
      .object({
        temperature: z.number().optional(),
        vent: z.string().optional(),
        ciel: z.string().optional(),
      })
      .optional(),
    forceColonie: z.number().int().min(1).max(5).optional(),
    couvain: z.number().int().min(0).max(5).optional(),
    reserves: z.number().int().min(1).max(5).optional(),
    comportement: z.string().max(100).trim().optional(),
    reineVue: z.boolean().optional(),
    celluleRoyale: z.boolean().optional(),
    signeEssaimage: z.boolean().optional(),
    varroa: z.number().int().min(0).optional(),
    traitementApplique: z.string().max(500).trim().optional(),
    maladieObservee: z.string().max(500).trim().optional(),
    actionsRealisees: z.array(z.string()).optional(),
    nourrissementType: z.string().max(200).trim().optional(),
    nourrissementQuantite: z.coerce.number().min(0).optional(),
    notes: z.string().max(5000).trim().optional(),
    photos: z.array(z.string().url()).optional(),
    dureeMinutes: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit etre fourni',
  });

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateInspectionSchema.parse);

  // If changing ruche, verify ownership
  if (body.rucheId) {
    const [targetRuche] = await db
      .select({ id: ruches.id })
      .from(ruches)
      .where(and(eq(ruches.id, body.rucheId), eq(ruches.userId, user.id)))
      .limit(1);

    if (!targetRuche) badRequest('Ruche cible introuvable');
  }

  // Convert nourrissementQuantite to string for decimal column
  const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.nourrissementQuantite !== undefined) {
    updateData.nourrissementQuantite = body.nourrissementQuantite.toString();
  }

  const [updated] = await db
    .update(inspections)
    .set(updateData)
    .where(and(eq(inspections.id, id), eq(inspections.userId, user.id)))
    .returning();

  if (!updated) notFound('Inspection introuvable');

  return { data: updated };
});
