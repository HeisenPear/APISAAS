import { z } from 'zod';
import {
  genererEchantillons,
  classifierCulture,
  classifierForet,
  agregerButinage,
  AUTRE,
  type EchantillonClasse,
} from '~~/server/utils/butinage';

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

const WMS = 'https://data.geopf.fr/wms-r/wms';
const RPG = 'LANDUSE.AGRICULTURE.LATEST';
const FORET = 'LANDCOVER.FORESTINVENTORY.V2';

function gfiUrl(layer: string, lat: number, lng: number): string {
  const d = 0.001; // ~110 m
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
    const r = await $fetch<{ features?: Array<{ properties?: Record<string, unknown> }> }>(
      gfiUrl(layer, lat, lng),
      { responseType: 'json', timeout: 4500 },
    );
    return r.features?.[0]?.properties ?? null;
  } catch {
    return null;
  }
}

async function classifierPoint(lat: number, lng: number): Promise<EchantillonClasse> {
  const rpg = await gfi(RPG, lat, lng);
  if (rpg && rpg.code_group != null) return classifierCulture(String(rpg.code_group));
  const foret = await gfi(FORET, lat, lng);
  if (foret)
    return classifierForet((foret.tfv_g11 as string) ?? null, (foret.essence as string) ?? null);
  return AUTRE;
}

/**
 * GET /api/transhumance/butinage?lat=&lng=
 * Composition mellifère du rayon de butinage (~3 km) : échantillonne l'occupation
 * du sol IGN (RPG cultures + BD Forêt) en plusieurs points → % par ressource +
 * potentiel mellifère. Gated `transhumance`.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { lat, lng } = await getValidatedQuery(event, querySchema.parse);
  const samples = genererEchantillons(lat, lng, 3000);
  const classes = await Promise.all(samples.map((s) => classifierPoint(s.lat, s.lng)));
  return { data: { rayonKm: 3, ...agregerButinage(classes) } };
});
