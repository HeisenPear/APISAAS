import { eq, and, sql } from 'drizzle-orm';
import { ruchers } from '~~/server/database/schema';
import { computeScore } from '~~/server/utils/santeScore';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  // Vérifier appartenance
  const [rucher] = await db
    .select({ id: ruchers.id })
    .from(ruchers)
    .where(and(eq(ruchers.id, id), eq(ruchers.userId, user.id)))
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
      AND r.user_id = ${user.id}
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

  const parRuche = rows.map((row) => ({
    rucheId: row.ruche_id,
    numero: row.numero,
    score: computeScore({
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
    }),
    dernierControle: row.date_visite ?? null,
    statut: row.statut,
  }));

  const activeScores = parRuche.filter((r) => r.statut === 'active').map((r) => r.score);
  const score =
    activeScores.length > 0
      ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
      : parRuche.length > 0
        ? Math.round(parRuche.reduce((a, b) => a + b.score, 0) / parRuche.length)
        : 0;

  const dernieresDates = parRuche.map((r) => r.dernierControle).filter(Boolean) as string[];
  const dernierControle =
    dernieresDates.length > 0
      ? dernieresDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

  return {
    data: {
      score,
      dernierControle,
      nbRuches: parRuche.length,
      parRuche: parRuche.sort((a, b) => a.score - b.score),
    },
  };
});
