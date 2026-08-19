import { calculerTournee } from '~~/server/utils/tourneeData';

/**
 * GET /api/tournee — « Ma tournée du jour ».
 * Ruchers ayant des ruches actives en retard de visite (seuil SAISONNIER, cf.
 * cadence.ts) ou en santé critique, ordonnés en itinéraire au plus proche voisin.
 */
export default defineEventHandler(async (event) => {
  const ownerId = await resolveOwnerId(event);
  const t = await calculerTournee(ownerId, new Date());

  return {
    data: {
      arrets: t.route,
      sansCoords: t.sansCoords,
      totalKm: t.totalKm,
      lienMaps: t.lienMaps,
      nbRuchersAVisiter: t.nbRuchersAVisiter,
      nbRuchesAVisiter: t.nbRuchesAVisiter,
      seuilJours: t.seuilJours,
    },
  };
});
