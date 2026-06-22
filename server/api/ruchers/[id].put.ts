import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { ruchers } from '~~/server/database/schema';

const updateRucherSchema = z
  .object({
    nom: z.string().min(1).max(255).trim().optional(),
    description: z.string().max(1000).trim().optional(),
    siteId: z.string().uuid().nullable().optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    adresse: z.string().max(500).trim().optional(),
    codePostal: z.string().max(10).trim().optional(),
    commune: z.string().max(255).trim().optional(),
    departement: z.string().max(100).trim().optional(),
    environnement: z.string().max(500).trim().optional(),
    notesAcces: z.string().max(1000).trim().optional(),
    actif: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit etre fourni',
  });

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateRucherSchema.parse);

  const [updated] = await db
    .update(ruchers)
    .set({
      ...body,
      latitude: body.latitude?.toString(),
      longitude: body.longitude?.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(ruchers.id, id), eq(ruchers.userId, user.id)))
    .returning();

  if (!updated) notFound('Rucher introuvable');

  return { data: updated };
});
