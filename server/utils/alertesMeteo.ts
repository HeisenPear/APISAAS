import { and, eq, isNotNull } from 'drizzle-orm';
import { ruchers, type alertes } from '~~/server/database/schema';
import { dayAlerts, optimalVisite } from '~~/server/utils/meteo';
import type { ContexteResolution } from '~~/server/utils/moteurAlertes/types';

// ═══════════════════════════════════════════════════════════════════════════
// ALERTES MÉTÉO (cloche uniquement, jamais de push) — générées par le cron.
//   • meteo_danger    (groupée) — gel / orage / vent / canicule prévus demain
//   • meteo_favorable (groupée) — créneau idéal de visite demain
//
// In-app SEULEMENT (absentes de TYPES_PUSH) : pas de notification poussée, donc
// pas de matraquage même en pleine canicule. On résout puis régénère à chaque
// run quotidien → l'alerte reflète TOUJOURS la prévision du jour.
//
// Découpage : la DÉCISION est pure et testée (interpretation → agrégation →
// alertes) ; seul le fetch Open-Meteo touche le réseau, et il est injectable
// pour que la règle soit vérifiable sans sortir de la machine.
// Best-effort : un échec réseau ne bloque jamais le cron — mais il est
// désormais LOGUÉ (une ligne par run, pas une par coordonnée).
// ═══════════════════════════════════════════════════════════════════════════

type AlerteInsert = typeof alertes.$inferInsert;
type DejaExiste = (type: string, referenceId?: string) => boolean;

const TYPES_METEO = ['meteo_danger', 'meteo_favorable'];
/** Plafond de requêtes Open-Meteo par utilisateur et par run (anti-coût/latence). */
export const MAX_COORDS = 20;

/** Une journée Open-Meteo réduite à ce dont les règles ont besoin. */
export interface JourMeteoBrut {
  tempMin: number;
  tempMax: number;
  code: number;
  pluieMm: number;
  ventKmh: number;
  rafaleKmh: number;
}

/** Verdicts apicoles d'une journée. */
export interface PrevisionDemain {
  gel: boolean;
  orage: boolean;
  vent: boolean;
  canicule: boolean;
  favorable: boolean;
  tempMin: number;
  tempMax: number;
}

/** Bloc `daily` d'une réponse Open-Meteo, tel qu'il arrive (tout est optionnel). */
export interface ReponseOpenMeteo {
  daily?: {
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    weathercode?: (number | null)[];
    precipitation_sum?: (number | null)[];
    windspeed_10m_max?: (number | null)[];
    windgusts_10m_max?: (number | null)[];
  };
}

/** Récupération d'une prévision — injectable pour tester sans réseau. */
export type RecupererPrevision = (lat: number, lon: number) => Promise<JourMeteoBrut | null>;

