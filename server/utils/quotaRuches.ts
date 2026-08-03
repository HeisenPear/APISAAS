import { and, asc, eq, sql } from 'drizzle-orm';
import { createError } from 'h3';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '~~/server/database/schema';
import { ruches } from '~~/server/database/schema';
import { getLimit, getPlanConfig, minimumPlanForLimit, type Plan } from '~~/app/config/plans';
import type { DrizzleTransaction } from '~~/server/types/interventions';

/**
 * Statuts qui ne consomment PAS de quota. DOIT rester identique au compteur
 * `countUserResource('ruches')` du middleware 04.subscription : deux listes qui
 * divergent, c'est un plafond qui compte différemment selon la porte d'entrée.
 */
const STATUTS_HORS_QUOTA = ['morte', 'vendue', 'fusionnee'] as const;

export function consommeDuQuota(statut: string): boolean {
  return !(STATUTS_HORS_QUOTA as readonly string[]).includes(statut);
}

type Executor = PostgresJsDatabase<typeof schema> | DrizzleTransaction;

/**
 * Refuse la création de `aCreer` ruches si elle ferait dépasser le plafond du plan.
 *
 * Le middleware `04.subscription` ne sait faire que `current >= max` : il ignore
 * combien de ruches la requête va créer. Sur un compte Découverte neuf (0 ruche,
 * plafond 1), `0 >= 1` est faux — il laisse donc passer une requête qui en crée
 * 80. Toute route ou handler qui insère PLUSIEURS ruches doit appeler ceci.
 *
 * Passer la transaction en `executor` quand la création est transactionnelle :
 * le comptage voit alors les ruches déjà insérées dans la même transaction, donc
 * N dispatchs successifs (bulk-group) se cumulent correctement.
 *
 * Les comptes admin doivent être neutralisés par l'appelant en passant
 * `plan = 'expert'` (cf. `planEffectif`), comme le fait `visite-rucher.post.ts`.
 */
/**
 * Les ruches que le plan autorise à GÉRER : les `getLimit(plan,'ruches')`
 * PREMIÈRES créées. Renvoie `null` quand le plan est illimité (aucune
 * restriction à appliquer, et aucune requête n'est émise).
 *
 * Au-delà, les ruches existent toujours en base — elles sont seulement
 * inaccessibles. Un abonnement les rend toutes à nouveau gérables, à l'endroit
 * exact où l'apiculteur s'était arrêté : RIEN n'est supprimé ni modifié.
 *
 * ⚠️ L'ordre de départage n'est PAS cosmétique. Une création en lot insère N
 * ruches à la MÊME microseconde : les 80 ruches du compte constaté en prod
 * partagent un `created_at` identique. Trier sur la seule date laisserait
 * l'ordre indéterminé — la ruche débloquée changerait d'une requête à l'autre.
 *
 * Départager par `id` (UUID) serait stable mais absurde pour l'apiculteur : sur
 * les comptes réels, ça conservait « Ruche 7 », « Ruche 24 », « Ruche 12 ».
 * On départage donc par la VALEUR NUMÉRIQUE du numéro, ce qui rend « Ruche 1 »
 * sur les trois — la « première » au sens où un humain l'entend. Les numéros
 * sans chiffre passent en dernier, puis `numero` et `id` closent le tri pour
 * garantir un ordre total, donc stable.
 */
export async function idsRuchesAutorisees(
  executor: Executor,
  ownerId: string,
  plan: Plan,
): Promise<Set<string> | null> {
  const max = getLimit(plan, 'ruches');
  if (max === Infinity) return null;

  const rows = await executor
    .select({ id: ruches.id })
    .from(ruches)
    .where(eq(ruches.userId, ownerId))
    .orderBy(
      asc(ruches.createdAt),
      // `[^0-9]` et NON `\D` : dans un littéral gabarit JS, `\D` est cuit en
      // `D`, ce qui produirait `regexp_replace(numero,'D',…)` — le cast
      // ::bigint lèverait alors une erreur à l'exécution. La classe POSIX
      // n'a aucun antislash, donc aucun piège d'échappement.
      sql`NULLIF(regexp_replace(${ruches.numero}, '[^0-9]', '', 'g'), '')::bigint ASC NULLS LAST`,
      asc(ruches.numero),
      asc(ruches.id),
    )
    .limit(max);

  return new Set(rows.map((r) => r.id));
}

export async function assertQuotaRuches(
  executor: Executor,
  ownerId: string,
  plan: Plan,
  aCreer: number,
): Promise<void> {
  const max = getLimit(plan, 'ruches');
  if (max === Infinity || aCreer <= 0) return;

  const rows = await executor
    .select({ count: sql<number>`count(*)::int` })
    .from(ruches)
    .where(
      and(
        eq(ruches.userId, ownerId),
        sql`${ruches.statut} NOT IN ('morte', 'vendue', 'fusionnee')`,
      ),
    );

  const current = rows[0]?.count ?? 0;
  if (current + aCreer <= max) return;

  throw createError({
    statusCode: 402,
    statusMessage: 'Limite du plan atteinte',
    data: {
      code: 'LIMIT_REACHED',
      limit: 'ruches',
      current,
      max,
      currentPlan: plan,
      requiredPlan: minimumPlanForLimit('ruches', current + aCreer),
      message: `Cette création (${aCreer}) dépasserait la limite de ${max} ruches du plan ${getPlanConfig(plan).label} (vous en avez déjà ${current}). Passez à un plan supérieur pour gérer de grosses exploitations.`,
    },
  });
}
