import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { isAdminEmail } from '~~/app/config/admin';
import { hasFeature, type Plan } from '~~/app/config/plans';
import { chargerBalance } from '~~/server/utils/balances/acces';
import { MAX_POINTS, resoudreFenetre } from '~~/server/utils/balances/periodes';

const querySchema = z.object({ periode: z.enum(['24h', '7j', '30j', 'saison']).default('7j') });

interface PointCourbe {
  t: string;
  poidsKg: number | null;
  poidsNetKg: number | null;
  variation24hKg: number | null;
  poidsMinKg: number | null;
  poidsMaxKg: number | null;
  temperatureC: number | null;
  humidite: number | null;
  batteriePct: number | null;
}

/**
 * GET /api/balances/:id/mesures?periode=24h|7j|30j|saison — série pour les courbes.
 * L'agrégation est faite EN SQL (bucket temporel + moyenne) : ~35 000 points/an
 * pour une balance à 15 min, on n'en renvoie jamais plus de MAX_POINTS.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);

  const balance = await chargerBalance(ownerId, id);
  if (!balance) return notFound('Balance introuvable');
  const { periode } = await getValidatedQuery(event, querySchema.parse);

  // Un plan qui a perdu la feature (rétrogradation) n'a plus de fenêtre
  // d'historique — mais AUCUNE mesure n'est supprimée : repasser en Pro rouvre
  // instantanément tout le passé.
  const plan: Plan = isAdminEmail(user.email) ? 'expert' : await planDuProprietaire(ownerId);
  const effectif: Plan = hasFeature(plan, 'balancesConnectees') ? plan : 'decouverte';
  const f = resoudreFenetre(periode, effectif);

  const points = (await withDbRetry(
    () =>
      db.execute(sql`
        SELECT to_char(
                 to_timestamp(floor(extract(epoch FROM mesuree_at) / ${f.bucketSecondes}) * ${f.bucketSecondes})
                   AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS t,
               round(avg(poids_kg), 2)::float8         AS "poidsKg",
               round(avg(poids_net_kg), 2)::float8     AS "poidsNetKg",
               round(avg(variation_24h_kg), 2)::float8 AS "variation24hKg",
               round(min(poids_kg), 2)::float8         AS "poidsMinKg",
               round(max(poids_kg), 2)::float8         AS "poidsMaxKg",
               round(avg(temperature_c), 2)::float8    AS "temperatureC",
               round(avg(humidite), 2)::float8         AS "humidite",
               round(avg(batterie_pct), 0)::int        AS "batteriePct"
        FROM mesures_balance
        WHERE balance_id = ${id} AND user_id = ${ownerId}
          AND mesuree_at >= ${f.depuis.toISOString()} AND mesuree_at <= ${f.jusqua.toISOString()}
        GROUP BY 1
        ORDER BY 1
        LIMIT ${MAX_POINTS}
      `),
    'balances:courbe',
    12_000,
  )) as unknown as PointCourbe[];

  const avecPoids = points.filter((p) => p.poidsNetKg !== null);
  const debut = avecPoids[0]?.poidsNetKg ?? null;
  const fin = avecPoids[avecPoids.length - 1]?.poidsNetKg ?? null;

  return {
    data: {
      periode,
      depuis: f.depuis.toISOString(),
      jusqua: f.jusqua.toISOString(),
      bucketSecondes: f.bucketSecondes,
      tronquee: f.tronquee,
      joursMaxPlan: Number.isFinite(f.joursMaxPlan) ? f.joursMaxPlan : null,
      points,
      resume: {
        poidsDebutKg: debut,
        poidsFinKg: fin,
        gainKg: debut !== null && fin !== null ? Math.round((fin - debut) * 100) / 100 : null,
      },
    },
  };
});
