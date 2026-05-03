import { z } from 'zod';
import { emplacements } from '~~/server/database/schema';

const schema = z.object({
  nom: z.string().min(1).max(255).trim(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  adresse: z.string().max(500).trim().optional(),
  commune: z.string().max(255).trim().optional(),
  codePostal: z.string().max(10).trim().optional(),
  altitudeMetres: z.coerce.number().int().optional(),
  capaciteMaxRuches: z.coerce.number().int().min(1).optional(),
  mielleesPrincipales: z.array(z.string()).optional(),
  proprietaireTerrain: z.string().max(255).trim().optional(),
  proprietaireTelephone: z.string().max(50).trim().optional(),
  accordSigne: z.boolean().optional(),
  loyerAnnuelEuros: z.coerce.number().min(0).optional(),
  loyerEnMielKg: z.coerce.number().min(0).optional(),
  accesDifficulte: z.enum(['facile', 'moyen', 'difficile']).optional(),
  notes: z.string().max(2000).trim().optional(),
  estActif: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, schema.parse);

  const [row] = await db.insert(emplacements).values({
    ...body,
    latitude: body.latitude.toString(),
    longitude: body.longitude.toString(),
    loyerAnnuelEuros: body.loyerAnnuelEuros?.toString(),
    loyerEnMielKg: body.loyerEnMielKg?.toString(),
    userId: user.id,
  }).returning();

  if (!row) internalError('Erreur création emplacement');
  setResponseStatus(event, 201);
  return { data: row };
});
