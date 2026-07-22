import { and, eq, isNull, inArray, isNotNull } from 'drizzle-orm';
import { alertes, ruchers } from '~~/server/database/schema';
import { dayAlerts, optimalVisite } from '~~/server/utils/meteo';

// ═══════════════════════════════════════════════════════════════════════════
// ALERTES MÉTÉO — générées par le cron.
//   • meteo_danger    (groupée) — gel / orage / vent / canicule prévus demain
//                       → POUSSÉE (tous les plans) : c'est une sécurité cheptel.
//   • meteo_favorable (groupée) — créneau idéal de visite demain → in-app seul.
//
// On résout puis régénère à chaque run → l'alerte reflète TOUJOURS la prévision.
// L'unicité (une seule `meteo_danger` active/user via `dejaExiste`) borne le push
// à un seul par jour depuis ce chemin ; le cron `urgences` ajoute la réactivité
// intraday avec son propre anti-doublon.
// Best-effort : tout échec réseau est avalé (ne bloque jamais le cron).
// ═══════════════════════════════════════════════════════════════════════════

type AlerteInsert = typeof alertes.$inferInsert;
type DejaExiste = (type: string, referenceId?: string) => boolean;

const TYPES_METEO = ['meteo_danger', 'meteo_favorable'];
/** Plafond de requêtes Open-Meteo par utilisateur et par run (anti-coût/latence). */
const MAX_COORDS = 20;

interface PrevisionDemain {
  gel: boolean;
  orage: boolean;
  vent: boolean;
  canicule: boolean;
  favorable: boolean;
  tempMin: number;
  tempMax: number;
}

async function previsionDemain(lat: number, lon: number): Promise<PrevisionDemain | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,windgusts_10m_max` +
    `&timezone=Europe%2FParis&forecast_days=2&wind_speed_unit=kmh`;
  try {
    const raw = await $fetch<{
      daily: {
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        weathercode: number[];
        precipitation_sum: number[];
        windspeed_10m_max: number[];
        windgusts_10m_max: number[];
      };
    }>(url, { timeout: 5000 });
    const d = raw.daily;
    const i = 1; // demain
    if (d.temperature_2m_max[i] == null) return null;
    const tempMax = d.temperature_2m_max[i] ?? 0;
    const tempMin = d.temperature_2m_min[i] ?? 0;
    const code = d.weathercode[i] ?? 0;
    const pluie = d.precipitation_sum[i] ?? 0;
    const vent = d.windspeed_10m_max[i] ?? 0;
    const rafale = d.windgusts_10m_max[i] ?? 0;
    const a = dayAlerts(tempMin, tempMax, code, rafale);
    return {
      gel: a.alerteGel,
      orage: a.alerteOrage,
      vent: a.alerteVent,
      canicule: a.alerteCanicule,
      favorable: optimalVisite(tempMax, pluie, vent, code),
      tempMin: Math.round(tempMin),
      tempMax: Math.round(tempMax),
    };
  } catch {
    return null;
  }
}

/** Coordonnées uniques (dédup ~1 km, plafonnées) des ruchers géolocalisés. */
async function chargerCoordsRuchers(userId: string): Promise<Array<{ lat: number; lon: number }>> {
  const lieux = await db
    .select({ latitude: ruchers.latitude, longitude: ruchers.longitude })
    .from(ruchers)
    .where(
      and(eq(ruchers.userId, userId), isNotNull(ruchers.latitude), isNotNull(ruchers.longitude)),
    );
  const coords = new Map<string, { lat: number; lon: number }>();
  for (const l of lieux) {
    const lat = Number(l.latitude);
    const lon = Number(l.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const cle = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (!coords.has(cle)) coords.set(cle, { lat, lon });
    if (coords.size >= MAX_COORDS) break;
  }
  return [...coords.values()];
}

export async function construireAlertesMeteo(
  userId: string,
  dejaExiste: DejaExiste,
): Promise<AlerteInsert[]> {
  const coords = await chargerCoordsRuchers(userId);
  if (coords.length === 0) return [];

  const previsions = (await Promise.all(coords.map((c) => previsionDemain(c.lat, c.lon)))).filter(
    (p): p is PrevisionDemain => p !== null,
  );
  if (previsions.length === 0) return [];

  const out: AlerteInsert[] = [];

  // Danger météo (au moins un lieu concerné demain)
  const dangers: string[] = [];
  if (previsions.some((p) => p.gel)) dangers.push('gel');
  if (previsions.some((p) => p.canicule)) dangers.push('canicule');
  if (previsions.some((p) => p.orage)) dangers.push('orage');
  if (previsions.some((p) => p.vent)) dangers.push('vent fort');

  if (dangers.length > 0 && !dejaExiste('meteo_danger')) {
    out.push({
      userId,
      type: 'meteo_danger',
      titre: `Alerte météo demain : ${dangers.join(', ')}`,
      message: `Conditions à risque prévues demain sur tes ruchers (${dangers.join(', ')}). Sécurise les toits, surveille l'abreuvement en cas de chaleur et évite les visites par orage ou grand vent.`,
      priorite: 'haute',
      referenceType: 'meteo',
      actionUrl: '/meteo',
      lue: false,
    });
  }

  // Créneau favorable (uniquement si AUCUN danger — on ne pousse pas à visiter par mauvais temps)
  if (
    dangers.length === 0 &&
    previsions.some((p) => p.favorable) &&
    !dejaExiste('meteo_favorable')
  ) {
    out.push({
      userId,
      type: 'meteo_favorable',
      titre: 'Demain : créneau idéal pour visiter 🐝',
      message:
        'La météo de demain s’annonce parfaite pour les visites (douce, calme et sans pluie). Profites-en pour avancer ton planning au rucher.',
      priorite: 'basse',
      referenceType: 'meteo',
      actionUrl: '/meteo',
      lue: false,
    });
  }

  return out;
}

