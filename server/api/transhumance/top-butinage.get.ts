import { z } from 'zod';
import { potentielLeger, corineMellifere, raffiner } from '~~/server/utils/butinageFetch';
import { grille, plusProcheCommune, selectionEspacee, mapLimit } from '~~/server/utils/geoSearch';

const querySchema = z.object({ dept: z.string().regex(/^(2[AB]|\d{2,3})$/) });

/**
 * GET /api/transhumance/top-butinage?dept=XX
 * Top des meilleurs lieux de butinage d'un département, par recherche adaptative :
 * reconnaissance grossière (CORINE) → germes répartis → raffinement hexagonal →
 * score complet des spots retenus. Gated `transhumance`.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { dept } = await getValidatedQuery(event, querySchema.parse);

  const geo = await $fetch<{
    features: Array<{ geometry: { coordinates: [number, number] }; properties: { nom: string } }>;
  }>(`https://geo.api.gouv.fr/departements/${dept}/communes`, {
    query: { fields: 'nom', format: 'geojson', geometry: 'centre' },
    responseType: 'json',
    timeout: 6000,
  });
  const communes = (geo.features ?? []).map((f) => ({
    nom: f.properties.nom,
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
  if (communes.length < 3) return { data: { dept, nbScannes: 0, spots: [] } };

  const lats = communes.map((c) => c.lat);
  const lngs = communes.map((c) => c.lng);

  // Phase 1 — Reconnaissance : grille grossière clippée au département, promesse CORINE.
  const cells = grille(
    Math.min(...lats),
    Math.max(...lats),
    Math.min(...lngs),
    Math.max(...lngs),
    6,
  )
    .map((p) => ({ ...p, ...plusProcheCommune(p, communes) }))
    .filter((p) => p.dist > 1 && p.dist < 9);
  // Concurrence plafonnée partout : l'IGN rate-limite sous rafale.
  const promesses = await mapLimit(cells, 8, async (c) => ({
    ...c,
    score: await corineMellifere(c.lat, c.lng),
  }));

  // Phase 2 — Germes répartis (meilleures promesses, espacées d'au moins 14 km).
  const germes = selectionEspacee(promesses, 4, 14);

  // Phase 3 — Raffinement hexagonal de chaque germe.
  const affines = await mapLimit(germes, 2, (g) => raffiner(g));

  // Phase 4 — Score complet (2 sources) + nom de la commune la plus proche.
  const scored = await mapLimit(affines, 4, async (p) => {
    const pl = await potentielLeger(p.lat, p.lng);
    const { nom } = plusProcheCommune(p, communes);
    return { nom, lat: p.lat, lng: p.lng, potentiel: pl.potentiel, dominant: pl.dominant };
  });

  const spots = scored.sort((a, b) => b.potentiel - a.potentiel).slice(0, 6);
  return { data: { dept, nbScannes: cells.length, spots } };
});
