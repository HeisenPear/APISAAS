import { sql } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════════════════════
// LE CHEPTEL, CHARGÉ UNE SEULE FOIS.
//
// Trois règles d'alerte interrogent les mêmes ruches et leur dernier contrôle :
// « visite en retard », « première visite » et « santé critique ». Chacune
// faisait sa propre requête (jusqu'à 3 par utilisateur et par run, dont deux
// LATERAL quasi identiques). Elles partagent désormais CE snapshot.
//
// Corollaire : mettre « santé critique » dans le socle commun ne coûte plus une
// requête de plus, il en économise deux — ce qui lève l'objection de coût au
// fait qu'un apiculteur qui n'ouvre jamais le dashboard n'en recevait aucune.
// ═══════════════════════════════════════════════════════════════════════════

/** Une ruche active + les constantes vitales de son dernier contrôle. */
export interface RucheSnapshot {
  id: string;
  numero: string;
  rucherId: string;
  statut: string;
  qualiteReine: string | null;
  dateVisite: string | null;
  forceColonie: number | null;
  couvain: number | null;
  reserves: number | null;
  reineVue: boolean | null;
  varroa: number | null;
  comportement: string | null;
  signeEssaimage: boolean | null;
  maladieObservee: string | null;
}

interface LigneCheptel {
  id: string;
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
}

/**
 * Ruches ACTIVES de l'espace + leur dernier contrôle.
 *
 * Les `CASE WHEN … donnees->>'…'` rattrapent les contrôles saisis via le
 * formulaire terrain, qui stocke certaines constantes dans le JSONB `donnees`
 * plutôt que dans les colonnes dédiées. Sans eux, une ruche parfaitement suivie
 * depuis le mobile paraissait dépourvue de données.
 */
export async function chargerCheptel(userId: string): Promise<RucheSnapshot[]> {
  const lignes = (await db.execute(sql`
    SELECT r.id, r.numero, r.rucher_id, r.statut, r.qualite_reine,
      li.date_visite, li.force_colonie, li.couvain, li.reserves,
      li.reine_vue, li.varroa, li.comportement, li.signe_essaimage, li.maladie_observee
    FROM ruches r
    LEFT JOIN LATERAL (
      SELECT i.date_visite,
        CASE WHEN i.donnees->>'force_colonie' ~ '^[0-9]+$' THEN (i.donnees->>'force_colonie')::int ELSE i.force_colonie END AS force_colonie,
        CASE WHEN lower(i.donnees->>'reine_vue') IN ('true','false','t','f') THEN (i.donnees->>'reine_vue')::bool ELSE i.reine_vue END AS reine_vue,
        CASE WHEN lower(i.donnees->>'couvain_present') IN ('true','false','t','f') THEN CASE WHEN (i.donnees->>'couvain_present')::bool THEN 4 ELSE 1 END ELSE i.couvain END AS couvain,
        CASE WHEN lower(i.donnees->>'reserves_presentes') IN ('true','false','t','f') THEN CASE WHEN (i.donnees->>'reserves_presentes')::bool THEN 4 ELSE 1 END ELSE i.reserves END AS reserves,
        COALESCE(i.donnees->>'comportement', i.comportement) AS comportement,
        i.varroa, i.signe_essaimage, i.maladie_observee
      FROM interventions i
      WHERE i.ruche_id = r.id AND i.type = 'controle'
      ORDER BY i.date_visite DESC LIMIT 1
    ) li ON true
    WHERE r.user_id = ${userId} AND r.statut = 'active'
  `)) as unknown as LigneCheptel[];

  return lignes.map((l) => ({
    id: l.id,
    numero: l.numero,
    rucherId: l.rucher_id,
    statut: l.statut,
    qualiteReine: l.qualite_reine,
    dateVisite: l.date_visite,
    forceColonie: l.force_colonie,
    couvain: l.couvain,
    reserves: l.reserves,
    reineVue: l.reine_vue,
    varroa: l.varroa,
    comportement: l.comportement,
    signeEssaimage: l.signe_essaimage,
    maladieObservee: l.maladie_observee,
  }));
}

/**
 * Le compte a-t-il au moins une ruche active ? PURE — c'était une requête
 * `EXISTS` dédiée. Sert à ne pas envoyer de nudge saisonnier ni de météo à un
 * compte vide.
 */
export function aDesRuchesActives(cheptel: readonly RucheSnapshot[]): boolean {
  return cheptel.length > 0;
}

/** Ruches actives jamais contrôlées. PURE — c'était un `count(*)` dédié. */
export function compterRuchesJamaisVisitees(cheptel: readonly RucheSnapshot[]): number {
  return cheptel.filter((r) => !r.dateVisite).length;
}
