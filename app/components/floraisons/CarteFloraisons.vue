<template>
  <ClientOnly>
    <div ref="mapContainer" class="h-full w-full rounded-2xl" />
    <template #fallback>
      <div class="flex h-full w-full items-center justify-center rounded-2xl bg-stone-100">
        <UIcon name="i-lucide-map" class="h-8 w-8 text-stone-300" />
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import { couleurStade, labelStade, type FloraisonStade } from '~/config/floraisons';

interface ObservationPoint {
  id: string;
  lat: number;
  lng: number;
  espece: string;
  emoji: string;
  stade: FloraisonStade;
}

const props = defineProps<{
  observations: ObservationPoint[];
  /** Point en cours de placement (nouvelle observation). */
  placement: { lat: number; lng: number } | null;
  /** Centre courant de la recherche (ma position / commune) — dessine le rayon. */
  centre: { lat: number; lng: number } | null;
  rayonKm: number | null;
  /** Recentrage : passer un NOUVEL objet pour déclencher. */
  focus?: { lat: number; lng: number } | null;
}>();

const emit = defineEmits<{
  point: [coord: { lat: number; lng: number }];
  select: [id: string];
}>();

const mapContainer = ref<HTMLElement | null>(null);
type L = typeof import('leaflet');
let leaflet: L | null = null;
let map: L.Map | null = null;
/** Arrêt de l'observateur de taille — voir `suivreTailleCarte`. */
let arreterSuiviTaille: (() => void) | null = null;
let layer: L.LayerGroup | null = null;
let placementMarker: L.Marker | null = null;

/**
 * Marqueur = pastille blanche portant l'emoji de l'espèce, cerclée de la
 * couleur du stade. On lit l'espèce ET l'avancement d'un seul coup d'œil,
 * sans légende à consulter.
 */
function observationIcon(emoji: string, stade: FloraisonStade) {
  const c = couleurStade(stade);
  return leaflet!.divIcon({
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:white;border:3px solid ${c};border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.25);font-size:16px;line-height:1">${emoji}</div>`,
  });
}

function crosshairIcon() {
  return leaflet!.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div style="width:26px;height:26px;border:2.5px dashed var(--honey, #f5a623);border-radius:50%;background:rgba(245,166,35,0.15)"></div>`,
  });
}

function render() {
  if (!map || !layer || !leaflet) return;
  layer.clearLayers();
  const bounds: [number, number][] = [];

  // Rayon de recherche : matérialise ce que la liste est en train de filtrer.
  if (props.centre && props.rayonKm !== null) {
    leaflet
      .circle([props.centre.lat, props.centre.lng], {
        radius: props.rayonKm * 1000,
        color: '#f5a623',
        weight: 1.5,
        opacity: 0.6,
        fillColor: '#f5a623',
        fillOpacity: 0.04,
        dashArray: '6',
      })
      .addTo(layer);
    bounds.push([props.centre.lat, props.centre.lng]);
  }

  for (const o of props.observations) {
    bounds.push([o.lat, o.lng]);
    leaflet
      .marker([o.lat, o.lng], { icon: observationIcon(o.emoji, o.stade) })
      .bindTooltip(`${o.emoji} ${o.espece} · ${labelStade(o.stade)}`)
      .on('click', () => emit('select', o.id))
      .addTo(layer);
  }

  if (bounds.length > 0 && !props.placement) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }
}

function renderPlacement() {
  if (!map || !leaflet) return;
  if (placementMarker) {
    placementMarker.remove();
    placementMarker = null;
  }
  if (props.placement) {
    placementMarker = leaflet
      .marker([props.placement.lat, props.placement.lng], { icon: crosshairIcon() })
      .addTo(map);
    map.panTo([props.placement.lat, props.placement.lng]);
  }
}

onMounted(async () => {
  await nextTick();
  if (!mapContainer.value) return;
  leaflet = await import('leaflet');
  map = leaflet.map(mapContainer.value, { zoomControl: false }).setView([46.6, 2.3], 6);
  leaflet.control.zoom({ position: 'topright' }).addTo(map);
  leaflet.tileLayer(TUILES_OSM, OPTIONS_TUILES_OSM).addTo(map);
  arreterSuiviTaille = suivreTailleCarte(map, mapContainer.value);
  layer = leaflet.layerGroup().addTo(map);
  map.on('click', (e: L.LeafletMouseEvent) =>
    emit('point', { lat: e.latlng.lat, lng: e.latlng.lng }),
  );
  render();
  renderPlacement();
});

watch(
  () => [props.observations, props.centre, props.rayonKm],
  () => render(),
  { deep: true },
);
watch(
  () => props.focus,
  (f) => {
    if (f && map) map.setView([f.lat, f.lng], 12, { animate: true });
  },
);
watch(() => props.placement, renderPlacement, { deep: true });

onUnmounted(() => {
  arreterSuiviTaille?.();
  arreterSuiviTaille = null;
  if (map) {
    map.remove();
    map = null;
  }
});
</script>
