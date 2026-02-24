import { eq, and, sql, lte } from 'drizzle-orm';
import { stocks, transactions, alertes } from '~~/server/database/schema';
import { computeScore } from '~~/server/utils/santeScore';

const VISITE_DELAI_JOURS = 21;

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const userId = user.id;

  // Récupère les alertes actives existantes pour éviter les doublons
  const existantes = await db
    .select({ type: alertes.type, referenceId: alertes.referenceId })
    .from(alertes)
    .where(and(eq(alertes.userId, userId), eq(alertes.lue, false)));

  const existantesSet = new Set(existantes.map((a) => `${a.type}:${a.referenceId ?? ''}`));

  const nouvelles: (typeof alertes.$inferInsert)[] = [];

  function dejaExiste(type: string, referenceId?: string): boolean {
    return existantesSet.has(`${type}:${referenceId ?? ''}`);
  }

  // ── 1. Ruches non visitées depuis > 21 jours ──────────────────────────────
  const ruchesAvecDerniereVisite = (await db.execute(sql`
    SELECT
      r.id,
      r.numero,
      r.rucher_id,
      li.date_visite
    FROM ruches r
    LEFT JOIN LATERAL (
      SELECT i.date_visite
      FROM inspections i
      WHERE i.ruche_id = r.id
        AND i.type = 'controle'
      ORDER BY i.date_visite DESC
      LIMIT 1
    ) li ON true
    WHERE r.user_id = ${userId}
      AND r.statut = 'active'
  `)) as unknown as Array<{
    id: string;
    numero: string;
    rucher_id: string;
    date_visite: string | null;
  }>;

  const cutoffVisite = new Date();
  cutoffVisite.setDate(cutoffVisite.getDate() - VISITE_DELAI_JOURS);

  for (const r of ruchesAvecDerniereVisite) {
    const derniere = r.date_visite ? new Date(r.date_visite) : null;
    const enRetard = !derniere || derniere < cutoffVisite;
    if (enRetard && !dejaExiste('visite_requise', r.id)) {
      const joursDepuis = derniere
        ? Math.floor((Date.now() - derniere.getTime()) / 86400000)
        : null;
      nouvelles.push({
        userId,
        type: 'visite_requise',
        titre: `Ruche ${r.numero} non visitée`,
        message: joursDepuis
          ? `Dernière visite il y a ${joursDepuis} jours (seuil : ${VISITE_DELAI_JOURS} j)`
          : `Cette ruche n'a jamais été visitée`,
        priorite: joursDepuis && joursDepuis > 45 ? 'haute' : 'moyenne',
        referenceType: 'ruche',
        referenceId: r.id,
        actionUrl: `/ruches/${r.id}`,
        lue: false,
      });
    }
  }

  // ── 2. Score de santé critique (< 40) ─────────────────────────────────────
  const ruchesAvecScore = (await db.execute(sql`
    SELECT
      r.id, r.numero, r.statut, r.qualite_reine,
      li.date_visite, li.force_colonie, li.couvain, li.reserves,
      li.reine_vue, li.varroa, li.comportement, li.signe_essaimage, li.maladie_observee
    FROM ruches r
    LEFT JOIN LATERAL (
      SELECT
        i.date_visite,
        COALESCE((i.donnees->>'force_colonie')::int, i.force_colonie) AS force_colonie,
        CASE WHEN i.donnees->>'reine_vue' IS NOT NULL THEN (i.donnees->>'reine_vue')::bool ELSE i.reine_vue END AS reine_vue,
        CASE WHEN i.donnees->>'couvain_present' IS NOT NULL THEN CASE WHEN (i.donnees->>'couvain_present')::bool THEN 4 ELSE 1 END ELSE i.couvain END AS couvain,
        CASE WHEN i.donnees->>'reserves_presentes' IS NOT NULL THEN CASE WHEN (i.donnees->>'reserves_presentes')::bool THEN 4 ELSE 1 END ELSE i.reserves END AS reserves,
        COALESCE(i.donnees->>'comportement', i.comportement) AS comportement,
        i.varroa, i.signe_essaimage, i.maladie_observee
      FROM inspections i
      WHERE i.ruche_id = r.id
        AND i.type = 'controle'
      ORDER BY i.date_visite DESC
      LIMIT 1
    ) li ON true
    WHERE r.user_id = ${userId} AND r.statut = 'active'
  `)) as unknown as Array<{
    id: string;
    numero: string;
    statut: string;
    qualite_reine: string | null;
    date_visite: string | null;
    force_colonie: number | null;
    couvain: number | null;
    reserves: number | null;
    reine_vue: boolean | null;
    varroa: number | null;
    comportement: string | null;
    signe_essaimage: boolean | null;
    maladie_observee: string | null;
  }>;

  for (const r of ruchesAvecScore) {
    const score = computeScore({
      rucheId: r.id,
      numero: r.numero,
      rucherId: '',
      statut: r.statut,
      qualiteReine: r.qualite_reine,
      dateVisite: r.date_visite,
      forceColonie: r.force_colonie,
      couvain: r.couvain,
      reserves: r.reserves,
      reineVue: r.reine_vue,
      varroa: r.varroa,
      comportement: r.comportement,
      signeEssaimage: r.signe_essaimage,
      maladieObservee: r.maladie_observee,
    });

    if (score < 40 && !dejaExiste('sante_critique', r.id)) {
      nouvelles.push({
        userId,
        type: 'sante_critique',
        titre: `Santé critique — Ruche ${r.numero}`,
        message: `Score de santé : ${score}/100. Une intervention urgente est recommandée.`,
        priorite: score < 20 ? 'critique' : 'haute',
        referenceType: 'ruche',
        referenceId: r.id,
        actionUrl: `/ruches/${r.id}`,
        lue: false,
      });
    }
  }

  // ── 3. Stocks sous le seuil d'alerte ──────────────────────────────────────
  const stocksBas = await db
    .select()
    .from(stocks)
    .where(
      and(
        eq(stocks.userId, userId),
        sql`${stocks.seuilAlerte} IS NOT NULL AND ${stocks.quantite}::numeric <= ${stocks.seuilAlerte}::numeric`,
      ),
    );

  for (const s of stocksBas) {
    if (!dejaExiste('stock_bas', s.id)) {
      nouvelles.push({
        userId,
        type: 'stock_bas',
        titre: `Stock bas — ${s.nom}`,
        message: `Quantité actuelle : ${s.quantite} ${s.unite ?? ''}. Seuil d'alerte : ${s.seuilAlerte} ${s.unite ?? ''}.`,
        priorite: 'moyenne',
        referenceType: 'stock',
        referenceId: s.id,
        actionUrl: `/stocks`,
        lue: false,
      });
    }
  }

  // ── 4. Factures en retard ──────────────────────────────────────────────────
  const facturesRetard = await db
    .select({ id: transactions.id, numero: transactions.numero, total: transactions.total })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'vente'),
        eq(transactions.statut, 'envoyee'),
        lte(transactions.dateEcheance, new Date()),
      ),
    );

  for (const f of facturesRetard) {
    if (!dejaExiste('facture_retard', f.id)) {
      nouvelles.push({
        userId,
        type: 'facture_retard',
        titre: `Facture en retard — ${f.numero ?? f.id.slice(0, 8)}`,
        message: `Montant : ${f.total ?? 0} €. Échéance dépassée.`,
        priorite: 'haute',
        referenceType: 'transaction',
        referenceId: f.id,
        actionUrl: `/finances/ventes`,
        lue: false,
      });
    }
  }

  // ── Insérer les nouvelles alertes ─────────────────────────────────────────
  if (nouvelles.length > 0) {
    await db.insert(alertes).values(nouvelles);
  }

  return { data: { created: nouvelles.length } };
});
