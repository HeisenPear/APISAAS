import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { balances } from '~~/server/database/schema';

const querySchema = z.object({
  rucheId: z.string().uuid().optional(),
  hausseId: z.string().uuid().optional(),
  /** Jour de la récolte (YYYY-MM-DD). */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

interface Extremes {
  avant: number | null;
  avantAt: string | null;
  apres: number | null;
  apresAt: string | null;
}

/**
 * GET /api/balances/chute — quelle masse a quitté la ruche le jour d'une récolte.
 *
 * On compare le dernier poids relevé AVANT le jour J et le premier relevé APRÈS :
 * la différence, c'est ce qu'on a emporté. Sert à pré-remplir la quantité d'une
 * récolte, au lieu de la deviner ou d'attendre la pesée des hausses.
 *
 * Fenêtre de 3 jours de part et d'autre : une balance peut n'émettre qu'une fois
 * par jour, et un capteur peut avoir manqué un envoi.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const q = await getValidatedQuery(event, querySchema.parse);

  if (!q.rucheId && !q.hausseId) {
    throw createError({ statusCode: 400, statusMessage: 'rucheId ou hausseId requis' });
  }

  const [balance] = await db
    .select({ id: balances.id, nom: balances.nom })
    .from(balances)
    .where(
      and(
        eq(balances.userId, ownerId),
        q.rucheId ? eq(balances.rucheId, q.rucheId) : eq(balances.hausseId, q.hausseId!),
      ),
    )
    .limit(1);

  if (!balance) return { data: null };

  const jour = `${q.date}T00:00:00.000Z`;
  const [ext] = (await withDbRetry(
    () =>
      db.execute(sql`
        SELECT
          (SELECT poids_net_kg::float8 FROM mesures_balance
             WHERE balance_id = ${balance.id} AND poids_net_kg IS NOT NULL
               AND mesuree_at < ${jour}::timestamptz
               AND mesuree_at >= ${jour}::timestamptz - interval '3 days'
             ORDER BY mesuree_at DESC LIMIT 1) AS avant,
          (SELECT mesuree_at FROM mesures_balance
             WHERE balance_id = ${balance.id} AND poids_net_kg IS NOT NULL
               AND mesuree_at < ${jour}::timestamptz
               AND mesuree_at >= ${jour}::timestamptz - interval '3 days'
             ORDER BY mesuree_at DESC LIMIT 1) AS "avantAt",
          (SELECT poids_net_kg::float8 FROM mesures_balance
             WHERE balance_id = ${balance.id} AND poids_net_kg IS NOT NULL
               AND mesuree_at >= ${jour}::timestamptz + interval '1 day'
               AND mesuree_at <= ${jour}::timestamptz + interval '4 days'
             ORDER BY mesuree_at ASC LIMIT 1) AS apres,
          (SELECT mesuree_at FROM mesures_balance
             WHERE balance_id = ${balance.id} AND poids_net_kg IS NOT NULL
               AND mesuree_at >= ${jour}::timestamptz + interval '1 day'
               AND mesuree_at <= ${jour}::timestamptz + interval '4 days'
             ORDER BY mesuree_at ASC LIMIT 1) AS "apresAt"
      `),
    'balances:chute',
  )) as unknown as Extremes[];

  const avant = ext?.avant ?? null;
  const apres = ext?.apres ?? null;
  // Une chute NÉGATIVE (la ruche a gagné du poids) n'est pas une récolte : on
  // ne propose rien plutôt que de suggérer une valeur absurde.
  const chuteKg = avant !== null && apres !== null ? Math.round((avant - apres) * 100) / 100 : null;

  return {
    data: {
      balanceId: balance.id,
      balanceNom: balance.nom,
      poidsAvantKg: avant,
      poidsApresKg: apres,
      mesureAvantAt: ext?.avantAt ?? null,
      mesureApresAt: ext?.apresAt ?? null,
      chuteKg: chuteKg !== null && chuteKg > 0 ? chuteKg : null,
    },
  };
});
