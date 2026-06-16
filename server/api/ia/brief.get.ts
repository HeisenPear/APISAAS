import { briefDuJour } from '~~/server/utils/maya-brief';

/**
 * « Brief du jour » de Maya — synthèse proactive pour la carte du dashboard.
 * Gate `copiloteIa` appliqué par le middleware subscription (cf. route-gates).
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const q = getQuery(event).contexte;
  const contexte = q === 'ruches' || q === 'meteo' ? q : undefined;
  // Résilience serverless : si le pool est gelé (sockets morts après le gel de
  // la lambda), on le recycle et on retente une fois avant d'abandonner.
  try {
    return { data: await dbWatchdog(briefDuJour(user.id, contexte), 'ia/brief', 9000) };
  } catch {
    await resetDb().catch(() => {});
    try {
      return { data: await dbWatchdog(briefDuJour(user.id, contexte), 'ia/brief (relance)', 9000) };
    } catch (err) {
      console.error('[ia/brief] échec:', err instanceof Error ? err.message : err);
      return { data: { salutation: 'Bonjour 🐝', intro: '', items: [] } };
    }
  }
});
