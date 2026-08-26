import { sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  rentabiliteRuchers,
  prixMoyenKg,
  alignerMensuel,
  comparaisonMensuelle,
  deltaPct,
  type RucherInfo,
  type ProductionRucher,
} from '~~/server/utils/analytics';
import { anneeParis } from '~~/server/utils/horloge';

const querySchema = z.object({
  annee: z.coerce.number().int().min(2020).max(2100).optional(),
});

type ProdMois = Array<{ mois: number; type_produit: string; total_kg: number }>;
type CaMois = Array<{ mois: number; total: number }>;

const bornes = (annee: number) => [`${annee}-01-01T00:00:00.000Z`, `${annee}-12-31T23:59:59.999Z`];
const sommeMiel = (rows: ProdMois) =>
  rows.filter((r) => r.type_produit === 'miel').reduce((s, r) => s + r.total_kg, 0);

/**
 * GET /api/analytics — pilotage de rentabilité.
 * Production mensuelle, rentabilité réelle par rucher, comparaison entre saisons.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const { annee: anneeQ } = await getValidatedQuery(event, querySchema.parse);

  const annee = anneeQ ?? anneeParis(new Date());
  const [debutN, finN] = bornes(annee);
  const [debutN1, finN1] = bornes(annee - 1);

  const [
    productionMensuelle,
    interventionsMensuelles,
    chiffreAffaires,
    totalRuches,
    ruchersInfo,
    prodParRucher,
    coutsRows,
    prodMensN1,
    caMensN1,
  ] = await Promise.all([
    db.execute(sql`
      SELECT EXTRACT(MONTH FROM date_recolte)::int AS mois, type_produit, SUM(quantite_kg)::float AS total_kg
      FROM recoltes WHERE user_id = ${ownerId} AND date_recolte >= ${debutN} AND date_recolte <= ${finN}
      GROUP BY mois, type_produit ORDER BY mois, type_produit`),
    db.execute(sql`
      SELECT EXTRACT(MONTH FROM date_visite)::int AS mois, COUNT(*)::int AS count
      FROM interventions WHERE user_id = ${ownerId} AND date_visite >= ${debutN} AND date_visite <= ${finN}
      GROUP BY mois ORDER BY mois`),
    db.execute(sql`
      SELECT EXTRACT(MONTH FROM date_transaction)::int AS mois, SUM(total)::float AS total
      FROM transactions WHERE user_id = ${ownerId} AND type = 'vente' AND statut <> 'brouillon'
        AND date_transaction >= ${debutN} AND date_transaction <= ${finN}
      GROUP BY mois ORDER BY mois`),
    db.execute(sql`
      SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE statut = 'active')::int AS actives,
        COUNT(*) FILTER (WHERE statut = 'faible')::int AS faibles,
        COUNT(*) FILTER (WHERE statut = 'morte')::int AS mortes
      FROM ruches WHERE user_id = ${ownerId}`),
    db.execute(sql`
      SELECT ru.id AS rucher_id, ru.nom, COUNT(rc.id)::int AS nb_ruches
      FROM ruchers ru LEFT JOIN ruches rc ON rc.rucher_id = ru.id
      WHERE ru.user_id = ${ownerId} GROUP BY ru.id, ru.nom ORDER BY ru.nom`),
    db.execute(sql`
      SELECT COALESCE(r.rucher_id, ru.rucher_id) AS rucher_id, SUM(r.quantite_kg)::float AS kg
      FROM recoltes r LEFT JOIN ruches ru ON r.ruche_id = ru.id
      WHERE r.user_id = ${ownerId} AND r.type_produit = 'miel'
        AND r.date_recolte >= ${debutN} AND r.date_recolte <= ${finN}
        AND COALESCE(r.rucher_id, ru.rucher_id) IS NOT NULL
      GROUP BY 1`),
    db.execute(sql`
      SELECT COALESCE(SUM(total), 0)::float AS total FROM transactions
      WHERE user_id = ${ownerId} AND type = 'achat' AND statut <> 'brouillon'
        AND date_transaction >= ${debutN} AND date_transaction <= ${finN}`),
    db.execute(sql`
      SELECT EXTRACT(MONTH FROM date_recolte)::int AS mois, type_produit, SUM(quantite_kg)::float AS total_kg
      FROM recoltes WHERE user_id = ${ownerId} AND date_recolte >= ${debutN1} AND date_recolte <= ${finN1}
      GROUP BY mois, type_produit`),
    db.execute(sql`
      SELECT EXTRACT(MONTH FROM date_transaction)::int AS mois, SUM(total)::float AS total
      FROM transactions WHERE user_id = ${ownerId} AND type = 'vente' AND statut <> 'brouillon'
        AND date_transaction >= ${debutN1} AND date_transaction <= ${finN1}
      GROUP BY mois`),
  ]);

  const prodN = productionMensuelle as unknown as ProdMois;
  const prodN1 = prodMensN1 as unknown as ProdMois;
  const caN = chiffreAffaires as unknown as CaMois;
  const caN1 = caMensN1 as unknown as CaMois;

  // Rentabilité réelle par rucher.
  const ruchers = (
    ruchersInfo as unknown as Array<{ rucher_id: string; nom: string; nb_ruches: number }>
  ).map((r): RucherInfo => ({ rucherId: r.rucher_id, nom: r.nom, nbRuches: r.nb_ruches }));
  const production = (prodParRucher as unknown as Array<{ rucher_id: string; kg: number }>).map(
    (r): ProductionRucher => ({ rucherId: r.rucher_id, kg: r.kg }),
  );
  const coutsTotal = Math.round((coutsRows as unknown as Array<{ total: number }>)[0]?.total ?? 0);
  const caTotalN = caN.reduce((s, r) => s + r.total, 0);
  const prodMielN = sommeMiel(prodN);
  const prixKg = prixMoyenKg(caTotalN, prodMielN);

  // Comparaison entre saisons (miel kg + CA).
  const prodMielMensN = alignerMensuel(
    prodN
      .filter((r) => r.type_produit === 'miel')
      .map((r) => ({ mois: r.mois, valeur: r.total_kg })),
  );
  const prodMielMensN1 = alignerMensuel(
    prodN1
      .filter((r) => r.type_produit === 'miel')
      .map((r) => ({ mois: r.mois, valeur: r.total_kg })),
  );
  const caMensNarr = alignerMensuel(caN.map((r) => ({ mois: r.mois, valeur: r.total })));
  const caMensN1arr = alignerMensuel(caN1.map((r) => ({ mois: r.mois, valeur: r.total })));
  const prodMielN1 = sommeMiel(prodN1);
  const caTotalN1 = caN1.reduce((s, r) => s + r.total, 0);

  return {
    data: {
      annee,
      productionMensuelle: prodN,
      interventionsMensuelles: interventionsMensuelles as unknown as Array<{
        mois: number;
        count: number;
      }>,
      chiffreAffaires: caN,
      ruches: (
        totalRuches as unknown as Array<{
          total: number;
          actives: number;
          faibles: number;
          mortes: number;
        }>
      )[0] ?? {
        total: 0,
        actives: 0,
        faibles: 0,
        mortes: 0,
      },
      rentabilite: {
        prixMoyenKg: prixKg,
        coutsTotal,
        ruchers: rentabiliteRuchers(ruchers, production, prixKg, coutsTotal),
      },
      comparaison: {
        anneeN: annee,
        anneeN1: annee - 1,
        production: comparaisonMensuelle(prodMielMensN, prodMielMensN1),
        ca: comparaisonMensuelle(caMensNarr, caMensN1arr),
        totals: {
          productionN: Math.round(prodMielN * 10) / 10,
          productionN1: Math.round(prodMielN1 * 10) / 10,
          productionDeltaPct: deltaPct(prodMielN, prodMielN1),
          caN: Math.round(caTotalN),
          caN1: Math.round(caTotalN1),
          caDeltaPct: deltaPct(caTotalN, caTotalN1),
        },
      },
    },
  };
});
