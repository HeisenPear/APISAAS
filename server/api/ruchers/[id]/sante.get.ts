import { eq, and, sql } from 'drizzle-orm';
import { ruchers } from '~~/server/database/schema';
import { computeHiveScore, computeRucherScore } from '~~/server/utils/santeScore';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  // Vérifier appartenance
  const [rucher] = await db
    .select({ id: ruchers.id })
    .from(ruchers)
    .where(and(eq(ruchers.id, id), eq(ruchers.userId, ownerId)))
    .limit(1);

  if (!rucher) notFound('Rucher introuvable');

  const rows = (await db.execute(sql`
    SELECT
      r.id AS ruche_id,
      r.numero,
      r.rucher_id,
      r.statut,
      r.qualite_reine,
      li.date_visite,
      li.force_colonie,
      li.couvain,
      li.reserves,
      li.reine_vue,
      li.varroa,
      li.comportement,
      li.signe_essaimage,
      li.maladie_observee
    FROM ruches r
    LEFT JOIN LATERAL (
      SELECT i.date_visite, i.force_colonie, i.couvain, i.reserves,
             i.reine_vue, i.varroa, i.comportement, i.signe_essaimage, i.maladie_observee
      FROM interventions i
      WHERE i.ruche_id = r.id
      ORDER BY i.date_visite DESC
      LIMIT 1
    ) li ON true
    WHERE r.rucher_id = ${id}
      AND r.user_id = ${ownerId}
  `)) as unknown as Array<{
    ruche_id: string;
    numero: string;
    rucher_id: string;
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

  // Instant de référence unique : toutes les ruches du rucher sont notées au
  // même moment, sinon la moyenne agrège des scores hétérogènes.
  const maintenant = new Date();
  const parRucheAll = rows.map((row) => ({
    rucheId: row.ruche_id,
    numero: row.numero,
    score: computeHiveScore({
      rucheId: row.ruche_id,
      numero: row.numero,
      rucherId: row.rucher_id,
      statut: row.statut,
      qualiteReine: row.qualite_reine,
      dateVisite: row.date_visite,
      forceColonie: row.force_colonie,
      couvain: row.couvain,
      reserves: row.reserves,
      reineVue: row.reine_vue,
      varroa: row.varroa,
      comportement: row.comportement,
      signeEssaimage: row.signe_essaimage,
      maladieObservee: row.maladie_observee,
      aujourdhui: maintenant,
    }).score,
    dernierControle: row.date_visite ?? null,
    statut: row.statut,
  }));

  const agg = computeRucherScore(parRucheAll);

  // Ruches comptabilisées uniquement (exclut vendue/fusionnée → score null)
  const parRuche = parRucheAll
    .filter((r) => r.score != null)
    .map((r) => ({ ...r, score: r.score as number }))
    .sort((a, b) => a.score - b.score);

  const dernieresDates = parRuche.map((r) => r.dernierControle).filter(Boolean) as string[];
  const dernierControle =
    dernieresDates.length > 0
      ? dernieresDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

  return {
    data: {
      score: agg.score ?? 0,
      dernierControle,
      nbRuches: agg.nbRuches,
      nbCritiques: agg.nbCritiques,
      parRuche,
    },
  };
});
