/**
 * Client RPG (Registre Parcellaire Graphique) via le WFS public de la
 * Géoplateforme IGN — open data, sans clé API.
 *
 * Récupère les parcelles agricoles (code culture + surface) autour d'un point.
 * Défensif : plusieurs millésimes tentés (le layer « LATEST » n'existe pas
 * toujours) et double ordre d'axes BBOX (l'ordre lat/lon vs lon/lat varie
 * selon les déploiements WFS 2.0). Résultats mis en cache mémoire 24 h par
 * zone (~110 m de granularité) pour épargner le service et la latence.
 */
import type { ParcelleMellifere } from '~~/server/utils/mellifere';

const WFS_URL = 'https://data.geopf.fr/wfs/ows';
const LAYERS = [
  process.env.NUXT_RPG_LAYER, // surcharge possible sans redéploiement de code
  'RPG.LATEST:parcelles_graphiques',
  'RPG.2023:parcelles_graphiques',
  'RPG.2022:parcelles_graphiques',
].filter(Boolean) as string[];

interface FeatureRPG {
  properties?: { code_cultu?: string; surf_parc?: number | string };
  geometry?: { type: string; coordinates: unknown };
}

interface CacheEntry {
  at: number;
  millesime: string;
  parcelles: ParcelleMellifere[];
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 3600 * 1000;
const CACHE_MAX = 80;

export interface ResultatRPG {
  millesime: string;
  parcelles: ParcelleMellifere[];
}

export async function fetchParcellesRPG(
  lat: number,
  lng: number,
  rayonM: number,
): Promise<ResultatRPG> {
  const key = `${lat.toFixed(3)}:${lng.toFixed(3)}:${rayonM}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { millesime: hit.millesime, parcelles: hit.parcelles };
  }

  // BBOX englobante du cercle (1° lat ≈ 111,32 km)
  const dLat = rayonM / 111_320;
  const dLng = rayonM / (111_320 * Math.cos((lat * Math.PI) / 180));
  const bboxLatLon = `${lat - dLat},${lng - dLng},${lat + dLat},${lng + dLng},urn:ogc:def:crs:EPSG::4326`;
  const bboxLonLat = `${lng - dLng},${lat - dLat},${lng + dLng},${lat + dLat},urn:ogc:def:crs:EPSG::4326`;

  let lastError: unknown = null;
  for (const layer of LAYERS) {
    for (const bbox of [bboxLatLon, bboxLonLat]) {
      try {
        const features = await wfsGetFeature(layer, bbox);
        if (features === null) continue; // layer inconnu / erreur service → essai suivant
        if (features.length === 0) continue; // mauvais ordre d'axes probable → essai suivant
        const parcelles = toParcelles(features, lat, lng, rayonM);
        const millesime = layer.split(':')[0]?.replace('RPG.', '') ?? layer;
        cache.set(key, { at: Date.now(), millesime, parcelles });
        if (cache.size > CACHE_MAX) {
          const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
          if (oldest) cache.delete(oldest[0]);
        }
        return { millesime, parcelles };
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw createError({
    statusCode: 502,
    message: `Service RPG (IGN) indisponible pour cette zone${lastError instanceof Error ? ` : ${lastError.message}` : ''}. Réessayez plus tard.`,
  });
}

async function wfsGetFeature(layer: string, bbox: string): Promise<FeatureRPG[] | null> {
  const params = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '2.0.0',
    REQUEST: 'GetFeature',
    TYPENAMES: layer,
    SRSNAME: 'EPSG:4326',
    BBOX: bbox,
    COUNT: '900',
    OUTPUTFORMAT: 'application/json',
  });
  const res = await fetch(`${WFS_URL}?${params}`, {
    signal: AbortSignal.timeout(12_000),
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const text = await res.text();
  // Le WFS renvoie du XML d'erreur (ExceptionReport) avec un statut 200 sur
  // certains cas (layer inconnu…) — on ne tente le JSON que si c'en est
  if (!text.trimStart().startsWith('{')) return null;
  const json = JSON.parse(text) as { features?: FeatureRPG[] };
  return json.features ?? [];
}

function toParcelles(
  features: FeatureRPG[],
  lat: number,
  lng: number,
  rayonM: number,
): ParcelleMellifere[] {
  const out: ParcelleMellifere[] = [];
  for (const f of features) {
    const code = f.properties?.code_cultu;
    const surf = Number(f.properties?.surf_parc);
    if (!code || !Number.isFinite(surf) || surf <= 0) continue;
    const centroid = centroidOf(f.geometry);
    if (!centroid) continue;
    const d = haversineM(lat, lng, centroid[1], centroid[0]);
    if (d > rayonM) continue; // la BBOX est carrée, on filtre au cercle
    out.push({ code, surfaceHa: surf, distanceM: Math.round(d) });
  }
  return out;
}

/** Centroïde approximatif (moyenne des sommets de l'anneau extérieur) — suffisant pour un filtre de distance */
function centroidOf(geometry: FeatureRPG['geometry']): [number, number] | null {
  if (!geometry) return null;
  const ring =
    geometry.type === 'Polygon'
      ? (geometry.coordinates as number[][][])[0]
      : geometry.type === 'MultiPolygon'
        ? (geometry.coordinates as number[][][][])[0]?.[0]
        : null;
  if (!ring || ring.length === 0) return null;
  let sx = 0;
  let sy = 0;
  for (const [x, y] of ring as [number, number][]) {
    sx += x;
    sy += y;
  }
  return [sx / ring.length, sy / ring.length];
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
