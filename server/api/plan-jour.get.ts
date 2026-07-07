import { chargerPlanJour } from '~~/server/utils/planJour';

/**
 * GET /api/plan-jour — feuille de route du jour de l'espace (visites dues selon
 * la cadence saisonnière, RDV du jour, traitements à clôturer, charge de la
 * semaine). Alimente la page /tournee et sert de base au résumé quotidien poussé.
 */
export default defineEventHandler(async (event) => {
  const ownerId = await resolveOwnerId(event);
  return { data: await chargerPlanJour(ownerId) };
});
