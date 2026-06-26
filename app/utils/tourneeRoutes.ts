// Stratégies de trajet pour « Ma tournée » (côté client, recalcul instantané) :
// - le plus court (plus proche voisin + optimisation 2-opt),
// - urgences d'abord (départ sur le rucher le plus critique),
// - au choix (départ imposé par l'apiculteur).
// Fonctions pures → testables.

export interface ArretBase {
  rucherId: string;
  nom: string;
  commune: string | null;
  lat: number;
  lng: number;
  nbEnRetard: number;
  nbCritiques: number;
}
export interface ArretOrdonne extends ArretBase {
  ordre: number;
  /** Distance depuis l'arrêt précédent (km). 0 pour le 1er. */
  distanceKm: number;
}

export function haversineKm(
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

export function urgence(a: { nbCritiques: number; nbEnRetard: number }): number {
  return a.nbCritiques * 10 + a.nbEnRetard;
}

function longueur(idx: number[], pts: ArretBase[]): number {
  let s = 0;
  for (let i = 1; i < idx.length; i++) s += haversineKm(pts[idx[i - 1]!]!, pts[idx[i]!]!);
  return s;
}

/** Plus proche voisin depuis un index de départ. */
function plusProcheVoisin(pts: ArretBase[], depart: number): number[] {
  const n = pts.length;
  const vu = new Array(n).fill(false);
  const order = [depart];
  vu[depart] = true;
  for (let k = 1; k < n; k++) {
    const last = order[order.length - 1]!;
    let best = -1;
    let bd = Infinity;
    for (let j = 0; j < n; j++) {
      if (vu[j]) continue;
      const d = haversineKm(pts[last]!, pts[j]!);
      if (d < bd) {
        bd = d;
        best = j;
      }
    }
    order.push(best);
    vu[best] = true;
  }
  return order;
}

/** Optimisation 2-opt d'un chemin ouvert (réduit la distance totale). */
function deuxOpt(order: number[], pts: ArretBase[], fixerDebut: boolean): number[] {
  let best = [...order];
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = fixerDebut ? 1 : 0; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const cand = [...best.slice(0, i), ...best.slice(i, k + 1).reverse(), ...best.slice(k + 1)];
        if (longueur(cand, pts) < longueur(best, pts) - 1e-9) {
          best = cand;
          improved = true;
        }
      }
    }
  }
  return best;
}

function assigner(order: number[], pts: ArretBase[]): ArretOrdonne[] {
  return order.map((idx, i) => ({
    ...pts[idx]!,
    ordre: i + 1,
    distanceKm: i === 0 ? 0 : Math.round(haversineKm(pts[order[i - 1]!]!, pts[idx]!) * 10) / 10,
  }));
}

/**
 * Trajet le plus court. Sans départ imposé, essaie tous les départs possibles
 * (+ 2-opt) et garde le plus court. Avec `departId`, optimise en gardant ce
 * point de départ fixe.
 */
export function routeOptimale(arrets: ArretBase[], departId?: string): ArretOrdonne[] {
  if (arrets.length === 0) return [];
  if (arrets.length === 1) return assigner([0], arrets);
  if (departId) {
    const s = Math.max(
      0,
      arrets.findIndex((a) => a.rucherId === departId),
    );
    return assigner(deuxOpt(plusProcheVoisin(arrets, s), arrets, true), arrets);
  }
  let bestOrder = plusProcheVoisin(arrets, 0);
  let bestLen = Infinity;
  for (let s = 0; s < arrets.length; s++) {
    const o = deuxOpt(plusProcheVoisin(arrets, s), arrets, false);
    const l = longueur(o, arrets);
    if (l < bestLen) {
      bestLen = l;
      bestOrder = o;
    }
  }
  return assigner(bestOrder, arrets);
}

/** Urgences d'abord : départ sur le rucher le plus critique, puis trajet optimisé. */
export function routeUrgences(arrets: ArretBase[]): ArretOrdonne[] {
  if (arrets.length === 0) return [];
  let s = 0;
  for (let i = 1; i < arrets.length; i++) if (urgence(arrets[i]!) > urgence(arrets[s]!)) s = i;
  return assigner(deuxOpt(plusProcheVoisin(arrets, s), arrets, true), arrets);
}

export function distanceTotaleKm(route: ArretOrdonne[]): number {
  return Math.round(route.reduce((s, a) => s + a.distanceKm, 0) * 10) / 10;
}

export function lienMaps(route: { lat: number; lng: number }[]): string | null {
  if (route.length === 0) return null;
  return `https://www.google.com/maps/dir/${route.map((a) => `${a.lat},${a.lng}`).join('/')}`;
}
