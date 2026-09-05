// Récupération de l'occupation du sol IGN (WMS GetFeatureInfo) et classification
// d'un point. Partagé entre l'analyse d'un lieu et le scan départemental.
import {
  genererEchantillons,
  classifierCulture,
  classifierForet,
  classifierCorine,
  agregerButinage,
  AUTRE,
  type EchantillonClasse,
  type ResultatButinage,
} from '~~/server/utils/butinage';
import { hexagone, type Pt } from '~~/server/utils/geoSearch';

const WMS = 'https://data.geopf.fr/wms-r/wms';
const RPG = 'LANDUSE.AGRICULTURE.LATEST';
const FORET = 'LANDCOVER.FORESTINVENTORY.V2';
const CORINE = 'LANDCOVER.CLC18';

function gfiUrl(layer: string, lat: number, lng: number): string {
  const d = 0.001;
  const p = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeatureInfo',
    LAYERS: layer,
    QUERY_LAYERS: layer,
    STYLES: '',
    CRS: 'EPSG:4326',
    BBOX: `${lat - d},${lng - d},${lat + d},${lng + d}`,
    WIDTH: '101',
    HEIGHT: '101',
    I: '50',
    J: '50',
    FORMAT: 'image/png',
    INFO_FORMAT: 'application/json',
  });
  return `${WMS}?${p.toString()}`;
}

async function gfi(
  layer: string,
  lat: number,
  lng: number,
): Promise<Record<string, unknown> | null> {
  try {
    const r = await $fetch<{ features?: Array<{ properties?: Record<string, unknown> }> }, string>(
      gfiUrl(layer, lat, lng),
      { responseType: 'json', timeout: 4500 },
    );
    return r.features?.[0]?.properties ?? null;
  } catch {
    return null;
  }
}

/** Valeur mellifère d'un point via CORINE seul (1 appel) — pour la reconnaissance. */
export async function corineMellifere(lat: number, lng: number): Promise<number> {
  const clc = await gfi(CORINE, lat, lng);
  if (clc && clc.code_18 != null) return classifierCorine(String(clc.code_18)).mellifere;
  return 0.25;
}

/** Classe un point via les 3 sources (RPG → BD Forêt → CORINE). */
export async function classifierPoint(lat: number, lng: number): Promise<EchantillonClasse> {
  const rpg = await gfi(RPG, lat, lng);
  if (rpg && rpg.code_group != null) return classifierCulture(String(rpg.code_group));
  const foret = await gfi(FORET, lat, lng);
  if (foret)
    return classifierForet((foret.tfv_g11 as string) ?? null, (foret.essence as string) ?? null);
  const clc = await gfi(CORINE, lat, lng);
  if (clc && clc.code_18 != null) return classifierCorine(String(clc.code_18));
  return AUTRE;
}

/** Analyse complète d'un lieu (rayon 3 km, ~13 points). */
export async function analyserButinage(lat: number, lng: number): Promise<ResultatButinage> {
  const pts = genererEchantillons(lat, lng, 3000);
  const classes = await Promise.all(pts.map((p) => classifierPoint(p.lat, p.lng)));
  return agregerButinage(classes);
}

/** Classification rapide pour le scan : RPG (cultures) → CORINE (tout le reste). */
async function classifierPointScan(lat: number, lng: number): Promise<EchantillonClasse> {
  const rpg = await gfi(RPG, lat, lng);
  if (rpg && rpg.code_group != null) return classifierCulture(String(rpg.code_group));
  const clc = await gfi(CORINE, lat, lng);
  if (clc && clc.code_18 != null) return classifierCorine(String(clc.code_18));
  return AUTRE;
}

/** Échantillonnage léger (centre + 3 points à 1,5 km, 2 sources) pour le scan. */
export async function potentielLeger(
  lat: number,
  lng: number,
): Promise<{ potentiel: number; dominant: string }> {
  const dLat = 1500 / 111320;
  const dLng = 1500 / (111320 * Math.cos((lat * Math.PI) / 180) || 1);
  const pts = [{ lat, lng }];
  for (let i = 0; i < 3; i++) {
    const a = (2 * Math.PI * i) / 3;
    pts.push({ lat: lat + dLat * Math.cos(a), lng: lng + dLng * Math.sin(a) });
  }
  return scoreLeger(pts);
}

async function scoreLeger(pts: Pt[]): Promise<{ potentiel: number; dominant: string }> {
  const classes = await Promise.all(pts.map((p) => classifierPointScan(p.lat, p.lng)));
  // Score « meilleur spot » : pondère vers la meilleure ressource accessible
  // (les abeilles exploitent les bons massifs) tout en tenant compte de la
  // couverture moyenne. Discrimine mieux les bons lieux qu'une simple moyenne.
  const vals = classes.map((c) => c.mellifere);
  const mean = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
  const max = Math.max(0, ...vals);
  const potentiel = Math.round(100 * (0.5 * mean + 0.5 * max));
  const r = agregerButinage(classes);
  return { potentiel, dominant: r.ressources[0]?.label ?? '—' };
}

/**
 * Raffinement local par triangulation hexagonale : autour d'un germe, on évalue
 * les 6 sommets d'un hexagone + le centre (promesse CORINE), on se déplace vers le
 * meilleur et on resserre le rayon → convergence vers l'optimum mellifère local.
 */
export async function raffiner(seed: Pt, rayonInitial = 4000): Promise<Pt> {
  let best = { lat: seed.lat, lng: seed.lng };
  let r = rayonInitial;
  for (let it = 0; it < 2; it++) {
    const cands = [best, ...hexagone(best.lat, best.lng, r)];
    const vals = await Promise.all(cands.map((c) => corineMellifere(c.lat, c.lng)));
    let bi = 0;
    for (let i = 1; i < vals.length; i++) if ((vals[i] ?? 0) > (vals[bi] ?? 0)) bi = i;
    best = cands[bi]!;
    r /= 2;
  }
  return best;
}
