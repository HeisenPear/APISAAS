import { eq, sql } from 'drizzle-orm';
import { ordonnances } from '~~/server/database/schema';
import { calculerTournee } from '~~/server/utils/tourneeData';
import { cadenceVisite, chargeHebdomadaire, type Saison } from '~~/server/utils/cadence';
import type { PrioriteAlerte } from '~~/server/utils/alertesPush';

// ═══════════════════════════════════════════════════════════════════════════
// FEUILLE DE ROUTE DU JOUR — ce que l'apiculteur a concrètement à faire
// aujourd'hui, condensé en UN objet : visites dues (cadence saisonnière), RDV du
// jour, fins de traitement à clôturer. Sert au résumé quotidien poussé le matin
// ET à la page /tournee. `resumerFeuilleDeRoute` est pur → testable.
// ═══════════════════════════════════════════════════════════════════════════

const RDV_LABELS: Record<string, string> = {
  veterinaire: 'vétérinaire',
  syndicat: 'syndicat',
  fournisseur: 'fournisseur',
  client: 'client',
  administration: 'administration',
  autre: '',
};

export interface PlanJourVisites {
  nbRuchers: number;
  nbRuches: number;
  nbCritiques: number;
}

export interface RdvBref {
  heure: string;
  label: string;
}

export interface PlanJour {
  date: string;
  saison: Saison;
  cadenceJours: number;
  /** Nombre de visites de ruches recommandées cette semaine (informatif). */
  chargeSemaine: number;
  visites: PlanJourVisites;
  rdv: RdvBref[];
  nbTraitements: number;
  estVide: boolean;
  resume: string;
  priorite: PrioriteAlerte;
  url: string;
}

/** Jour civil (YYYY-MM-DD) d'une date dans le fuseau Europe/Paris. */
function jourParis(date: Date): string {
  return new Intl.DateTimeFormat('fr-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Europe/Paris',
  }).format(date);
}

function heureParis(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Europe/Paris',
  }).format(date);
}

/**
 * Assemble le résumé texte + la priorité + le fait qu'il n'y a rien à faire.
 * Pur : aucune I/O, entièrement testable.
 */
export function resumerFeuilleDeRoute(input: {
  visites: PlanJourVisites;
  rdv: RdvBref[];
  nbTraitements: number;
}): { resume: string; priorite: PrioriteAlerte; estVide: boolean } {
  const { visites, rdv, nbTraitements } = input;
  const parts: string[] = [];

  if (visites.nbRuchers > 0) {
    let v = `${visites.nbRuchers} rucher${visites.nbRuchers > 1 ? 's' : ''} à visiter (${
      visites.nbRuches
    } ruche${visites.nbRuches > 1 ? 's' : ''}`;
    v +=
      visites.nbCritiques > 0
        ? `, ${visites.nbCritiques} critique${visites.nbCritiques > 1 ? 's' : ''})`
        : ')';
    parts.push(v);
  }

  if (rdv.length === 1) parts.push(rdv[0]!.label);
  else if (rdv.length > 1) parts.push(`${rdv.length} rendez-vous`);

  if (nbTraitements > 0)
    parts.push(`${nbTraitements} traitement${nbTraitements > 1 ? 's' : ''} à clôturer`);

  const estVide = parts.length === 0;
  const priorite: PrioriteAlerte = visites.nbCritiques > 0 || rdv.length > 0 ? 'haute' : 'moyenne';

  return { resume: parts.join(' · '), priorite, estVide };
}

/** Construit la feuille de route du jour d'un espace (propriétaire `ownerId`). */
export async function chargerPlanJour(ownerId: string, now: Date = new Date()): Promise<PlanJour> {
  const cad = cadenceVisite(now);
  const t = await calculerTournee(ownerId, now);

  // RDV pro du jour (fuseau Paris).
  const rdvRows = (await db.execute(sql`
    SELECT date_visite, donnees, notes
    FROM interventions
    WHERE user_id = ${ownerId}
      AND type = 'rendez_vous_pro'
      AND (date_visite AT TIME ZONE 'Europe/Paris')::date
          = (${now.toISOString()}::timestamptz AT TIME ZONE 'Europe/Paris')::date
    ORDER BY date_visite ASC
    LIMIT 10
  `)) as unknown as Array<{
    date_visite: string;
    donnees: { typeRdv?: string; contact?: string } | null;
    notes: string | null;
  }>;

  const rdv: RdvBref[] = rdvRows.map((r) => {
    const d = new Date(r.date_visite);
    const heure = heureParis(d);
    const typeLabel = RDV_LABELS[r.donnees?.typeRdv ?? ''] || 'pro';
    return { heure, label: `RDV ${typeLabel} ${heure}`.replace(/\s+/g, ' ').trim() };
  });

  // Traitements dont le délai d'attente avant récolte s'achève AUJOURD'HUI.
  const ords = await db
    .select({
      datePrescription: ordonnances.datePrescription,
      duree: ordonnances.dureeTraitementJours,
      delai: ordonnances.delaiAttenteAvantRecolteJours,
    })
    .from(ordonnances)
    .where(eq(ordonnances.userId, ownerId));

  const aujourdhui = jourParis(now);
  let nbTraitements = 0;
  for (const o of ords) {
    if (!o.datePrescription) continue;
    const safe = new Date(o.datePrescription);
    safe.setDate(safe.getDate() + (o.duree ?? 0) + (o.delai ?? 0));
    if (jourParis(safe) === aujourdhui) nbTraitements++;
  }

  const visites: PlanJourVisites = {
    nbRuchers: t.nbRuchersAVisiter,
    nbRuches: t.nbRuchesAVisiter,
    nbCritiques: t.nbCritiques,
  };

  const { resume, priorite, estVide } = resumerFeuilleDeRoute({ visites, rdv, nbTraitements });

  return {
    date: jourParis(now),
    saison: cad.saison,
    cadenceJours: cad.intervalleJours,
    chargeSemaine: chargeHebdomadaire(t.nbRuchesActives, now),
    visites,
    rdv,
    nbTraitements,
    estVide,
    resume,
    priorite,
    url: '/tournee',
  };
}
