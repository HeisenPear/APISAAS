import { z } from 'zod';

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/**
 * GET /api/transhumance/analyser-point?lat=&lng=
 * Enrichit un point cliqué sur la carte : commune (Base Adresse Nationale) +
 * altitude (Open-Meteo). Deux sources publiques gratuites sans clé. Appel
 * serveur (évite les soucis CORS, dégrade proprement si une source échoue).
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { lat, lng } = await getValidatedQuery(event, querySchema.parse);

  let commune: string | null = null;
  let codePostal: string | null = null;
  let departement: string | null = null;
  let altitude: number | null = null;

  try {
    const geo = await $fetch<{
      features?: Array<{ properties?: { city?: string; postcode?: string; context?: string } }>;
    }>('https://api-adresse.data.gouv.fr/reverse/', { query: { lon: lng, lat }, timeout: 4000 });
    const p = geo.features?.[0]?.properties;
    commune = p?.city ?? null;
    codePostal = p?.postcode ?? null;
    departement = p?.context ?? null;
  } catch {
    // Géocodage indisponible — on renvoie le reste.
  }

  try {
    const alt = await $fetch<{ elevation?: number[] }>('https://api.open-meteo.com/v1/elevation', {
      query: { latitude: lat, longitude: lng },
      timeout: 4000,
    });
    altitude = alt.elevation?.[0] != null ? Math.round(alt.elevation[0]) : null;
  } catch {
    // Altimétrie indisponible.
  }

  return { data: { lat, lng, commune, codePostal, departement, altitude } };
});
