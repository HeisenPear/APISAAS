import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { sites } from '~~/server/database/schema';

const updateSiteSchema = z
  .object({
    nom: z.string().min(1).max(255).trim().optional(),
    description: z.string().max(1000).trim().optional(),
    couleur: z.string().max(20).trim().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Au moins un champ doit être fourni' });

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateSiteSchema.parse);

  const [updated] = await db
    .update(sites)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(sites.id, id), eq(sites.userId, user.id)))
    .returning();

  if (!updated) notFound('Site introuvable');

  return { data: updated };
});
