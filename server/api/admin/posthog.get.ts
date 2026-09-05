/**
 * Données PostHog pour l'admin — conversion landing & pages les plus vues.
 *
 * Interroge l'API HogQL de PostHog avec la clé API PERSONNELLE (phx_…) côté
 * serveur. Sans clé configurée (NUXT_POSTHOG_PERSONAL_API_KEY + _PROJECT_ID),
 * renvoie `{ configured: false }` → l'UI affiche un état « à connecter ».
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const config = useRuntimeConfig();
  const key = config.posthogPersonalApiKey;
  const projectId = config.posthogProjectId;
  const host = config.public.posthogHost || 'https://eu.posthog.com';

  if (!key || !projectId) return { data: { configured: false } };

  async function hogql(query: string): Promise<unknown[][]> {
    const res = await $fetch<{ results: unknown[][] }, string>(
      `${host}/api/projects/${projectId}/query/`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}` },
        body: { query: { kind: 'HogQLQuery', query } },
      },
    );
    return res.results ?? [];
  }

  try {
    const [funnelRows, pagesRows] = await Promise.all([
      hogql(`
        SELECT
          (SELECT count(DISTINCT person_id) FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 30 DAY) AS visiteurs,
          (SELECT count() FROM events WHERE event = 'signup_completed' AND timestamp > now() - INTERVAL 30 DAY) AS inscriptions,
          (SELECT count() FROM events WHERE event = 'trial_started' AND timestamp > now() - INTERVAL 30 DAY) AS trials
      `),
      hogql(`
        SELECT properties.$current_url AS url, count() AS vues
        FROM events
        WHERE event = '$pageview' AND timestamp > now() - INTERVAL 30 DAY
        GROUP BY url ORDER BY vues DESC LIMIT 15
      `),
    ]);

    const f = (funnelRows[0] ?? []) as unknown[];
    const visiteurs = Number(f[0] ?? 0);
    const inscriptions = Number(f[1] ?? 0);
    const trials = Number(f[2] ?? 0);

    return {
      data: {
        configured: true,
        funnel: {
          visiteurs,
          inscriptions,
          trials,
          tauxInscription: visiteurs ? Math.round((inscriptions / visiteurs) * 1000) / 10 : 0,
          tauxTrial: inscriptions ? Math.round((trials / inscriptions) * 1000) / 10 : 0,
        },
        topPages: (pagesRows as [string, number][]).map(([url, vues]) => ({
          url: url || '—',
          vues: Number(vues),
        })),
      },
    };
  } catch (err) {
    console.error('[admin/posthog] query failed', err);
    return {
      data: { configured: true, error: 'Requête PostHog échouée — vérifiez la clé/le projet.' },
    };
  }
});
