import { and, eq, isNull, inArray, isNotNull } from 'drizzle-orm';
import { alertes, ruchers } from '~~/server/database/schema';
import { dayAlerts, optimalVisite } from '~~/server/utils/meteo';

// ═══════════════════════════════════════════════════════════════════════════
// ALERTES MÉTÉO (cloche uniquement, jamais de push) — générées par le cron.
//   • meteo_danger    (groupée) — gel / orage / vent / canicule prévus demain
//   • meteo_favorable (groupée) — créneau idéal de visite demain
//
// In-app SEULEMENT (absentes de TYPES_PUSH) : pas de notification poussée, donc
// pas de matraquage même en pleine canicule. On résout puis régénère à chaque
// run quotidien → l'alerte reflète TOUJOURS la prévision du jour.
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

export async function construireAlertesMeteo(
  userId: string,
  dejaExiste: DejaExiste,
): Promise<AlerteInsert[]> {
  const lieux = await db
    .select({ latitude: ruchers.latitude, longitude: ruchers.longitude })
    .from(ruchers)
    .where(
      and(eq(ruchers.userId, userId), isNotNull(ruchers.latitude), isNotNull(ruchers.longitude)),
    );
  if (lieux.length === 0) return [];

  // Dédup par coordonnées arrondies (~1 km), plafonné.
  const coords = new Map<string, { lat: number; lon: number }>();
  for (const l of lieux) {
    const lat = Number(l.latitude);
    const lon = Number(l.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const cle = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (!coords.has(cle)) coords.set(cle, { lat, lon });
    if (coords.size >= MAX_COORDS) break;
  }

  const previsions = (
    await Promise.all([...coords.values()].map((c) => previsionDemain(c.lat, c.lon)))
  ).filter((p): p is PrevisionDemain => p !== null);
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
