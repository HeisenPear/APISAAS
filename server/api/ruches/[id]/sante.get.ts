import { sql } from 'drizzle-orm';
import { computeHiveScore, type EvenementSante } from '~~/server/utils/santeScore';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  // 1) Ruche + dernier contrôle (snapshot des constantes vitales)
  const rows = (await db.execute(sql`
    SELECT
      r.id AS ruche_id, r.numero, r.rucher_id, r.statut, r.qualite_reine,
      li.date_visite, li.force_colonie, li.couvain, li.reserves, li.reine_vue,
      li.varroa, li.comportement, li.signe_essaimage, li.cellule_royale, li.maladie_observee
    FROM ruches r
    LEFT JOIN LATERAL (
      SELECT i.date_visite, i.force_colonie, i.couvain, i.reserves, i.reine_vue,
             i.varroa, i.comportement, i.signe_essaimage, i.cellule_royale, i.maladie_observee
      FROM interventions i
      WHERE i.ruche_id = r.id AND i.type = 'controle'
      ORDER BY i.date_visite DESC LIMIT 1
    ) li ON true
    WHERE r.id = ${id} AND r.user_id = ${user.id}
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
    cellule_royale: boolean | null;
    maladie_observee: string | null;
  }>;

  if (!rows[0]) notFound('Ruche introuvable');
  const row = rows[0];

  // 2) Interventions récentes (120 j) — chaque action a une incidence
  const interventions = (await db.execute(sql`
    SELECT type, date_visite, reine_vue, couvain, traitement_applique, maladie_observee
    FROM interventions
    WHERE ruche_id = ${id} AND user_id = ${user.id}
      AND date_visite > now() - interval '120 days'
    ORDER BY date_visite DESC
  `)) as unknown as Array<{
    type: string | null;
    date_visite: string;
    reine_vue: boolean | null;
    couvain: number | null;
    traitement_applique: string | null;
    maladie_observee: string | null;
  }>;

  // 3) Événements reine (réintroduction, perte, reprise de ponte)
  const evReine = (await db
    .execute(
      sql`
    SELECT type_evenement, date_evenement
    FROM evenements_reine
    WHERE ruche_id = ${id} AND user_id = ${user.id}
      AND date_evenement > now() - interval '120 days'
    ORDER BY date_evenement DESC
  `,
    )
    .catch(() => [])) as unknown as Array<{ type_evenement: string; date_evenement: string }>;

  const evenements: EvenementSante[] = [];
  for (const it of interventions) {
    if (!it.type) continue;
    evenements.push({
      type: it.type,
      date: it.date_visite,
      ponteConfirmee: it.type === 'controle' && (it.reine_vue === true || (it.couvain ?? 0) >= 3),
      mortalite: it.type === 'sanitaire' && !!it.maladie_observee?.toLowerCase().includes('mort'),
    });
    if (it.traitement_applique) evenements.push({ type: 'traitement', date: it.date_visite });
  }
  for (const e of evReine) {
    evenements.push({
      type: e.type_evenement,
      date: e.date_evenement,
      ponteConfirmee: e.type_evenement === 'ponte_vue',
    });
  }

  const result = computeHiveScore({
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
    celluleRoyale: row.cellule_royale,
    maladieObservee: row.maladie_observee,
    evenements,
  });

  return {
    data: {
      score: result.score,
      niveau: result.niveau,
      couleur: result.couleur,
      confiance: result.confiance,
      raisons: result.raisons,
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
