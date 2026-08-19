import { sql } from 'drizzle-orm';
import type { alertes } from '~~/server/database/schema';
import type { ContexteResolution } from '~~/server/utils/moteurAlertes/types';

// ═══════════════════════════════════════════════════════════════════════════
// ALERTES AVANCÉES — règles à forte valeur, ancrées dans des données réelles.
//   • varroa_seuil       (groupée) — dépassement du seuil d'infestation
//   • maladie_observee   (groupée) — maladie notée au dernier contrôle
//   • maladie_loque      (par ruche, CRITIQUE) — loque suspectée (déclaration)
//   • colonie_orpheline  (groupée) — reine non vue + couvain absent
//   • mortalite_anormale (groupée) — pertes récentes significatives
//   • pesee_chute        (groupée) — chute de poids brutale (pillage/essaimage)
//   • commande_a_cloturer (par campagne) — campagne dont la date de clôture est passée
//
// Toutes GROUPÉES (1 alerte pour N ruches) sauf loque (rare, par ruche) et
// commande (par campagne). Aucune migration. Patron : détecter → 1 alerte ;
// auto-résolution dès que la condition retombe (même détecteur réutilisé).
// ═══════════════════════════════════════════════════════════════════════════

type AlerteInsert = typeof alertes.$inferInsert;
type DejaExiste = (type: string, referenceId?: string) => boolean;

export const TYPES_AVANCES = [
  'varroa_seuil',
  'maladie_observee',
  'maladie_loque',
  'colonie_orpheline',
  'mortalite_anormale',
  'pesee_chute',
  'commande_a_cloturer',
];

// ── Détecteurs (partagés entre génération et auto-résolution) ───────────────

/** Ruches actives dont le dernier comptage (<30 j) dépasse le seuil, non traitées depuis. */
async function detecterVarroa(userId: string, maintenant: Date): Promise<number> {
  const res = (await db.execute(sql`
    WITH dernier AS (
      SELECT DISTINCT ON (cv.ruche_id)
        cv.ruche_id, cv.type_comptage, cv.chute_par_jour, cv.taux_vph, cv.created_at
      FROM comptages_varroa cv
      WHERE cv.user_id = ${userId}
        AND cv.created_at >= ${maintenant.toISOString()}::timestamptz - interval '30 days'
      ORDER BY cv.ruche_id, cv.created_at DESC
    )
    SELECT count(*)::int AS n
    FROM dernier d
    JOIN ruches r ON r.id = d.ruche_id AND r.statut = 'active'
    WHERE (
            (d.type_comptage = 'plancher' AND d.chute_par_jour IS NOT NULL AND d.chute_par_jour >= 50)
         OR (d.type_comptage = 'vph'      AND d.taux_vph      IS NOT NULL AND d.taux_vph      >= 3)
          )
      AND NOT EXISTS (
        SELECT 1 FROM traitements_varroa tv
        WHERE tv.ruche_id = d.ruche_id AND tv.date_debut >= d.created_at
      )
  `)) as unknown as Array<{ n: number }>;
  return res[0]?.n ?? 0;
}

/** Ruches actives dont le dernier contrôle (<30 j) montre reine non vue + couvain absent. */
async function detecterOrphelines(userId: string, maintenant: Date): Promise<number> {
  const res = (await db.execute(sql`
    SELECT count(*)::int AS n FROM ruches r
    LEFT JOIN LATERAL (
      SELECT i.reine_vue, i.couvain, i.couvain_present, i.date_visite
      FROM interventions i
      WHERE i.ruche_id = r.id AND i.type = 'controle'
      ORDER BY i.date_visite DESC LIMIT 1
    ) li ON true
    WHERE r.user_id = ${userId} AND r.statut = 'active'
      AND li.date_visite >= ${maintenant.toISOString()}::timestamptz - interval '30 days'
      AND li.reine_vue IS FALSE
      AND (li.couvain_present IS FALSE OR (li.couvain IS NOT NULL AND li.couvain <= 1))
  `)) as unknown as Array<{ n: number }>;
  return res[0]?.n ?? 0;
}

