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

const props = defineProps<{
  ruchers: MapPoint[];
  emplacements: MapPoint[];
  zonesMiel?: Record<string, DeptBreakdown>;
  maxRichesse?: number;
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
let markersLayer: L.LayerGroup | null = null;
let pointMarker: L.Marker | null = null;
let zonesLayer: L.GeoJSON | null = null;
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
  return {
    fillColor: bd.couleur,
    fillOpacity: opaciteRichesse(bd.richesse, props.maxRichesse ?? 1),
    color: '#ffffff',
    weight: 1,
    opacity: 0.7,
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

async function initMap() {
  if (!mapContainer.value) return;
  leaflet = await import('leaflet');

  map = leaflet
    .map(mapContainer.value, { zoomControl: true, attributionControl: true })
    .setView(props.center ?? [46.6, 2.3], props.zoom ?? 6);

  map.attributionControl.setPrefix(false);

  const plan = leaflet
    .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    })
    .addTo(map);
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

  leaflet.control
    .layers(
      { Plan: plan, Satellite: satellite },
      { 'Zones de miel': zonesLayer, 'Cultures (RPG)': cultures, Forêts: forets },
      { collapsed: false },
    )
    .addTo(map);

  markersLayer = leaflet.layerGroup().addTo(map);
  updateMarkers();
  await loadZones();

  map.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    if (!leaflet || !map) return;
    if (pointMarker) pointMarker.setLatLng([lat, lng]);
    else pointMarker = leaflet.marker([lat, lng], { icon: pinIcon('#a86a13', 30) }).addTo(map);
    emit('point', { lat, lng });
  });
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
  for (const e of props.emplacements) add(e, '#7a9676', 'Emplacement');

  if (bounds.length > 0 && !props.center) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }
}

watch(
  () => [props.ruchers, props.emplacements],
  () => map && updateMarkers(),
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
  if (map) {
    map.remove();
    map = null;
  }
});
</script>
