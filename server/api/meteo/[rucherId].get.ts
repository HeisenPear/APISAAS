import { eq, and } from 'drizzle-orm';
import { ruchers } from '~~/server/database/schema';

const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: 'Ciel dégagé', icon: '☀️' },
  1: { label: 'Peu nuageux', icon: '🌤️' },
  2: { label: 'Partiellement nuageux', icon: '⛅' },
  3: { label: 'Couvert', icon: '☁️' },
  45: { label: 'Brouillard', icon: '🌫️' },
  48: { label: 'Brouillard givrant', icon: '🌫️' },
  51: { label: 'Bruine légère', icon: '🌦️' },
  53: { label: 'Bruine', icon: '🌦️' },
  55: { label: 'Bruine forte', icon: '🌧️' },
  61: { label: 'Pluie légère', icon: '🌧️' },
  63: { label: 'Pluie', icon: '🌧️' },
  65: { label: 'Pluie forte', icon: '🌧️' },
  71: { label: 'Neige légère', icon: '🌨️' },
  73: { label: 'Neige', icon: '❄️' },
  75: { label: 'Neige forte', icon: '❄️' },
  77: { label: 'Grésil', icon: '🌨️' },
  80: { label: 'Averses légères', icon: '🌦️' },
  81: { label: 'Averses', icon: '🌧️' },
  82: { label: 'Averses violentes', icon: '⛈️' },
  85: { label: 'Averses de neige', icon: '🌨️' },
  95: { label: 'Orage', icon: '⛈️' },
  96: { label: 'Orage avec grêle', icon: '⛈️' },
  99: { label: 'Orage violent', icon: '⛈️' },
};

function wmo(code: number) {
  return WMO[code] ?? { label: 'Inconnu', icon: '🌡️' };
}

