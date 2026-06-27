// Logique pure de la surveillance frelon : distances, menace par rucher, stats.
// Testable, zéro I/O.
import type { FrelonStatut, FrelonPression, NiveauMenace } from '~/config/frelon';

export interface NidPos {
  id: string;
  lat: number;
  lng: number;
  statut: FrelonStatut;
  pression: FrelonPression;
}
export interface RucherPos {
  id: string;
  nom: string;
  lat: number;
  lng: number;
}

/** Distance haversine en km. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface MenaceRucher {
  rucherId: string;
  nom: string;
  /** Nids ACTIFS (ni détruits, ni rejetés) dans le rayon de surveillance. */
  nidsProches: number;
  /** Distance du nid actif le plus proche (km), ou null si aucun. */
  plusProcheKm: number | null;
  /** Niveau d'alerte agrégé (proximité × quantité de frelons). */
  niveau: NiveauMenace;
}

/** Un signalement « actif » menace les ruchers : ni détruit, ni rejeté. */
export function estActif(statut: FrelonStatut): boolean {
  return statut !== 'detruit' && statut !== 'rejete';
}

const PRESSION_SCORE: Record<FrelonPression, number> = {
  faible: 1,
  modere: 2,
  fort: 3,
  infestation: 4,
};
const NIVEAU_PAR_SCORE: NiveauMenace[] = ['aucun', 'faible', 'modere', 'fort', 'infestation'];
const ORDRE_NIVEAU: Record<NiveauMenace, number> = {
  infestation: 0,
  fort: 1,
  modere: 2,
  faible: 3,
  aucun: 4,
};

/**
 * Évalue la menace frelon par rucher en combinant la PROXIMITÉ et la QUANTITÉ de
 * frelons (pression). Pour chaque nid actif dans le rayon (défaut 3 km), la
 * sévérité = score de pression (+1 si le nid est à moins d'1 km). Le niveau du
 * rucher reflète la pire sévérité : aucune → faible → modérée → forte → infestation.
 */
export function menacesParRucher(
  nids: NidPos[],
  ruchers: RucherPos[],
  rayonKm = 3,
): MenaceRucher[] {
  const actifs = nids.filter((n) => estActif(n.statut));
  return ruchers
    .map((r) => {
      let nidsProches = 0;
      let plusProcheKm: number | null = null;
      let sev = 0;
      for (const n of actifs) {
        const d = distanceKm(r, n);
        if (d > rayonKm) continue;
        nidsProches += 1;
        if (plusProcheKm === null || d < plusProcheKm) plusProcheKm = d;
        const s = Math.min(4, PRESSION_SCORE[n.pression] + (d <= 1 ? 1 : 0));
        if (s > sev) sev = s;
      }
      return {
        rucherId: r.id,
        nom: r.nom,
        nidsProches,
        plusProcheKm: plusProcheKm === null ? null : Math.round(plusProcheKm * 10) / 10,
        niveau: NIVEAU_PAR_SCORE[sev]!,
      };
    })
    .sort((a, b) => ORDRE_NIVEAU[a.niveau] - ORDRE_NIVEAU[b.niveau]);
}

export interface StatsFrelon {
  total: number;
  a_verifier: number;
  confirme: number;
  rejete: number;
  detruit: number;
  /** Nids/individus encore actifs (ni détruits, ni rejetés). */
  actifs: number;
}

export function statsFrelon(nids: { statut: FrelonStatut }[]): StatsFrelon {
  const s: StatsFrelon = {
    total: nids.length,
    a_verifier: 0,
    confirme: 0,
    rejete: 0,
    detruit: 0,
    actifs: 0,
  };
  for (const n of nids) {
    s[n.statut] += 1;
    if (estActif(n.statut)) s.actifs += 1;
  }
  return s;
}