/** Total des colonies perdues récemment (14 j) — 0 si sous le seuil « anormal » (≥ 3). */
async function detecterMortalite(userId: string, maintenant: Date): Promise<number> {
  const res = (await db.execute(sql`
    SELECT COALESCE(sum(nombre_colonies), 0)::int AS n
    FROM mortalites
    WHERE user_id = ${userId}
      AND date_constatee >= ${maintenant.toISOString()}::timestamptz - interval '14 days'
  `)) as unknown as Array<{ n: number }>;
  const total = res[0]?.n ?? 0;
  return total >= 3 ? total : 0;
}

/** Ruches actives ayant perdu ≥ 3 kg entre deux pesées totales rapprochées (≤ 21 j). */
async function detecterPeseeChute(userId: string, maintenant: Date): Promise<number> {
  const res = (await db.execute(sql`
    WITH p AS (
      SELECT ruche_id, poids_kg::numeric AS poids, created_at,
        LAG(poids_kg::numeric) OVER (PARTITION BY ruche_id ORDER BY created_at) AS poids_prec,
        LAG(created_at)        OVER (PARTITION BY ruche_id ORDER BY created_at) AS dt_prec
      FROM pesees
      WHERE user_id = ${userId} AND type_pesee = 'totale'
    )
    SELECT count(DISTINCT p.ruche_id)::int AS n
    FROM p
    JOIN ruches r ON r.id = p.ruche_id AND r.statut = 'active'
    WHERE p.poids_prec IS NOT NULL
      AND p.created_at >= ${maintenant.toISOString()}::timestamptz - interval '7 days'
      AND p.dt_prec   >= ${maintenant.toISOString()}::timestamptz - interval '21 days'
      AND (p.poids_prec - p.poids) >= 3
  `)) as unknown as Array<{ n: number }>;
  return res[0]?.n ?? 0;
}

/** Maladies au dernier contrôle (<30 j) — loque isolée des autres. */
async function detecterMaladies(
  userId: string,
  maintenant: Date,
): Promise<{
  loque: Array<{ id: string; numero: string }>;
  autres: Array<{ id: string; numero: string }>;
}> {
  const rows = (await db.execute(sql`
    SELECT r.id, r.numero,
      COALESCE(NULLIF(trim(li.maladie_observee), ''), li.donnees->>'maladie_observee') AS maladie
    FROM ruches r
    LEFT JOIN LATERAL (
      SELECT i.maladie_observee, i.donnees, i.date_visite
      FROM interventions i
      WHERE i.ruche_id = r.id AND i.type = 'controle'
      ORDER BY i.date_visite DESC LIMIT 1
    ) li ON true
    WHERE r.user_id = ${userId} AND r.statut = 'active'
      AND li.date_visite >= ${maintenant.toISOString()}::timestamptz - interval '30 days'
      AND COALESCE(NULLIF(trim(li.maladie_observee), ''), li.donnees->>'maladie_observee') IS NOT NULL
  `)) as unknown as Array<{ id: string; numero: string; maladie: string }>;

  const loque: Array<{ id: string; numero: string }> = [];
  const autres: Array<{ id: string; numero: string }> = [];
  for (const r of rows) {
    if ((r.maladie ?? '').toLowerCase().includes('loque'))
      loque.push({ id: r.id, numero: r.numero });
    else autres.push({ id: r.id, numero: r.numero });
  }
  return { loque, autres };
}

/** Campagnes de commande encore « ouverte » alors que la date de clôture est passée. */
async function detecterCommandes(
  userId: string,
  maintenant: Date,
): Promise<Array<{ id: string; nom: string }>> {
  return (await db.execute(sql`
    SELECT cc.id, cc.nom
    FROM campagnes_commande cc
    JOIN organisations o ON o.id = cc.organisation_id
    WHERE o.owner_id = ${userId}
      AND cc.statut = 'ouverte'
      AND cc.date_fermeture < ${maintenant.toISOString()}::timestamptz
  `)) as unknown as Array<{ id: string; nom: string }>;
}

