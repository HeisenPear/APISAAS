import { z } from 'zod';
import { analyserButinage } from '~~/server/utils/butinageFetch';

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/**
 * GET /api/transhumance/butinage?lat=&lng=
 * Composition mellifère du rayon de butinage (~3 km) : échantillonne l'occupation
 * du sol IGN (RPG + BD Forêt + CORINE) → % par ressource + potentiel + miels
 * probables. Gated `transhumance`.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { lat, lng } = await getValidatedQuery(event, querySchema.parse);
  return { data: { rayonKm: 3, ...(await analyserButinage(lat, lng)) } };
});
