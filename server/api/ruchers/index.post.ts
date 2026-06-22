import { z } from 'zod';
import { ruchers } from '~~/server/database/schema';

const createRucherSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(255).trim(),
  description: z.string().max(1000).trim().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  adresse: z.string().max(500).trim().optional(),
  codePostal: z.string().max(10).trim().optional(),
  commune: z.string().max(255).trim().optional(),
  departement: z.string().max(100).trim().optional(),
  environnement: z.string().max(500).trim().optional(),
  notesAcces: z.string().max(1000).trim().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const body = await readValidatedBody(event, createRucherSchema.parse);

  const [newRucher] = await db
    .insert(ruchers)
    .values({
      ...body,
      latitude: body.latitude?.toString(),
      longitude: body.longitude?.toString(),
      userId: user.id,
    })
    .returning();

  if (!newRucher) {
    internalError('Erreur lors de la creation du rucher');
  }

  setResponseStatus(event, 201);
  return { data: newRucher };
});
