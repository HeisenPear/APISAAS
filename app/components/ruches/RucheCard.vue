<template>
  <NuxtLink
    :to="`/ruches/${ruche.id}`"
    class="group block rounded-2xl border border-stone-200/60 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
  >
    <div class="p-5">
      <!-- Header -->
      <div class="mb-3 flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
            :class="statutBgClass"
          >
            <UIcon name="i-lucide-box" class="h-5 w-5" :class="statutIconClass" />
          </div>
          <div>
            <h3 class="font-semibold text-stone-900 group-hover:text-amber-700 transition-colors">
              {{ ruche.numero }}
            </h3>
            <p v-if="rucherNom" class="text-xs text-stone-400">{{ rucherNom }}</p>
          </div>
        </div>

        <RuchesRucheHealthBadge
          :statut="ruche.statut"
          :qualite-reine="ruche.qualiteReine"
          :force-colonie="lastForceColonie"
        />
      </div>

      <!-- Info grid -->
      <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span class="text-stone-400">Type</span>
          <p class="font-medium text-stone-700">{{ typeLabel }}</p>
        </div>
        <div>
          <span class="text-stone-400">Statut</span>
          <p class="font-medium text-stone-700">{{ statutLabel }}</p>
        </div>
        <div v-if="ruche.raceAbeille && ruche.raceAbeille !== 'inconnue'">
          <span class="text-stone-400">Race</span>
          <p class="font-medium text-stone-700">{{ raceLabel }}</p>
        </div>
        <div v-if="ruche.dateInstallation">
          <span class="text-stone-400">Installee le</span>
          <p class="font-medium text-stone-700">{{ formattedDate }}</p>
        </div>
      </div>

      <!-- Footer stats -->
      <div
        v-if="ruche.nombreCadres || ruche.nombreHausses"
        class="mt-3 flex items-center gap-3 border-t border-stone-100 pt-3 text-xs text-stone-400"
      >
        <span v-if="ruche.nombreCadres">{{ ruche.nombreCadres }} cadres</span>
        <span v-if="ruche.nombreHausses">{{ ruche.nombreHausses }} hausses</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Ruche } from '~/types/models';

const props = defineProps<{
  ruche: Ruche & { rucherNom?: string };
  lastForceColonie?: number | null;
}>();

const rucherNom = computed(() => (props.ruche as Ruche & { rucherNom?: string }).rucherNom);

const typeLabels: Record<string, string> = {
  dadant_10: 'Dadant 10',
  dadant_12: 'Dadant 12',
  langstroth: 'Langstroth',
  warre: 'Warre',
  voirnot: 'Voirnot',
  kenyane: 'Kenyane',
  autre: 'Autre',
};

const statutLabels: Record<string, string> = {
  active: 'Active',
  faible: 'Faible',
  orpheline: 'Orpheline',
  essaimee: 'Essaimee',
  morte: 'Morte',
  vendue: 'Vendue',
  fusionnee: 'Fusionnee',
};

const raceLabels: Record<string, string> = {
  noire: 'Noire',
  buckfast: 'Buckfast',
  carnica: 'Carnica',
  italienne: 'Italienne',
  caucasienne: 'Caucasienne',
  hybride: 'Hybride',
  inconnue: 'Inconnue',
};

const typeLabel = computed(() => typeLabels[props.ruche.type] ?? props.ruche.type);
const statutLabel = computed(() => statutLabels[props.ruche.statut] ?? props.ruche.statut);
const raceLabel = computed(
  () =>
    (props.ruche.raceAbeille ? raceLabels[props.ruche.raceAbeille] : null) ??
    props.ruche.raceAbeille,
);

const formattedDate = computed(() => {
  if (!props.ruche.dateInstallation) return '';
  return new Date(props.ruche.dateInstallation).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
});

const statutBgClass = computed(() => {
  const map: Record<string, string> = {
    active: 'bg-emerald-50',
    faible: 'bg-amber-50',
    orpheline: 'bg-amber-50',
    essaimee: 'bg-sky-50',
    morte: 'bg-red-50',
    vendue: 'bg-stone-100',
    fusionnee: 'bg-stone-100',
  };
  return map[props.ruche.statut] ?? 'bg-stone-100';
});

const statutIconClass = computed(() => {
  const map: Record<string, string> = {
    active: 'text-emerald-600',
    faible: 'text-amber-600',
    orpheline: 'text-amber-600',
    essaimee: 'text-sky-600',
    morte: 'text-red-600',
    vendue: 'text-stone-400',
    fusionnee: 'text-stone-400',
  };
  return map[props.ruche.statut] ?? 'text-stone-400';
});
</script>
