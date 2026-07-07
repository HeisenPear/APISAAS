import { z } from 'zod';
import { scoreVisite, type EntreeMeteo } from '~~/server/utils/meteo';

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/**
 * GET /api/transhumance/meteo-point?lat=&lng=
 * Score météo du jour (0-100) pour un point, via Open-Meteo + le scoring de visite
 * apicole. Sert au score d'emplacement. Gated `transhumance`.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { lat, lng } = await getValidatedQuery(event, querySchema.parse);

  try {
    const raw = await $fetch<{
      daily: {
        temperature_2m_max: number[];
        weathercode: number[];
        precipitation_sum: number[];
        precipitation_probability_max: number[];
        windspeed_10m_max: number[];
        windgusts_10m_max: number[];
      };
    }>('https://api.open-meteo.com/v1/forecast', {
      query: {
        latitude: lat,
        longitude: lng,
        daily:
          'temperature_2m_max,weathercode,precipitation_sum,precipitation_probability_max,windspeed_10m_max,windgusts_10m_max',
        timezone: 'auto',
        forecast_days: 1,
      },
      responseType: 'json',
      timeout: 4500,
    });

    const e: EntreeMeteo = {
      tempMax: raw.daily.temperature_2m_max[0] ?? 15,
      pluieMm: raw.daily.precipitation_sum[0] ?? 0,
      probPluie: raw.daily.precipitation_probability_max[0] ?? 0,
      ventMax: raw.daily.windspeed_10m_max[0] ?? 0,
      rafaleMax: raw.daily.windgusts_10m_max[0] ?? 0,
      humidite: 60, // humidité journalière non exposée ; valeur neutre (poids 5%)
      code: raw.daily.weathercode[0] ?? 0,
    };

    return { data: { score: scoreVisite(e), tempMax: Math.round(e.tempMax), code: e.code } };
  } catch {
    return { data: { score: null } };
  }
});