/** URL Open-Meteo d'une prévision à 2 jours (aujourd'hui + demain). PURE. */
export function urlPrevisionDemain(lat: number, lon: number): string {
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max,windgusts_10m_max` +
    `&timezone=Europe%2FParis&forecast_days=2&wind_speed_unit=kmh`
  );
}

/**
 * Extrait la journée de DEMAIN (index 1) d'une réponse Open-Meteo. PURE.
 * `null` si la donnée manque — c'est le seul champ dont l'absence disqualifie
 * toute la prévision, les autres retombent sur 0.
 */
export function extraireJourDemain(
  reponse: ReponseOpenMeteo | null | undefined,
  index = 1,
): JourMeteoBrut | null {
  const d = reponse?.daily;
  if (!d) return null;
  const tempMax = d.temperature_2m_max?.[index];
  if (tempMax == null) return null;
  return {
    tempMax,
    tempMin: d.temperature_2m_min?.[index] ?? 0,
    code: d.weathercode?.[index] ?? 0,
    pluieMm: d.precipitation_sum?.[index] ?? 0,
    ventKmh: d.windspeed_10m_max?.[index] ?? 0,
    rafaleKmh: d.windgusts_10m_max?.[index] ?? 0,
  };
}

/** Journée brute → verdicts apicoles. PURE (délègue à meteo.ts, déjà testé). */
export function evaluerPrevision(j: JourMeteoBrut): PrevisionDemain {
  const a = dayAlerts(j.tempMin, j.tempMax, j.code, j.rafaleKmh);
  return {
    gel: a.alerteGel,
    orage: a.alerteOrage,
    vent: a.alerteVent,
    canicule: a.alerteCanicule,
    favorable: optimalVisite(j.tempMax, j.pluieMm, j.ventKmh, j.code),
    tempMin: Math.round(j.tempMin),
    tempMax: Math.round(j.tempMax),
  };
}

/**
 * Coordonnée exploitable, ou `null`.
 *
 * ⚠️ `Number(null)` vaut 0 et `Number('')` aussi : un rucher sans latitude
 * serait devenu un point valide au large du golfe de Guinée. La requête filtre
 * déjà les NULL, mais une fonction pure ne doit pas dépendre de son appelant.
 */
function versCoordonnee(valeur: unknown): number | null {
  if (valeur === null || valeur === undefined || valeur === '') return null;
  const n = Number(valeur);
  return Number.isFinite(n) ? n : null;
}

/**
 * Dédup des ruchers par coordonnées arrondies (~1 km) et plafond de requêtes.
 * PURE. Les coordonnées illisibles sont ignorées plutôt que d'interroger
 * Open-Meteo sur `NaN` — ou pire, sur (0, 0).
 */
export function dedupliquerCoordonnees(
  lieux: ReadonlyArray<{ latitude: unknown; longitude: unknown }>,
  max = MAX_COORDS,
): Array<{ lat: number; lon: number }> {
  const coords = new Map<string, { lat: number; lon: number }>();
  for (const l of lieux) {
    const lat = versCoordonnee(l.latitude);
    const lon = versCoordonnee(l.longitude);
    if (lat === null || lon === null) continue;
    const cle = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (!coords.has(cle)) coords.set(cle, { lat, lon });
    if (coords.size >= max) break;
  }
  return [...coords.values()];
}

/**
 * Dangers présents sur AU MOINS UN rucher, dans un ordre stable. PURE.
 * L'agrégation est un OU : un seul rucher sous l'orage suffit à alerter.
 */
export function agregerDangers(previsions: readonly PrevisionDemain[]): string[] {
  const dangers: string[] = [];
  if (previsions.some((p) => p.gel)) dangers.push('gel');
  if (previsions.some((p) => p.canicule)) dangers.push('canicule');
  if (previsions.some((p) => p.orage)) dangers.push('orage');
  if (previsions.some((p) => p.vent)) dangers.push('vent fort');
  return dangers;
}

/**
 * LA DÉCISION : 0, 1 ou 2 alertes à partir des prévisions agrégées. PURE.
 * `meteo_favorable` n'est émise QUE si aucun danger n'est prévu — on ne pousse
 * pas à visiter par mauvais temps.
 */
export function deciderAlertesMeteo(
  userId: string,
  previsions: readonly PrevisionDemain[],
  dejaExiste: DejaExiste,
): AlerteInsert[] {
  if (previsions.length === 0) return [];
  const out: AlerteInsert[] = [];
  const dangers = agregerDangers(previsions);

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

/** Fetch réel — la seule I/O réseau du module. */
async function recupererPrevisionOpenMeteo(
  lat: number,
  lon: number,
): Promise<JourMeteoBrut | null> {
  const raw = await $fetch<ReponseOpenMeteo>(urlPrevisionDemain(lat, lon), { timeout: 5000 });
  return extraireJourDemain(raw);
}

/**
 * Alertes météo d'un utilisateur : lit ses ruchers géolocalisés, interroge
 * Open-Meteo, puis décide. Le fetch est injectable (`opts.recuperer`).
 */
export async function construireAlertesMeteo(
  userId: string,
  dejaExiste: DejaExiste,
  opts: { recuperer?: RecupererPrevision; maxCoords?: number } = {},
): Promise<AlerteInsert[]> {
  const lieux = await db
    .select({ latitude: ruchers.latitude, longitude: ruchers.longitude })
    .from(ruchers)
    .where(
      and(eq(ruchers.userId, userId), isNotNull(ruchers.latitude), isNotNull(ruchers.longitude)),
    );
  if (lieux.length === 0) return [];

  const coords = dedupliquerCoordonnees(lieux, opts.maxCoords ?? MAX_COORDS);
  const recuperer = opts.recuperer ?? recupererPrevisionOpenMeteo;

  // Un échec par coordonnée ne disqualifie que cette coordonnée. On compte les
  // échecs pour n'écrire QU'UNE ligne de log par run : quand Open-Meteo tombe,
  // 20 lignes par utilisateur × tous les comptes noieraient les logs Vercel.
  let echecs = 0;
  const bruts = await Promise.all(
    coords.map((c) =>
      recuperer(c.lat, c.lon).catch(() => {
        echecs++;
        return null;
      }),
    ),
  );
  if (echecs > 0) {
    console.warn(`[alertesMeteo] ${echecs}/${coords.length} prévisions indisponibles`, { userId });
  }

  const previsions = bruts.filter((b): b is JourMeteoBrut => b !== null).map(evaluerPrevision);
  return deciderAlertesMeteo(userId, previsions, dejaExiste);
}

/**
 * TOUTES les alertes météo actives : on résout puis on régénère à chaque run,
 * pour que l'alerte reflète toujours la prévision du jour. PURE.
 */
export function resolutionsMeteo(ctx: ContexteResolution): string[] {
  return ctx.existantes.filter((a) => TYPES_METEO.includes(a.type)).map((a) => a.id);
}