/** Instant courant au format horaire Open-Meteo (Europe/Paris) : « YYYY-MM-DDTHH:00 ». */
function heureParisISO(now: Date): string {
  const p = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Europe/Paris',
  }).formatToParts(now);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:00`;
}

interface DangerHoraire {
  gel: boolean;
  orage: boolean;
  vent: boolean;
  canicule: boolean;
}

/** Danger météo sur la fenêtre des ~12 prochaines heures (prévision HORAIRE). */
async function dangerHoraire(lat: number, lon: number, now: Date): Promise<DangerHoraire | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,weathercode,windgusts_10m` +
    `&timezone=Europe%2FParis&forecast_days=2&wind_speed_unit=kmh`;
  try {
    const raw = await $fetch<{
      hourly: {
        time: string[];
        temperature_2m: number[];
        weathercode: number[];
        windgusts_10m: number[];
      };
    }>(url, { timeout: 5000 });
    const h = raw.hourly;
    if (!h?.time?.length) return null;

    // Fenêtre : de l'heure courante à +12 h.
    let idx = h.time.indexOf(heureParisISO(now));
    if (idx < 0) idx = 0;
    const fin = Math.min(idx + 12, h.time.length);

    let tMin = Infinity;
    let tMax = -Infinity;
    let codeMax = 0;
    let rafaleMax = 0;
    for (let i = idx; i < fin; i++) {
      const t = h.temperature_2m[i];
      const c = h.weathercode[i];
      const g = h.windgusts_10m[i];
      if (typeof t === 'number') {
        tMin = Math.min(tMin, t);
        tMax = Math.max(tMax, t);
      }
      if (typeof c === 'number') codeMax = Math.max(codeMax, c);
      if (typeof g === 'number') rafaleMax = Math.max(rafaleMax, g);
    }
    if (!Number.isFinite(tMin)) return null;

    const a = dayAlerts(tMin, tMax, codeMax, rafaleMax);
    return {
      gel: a.alerteGel,
      orage: a.alerteOrage,
      vent: a.alerteVent,
      canicule: a.alerteCanicule,
    };
  } catch {
    return null;
  }
}

/**
 * Danger météo INTRADAY (prochaines ~12 h) → alerte `meteo_danger` si un danger
 * apparaît et qu'aucune n'est déjà active (dejaExiste évite le doublon avec le
 * cron 8 h « demain »). Utilisé par le cron `urgences` pour la réactivité en
 * cours de journée. L'unicité de l'alerte active borne le nombre de push.
 */
export async function construireDangerMeteoIntraday(
  userId: string,
  dejaExiste: DejaExiste,
  now: Date,
): Promise<AlerteInsert[]> {
  if (dejaExiste('meteo_danger')) return [];
  const coords = await chargerCoordsRuchers(userId);
  if (coords.length === 0) return [];

  const res = (await Promise.all(coords.map((c) => dangerHoraire(c.lat, c.lon, now)))).filter(
    (r): r is DangerHoraire => r !== null,
  );
  if (res.length === 0) return [];

  const dangers: string[] = [];
  if (res.some((r) => r.gel)) dangers.push('gel');
  if (res.some((r) => r.canicule)) dangers.push('canicule');
  if (res.some((r) => r.orage)) dangers.push('orage');
  if (res.some((r) => r.vent)) dangers.push('vent fort');
  if (dangers.length === 0) return [];

  return [
    {
      userId,
      type: 'meteo_danger',
      titre: `Alerte météo : ${dangers.join(', ')}`,
      message: `Conditions à risque dans les prochaines heures sur tes ruchers (${dangers.join(
        ', ',
      )}). Sécurise les toits, surveille l'abreuvement en cas de chaleur et évite les visites par orage ou grand vent.`,
      priorite: 'haute',
      referenceType: 'meteo',
      actionUrl: '/meteo',
      lue: false,
    },
  ];
}

/** Résout toutes les alertes météo actives — elles seront régénérées si toujours pertinentes. */
export async function autoResoudreMeteo(userId: string): Promise<void> {
  const now = new Date();
  const actives = await db
    .select({ id: alertes.id })
    .from(alertes)
    .where(
      and(
        eq(alertes.userId, userId),
        isNull(alertes.resolvedAt),
        inArray(alertes.type, TYPES_METEO),
      ),
    );
  if (actives.length === 0) return;
  await db
    .update(alertes)
    .set({ resolvedAt: now, updatedAt: now })
    .where(
      inArray(
        alertes.id,
        actives.map((a) => a.id),
      ),
    );
}
