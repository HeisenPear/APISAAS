import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { ruches, ruchers } from '~~/server/database/schema';

const photoEntrySchema = z.object({
  url: z.string(),
  path: z.string(),
  name: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
  caption: z.string().optional(),
});

const updateRucheSchema = z
  .object({
    rucherId: z.string().uuid().optional(),
    numero: z.string().min(1).max(100).trim().optional(),
    type: z
      .enum(['dadant_10', 'dadant_12', 'langstroth', 'warre', 'voirnot', 'kenyane', 'autre'])
      .optional(),
    statut: z
      .enum(['active', 'faible', 'orpheline', 'essaimee', 'morte', 'vendue', 'fusionnee'])
      .optional(),
    raceAbeille: z
      .enum(['noire', 'buckfast', 'carnica', 'italienne', 'caucasienne', 'hybride', 'inconnue'])
      .optional(),
    qualiteReine: z
      .enum(['excellente', 'bonne', 'moyenne', 'faible', 'absente', 'inconnue'])
      .optional(),
    dateInstallation: z.coerce.date().optional(),
    origineEssaim: z.string().max(500).trim().optional(),
    marquageReine: z.string().max(100).trim().optional(),
    nombreCadres: z.coerce.number().int().min(0).max(30).optional(),
    nombreHausses: z.coerce.number().int().min(0).max(10).optional(),
    notes: z.string().max(2000).trim().optional(),
    photos: z.array(photoEntrySchema).optional(),
    couleurPersonnalisee: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hex invalide')
      .nullable()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit etre fourni',
  });

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateRucheSchema.parse);

  // If changing rucher, verify ownership of the new rucher
  if (body.rucherId) {
    const [targetRucher] = await db
      .select({ id: ruchers.id })
      .from(ruchers)
      .where(and(eq(ruchers.id, body.rucherId), eq(ruchers.userId, user.id)))
      .limit(1);

    if (!targetRucher) badRequest('Rucher cible introuvable');
  }

  const [updated] = await db
    .update(ruches)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(ruches.id, id), eq(ruches.userId, user.id)))
    .returning();

  if (!updated) notFound('Ruche introuvable');

  return { data: updated };
});
