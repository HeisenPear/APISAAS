// Logique pure de la surveillance frelon : distances, menace par rucher, stats.
// Testable, zéro I/O.
import type { FrelonStatut } from '~/config/frelon';

export interface NidPos {
  id: string;
  lat: number;
  lng: number;
  statut: FrelonStatut;
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

export type NiveauMenace = 'aucun' | 'surveillance' | 'eleve';

export interface MenaceRucher {
  rucherId: string;
  nom: string;
  /** Nids ACTIFS (non détruits) dans le rayon de surveillance. */
  nidsProches: number;
  /** Distance du nid actif le plus proche (km), ou null si aucun. */
  plusProcheKm: number | null;
  niveau: NiveauMenace;
}

/**
 * Évalue la menace frelon par rucher : nids actifs (non détruits) dans le rayon
 * de surveillance (défaut 3 km, ~zone de chasse d'une colonie de velutina).
 * Niveau « élevé » si un nid actif est à moins d'1 km.
 */
export function menacesParRucher(
  nids: NidPos[],
  ruchers: RucherPos[],
  rayonKm = 3,
): MenaceRucher[] {
  const actifs = nids.filter((n) => n.statut !== 'detruit');
  return ruchers
    .map((r) => {
      let nidsProches = 0;
      let plusProcheKm: number | null = null;
      for (const n of actifs) {
        const d = distanceKm(r, n);
        if (d <= rayonKm) {
          nidsProches += 1;
          if (plusProcheKm === null || d < plusProcheKm) plusProcheKm = d;
        }
      }
      const niveau: NiveauMenace =
        plusProcheKm === null ? 'aucun' : plusProcheKm <= 1 ? 'eleve' : 'surveillance';
      return {
        rucherId: r.id,
        nom: r.nom,
        nidsProches,
        plusProcheKm: plusProcheKm === null ? null : Math.round(plusProcheKm * 10) / 10,
        niveau,
      };
    })
    .sort((a, b) => {
      const ordre = { eleve: 0, surveillance: 1, aucun: 2 } as const;
      return ordre[a.niveau] - ordre[b.niveau];
    });
}

export interface StatsFrelon {
  total: number;
  signale: number;
  confirme: number;
  detruit: number;
  /** Nids/individus encore actifs (non détruits). */
  actifs: number;
}

export function statsFrelon(nids: { statut: FrelonStatut }[]): StatsFrelon {
  const s: StatsFrelon = { total: nids.length, signale: 0, confirme: 0, detruit: 0, actifs: 0 };
  for (const n of nids) {
    s[n.statut] += 1;
    if (n.statut !== 'detruit') s.actifs += 1;
  }
  return s;
}
