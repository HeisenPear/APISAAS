// ═══════════════════════════════════════════════════════════════════════════
// ÉCRITURE DES MESURES — tare, variations, idempotence, cache de la balance.
//
// Toutes les sources (webhook, BEEP, CSV) convergent ici APRÈS le normaliseur.
// Trois garanties :
//  1. IDEMPOTENCE : `onConflictDoNothing` sur (balance_id, mesuree_at) — re-syncer
//     BEEP ou ré-importer deux fois le même CSV ne duplique jamais un point.
//  2. VARIATIONS RECALCULÉES EN SQL, pas en JS : une mesure qui arrive EN RETARD
//     (réseau LoRa capricieux, import d'un historique) doit corriger la variation
//     de la mesure SUIVANTE, ce qu'un simple « delta avec la précédente » calculé
//     à l'insertion ne fait pas.
//  3. Le cache dénormalisé de `balances` reflète toujours le point le plus récent.
// ═══════════════════════════════════════════════════════════════════════════

import { asc, inArray, sql } from 'drizzle-orm';
import { mesuresBalance } from '~~/server/database/schema';
import type { MesureNormalisee } from './normaliser';

export type SourceBalance = 'webhook' | 'beep' | 'csv' | 'manuelle';

/** Le minimum dont l'enregistrement a besoin (évite de trimballer la ligne entière). */
export interface BalanceCible {
  id: string;
  userId: string;
  poidsTare: string | number | null;
}

export interface LigneMesureEnregistree {
  id: string;
  mesureeAt: Date;
  poidsKg: number | null;
  poidsNetKg: number | null;
  variationKg: number | null;
  variation24hKg: number | null;
  batteriePct: number | null;
}

export interface ResultatEnregistrement {
  enregistrees: LigneMesureEnregistree[];
  /** Points déjà présents (même horodatage) — signal d'idempotence, pas une erreur. */
  doublons: number;
  /** La plus récente des mesures effectivement écrites (base de la détection d'alertes). */
  derniere: LigneMesureEnregistree | null;
}

/**
 * Tolérance autour de J-24 h pour trouver le point de référence de la miellée.
 * ±6 h : un capteur qui émet toutes les 4 h trouve toujours un voisin, sans
 * jamais comparer avec un point trop éloigné pour être significatif.
 */
const TOLERANCE_24H_HEURES = 6;

/**
 * Profondeur d'historique rechargée pour recalculer les variations. Sert
 * uniquement à donner un point d'ancrage au LAG : au-delà d'une semaine de
 * silence, un « écart avec la mesure précédente » n'a plus de sens.
 */
const ANCRAGE_JOURS = 7;

// ─── Calculs purs (testables sans base) ─────────────────────────────────────

