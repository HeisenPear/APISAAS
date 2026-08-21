<template>
  <ClientOnly>
    <div ref="mapContainer" class="h-full w-full" />
    <template #fallback>
      <div class="flex h-full w-full items-center justify-center bg-[var(--surface-muted)]">
        <UIcon name="i-lucide-map" class="h-8 w-8 text-[var(--text-quaternary)]" />
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import { opaciteRichesse, type DeptBreakdown } from '~/utils/zonesMelliferes';

interface MapPoint {
  id: string;
  nom: string;
  latitude: string | number | null;
  longitude: string | number | null;
}

interface Spot {
  nom: string;
  lat: number;
  lng: number;
  potentiel: number;
}

const props = defineProps<{
  ruchers: MapPoint[];
  emplacements: MapPoint[];
  zonesMiel?: Record<string, DeptBreakdown>;
  maxRichesse?: number;
  topSpots?: Spot[];
  center?: [number, number];
  zoom?: number;
}>();

const emit = defineEmits<{
  point: [{ lat: number; lng: number }];
  zone: [{ code: string; nom: string; breakdown: DeptBreakdown }];
}>();

type L = typeof import('leaflet');
let leaflet: L | null = null;
let map: L.Map | null = null;
/** Arrêt de l'observateur de taille — voir `suivreTailleCarte`. */
let arreterSuiviTaille: (() => void) | null = null;
let markersLayer: L.LayerGroup | null = null;
let topSpotsLayer: L.LayerGroup | null = null;
let pointMarker: L.Marker | null = null;
let zonesLayer: L.GeoJSON | null = null;
let communesLayer: L.GeoJSON | null = null;
let currentDeptCommunes: string | null = null;
let detailMode = false;
let zoomBusy = false;
const communesCache = new Map<string, unknown>();
const SEUIL_COMMUNES = 9;
const mapContainer = ref<HTMLElement | null>(null);

// Géoplateforme IGN — flux ouverts, sans clé (licence ouverte 2.0).
const GEOPF = 'https://data.geopf.fr/wmts';
function ignLayer(layer: string, format = 'image/png') {
  return `${GEOPF}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=normal&TILEMATRIXSET=PM&FORMAT=${format}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`;
}

function pinIcon(color: string, size = 24) {
  if (!leaflet) return undefined;
  return leaflet.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
  });
}

function num(v: string | number | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

type DeptFeature = { properties?: { code?: string; nom?: string } | null };

function styleDept(feature?: DeptFeature) {
  const bd = feature?.properties?.code ? props.zonesMiel?.[feature.properties.code] : undefined;
  if (!bd) {
    return { fillColor: '#94a3b8', fillOpacity: 0, color: '#ffffff', weight: 0.4, opacity: 0.25 };
  }
  // En mode détail (zoom commune), le choroplèthe départemental s'estompe.
  return {
    fillColor: bd.couleur,
    fillOpacity: detailMode ? 0.12 : opaciteRichesse(bd.richesse, props.maxRichesse ?? 1),
    color: '#ffffff',
    weight: detailMode ? 0.5 : 1,
    opacity: detailMode ? 0.4 : 0.7,
  };
}

async function loadZones() {
  if (!leaflet || !map || !zonesLayer) return;
  try {
    const geo = await $fetch('/geo/departements.geojson', { responseType: 'json' });
    zonesLayer.addData(geo as Parameters<L.GeoJSON['addData']>[0]);
  } catch {
    // Fond de zones indisponible — la carte reste utilisable.
  }
}

// ── Détail communal au zoom (API officielle geo.api.gouv.fr) ──
function emitPoint(latlng: { lat: number; lng: number }) {
  if (!leaflet || !map) return;
  if (pointMarker) pointMarker.setLatLng([latlng.lat, latlng.lng]);
  else
    pointMarker = leaflet
      .marker([latlng.lat, latlng.lng], { icon: pinIcon('#9f6412', 30) })
      .addTo(map);
  emit('point', { lat: latlng.lat, lng: latlng.lng });
}

async function deptAt(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await $fetch<Array<{ codeDepartement?: string }>>(
      'https://geo.api.gouv.fr/communes',
      { query: { lat, lon: lng, fields: 'codeDepartement' }, responseType: 'json' },
    );
    return r?.[0]?.codeDepartement ?? null;
  } catch {
    return null;
  }
}

