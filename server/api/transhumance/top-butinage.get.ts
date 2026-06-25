import { z } from 'zod';
import { potentielLeger } from '~~/server/utils/butinageFetch';

const querySchema = z.object({ dept: z.string().regex(/^(2[AB]|\d{2,3})$/) });

interface Centroid {
  nom: string;
  lat: number;
  lng: number;
}

function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la = (a.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * GET /api/transhumance/top-butinage?dept=XX
 * Top des meilleurs lieux de butinage d'un département : on couvre le territoire
 * d'une grille de points RURAUX (pas les villages), on score l'occupation du sol
 * réelle de chacun, on classe. Gated `transhumance`.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { dept } = await getValidatedQuery(event, querySchema.parse);

  // Centres de communes : servent à délimiter le département et à nommer les lieux.
  const geo = await $fetch<{
    features: Array<{ geometry: { coordinates: [number, number] }; properties: { nom: string } }>;
  }>(`https://geo.api.gouv.fr/departements/${dept}/communes`, {
    query: { fields: 'nom', format: 'geojson', geometry: 'centre' },
    responseType: 'json',
    timeout: 6000,
  });
  const centroids: Centroid[] = (geo.features ?? []).map((f) => ({
    nom: f.properties.nom,
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
  if (centroids.length < 3) return { data: { dept, nbScannes: 0, spots: [] } };

  // Bbox + grille 6×6, en gardant les points proches d'une commune (donc dans le
  // département) et hors des centres-villages (rural). Un nom de commune par point.
  const lats = centroids.map((c) => c.lat);
  const lngs = centroids.map((c) => c.lng);
  const [minLat, maxLat, minLng, maxLng] = [
    Math.min(...lats),
    Math.max(...lats),
    Math.min(...lngs),
    Math.max(...lngs),
  ];
  const N = 8;
  const candidats: Array<{ lat: number; lng: number; nom: string }> = [];
  const vus = new Set<string>();
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const lat = minLat + ((maxLat - minLat) * (i + 0.5)) / N;
      const lng = minLng + ((maxLng - minLng) * (j + 0.5)) / N;
      let best: Centroid | null = null;
      let bestD = Infinity;
      for (const c of centroids) {
        const d = distKm({ lat, lng }, c);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      // Point dans le département (proche d'une commune) mais à l'écart du village.
      if (best && bestD < 10 && bestD > 1.2 && !vus.has(best.nom)) {
        vus.add(best.nom);
        candidats.push({ lat, lng, nom: best.nom });
      }
    }
  }

  const echantillon = candidats.slice(0, 16);
  const notes: Array<{
    lat: number;
    lng: number;
    nom: string;
    potentiel: number;
    dominant: string;
  }> = [];
  for (const lot of chunk(echantillon, 8)) {
    const r = await Promise.all(
      lot.map(async (c) => ({ ...c, ...(await potentielLeger(c.lat, c.lng)) })),
    );
    notes.push(...r);
  }

  const spots = notes.sort((a, b) => b.potentiel - a.potentiel).slice(0, 6);
  return { data: { dept, nbScannes: echantillon.length, spots } };
});
