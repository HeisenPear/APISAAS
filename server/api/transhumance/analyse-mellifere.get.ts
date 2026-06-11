import { z } from 'zod';
import { fetchParcellesRPG } from '~~/server/utils/rpg';
import { analyserParcelles } from '~~/server/utils/mellifere';

const querySchema = z.object({
  lat: z.coerce.number().min(41).max(51.5), // France métropolitaine
  lng: z.coerce.number().min(-5.5).max(10),
  rayon: z.coerce.number().min(500).max(3000).default(3000),
});

/**
 * Analyse mellifère d'un point (emplacement de transhumance) :
 * parcelles RPG dans le rayon de butinage → score 0-100, cultures dominantes,
 * calendrier de floraisons prévisionnel. Gate plan : analyseMellifere (Pro+),
 * appliqué par le middleware subscription via route-gates.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { lat, lng, rayon } = await getValidatedQuery(event, querySchema.parse);

  const { millesime, parcelles } = await fetchParcellesRPG(lat, lng, rayon);
  const analyse = analyserParcelles(parcelles);

  return {
    data: {
      ...analyse,
      millesime,
      rayonM: rayon,
      position: { lat, lng },
    },
  };
});
