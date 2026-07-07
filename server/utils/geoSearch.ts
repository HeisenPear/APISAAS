// Helpers géométriques pour la recherche adaptative de spots de butinage :
// grille de reconnaissance, motif hexagonal de raffinement (triangulation locale),
// sélection de germes espacés. Fonctions pures → testables.

export interface Pt {
  lat: number;
  lng: number;
}

export function distKm(a: Pt, b: Pt): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la = (a.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Grille n×n de points au centre de chaque cellule d'une bbox. */
export function grille(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  n: number,
): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      pts.push({
        lat: minLat + ((maxLat - minLat) * (i + 0.5)) / n,
        lng: minLng + ((maxLng - minLng) * (j + 0.5)) / n,
      });
    }
  }
  return pts;
}

/** 6 sommets d'un hexagone de rayon `rayonM` autour d'un centre (motif de raffinement). */
export function hexagone(lat: number, lng: number, rayonM: number): Pt[] {
  const dLat = rayonM / 111320;
  const dLng = rayonM / (111320 * Math.cos((lat * Math.PI) / 180) || 1);
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return { lat: lat + dLat * Math.cos(a), lng: lng + dLng * Math.sin(a) };
  });
}

/** Commune la plus proche d'un point (parmi des centroïdes nommés). */
export function plusProcheCommune<T extends Pt & { nom: string }>(
  p: Pt,
  communes: T[],
): { nom: string; dist: number } {
  let nom = '';
  let dist = Infinity;
  for (const c of communes) {
    const d = distKm(p, c);
    if (d < dist) {
      dist = d;
      nom = c.nom;
    }
  }
  return { nom, dist };
}

/**
 * Exécute `fn` sur chaque élément avec une concurrence plafonnée (évite de saturer
 * l'IGN qui rate-limite sous rafale). Préserve l'ordre des résultats.
 */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, i: number) => Promise<R>,
): Promise<R[]> {
  const res = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      res[i] = await fn(items[i]!, i);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return res;
}

/**
 * Sélectionne les `n` points de meilleur score, en imposant un espacement minimal
 * (`minKm`) entre eux → des germes répartis sur tout le territoire, pas regroupés.
 */
export function selectionEspacee<T extends Pt & { score: number }>(
  scored: T[],
  n: number,
  minKm: number,
): T[] {
  const tri = [...scored].sort((a, b) => b.score - a.score);
  const out: T[] = [];
  for (const p of tri) {
    if (out.length >= n) break;
    if (out.every((o) => distKm(o, p) >= minKm)) out.push(p);
  }
  return out;
}
