import { eq, and } from 'drizzle-orm';
import { ruchers } from '~~/server/database/schema';
import {
  wmo,
  evaluerJour,
  optimalVisite,
  dayAlerts,
  scoreHoraire,
  meilleurCreneau,
  conseilsMeteo,
  type EntreeMeteo,
} from '~~/server/utils/meteo';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const rucherId = getRouterParam(event, 'rucherId');
  if (!rucherId) badRequest('ID rucher manquant');

  const [rucher] = await db
    .select({ latitude: ruchers.latitude, longitude: ruchers.longitude, nom: ruchers.nom })
    .from(ruchers)
    .where(and(eq(ruchers.id, rucherId), eq(ruchers.userId, ownerId)))
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
    `&hourly=temperature_2m,relativehumidity_2m,precipitation_probability,precipitation,weathercode,windspeed_10m,windgusts_10m` +
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
      relativehumidity_2m: number[];
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
  const now = new Date(current.time);
  const nowHour = now.getHours();
  const todayStr = now.toISOString().slice(0, 10);

  // Heures du jour (toutes) — typées pour le scoring horaire.
  const heuresDuJour = raw.hourly.time
    .map((t, i) => ({
      heure: t,
      temp: Math.round(raw.hourly.temperature_2m[i] ?? 0),
      humidite: raw.hourly.relativehumidity_2m[i] ?? 0,
      probPluie: raw.hourly.precipitation_probability[i] ?? 0,
      pluie: raw.hourly.precipitation[i] ?? 0,
      vent: Math.round(raw.hourly.windspeed_10m[i] ?? 0),
      rafale: Math.round(raw.hourly.windgusts_10m[i] ?? 0),
      code: raw.hourly.weathercode[i] ?? 0,
      icon: wmo(raw.hourly.weathercode[i] ?? 0).icon,
    }))
    .filter((h) => h.heure.slice(0, 10) === todayStr);

  // Strip horaire affiché (prochaines ~8h)
  const heures = heuresDuJour
    .filter((h) => {
      const hHour = parseInt(h.heure.slice(11, 13), 10);
      return hHour >= nowHour && hHour <= nowHour + 12;
    })
    .slice(0, 8);

  // Meilleur créneau de visite aujourd'hui (depuis les scores horaires)
  const creneau = meilleurCreneau(
    heuresDuJour.map((h) => ({ heure: h.heure, score: scoreHoraire(h) })),
  );

  // Prévisions 14 jours (score multi-facteurs + détail par facteur)
  const previsions = raw.daily.time.map((date, i) => {
    const tempMax = raw.daily.temperature_2m_max[i] ?? 0;
    const tempMin = raw.daily.temperature_2m_min[i] ?? 0;
    const pluieMm = Math.round((raw.daily.precipitation_sum[i] ?? 0) * 10) / 10;
    const ventMax = Math.round(raw.daily.windspeed_10m_max[i] ?? 0);
    const code = raw.daily.weathercode[i] ?? 0;
    const rafaleMax = Math.round(raw.daily.windgusts_10m_max[i] ?? 0);
    const probPluie = raw.daily.precipitation_probability_max[i] ?? 0;
    const uvMax = Math.round(raw.daily.uv_index_max[i] ?? 0);

    const { alerteGel, alerteOrage, alerteVent, alerteCanicule } = dayAlerts(
      tempMin,
      tempMax,
      code,
      rafaleMax,
    );

    // Le jour courant bénéficie de l'humidité instantanée pour plus de précision.
    const entree: EntreeMeteo = {
      tempMax,
      pluieMm,
      probPluie,
      ventMax,
      rafaleMax,
      humidite: i === 0 ? current.relativehumidity_2m : 0,
      code,
    };
    const ev = evaluerJour(entree);

    return {
      date,
      tempMax: Math.round(tempMax),
      tempMin: Math.round(tempMin),
      pluieMm,
      probPluie,
      ventMax,
      rafaleMax,
      uvMax,
      code,
      label: wmo(code).label,
      icon: wmo(code).icon,
      sunrise: raw.daily.sunrise[i]?.slice(11, 16) ?? '—',
      sunset: raw.daily.sunset[i]?.slice(11, 16) ?? '—',
      scoreVisite: ev.score,
      facteurs: ev.facteurs,
      palier: ev.palier,
      optimalVisite: optimalVisite(tempMax, pluieMm, ventMax, code),
      conseils: conseilsMeteo({
        ...entree,
        tempMin,
        alerteGel,
        alerteOrage,
        alerteVent,
        alerteCanicule,
      }),
      alerteGel,
      alerteOrage,
      alerteVent,
      alerteCanicule,
    };
  });

  const auj = previsions[0];
  const conseilsAuj = auj ? [...auj.conseils] : [];
  if (creneau && auj && auj.scoreVisite >= 55) {
    conseilsAuj.unshift(`Belle fenêtre de visite aujourd'hui : ${creneau.debut}–${creneau.fin}.`);
  }

  // Alertes actives (aujourd'hui + demain)
  const alertes: string[] = [];
  const dem = previsions[1];
  if (auj) {
    if (auj.alerteGel) alertes.push(`Risque de gel cette nuit (${auj.tempMin}°C)`);
    if (auj.alerteOrage) alertes.push("Orage prévu aujourd'hui — évitez les visites");
    if (auj.alerteVent)
      alertes.push(`Rafales violentes (${auj.rafaleMax} km/h) — ruches à vérifier`);
    if (auj.alerteCanicule)
      alertes.push(`Canicule (${auj.tempMax}°C) — surveillez l'eau et la ventilation`);
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
        conditionsOptimales: (auj?.scoreVisite ?? 0) >= 70,
      },
      aujourdhui: {
        score: auj?.scoreVisite ?? 0,
        palier: auj?.palier ?? null,
        facteurs: auj?.facteurs ?? [],
        creneau,
        conseils: conseilsAuj,
      },
      heures,
      previsions,
      alertes,
    },
  };
});
