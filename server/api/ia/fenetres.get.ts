import { getFenetres } from '~~/server/utils/maya-fenetres';

/**
 * Maya — Fenêtres d'intervention prédictives (capacité Beekube #4).
 * Suggestions déterministes (historique × saison × météo prévue), aucun LLM.
 * Gate `copiloteIa` appliqué par le middleware subscription (cf. route-gates).
 */
export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  try {
    return { data: await dbWatchdog(getFenetres(user.id), 'ia/fenetres', 12_000) };
  } catch {
    await resetDb().catch(() => {});
    try {
      return { data: await dbWatchdog(getFenetres(user.id), 'ia/fenetres (relance)', 12_000) };
    } catch (err) {
      console.error('[ia/fenetres] échec:', err instanceof Error ? err.message : err);
      return { data: [] };
    }
  }
});
