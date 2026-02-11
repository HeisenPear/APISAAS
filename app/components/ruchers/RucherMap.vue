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
import type { Rucher } from '~/types/models';

const props = defineProps<{
  ruchers: Rucher[];
  selectedId?: string | null;
  zoom?: number;
  center?: [number, number];
}>();

const emit = defineEmits<{
  select: [id: string];
}>();

const mapContainer = ref<HTMLElement | null>(null);

let map: L.Map | null = null;
let markersLayer: L.LayerGroup | null = null;
type L = typeof import('leaflet');
let leaflet: L | null = null;

function createAmberIcon(selected = false) {
  if (!leaflet) return undefined;
  const size = selected ? 32 : 24;
  const bg = selected ? '#d97706' : '#f59e0b';
  return leaflet.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border:3px solid white;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
  });
}

async function initMap() {
  if (!mapContainer.value) return;

  leaflet = await import('leaflet');

  const defaultCenter = props.center || [46.6, 2.3];
  const defaultZoom = props.zoom || 6;

  map = leaflet
    .map(mapContainer.value, {
      zoomControl: true,
      attributionControl: false,
    })
    .setView(defaultCenter as [number, number], defaultZoom);

  leaflet
    .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    })
    .addTo(map);

  markersLayer = leaflet.layerGroup().addTo(map);
  updateMarkers();
}

function updateMarkers() {
  if (!map || !markersLayer || !leaflet) return;

  markersLayer.clearLayers();

  const bounds: [number, number][] = [];

  for (const rucher of props.ruchers) {
    if (!rucher.latitude || !rucher.longitude) continue;

    const lat = Number(rucher.latitude);
    const lng = Number(rucher.longitude);
    if (isNaN(lat) || isNaN(lng)) continue;

    bounds.push([lat, lng]);

    const isSelected = rucher.id === props.selectedId;
    const marker = leaflet
      .marker([lat, lng], { icon: createAmberIcon(isSelected) })
      .addTo(markersLayer);

    marker.bindTooltip(rucher.nom, {
      direction: 'top',
      offset: [0, -20],
    });

    marker.on('click', () => {
      emit('select', rucher.id);
    });
  }

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }
}

watch(
  () => [props.ruchers, props.selectedId],
  () => {
    if (map) updateMarkers();
  },
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
