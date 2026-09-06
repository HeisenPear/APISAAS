<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-[15px] font-semibold text-[var(--text-primary)]">
        Distance & chevauchement de butinage
      </h2>
      <p class="mt-1 text-[12.5px] text-[var(--text-secondary)]">
        Les abeilles butinent efficacement dans un rayon d'environ 3 km. Comparez deux emplacements
        pour savoir si leurs zones de butinage se chevauchent avant une transhumance.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <OutilsPointPicker v-model="pointA" label="Emplacement A" :ruchers="ruchersAvecCoords" />
      <OutilsPointPicker v-model="pointB" label="Emplacement B" :ruchers="ruchersAvecCoords" />
    </div>

    <div v-if="distanceKm !== null" class="rounded-[12px] p-5" :class="verdict.bg">
      <div class="flex items-center gap-3">
        <UIcon :name="verdict.icon" class="h-5 w-5 shrink-0" :class="verdict.iconColor" />
        <div>
          <p class="text-[18px] font-semibold tabular-nums text-[var(--text-primary)]">
            {{ formatNombre(distanceKm) }} km
          </p>
          <p class="text-[12.5px]" :class="verdict.textColor">{{ verdict.label }}</p>
        </div>
      </div>
    </div>
    <div v-else class="rounded-[12px] bg-[var(--surface-muted)] p-5 text-center">
      <p class="text-[12.5px] text-[var(--text-tertiary)]">
        Renseignez les deux emplacements pour calculer la distance
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RucherWithCount } from '~/types/models';

interface Coords {
  lat: number | undefined;
  lng: number | undefined;
}

const { ruchers } = useRuchers();
const ruchersAvecCoords = computed(() =>
  (ruchers.value ?? []).filter(
    (r): r is RucherWithCount => r.latitude != null && r.longitude != null,
  ),
);

const pointA = ref<Coords>({ lat: undefined, lng: undefined });
const pointB = ref<Coords>({ lat: undefined, lng: undefined });

const distanceKm = computed(() => {
  const a = pointA.value;
  const b = pointB.value;
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  return haversineKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
});

const RAYON_BUTINAGE_KM = 3;

const verdict = computed(() => {
  const d = distanceKm.value ?? 0;
  if (d < RAYON_BUTINAGE_KM) {
    return {
      label: 'Même bassin de butinage — chevauchement fort, la ressource florale sera partagée',
      bg: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-red-700',
      icon: 'i-lucide-alert-triangle',
    };
  }
  if (d < RAYON_BUTINAGE_KM * 2) {
    return {
      label: 'Chevauchement partiel des rayons de butinage (3 km chacun)',
      bg: 'bg-amber-50',
      iconColor: 'text-honey-deep',
      textColor: 'text-amber-700',
      icon: 'i-lucide-circle-alert',
    };
  }
  return {
    label: 'Aucun chevauchement — bassins de butinage indépendants',
    bg: 'bg-amber-50',
    iconColor: 'text-honey-deep',
    textColor: 'text-amber-700',
    icon: 'i-lucide-check-circle',
  };
});

function formatNombre(n: number) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}
</script>