/** Score de visite apicole 0-100 basé sur les conditions du jour */
function scoreVisite(tempMax: number, pluieMm: number, ventMax: number, code: number): number {
  let score = 0;

  // Température (40 pts)
  if (tempMax >= 20) score += 40;
  else if (tempMax >= 15) score += 30;
  else if (tempMax >= 12) score += 15;

  // Précipitations (30 pts)
  if (pluieMm === 0) score += 30;
  else if (pluieMm <= 2) score += 15;

  // Vent (20 pts)
  if (ventMax < 15) score += 20;
  else if (ventMax < 25) score += 10;

  // Ciel (10 pts)
  if (code <= 2) score += 10;
  else if (code === 3) score += 5;

  return Math.min(100, score);
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const rucherId = getRouterParam(event, 'rucherId');
  if (!rucherId) badRequest('ID rucher manquant');

  const [rucher] = await db
    .select({ latitude: ruchers.latitude, longitude: ruchers.longitude, nom: ruchers.nom })
    .from(ruchers)
    .where(and(eq(ruchers.id, rucherId), eq(ruchers.userId, user.id)))
    .limit(1);

  if (!rucher) notFound('Rucher introuvable');
  if (!rucher.latitude || !rucher.longitude) {
    throw createError({ statusCode: 422, message: "Ce rucher n'a pas de coordonnées GPS" });
  }

  const lat = Number(rucher.latitude);
  const lon = Number(rucher.longitude);

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,windspeed_10m,windgusts_10m,weathercode,precipitation,relativehumidity_2m` +
    `&hourly=temperature_2m,precipitation_probability,precipitation,weathercode,windspeed_10m,windgusts_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,precipitation_probability_max,windspeed_10m_max,windgusts_10m_max,sunrise,sunset,uv_index_max` +
    `&timezone=Europe%2FParis&forecast_days=14&wind_speed_unit=kmh`;

  const raw = await $fetch<{
    current: {
      time: string;
      temperature_2m: number;
      apparent_temperature: number;
      windspeed_10m: number;
      windgusts_10m: number;
      weathercode: number;
      precipitation: number;
      relativehumidity_2m: number;
    };
    hourly: {
      time: string[];
      temperature_2m: number[];
      precipitation_probability: number[];
      precipitation: number[];
      weathercode: number[];
      windspeed_10m: number[];
      windgusts_10m: number[];
    };
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      weathercode: number[];
      precipitation_sum: number[];
      precipitation_probability_max: number[];
      windspeed_10m_max: number[];
      windgusts_10m_max: number[];
      sunrise: string[];
      sunset: string[];
      uv_index_max: number[];
    };
  }>(url);

  const current = raw.current;
  const wmoNow = wmo(current.weathercode);

  const conditionsOptimales =
    current.temperature_2m >= 15 &&
    current.windspeed_10m < 20 &&
    current.precipitation === 0 &&
    current.weathercode < 51;

  // Prochaines 24h en horaire (depuis l'heure actuelle)
  const now = new Date(current.time);
  const nowHour = now.getHours();
  const todayStr = now.toISOString().slice(0, 10);

  const heures = raw.hourly.time
    .map((t, i) => ({
      heure: t,
      temp: Math.round(raw.hourly.temperature_2m[i] ?? 0),
      probPluie: raw.hourly.precipitation_probability[i] ?? 0,
      pluie: raw.hourly.precipitation[i] ?? 0,
      vent: Math.round(raw.hourly.windspeed_10m[i] ?? 0),
      rafale: Math.round(raw.hourly.windgusts_10m[i] ?? 0),
      code: raw.hourly.weathercode[i] ?? 0,
      icon: wmo(raw.hourly.weathercode[i] ?? 0).icon,
    }))
    .filter((h) => {
      const hDate = h.heure.slice(0, 10);
      const hHour = parseInt(h.heure.slice(11, 13));
      return hDate === todayStr && hHour >= nowHour && hHour <= nowHour + 12;
    })
    .slice(0, 8);

  // Prévisions 14 jours
  const previsions = raw.daily.time.map((date, i) => {
    const tempMax = raw.daily.temperature_2m_max[i] ?? 0;
    const tempMin = raw.daily.temperature_2m_min[i] ?? 0;
    const pluieMm = raw.daily.precipitation_sum[i] ?? 0;
    const ventMax = raw.daily.windspeed_10m_max[i] ?? 0;
    const code = raw.daily.weathercode[i] ?? 0;
    const rafaleMax = raw.daily.windgusts_10m_max[i] ?? 0;
    const probPluie = raw.daily.precipitation_probability_max[i] ?? 0;
    const uvMax = raw.daily.uv_index_max[i] ?? 0;

    // Alertes apicoles
    const alerteGel = tempMin <= 3;
    const alerteOrage = code >= 95;
    const alerteVent = rafaleMax >= 40;

    return {
      date,
      tempMax: Math.round(tempMax),
      tempMin: Math.round(tempMin),
      pluieMm: Math.round(pluieMm * 10) / 10,
      probPluie,
      ventMax: Math.round(ventMax),
      rafaleMax: Math.round(rafaleMax),
      uvMax: Math.round(uvMax),
      code,
      label: wmo(code).label,
      icon: wmo(code).icon,
      sunrise: raw.daily.sunrise[i]?.slice(11, 16) ?? '—',
      sunset: raw.daily.sunset[i]?.slice(11, 16) ?? '—',
      scoreVisite: scoreVisite(tempMax, pluieMm, ventMax, code),
      optimalVisite: tempMax >= 15 && pluieMm === 0 && ventMax < 20 && code < 51,
      alerteGel,
      alerteOrage,
      alerteVent,
    };
  });

  // Alertes actives (basées sur aujourd'hui + demain)
  const alertes: string[] = [];
  const auj = previsions[0];
  const dem = previsions[1];
  if (auj) {
    if (auj.alerteGel) alertes.push(`Risque de gel cette nuit (${auj.tempMin}°C)`);
    if (auj.alerteOrage) alertes.push("Orage prévu aujourd'hui — évitez les visites");
    if (auj.alerteVent)
      alertes.push(`Rafales violentes (${auj.rafaleMax} km/h) — ruches à vérifier`);
  }
  if (dem) {
    if (dem.alerteGel && !auj?.alerteGel)
      alertes.push(`Risque de gel demain nuit (${dem.tempMin}°C)`);
    if (dem.alerteOrage && !auj?.alerteOrage) alertes.push('Orage prévu demain');
  }

  return {
    data: {
      rucherNom: rucher.nom,
      actuel: {
        temperature: Math.round(current.temperature_2m),
        ressenti: Math.round(current.apparent_temperature),
        vent: Math.round(current.windspeed_10m),
        rafale: Math.round(current.windgusts_10m),
        humidite: current.relativehumidity_2m,
        pluie: current.precipitation,
        code: current.weathercode,
        label: wmoNow.label,
        icon: wmoNow.icon,
        conditionsOptimales,
      },
      heures,
      previsions,
      alertes,
    },
  };
});
