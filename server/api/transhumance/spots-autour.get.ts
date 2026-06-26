import { z } from 'zod';
import { potentielLeger, corineMellifere, raffiner } from '~~/server/utils/butinageFetch';
import { grille, distKm, selectionEspacee, mapLimit } from '~~/server/utils/geoSearch';

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  rayon: z.coerce.number().min(3000).max(25000).default(12000),
});

async function commune(lat: number, lng: number): Promise<string> {
  try {
    const r = await $fetch<{ features?: Array<{ properties?: { city?: string } }> }>(
      'https://api-adresse.data.gouv.fr/reverse/',
      { query: { lon: lng, lat }, timeout: 3500, responseType: 'json' },
    );
    return r.features?.[0]?.properties?.city ?? '';
  } catch {
    return '';
  }
}

/**
 * GET /api/transhumance/spots-autour?lat=&lng=&rayon=
 * Meilleurs spots de butinage AUTOUR d'un lieu (typiquement un rucher/emplacement),
 * par recherche adaptative locale (triangulation). Plus fin que le scan
 * départemental car la zone est resserrée. Gated `transhumance`.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { lat, lng, rayon } = await getValidatedQuery(event, querySchema.parse);
  const rKm = rayon / 1000;
  const dLat = rayon / 111320;
  const dLng = rayon / (111320 * Math.cos((lat * Math.PI) / 180) || 1);
  const centre = { lat, lng };

  // Phase 1 — Reconnaissance : grille locale, clippée au rayon de butinage.
  const cells = grille(lat - dLat, lat + dLat, lng - dLng, lng + dLng, 6).filter((p) => {
    const d = distKm(centre, p);
    return d >= 0.8 && d <= rKm;
  });
  const promesses = await mapLimit(cells, 8, async (c) => ({
    ...c,
    score: await corineMellifere(c.lat, c.lng),
  }));

  // Phase 2 — Germes répartis dans le rayon.
  const germes = selectionEspacee(promesses, 4, Math.max(2, rKm / 2.5));

  // Phase 3 — Raffinement hexagonal (rayon initial réduit, on est en local).
  const affines = await mapLimit(germes, 2, (g) => raffiner(g, Math.min(3000, rayon / 3)));

  // Phase 4 — Score complet + commune + distance au point de départ.
  const scored = await mapLimit(affines, 4, async (p) => {
    const pl = await potentielLeger(p.lat, p.lng);
    return {
      nom: await commune(p.lat, p.lng),
      lat: p.lat,
      lng: p.lng,
      potentiel: pl.potentiel,
      dominant: pl.dominant,
      distance: Math.round(distKm(centre, p) * 10) / 10,
    };
  });

  const spots = scored.sort((a, b) => b.potentiel - a.potentiel).slice(0, 5);
  return { data: { spots } };
});
