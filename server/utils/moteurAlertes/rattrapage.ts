import { and, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import { alertes } from '~~/server/database/schema';
import {
  planifierPushDetaille,
  type PushItem,
  type PushPayload,
} from '~~/server/utils/alertesPush';
import type { PreferencesNotif } from './index';

// ═══════════════════════════════════════════════════════════════════════════
// RATTRAPAGE DES NOTIFICATIONS REPORTÉES.
//
// `planifierPush` diffère les priorités basse et moyenne pendant les heures
// calmes (21 h-8 h Paris) et juste après une rafale. « Différer » n'a de sens
// que s'il existe un run ultérieur qui repousse — or l'anti-doublon empêche de
// recréer une alerte encore active, et aucun run ne repoussait une alerte
// existante. Le report était donc une PERTE SÈCHE.
//
// Ce balayage tourne au cron du matin (donc hors heures calmes) et repêche les
// alertes actives dont le sort push n'a jamais été tranché.
// ═══════════════════════════════════════════════════════════════════════════

/** Au-delà, ce n'est plus un rattrapage : une alerte ratée depuis 3 jours n'a plus rien d'une notification. */
export const RATTRAPAGE_FENETRE_HEURES = 36;
/** Plafond par compte et par run — un rattrapage ne doit jamais devenir un déluge. */
export const RATTRAPAGE_MAX_PAR_COMPTE = 50;

export interface Rattrapage {
  payloads: PushPayload[];
  /** Ids dont le sort est désormais tranché → à horodater après envoi. */
  aHorodater: string[];
}

/**
 * Alertes actives jamais notifiées, à repousser. Bornées dans le temps ET en
 * nombre : deux protections indépendantes contre un repush massif.
 */
export async function rattraperPushDifferes(
  userId: string,
  preferences: PreferencesNotif,
  maintenant: Date,
): Promise<Rattrapage> {
  const depuis = new Date(maintenant.getTime() - RATTRAPAGE_FENETRE_HEURES * 3_600_000);

  const enAttente = await db
    .select({
      id: alertes.id,
      type: alertes.type,
      titre: alertes.titre,
      message: alertes.message,
      actionUrl: alertes.actionUrl,
      priorite: alertes.priorite,
      referenceId: alertes.referenceId,
    })
    .from(alertes)
    .where(
      and(
        eq(alertes.userId, userId),
        isNull(alertes.resolvedAt),
        isNull(alertes.notifieeLe),
        gte(alertes.createdAt, depuis),
      ),
    )
    .orderBy(alertes.createdAt)
    .limit(RATTRAPAGE_MAX_PAR_COMPTE);

  if (enAttente.length === 0) return { payloads: [], aHorodater: [] };

  const items: PushItem[] = enAttente.map((a) => ({
    id: a.id,
    type: a.type,
    titre: a.titre,
    message: a.message,
    actionUrl: a.actionUrl,
    priorite: a.priorite as PushItem['priorite'],
    referenceId: a.referenceId,
  }));

  // Le cron tourne le matin : `dansHeuresCalmes` est faux, donc rien n'est
  // différé une seconde fois. Si le cron venait à tourner de nuit, l'alerte
  // resterait simplement en attente — jamais perdue.
  const plan = planifierPushDetaille(items, preferences.categories, maintenant, preferences.plan);
  return {
    payloads: plan.payloads,
    aHorodater: plan.tranchees.map((a) => a.id).filter((id): id is string => !!id),
  };
}

/** Marque les alertes comme notifiées — APRÈS envoi (cf. index.ts). */
export async function horodaterNotifiees(ids: readonly string[], maintenant: Date): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(alertes)
    .set({ notifieeLe: maintenant, updatedAt: maintenant })
    .where(inArray(alertes.id, [...ids]));
}

/** Nombre d'alertes actives en attente de notification (diagnostic). */
export async function compterEnAttente(userId: string): Promise<number> {
  const [row] = (await db.execute(sql`
    SELECT count(*)::int AS n FROM alertes
    WHERE user_id = ${userId} AND resolved_at IS NULL AND notifiee_le IS NULL
  `)) as unknown as Array<{ n: number }>;
  return row?.n ?? 0;
}
