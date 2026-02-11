<template>
  <NuxtLink
    :to="`/inspections/${inspection.id}`"
    class="group block rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
  >
    <!-- Header -->
    <div class="mb-3 flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl" :class="typeBgClass">
          <UIcon :name="typeIcon" class="h-5 w-5" :class="typeIconClass" />
        </div>
        <div>
          <h3
            class="text-sm font-semibold text-stone-900 group-hover:text-amber-700 transition-colors"
          >
            {{ typeLabel }}
          </h3>
          <p class="text-xs text-stone-400">
            {{ formattedDate }}
            <span v-if="inspection.dureeMinutes"> — {{ inspection.dureeMinutes }} min</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Ruche info -->
    <div class="mb-3 flex items-center gap-2 text-sm text-stone-600">
      <UIcon name="i-lucide-box" class="h-3.5 w-3.5 text-stone-400" />
      <span>{{ rucheLabel }}</span>
      <span v-if="rucherLabel" class="text-stone-400">— {{ rucherLabel }}</span>
    </div>

    <!-- Scores -->
    <div v-if="hasScores" class="mb-3 flex flex-wrap gap-2">
      <span
        v-if="inspection.forceColonie"
        class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
        :class="scoreClass(inspection.forceColonie)"
      >
        Force {{ inspection.forceColonie }}/5
      </span>
      <span
        v-if="inspection.couvain != null"
        class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
        :class="scoreClass(inspection.couvain)"
      >
        Couvain {{ inspection.couvain }}/5
      </span>
      <span
        v-if="inspection.reserves"
        class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
        :class="scoreClass(inspection.reserves)"
      >
        Reserves {{ inspection.reserves }}/5
      </span>
      <span
        v-if="inspection.reineVue"
        class="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
      >
        Reine vue
      </span>
      <span
        v-if="inspection.varroa != null"
        class="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs text-red-700"
      >
        Varroa {{ inspection.varroa }}
      </span>
    </div>

    <!-- Notes preview -->
    <p v-if="inspection.notes" class="text-sm text-stone-500 line-clamp-2">
      {{ inspection.notes }}
    </p>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { InspectionWithContext } from '~/composables/useInspections';

const props = defineProps<{
  inspection: InspectionWithContext;
}>();

const typeLabels: Record<string, string> = {
  visite_printemps: 'Visite de printemps',
  controle: 'Controle',
  traitement: 'Traitement',
  recolte: 'Visite recolte',
  hivernage: 'Mise en hivernage',
};

const typeIcons: Record<string, string> = {
  visite_printemps: 'i-lucide-sun',
  controle: 'i-lucide-clipboard-check',
  traitement: 'i-lucide-shield',
  recolte: 'i-lucide-droplets',
  hivernage: 'i-lucide-snowflake',
};

const typeLabel = computed(
  () =>
    (props.inspection.type ? typeLabels[props.inspection.type] : null) ??
    props.inspection.type ??
    'Inspection',
);

const typeIcon = computed(
  () =>
    (props.inspection.type ? typeIcons[props.inspection.type] : null) ?? 'i-lucide-clipboard-check',
);

const typeBgClass = computed(() => {
  const map: Record<string, string> = {
    visite_printemps: 'bg-amber-50',
    controle: 'bg-sky-50',
    traitement: 'bg-violet-50',
    recolte: 'bg-amber-50',
    hivernage: 'bg-blue-50',
  };
  return (props.inspection.type ? map[props.inspection.type] : null) ?? 'bg-stone-100';
});

const typeIconClass = computed(() => {
  const map: Record<string, string> = {
    visite_printemps: 'text-amber-600',
    controle: 'text-sky-600',
    traitement: 'text-violet-600',
    recolte: 'text-amber-600',
    hivernage: 'text-blue-600',
  };
  return (props.inspection.type ? map[props.inspection.type] : null) ?? 'text-stone-500';
});

const rucheLabel = computed(
  () => props.inspection.rucheNumero ?? props.inspection.ruche?.numero ?? 'Ruche inconnue',
);

const rucherLabel = computed(
  () => props.inspection.rucherNom ?? props.inspection.rucher?.nom ?? null,
);

const formattedDate = computed(() =>
  new Date(props.inspection.dateVisite).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
);

const hasScores = computed(
  () =>
    props.inspection.forceColonie ||
    props.inspection.couvain != null ||
    props.inspection.reserves ||
    props.inspection.reineVue ||
    props.inspection.varroa != null,
);

function scoreClass(value: number) {
  if (value >= 4) return 'bg-emerald-50 text-emerald-700';
  if (value >= 3) return 'bg-sky-50 text-sky-700';
  if (value >= 2) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
}
</script>
