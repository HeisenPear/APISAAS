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
import {
  couleurStatut,
  labelType,
  labelStatut,
  labelPression,
  type FrelonStatut,
  type FrelonPression,
} from '~/config/frelon';

interface NidPoint {
  id: string;
  lat: number;
  lng: number;
  statut: FrelonStatut;
  type: string;
  pression: FrelonPression;
}
interface RucherPoint {
  id: string;
  nom: string;
  lat: number;
  lng: number;
}

const props = defineProps<{
  nids: NidPoint[];
  ruchers: RucherPoint[];
  placement: { lat: number; lng: number } | null;
  /** Recentre la carte (ex. « Me localiser ») — passer un NOUVEL objet pour déclencher. */
  focus?: { lat: number; lng: number } | null;
  /** Rayon de surveillance affiché autour des ruchers (km). */
  rayonKm?: number;
}>();

const emit = defineEmits<{
  point: [coord: { lat: number; lng: number }];
  select: [id: string];
}>();

const mapContainer = ref<HTMLElement | null>(null);
type L = typeof import('leaflet');
let leaflet: L | null = null;
let map: L.Map | null = null;
let layer: L.LayerGroup | null = null;
let placementMarker: L.Marker | null = null;

function rucherIcon() {
  return leaflet!.divIcon({
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    html: `<div style="width:22px;height:22px;background:#f59e0b;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 5px rgba(0,0,0,0.3)"></div>`,
  });
}

const TAILLE_PRESSION: Record<FrelonPression, number> = {
  faible: 16,
  modere: 20,
  fort: 24,
  infestation: 30,
};

// Couleur = statut de validation ; taille = pression (quantité de frelons).
// Une infestation gagne un halo translucide pour ressortir d'un coup d'œil.
function nidIcon(statut: FrelonStatut, pression: FrelonPression) {
  const c = couleurStatut(statut);
  const s = TAILLE_PRESSION[pression];
  const halo = pression === 'infestation' ? `,0 0 0 5px ${c}33` : '';
  return leaflet!.divIcon({
    className: '',
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
    html: `<div style="width:${s}px;height:${s}px;background:${c};border:2.5px solid white;border-radius:50%;box-shadow:0 1.5px 4px rgba(0,0,0,0.3)${halo}"></div>`,
  });
}

function crosshairIcon() {
  return leaflet!.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div style="width:26px;height:26px;border:2.5px dashed #dc2626;border-radius:50%;background:rgba(220,38,38,0.12)"></div>`,
  });
}

function render() {
  if (!map || !layer || !leaflet) return;
  layer.clearLayers();
  const bounds: [number, number][] = [];
  const rayon = (props.rayonKm ?? 3) * 1000;

  for (const r of props.ruchers) {
    bounds.push([r.lat, r.lng]);
    leaflet
      .circle([r.lat, r.lng], {
        radius: rayon,
        color: '#f59e0b',
        weight: 1,
        opacity: 0.5,
        fillColor: '#f59e0b',
        fillOpacity: 0.05,
        dashArray: '4',
      })
      .addTo(layer);
    leaflet.marker([r.lat, r.lng], { icon: rucherIcon() }).bindTooltip(r.nom).addTo(layer);
  }

  for (const n of props.nids) {
    bounds.push([n.lat, n.lng]);
    leaflet
      .marker([n.lat, n.lng], { icon: nidIcon(n.statut, n.pression) })
      .bindTooltip(`${labelType(n.type)} · ${labelStatut(n.statut)} · ${labelPression(n.pression)}`)
      .on('click', () => emit('select', n.id))
      .addTo(layer);
  }

  if (bounds.length > 0 && !props.placement) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
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
  map = leaflet
    .map(mapContainer.value, { zoomControl: false, attributionControl: false })
    .setView([46.6, 2.3], 6);
  leaflet.control.zoom({ position: 'topright' }).addTo(map);
  leaflet
    .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 })
    .addTo(map);
  layer = leaflet.layerGroup().addTo(map);
  map.on('click', (e: L.LeafletMouseEvent) =>
    emit('point', { lat: e.latlng.lat, lng: e.latlng.lng }),
  );
  render();
  renderPlacement();
});

watch(
  () => [props.nids, props.ruchers],
  () => render(),
  { deep: true },
);
watch(
  () => props.focus,
  (f) => {
    if (f && map) map.setView([f.lat, f.lng], 14, { animate: true });
  },
);
watch(
  () => props.placement,
  () => renderPlacement(),
  { deep: true },
);

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>
