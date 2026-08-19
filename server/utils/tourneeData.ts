import { sql } from 'drizzle-orm';
import { computeHiveScore } from '~~/server/utils/santeScore';
import { intervalleVisiteJours } from '~~/server/utils/cadence';
import {
  agregerArrets,
  ordonnerTournee,
  distanceTotaleKm,
  lienMaps,
  type ArretBrut,
  type ArretOrdonne,
  type ArretGeo,
  type RucheEtat,
} from '~~/server/utils/tournee';

// ═══════════════════════════════════════════════════════════════════════════
// Calcul des ruchers à visiter aujourd'hui — factorisé pour être partagé par
// l'endpoint /api/tournee ET la feuille de route du jour (planJour). Le seuil de
// retard est SAISONNIER (cf. cadence.ts) : plus rapproché au printemps.
// ═══════════════════════════════════════════════════════════════════════════

export interface TourneeCalculee {
  route: ArretOrdonne[];
  sansCoords: ArretBrut[];
  totalKm: number;
  lienMaps: string | null;
  nbRuchersAVisiter: number;
  nbRuchesAVisiter: number;
  nbCritiques: number;
  /** Total de ruches actives (ruchers actifs) — sert au calcul de charge. */
  nbRuchesActives: number;
  seuilJours: number;
}

export async function calculerTournee(
  ownerId: string,
  maintenant: Date = new Date(),
): Promise<TourneeCalculee> {
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

  const seuilJours = intervalleVisiteJours(maintenant);
  const cutoff = new Date(maintenant);
  cutoff.setDate(cutoff.getDate() - seuilJours);

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
      // L'instant du run traverse jusqu'à la décote de fraîcheur du score :
      // sans lui, la tournée mélangeait un seuil de retard calculé sur
      // `maintenant` et des scores calculés sur l'horloge réelle.
      aujourdhui: maintenant,
    }).score,
    enRetard: row.date_visite == null || new Date(row.date_visite) < cutoff,
  }));

  const { arrets, nbRuchesAVisiter } = agregerArrets(etats);
  const geo = arrets.filter((a): a is ArretGeo => a.lat != null && a.lng != null);
  const sansCoords = arrets.filter((a) => a.lat == null || a.lng == null);
  const route = ordonnerTournee(geo);
  const nbCritiques = arrets.reduce((s, a) => s + a.nbCritiques, 0);

  return {
    route,
    sansCoords,
    totalKm: distanceTotaleKm(route),
    lienMaps: lienMaps(route),
    nbRuchersAVisiter: arrets.length,
    nbRuchesAVisiter,
    nbCritiques,
    nbRuchesActives: rows.length,
    seuilJours,
  };
}