async function loadCommunes(dept: string) {
  if (!leaflet || !map) return;
  if (communesLayer) {
    map.removeLayer(communesLayer);
    communesLayer = null;
  }
  let geo = communesCache.get(dept);
  if (!geo) {
    try {
      geo = await $fetch(`https://geo.api.gouv.fr/departements/${dept}/communes`, {
        query: { fields: 'nom,code', format: 'geojson', geometry: 'contour' },
        responseType: 'json',
      });
      communesCache.set(dept, geo);
    } catch {
      return;
    }
  }
  if (!map || map.getZoom() < SEUIL_COMMUNES) return; // re-dézoomé entre-temps
  // Découpage communal coloré : chaque commune hérite du miel dominant de son
  // département (la curation est départementale ; le détail réel par lieu vient
  // de l'analyse du rayon de butinage au clic).
  const styleCommune = (f?: { properties?: { code?: string } | null }) => {
    const code = f?.properties?.code ?? '';
    const bd = code ? props.zonesMiel?.[code.slice(0, 2)] : undefined;
    return {
      fillColor: bd?.couleur ?? '#94a3b8',
      fillOpacity: bd ? 0.28 : 0.04,
      color: '#ffffff',
      weight: 0.6,
      opacity: 0.7,
    };
  };
  communesLayer = leaflet
    .geoJSON(geo as Parameters<L.GeoJSON['addData']>[0], {
      style: (f) => styleCommune(f as { properties?: { code?: string } | null }),
      onEachFeature: (f: { properties?: { nom?: string } }, layer: L.Layer) => {
        const nom = f.properties?.nom;
        if (nom) layer.bindTooltip(nom, { sticky: true });
        const path = layer as L.Path;
        layer.on('mouseover', () => path.setStyle({ fillOpacity: 0.55, weight: 1.2 }));
        layer.on('mouseout', () => communesLayer && communesLayer.resetStyle(path));
        layer.on('click', (e: L.LeafletMouseEvent) => {
          if (leaflet) leaflet.DomEvent.stopPropagation(e);
          emitPoint(e.latlng);
        });
      },
    })
    .addTo(map);
  currentDeptCommunes = dept;
}

function setDetail(on: boolean) {
  if (detailMode === on) return;
  detailMode = on;
  if (zonesLayer) zonesLayer.setStyle((f) => styleDept(f as DeptFeature));
}

async function onMapMove() {
  if (!map) return;
  if (map.getZoom() >= SEUIL_COMMUNES) {
    setDetail(true);
    if (zoomBusy) return;
    zoomBusy = true;
    const c = map.getCenter();
    const dept = await deptAt(c.lat, c.lng);
    zoomBusy = false;
    if (dept && dept !== currentDeptCommunes) await loadCommunes(dept);
  } else {
    setDetail(false);
    if (communesLayer) {
      map.removeLayer(communesLayer);
      communesLayer = null;
      currentDeptCommunes = null;
    }
  }
}

async function initMap() {
  if (!mapContainer.value) return;
  leaflet = await import('leaflet');

  map = leaflet
    .map(mapContainer.value, { zoomControl: false, attributionControl: true })
    .setView(props.center ?? [46.6, 2.3], props.zoom ?? 6);

  // Zoom déplacé en bas-droite : le haut-gauche/haut-droite est occupé par les
  // contrôles flottants de la page (mois, « zones du mois », Ma position).
  leaflet.control.zoom({ position: 'bottomright' }).addTo(map);
  map.attributionControl.setPrefix(false);

  const plan = leaflet.tileLayer(TUILES_OSM, OPTIONS_TUILES_OSM).addTo(map);
  arreterSuiviTaille = suivreTailleCarte(map, mapContainer.value);
  const satellite = leaflet.tileLayer(ignLayer('ORTHOIMAGERY.ORTHOPHOTOS', 'image/jpeg'), {
    maxZoom: 19,
    attribution: '© IGN — Géoplateforme',
  });

  const cultures = leaflet.tileLayer(ignLayer('LANDUSE.AGRICULTURE.LATEST'), {
    maxZoom: 18,
    opacity: 0.55,
    attribution: '© IGN — RPG',
  });
  const forets = leaflet.tileLayer(ignLayer('LANDCOVER.FORESTINVENTORY.V2'), {
    maxZoom: 18,
    opacity: 0.55,
    attribution: '© IGN — BD Forêt',
  });

  // Zones de miel (départements colorés par miel dominant) — visible par défaut.
  zonesLayer = leaflet
    .geoJSON(undefined, {
      style: (f) => styleDept(f as DeptFeature),
      onEachFeature: (feature: DeptFeature, layer: L.Layer) => {
        const code = feature.properties?.code;
        const nom = feature.properties?.nom ?? '';
        if (nom) layer.bindTooltip(nom, { sticky: true });
        layer.on('click', (e) => {
          if (leaflet) leaflet.DomEvent.stopPropagation(e);
          const bd = code ? props.zonesMiel?.[code] : undefined;
          if (code && bd) emit('zone', { code, nom, breakdown: bd });
        });
      },
    })
    .addTo(map);

  // Le sélecteur de calques est DÉPLIÉ sur grand écran (on voit tout d'un coup)
  // et REPLIÉ sur téléphone. Déplié en permanence, son panneau — deux fonds de
  // carte plus trois calques — mange un bon tiers de la largeur, recouvre la
  // carte et percute le bouton « Ma position » de la page, posé au même coin.
  // Replié, Leaflet rend une pastille qu'on ouvre au doigt.
  const petitEcran = !window.matchMedia('(min-width: 640px)').matches;
  leaflet.control
    .layers(
      { Plan: plan, Satellite: satellite },
      { 'Zones de miel': zonesLayer, 'Cultures (RPG)': cultures, Forêts: forets },
      { collapsed: petitEcran },
    )
    .addTo(map);

  markersLayer = leaflet.layerGroup().addTo(map);
  topSpotsLayer = leaflet.layerGroup().addTo(map);
  updateMarkers();
  updateTopSpots();
  await loadZones();

  map.on('click', (e: L.LeafletMouseEvent) => emitPoint(e.latlng));
  map.on('moveend', onMapMove);
}

