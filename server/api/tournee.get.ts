import { sql } from 'drizzle-orm';
import { computeHiveScore } from '~~/server/utils/santeScore';
import { VISITE_DELAI_JOURS } from '~~/server/utils/alertesCore';
import {
  agregerArrets,
  ordonnerTournee,
  distanceTotaleKm,
  lienMaps,
  type ArretGeo,
  type RucheEtat,
} from '~~/server/utils/tournee';

/**
 * GET /api/tournee — « Ma tournée du jour ».
 * Ruchers ayant des ruches actives en retard de visite (> VISITE_DELAI_JOURS)
 * ou en santé critique, ordonnés en itinéraire au plus proche voisin.
 */
export default defineEventHandler(async (event) => {
  const ownerId = await resolveOwnerId(event);

  const rows = (await db.execute(sql`
    SELECT r.id AS ruche_id, r.numero, r.rucher_id, r.statut, r.qualite_reine,
      ru.nom AS rucher_nom, ru.commune AS rucher_commune,
      ru.latitude::float8 AS lat, ru.longitude::float8 AS lng,
      li.date_visite, li.force_colonie, li.couvain, li.reserves,
      li.reine_vue, li.varroa, li.comportement, li.signe_essaimage, li.maladie_observee
    FROM ruches r
    JOIN ruchers ru ON ru.id = r.rucher_id
    LEFT JOIN LATERAL (
      SELECT i.date_visite, i.force_colonie, i.couvain, i.reserves,
             i.reine_vue, i.varroa, i.comportement, i.signe_essaimage, i.maladie_observee
      FROM interventions i
      WHERE i.ruche_id = r.id AND i.type = 'controle'
      ORDER BY i.date_visite DESC LIMIT 1
    ) li ON true
    WHERE r.user_id = ${ownerId} AND r.statut = 'active' AND ru.actif = true
  `)) as unknown as Array<{
    ruche_id: string;
    numero: string;
    rucher_id: string;
    statut: string;
    qualite_reine: string | null;
    rucher_nom: string;
    rucher_commune: string | null;
    lat: number | null;
    lng: number | null;
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

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - VISITE_DELAI_JOURS);

  const etats: RucheEtat[] = rows.map((row) => ({
    rucherId: row.rucher_id,
    nom: row.rucher_nom,
    commune: row.rucher_commune,
    lat: row.lat,
    lng: row.lng,
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
    }).score,
    enRetard: row.date_visite == null || new Date(row.date_visite) < cutoff,
  }));

  const { arrets, nbRuchesAVisiter } = agregerArrets(etats);
  const geo = arrets.filter((a): a is ArretGeo => a.lat != null && a.lng != null);
  const sansCoords = arrets.filter((a) => a.lat == null || a.lng == null);
  const route = ordonnerTournee(geo);

  return {
    data: {
      arrets: route,
      sansCoords,
      totalKm: distanceTotaleKm(route),
      lienMaps: lienMaps(route),
      nbRuchersAVisiter: arrets.length,
      nbRuchesAVisiter,
      seuilJours: VISITE_DELAI_JOURS,
    },
  };
});