/** Arrondi à 2 décimales — la précision des colonnes `decimal(_, 2)`. */
export function arrondi2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Une colonne `decimal` de Drizzle revient en STRING : ce helper la remet en nombre. */
export function versNombre(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Une valeur numérique vers le format attendu par une colonne `decimal`. */
export function versDecimal(n: number | null | undefined): string | null {
  return n === null || n === undefined ? null : arrondi2(n).toFixed(2);
}

export interface EntreesDerives {
  poidsKg: number | null;
  /** Tare de la balance (poids du matériel à vide). */
  poidsTare: string | number | null;
  /** Poids brut de la mesure précédente, si connue. */
  poidsPrecedentKg?: number | null;
  /** Poids brut de la mesure la plus proche de J-24 h, si connue. */
  poids24hKg?: number | null;
}

export interface Derives {
  poidsNetKg: number | null;
  variationKg: number | null;
  variation24hKg: number | null;
}

/**
 * Poids net (brut − tare) et variations.
 *
 * Les variations sont calculées sur le poids BRUT : la tare étant constante,
 * l'écart est identique sur le net, et le brut reste défini même quand aucune
 * tare n'est renseignée.
 */
export function calculerDerives(e: EntreesDerives): Derives {
  const tare = versNombre(e.poidsTare) ?? 0;
  const poids = e.poidsKg;
  return {
    poidsNetKg: poids === null ? null : arrondi2(poids - tare),
    variationKg:
      poids === null || e.poidsPrecedentKg === null || e.poidsPrecedentKg === undefined
        ? null
        : arrondi2(poids - e.poidsPrecedentKg),
    variation24hKg:
      poids === null || e.poids24hKg === null || e.poids24hKg === undefined
        ? null
        : arrondi2(poids - e.poids24hKg),
  };
}

// ─── Écriture ───────────────────────────────────────────────────────────────

/**
 * Recalcule `variation_kg` et `variation_24h_kg` de toutes les mesures d'une
 * balance à partir de `depuis`. Fait en SQL (fenêtre LAG + plus proche voisin
 * de J-24 h) pour rester correct quand des points arrivent dans le désordre.
 */
async function recalculerVariations(balanceId: string, depuis: Date): Promise<void> {
  await withDbRetry(
    () =>
      db.execute(sql`
        WITH serie AS (
          SELECT id,
                 mesuree_at,
                 poids_kg - LAG(poids_kg) OVER (ORDER BY mesuree_at) AS delta
          FROM mesures_balance
          WHERE balance_id = ${balanceId}
            AND poids_kg IS NOT NULL
            AND mesuree_at >= ${depuis}::timestamptz - make_interval(days => ${ANCRAGE_JOURS})
        )
        UPDATE mesures_balance m
        SET variation_kg = round(s.delta, 2)
        FROM serie s
        WHERE m.id = s.id AND s.delta IS NOT NULL AND m.mesuree_at >= ${depuis}
      `),
    'balances:variations',
  );

  await withDbRetry(
    () =>
      db.execute(sql`
        WITH cible AS (
          SELECT m.id,
                 m.poids_kg,
                 (
                   SELECT p.poids_kg
                   FROM mesures_balance p
                   WHERE p.balance_id = m.balance_id
                     AND p.poids_kg IS NOT NULL
                     AND p.mesuree_at BETWEEN
                         m.mesuree_at - make_interval(hours => ${24 + TOLERANCE_24H_HEURES})
                     AND m.mesuree_at - make_interval(hours => ${24 - TOLERANCE_24H_HEURES})
                   ORDER BY abs(extract(epoch FROM (p.mesuree_at - (m.mesuree_at - interval '24 hours'))))
                   LIMIT 1
                 ) AS ref
          FROM mesures_balance m
          WHERE m.balance_id = ${balanceId}
            AND m.mesuree_at >= ${depuis}
            AND m.poids_kg IS NOT NULL
        )
        UPDATE mesures_balance m
        SET variation_24h_kg = round(c.poids_kg - c.ref, 2)
        FROM cible c
        WHERE m.id = c.id AND c.ref IS NOT NULL
      `),
    'balances:variations24h',
  );
}

/** Remet à jour le cache dénormalisé (`derniere_mesure_at`, `dernier_poids_kg`, `batterie_pct`). */
export async function rafraichirCacheBalance(balanceId: string): Promise<void> {
  await withDbRetry(
    () =>
      db.execute(sql`
        UPDATE balances b
        SET derniere_mesure_at = d.mesuree_at,
            dernier_poids_kg  = d.poids_kg,
            batterie_pct      = COALESCE(d.batterie_pct, b.batterie_pct),
            updated_at        = now()
        FROM (
          SELECT mesuree_at, poids_kg, batterie_pct
          FROM mesures_balance
          WHERE balance_id = ${balanceId}
          ORDER BY mesuree_at DESC
          LIMIT 1
        ) d
        WHERE b.id = ${balanceId}
      `),
    'balances:cache',
  );
}

/**
 * Recalcule `poids_net_kg` de tout l'historique d'une balance après un
 * changement de tare (sinon les anciens points resteraient sur l'ancienne).
 */
export async function recalculerPoidsNet(
  balanceId: string,
  poidsTare: string | number | null,
): Promise<void> {
  const tare = versNombre(poidsTare) ?? 0;
  await withDbRetry(
    () =>
      db.execute(sql`
        UPDATE mesures_balance
        SET poids_net_kg = round(poids_kg - ${tare}, 2)
        WHERE balance_id = ${balanceId} AND poids_kg IS NOT NULL
      `),
    'balances:poidsNet',
  );
}

/**
 * Écrit un LOT de mesures normalisées sur UNE balance.
 * L'appelant garantit que `balance` appartient bien à l'espace de l'utilisateur :
 * `userId`/`balanceId` sont pris sur la balance résolue, jamais sur le payload.
 */
export async function enregistrerMesures(
  balance: BalanceCible,
  mesures: MesureNormalisee[],
  source: SourceBalance,
): Promise<ResultatEnregistrement> {
  if (mesures.length === 0) return { enregistrees: [], doublons: 0, derniere: null };

  // Dédoublonnage INTRA-lot (le conflit SQL ne protège que de l'inter-lot :
  // deux lignes de même horodatage dans un même INSERT feraient échouer la
  // commande entière — « ON CONFLICT DO NOTHING » ne dédoublonne pas la source).
  const parHorodatage = new Map<number, MesureNormalisee>();
  for (const m of mesures) parHorodatage.set(m.mesureeAt.getTime(), m);
  const uniques = [...parHorodatage.values()].sort(
    (a, b) => a.mesureeAt.getTime() - b.mesureeAt.getTime(),
  );

  const tare = versNombre(balance.poidsTare) ?? 0;
  const lignes = uniques.map((m) => ({
    userId: balance.userId,
    balanceId: balance.id,
    mesureeAt: m.mesureeAt,
    poidsKg: versDecimal(m.poidsKg),
    poidsNetKg: m.poidsKg === null ? null : versDecimal(m.poidsKg - tare),
    temperatureC: versDecimal(m.temperatureC),
    temperatureIntC: versDecimal(m.temperatureIntC),
    humidite: versDecimal(m.humidite),
    humiditeIntPct: versDecimal(m.humiditeIntPct),
    sonDb: versDecimal(m.sonDb),
    frequenceHz: versDecimal(m.frequenceHz),
    batteriePct: m.batteriePct,
    tensionV: versDecimal(m.tensionV),
    signalDbm: versDecimal(m.signalDbm),
    pluieMm: versDecimal(m.pluieMm),
    ventKmh: versDecimal(m.ventKmh),
    pressionHpa: versDecimal(m.pressionHpa),
    source,
    raw: m.raw,
  }));

  const inserees = await withDbRetry(
    () =>
      db
        .insert(mesuresBalance)
        .values(lignes)
        .onConflictDoNothing({ target: [mesuresBalance.balanceId, mesuresBalance.mesureeAt] })
        .returning({ id: mesuresBalance.id, mesureeAt: mesuresBalance.mesureeAt }),
    'balances:insert',
    15_000,
  );

  const doublons = lignes.length - inserees.length;
  if (inserees.length === 0) return { enregistrees: [], doublons, derniere: null };

  const depuis = new Date(Math.min(...inserees.map((r) => r.mesureeAt.getTime())));
  await recalculerVariations(balance.id, depuis);
  await rafraichirCacheBalance(balance.id);

  const rows = await withDbRetry(
    () =>
      db
        .select({
          id: mesuresBalance.id,
          mesureeAt: mesuresBalance.mesureeAt,
          poidsKg: mesuresBalance.poidsKg,
          poidsNetKg: mesuresBalance.poidsNetKg,
          variationKg: mesuresBalance.variationKg,
          variation24hKg: mesuresBalance.variation24hKg,
          batteriePct: mesuresBalance.batteriePct,
        })
        .from(mesuresBalance)
        .where(
          inArray(
            mesuresBalance.id,
            inserees.map((r) => r.id),
          ),
        )
        .orderBy(asc(mesuresBalance.mesureeAt)),
    'balances:relecture',
  );

  const enregistrees: LigneMesureEnregistree[] = rows.map((r) => ({
    id: r.id,
    mesureeAt: r.mesureeAt,
    poidsKg: versNombre(r.poidsKg),
    poidsNetKg: versNombre(r.poidsNetKg),
    variationKg: versNombre(r.variationKg),
    variation24hKg: versNombre(r.variation24hKg),
    batteriePct: r.batteriePct,
  }));

  return {
    enregistrees,
    doublons,
    derniere: enregistrees.length > 0 ? enregistrees[enregistrees.length - 1]! : null,
  };
}

/** Raccourci mono-mesure. */
export async function enregistrerMesure(
  balance: BalanceCible,
  mesure: MesureNormalisee,
  source: SourceBalance,
): Promise<ResultatEnregistrement> {
  return enregistrerMesures(balance, [mesure], source);
}