// ── Construction ────────────────────────────────────────────────────────────

function liste(numeros: string[], max = 5): string {
  const tete = numeros.slice(0, max).join(', ');
  const reste = numeros.length - max;
  return reste > 0 ? `${tete} +${reste} autres` : tete;
}

export async function construireAlertesAvancees(
  userId: string,
  dejaExiste: DejaExiste,
  maintenant: Date,
): Promise<AlerteInsert[]> {
  const out: AlerteInsert[] = [];

  // Varroa
  if (!dejaExiste('varroa_seuil')) {
    const n = await detecterVarroa(userId, maintenant);
    if (n > 0) {
      out.push({
        userId,
        type: 'varroa_seuil',
        titre: `${n} ruche${n > 1 ? 's' : ''} au-dessus du seuil varroa 🪲`,
        message: `${n} de tes colonies dépassent le seuil d'infestation (≥ 50 chutes/j au plancher ou ≥ 3 % au comptage VPH) et n'ont pas encore été traitées. À cette charge, le risque d'effondrement hivernal grimpe vite — programme un traitement sans attendre.`,
        priorite: 'haute',
        referenceType: 'cheptel',
        actionUrl: '/ruches',
        lue: false,
      });
    }
  }

  // Colonies orphelines
  if (!dejaExiste('colonie_orpheline')) {
    const n = await detecterOrphelines(userId, maintenant);
    if (n > 0) {
      out.push({
        userId,
        type: 'colonie_orpheline',
        titre: `${n} colonie${n > 1 ? 's' : ''} peut-être orpheline${n > 1 ? 's' : ''}`,
        message: `Au dernier contrôle, ${n > 1 ? 'ces colonies n’avaient' : 'cette colonie n’avait'} ni reine vue ni couvain. Sans ponte, ${n > 1 ? 'elles s’éteindront' : 'elle s’éteindra'} : vérifie et réintroduis une reine ou réunis avec une colonne forte.`,
        priorite: 'haute',
        referenceType: 'cheptel',
        actionUrl: '/ruches',
        lue: false,
      });
    }
  }

  // Mortalité anormale
  if (!dejaExiste('mortalite_anormale')) {
    const n = await detecterMortalite(userId, maintenant);
    if (n > 0) {
      out.push({
        userId,
        type: 'mortalite_anormale',
        titre: `Mortalité anormale — ${n} colonies perdues`,
        message: `Tu as enregistré ${n} pertes de colonies sur les 14 derniers jours. Pense à documenter les causes, à prélever pour analyse si besoin, et à déclarer (GDS / assurance) le cas échéant.`,
        priorite: 'haute',
        referenceType: 'mortalite',
        actionUrl: '/conformite/mortalites',
        lue: false,
      });
    }
  }

  // Pesée en chute
  if (!dejaExiste('pesee_chute')) {
    const n = await detecterPeseeChute(userId, maintenant);
    if (n > 0) {
      out.push({
        userId,
        type: 'pesee_chute',
        titre: `${n} ruche${n > 1 ? 's' : ''} en chute de poids`,
        message: `Une perte de poids brutale (≥ 3 kg) a été détectée sur ${n} ruche${n > 1 ? 's' : ''}. Ça peut signaler un pillage, un essaimage, une disette ou un vol — va vérifier rapidement.`,
        priorite: 'haute',
        referenceType: 'cheptel',
        actionUrl: '/ruches',
        lue: false,
      });
    }
  }

  // Maladies
  const { loque, autres } = await detecterMaladies(userId, maintenant);
  for (const r of loque) {
    if (dejaExiste('maladie_loque', r.id)) continue;
    out.push({
      userId,
      type: 'maladie_loque',
      titre: `Loque suspectée — Ruche ${r.numero}`,
      message: `Une loque (maladie à déclaration obligatoire) est notée sur la ruche ${r.numero}. Isole la colonie, évite tout transfert de cadres et contacte ton GDS / la DDPP sans tarder.`,
      priorite: 'critique',
      referenceType: 'ruche',
      referenceId: r.id,
      actionUrl: `/ruches/${r.id}`,
      lue: false,
    });
  }
  if (autres.length > 0 && !dejaExiste('maladie_observee')) {
    out.push({
      userId,
      type: 'maladie_observee',
      titre: `${autres.length} ruche${autres.length > 1 ? 's' : ''} avec une maladie observée`,
      message: `Une maladie a été notée au dernier contrôle sur : ${liste(autres.map((r) => r.numero))}. Surveille leur évolution et planifie un traitement adapté.`,
      priorite: 'haute',
      referenceType: 'cheptel',
      actionUrl: '/ruches',
      lue: false,
    });
  }

  // Commandes groupées à clôturer
  const commandes = await detecterCommandes(userId, maintenant);
  for (const c of commandes) {
    if (dejaExiste('commande_a_cloturer', c.id)) continue;
    out.push({
      userId,
      type: 'commande_a_cloturer',
      titre: `Commande « ${c.nom} » à clôturer`,
      message: `La date de clôture de la campagne « ${c.nom} » est passée mais elle est toujours ouverte. Clôture-la pour lancer le traitement des commandes du groupe.`,
      priorite: 'moyenne',
      referenceType: 'campagne',
      referenceId: c.id,
      actionUrl: '/association/campagnes',
      lue: false,
    });
  }

  return out;
}

