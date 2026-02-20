import { sql } from 'drizzle-orm';
import { computeScore } from '~~/server/utils/santeScore';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

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
      FROM inspections i
      WHERE i.ruche_id = r.id
      ORDER BY i.date_visite DESC
      LIMIT 1
    ) li ON true
    WHERE r.id = ${id}
      AND r.user_id = ${user.id}
    LIMIT 1
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

  if (!rows[0]) notFound('Ruche introuvable');

  const row = rows[0];
  const score = computeScore({
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
  });

  return {
    data: {
      score,
      dernierControle: row.date_visite ?? null,
      facteurs: row.date_visite
        ? {
            forceColonie: row.force_colonie,
            couvain: row.couvain,
            reserves: row.reserves,
            reineVue: row.reine_vue,
            varroa: row.varroa,
            comportement: row.comportement,
          }
        : null,
    },
  };
});
