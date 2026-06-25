// Tournée du jour : sélection des ruchers à visiter (ruches en retard de visite
// ou en santé critique) + ordonnancement « plus proche voisin » (heuristique TSP
// gloutonne) au départ du rucher le plus urgent. Fonctions pures → testables.

const R_TERRE_KM = 6371;
const SEUIL_CRITIQUE = 40;

export interface ArretBrut {
  rucherId: string;
  nom: string;
  commune: string | null;
  lat: number | null;
  lng: number | null;
  nbEnRetard: number;
  nbCritiques: number;
}

/** Arrêt dont les coordonnées GPS sont connues (routable). */
export type ArretGeo = ArretBrut & { lat: number; lng: number };

export interface ArretOrdonne extends ArretGeo {
  ordre: number;
  /** Distance à vol d'oiseau depuis l'arrêt précédent (km). 0 pour le 1er. */
  distanceKm: number;
}

/** État de visite d'une ruche (issu de son dernier contrôle). */
export interface RucheEtat {
  rucherId: string;
  nom: string;
  commune: string | null;
  lat: number | null;
  lng: number | null;
  score: number | null;
  enRetard: boolean;
}

/** Distance à vol d'oiseau entre deux points (km, formule de haversine). */
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
  return 2 * R_TERRE_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Priorité d'un arrêt : une santé critique pèse 10× un simple retard. */
export function urgence(a: { nbCritiques: number; nbEnRetard: number }): number {
  return a.nbCritiques * 10 + a.nbEnRetard;
}

/**
 * Agrège les ruches par rucher et ne conserve que les ruchers « à visiter »
 * (≥ 1 ruche en retard ou en santé critique). Renvoie aussi le nombre total de
 * ruches concernées (une ruche à la fois en retard ET critique n'est comptée
 * qu'une fois).
 */
export function agregerArrets(ruches: RucheEtat[]): {
  arrets: ArretBrut[];
  nbRuchesAVisiter: number;
} {
  const map = new Map<string, ArretBrut>();
  let nbRuches = 0;
  for (const r of ruches) {
    let a = map.get(r.rucherId);
    if (!a) {
      a = {
        rucherId: r.rucherId,
        nom: r.nom,
        commune: r.commune,
        lat: r.lat,
        lng: r.lng,
        nbEnRetard: 0,
        nbCritiques: 0,
      };
      map.set(r.rucherId, a);
    }
    const critique = r.score != null && r.score < SEUIL_CRITIQUE;
    if (r.enRetard) a.nbEnRetard++;
    if (critique) a.nbCritiques++;
    if (r.enRetard || critique) nbRuches++;
  }
  const arrets = [...map.values()].filter((a) => a.nbEnRetard > 0 || a.nbCritiques > 0);
  return { arrets, nbRuchesAVisiter: nbRuches };
}

/**
 * Ordonne les arrêts : départ sur le plus urgent, puis plus proche voisin.
 * Renseigne `ordre` (1-based) et `distanceKm` depuis l'arrêt précédent.
 */
export function ordonnerTournee(arrets: ArretGeo[]): ArretOrdonne[] {
  if (arrets.length === 0) return [];
  const restants = [...arrets].sort((a, b) => urgence(b) - urgence(a));
  const depart = restants.shift()!;
  const route: ArretOrdonne[] = [{ ...depart, ordre: 1, distanceKm: 0 }];
  while (restants.length > 0) {
    const dernier = route[route.length - 1]!;
    let idx = 0;
    let best = Infinity;
    for (let i = 0; i < restants.length; i++) {
      const d = haversineKm(dernier, restants[i]!);
      if (d < best) {
        best = d;
        idx = i;
      }
    }
    const suiv = restants.splice(idx, 1)[0]!;
    route.push({ ...suiv, ordre: route.length + 1, distanceKm: Math.round(best * 10) / 10 });
  }
  return route;
}

/** Distance totale de la tournée (km). */
export function distanceTotaleKm(route: ArretOrdonne[]): number {
  return Math.round(route.reduce((s, a) => s + a.distanceKm, 0) * 10) / 10;
}

/** Lien Google Maps multi-étapes (ouvre l'app Maps sur mobile). null si vide. */
export function lienMaps(route: { lat: number; lng: number }[]): string | null {
  if (route.length === 0) return null;
  return `https://www.google.com/maps/dir/${route.map((a) => `${a.lat},${a.lng}`).join('/')}`;
}