// ── Résolution ───────────────────────────────────────────────────────────────

/**
 * Alertes avancées dont la condition est retombée. Rend les ids, n'écrit rien —
 * l'orchestrateur regroupe toutes les résolutions en une seule mise à jour.
 *
 * Les mêmes détecteurs servent à créer ET à résoudre : impossible qu'ils
 * divergent.
 */
export async function resolutionsAvancees(ctx: ContexteResolution): Promise<string[]> {
  const { userId, maintenant, existantes } = ctx;
  const actives = existantes.filter((a) => TYPES_AVANCES.includes(a.type));
  if (actives.length === 0) return [];

  const out: string[] = [];

  // Types groupés : résolus dès que le détecteur ne renvoie plus rien.
  const groupes: Array<[string, () => Promise<number>]> = [
    ['varroa_seuil', () => detecterVarroa(userId, maintenant)],
    ['colonie_orpheline', () => detecterOrphelines(userId, maintenant)],
    ['mortalite_anormale', () => detecterMortalite(userId, maintenant)],
    ['pesee_chute', () => detecterPeseeChute(userId, maintenant)],
  ];
  for (const [type, detecter] of groupes) {
    const duType = actives.filter((a) => a.type === type);
    if (duType.length > 0 && (await detecter()) === 0) out.push(...duType.map((a) => a.id));
  }

  // Maladies : loque par ruche, autres en groupe.
  if (actives.some((a) => a.type === 'maladie_observee' || a.type === 'maladie_loque')) {
    const { loque, autres } = await detecterMaladies(userId, maintenant);
    if (autres.length === 0) {
      out.push(...actives.filter((a) => a.type === 'maladie_observee').map((a) => a.id));
    }
    const loqueIds = new Set(loque.map((r) => r.id));
    out.push(
      ...actives
        .filter((a) => a.type === 'maladie_loque' && !loqueIds.has(a.referenceId ?? ''))
        .map((a) => a.id),
    );
  }

  // Commandes : résolues si la campagne n'est plus ouverte/échue.
  const cmd = actives.filter((a) => a.type === 'commande_a_cloturer');
  if (cmd.length > 0) {
    const ouvertes = new Set((await detecterCommandes(userId, maintenant)).map((c) => c.id));
    out.push(...cmd.filter((a) => !ouvertes.has(a.referenceId ?? '')).map((a) => a.id));
  }

  return out;
}
