import { z } from 'zod';
import { sites } from '~~/server/database/schema';

const createSiteSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(255).trim(),
  description: z.string().max(1000).trim().optional(),
  couleur: z.string().max(20).trim().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, createSiteSchema.parse);

  const [site] = await db
    .insert(sites)
    .values({ ...body, userId: user.id })
    .returning();

  if (!site) internalError('Erreur lors de la création du site');

  setResponseStatus(event, 201);
  return { data: site };
});