function updateMarkers() {
  if (!map || !markersLayer || !leaflet) return;
  markersLayer.clearLayers();
  const bounds: [number, number][] = [];

  const add = (p: MapPoint, color: string, label: string) => {
    const lat = num(p.latitude);
    const lng = num(p.longitude);
    if (lat == null || lng == null) return;
    bounds.push([lat, lng]);
    leaflet!
      .marker([lat, lng], { icon: pinIcon(color) })
      .addTo(markersLayer!)
      .bindTooltip(`${label} · ${p.nom}`, { direction: 'top', offset: [0, -20] });
  };

  for (const r of props.ruchers) add(r, '#f59e0b', 'Rucher');
  for (const e of props.emplacements) add(e, '#c9873d', 'Emplacement');

  if (bounds.length > 0 && !props.center) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }
}

function rankIcon(rank: number) {
  if (!leaflet) return undefined;
  return leaflet.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    html: `<div style="width:28px;height:28px;background:var(--honey);border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);display:grid;place-items:center"><span style="transform:rotate(45deg);color: var(--text-primary);font-weight:800;font-size:13px">${rank}</span></div>`,
  });
}

function updateTopSpots() {
  if (!map || !topSpotsLayer || !leaflet) return;
  topSpotsLayer.clearLayers();
  const spots = props.topSpots ?? [];
  spots.forEach((s, i) => {
    leaflet!
      .marker([s.lat, s.lng], { icon: rankIcon(i + 1) })
      .addTo(topSpotsLayer!)
      .bindTooltip(`${i + 1}. ${s.nom} · ${s.potentiel}/100`, {
        direction: 'top',
        offset: [0, -26],
      })
      .on('click', (e) => {
        if (leaflet) leaflet.DomEvent.stopPropagation(e);
        emitPoint(e.latlng);
      });
  });
  if (spots.length && !props.center) {
    map.fitBounds(
      spots.map((s) => [s.lat, s.lng]),
      { padding: [60, 60], maxZoom: 11 },
    );
  }
}

watch(
  () => [props.ruchers, props.emplacements],
  () => map && updateMarkers(),
  { deep: true },
);
watch(
  () => props.topSpots,
  () => map && updateTopSpots(),
  { deep: true },
);
watch(
  () => props.center,
  (c) => c && map && map.setView(c, props.zoom ?? 12),
);
watch(
  () => props.zonesMiel,
  () => zonesLayer && zonesLayer.setStyle((f) => styleDept(f as DeptFeature)),
  { deep: true },
);

onMounted(async () => {
  await nextTick();
  await initMap();
});
onUnmounted(() => {
  arreterSuiviTaille?.();
  arreterSuiviTaille = null;
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
/*
  Cohabitation avec les boutons flottants de la PAGE sur téléphone.

  Leaflet empile ses contrôles dans les quatre coins ; la page pose les siens
  aux mêmes endroits (« Ma position » en haut à droite, la légende en bas à
  gauche). Sur grand écran il reste de la place, sur un téléphone les deux se
  recouvrent — le sélecteur de calques passait sous le bouton de position.

  Les nœuds sont créés par Leaflet, donc hors de la portée du `scoped` :
  `:deep()` est indispensable.
*/
@media (max-width: 639px) {
  /* On glisse la pile de droite SOUS le bouton « Ma position » (36 px + marge). */
  :deep(.leaflet-top.leaflet-right) {
    padding-top: 46px;
  }

  /* L'attribution IGN/OSM est longue : sans bride, elle traverse toute la
     largeur et vient buter contre la légende. On la borne et on l'ellipse. */
  :deep(.leaflet-control-attribution) {
    max-width: 62vw;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Le panneau des calques, une fois ouvert au doigt, ne doit pas déborder
     non plus : il reste dans l'écran et défile si la liste s'allonge. */
  :deep(.leaflet-control-layers-expanded) {
    max-width: calc(100vw - 92px);
    max-height: 46vh;
    overflow-y: auto;
  }
}
</style>
