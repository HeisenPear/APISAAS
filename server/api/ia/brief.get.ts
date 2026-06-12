import { briefDuJour } from '~~/server/utils/maya-brief';

/**
 * « Brief du jour » de Maya — synthèse proactive pour la carte du dashboard.
 * Gate `copiloteIa` appliqué par le middleware subscription (cf. route-gates).
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const q = getQuery(event).contexte;
  const contexte = q === 'ruches' || q === 'meteo' ? q : undefined;
  try {
    const brief = await briefDuJour(user.id, contexte);
    return { data: brief };
  } catch (err) {
    console.error('[ia/brief] échec:', err instanceof Error ? err.message : err);
    return { data: { salutation: 'Bonjour 🐝', intro: '', items: [] } };
  }
});
