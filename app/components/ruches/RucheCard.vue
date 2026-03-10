<template>
  <NuxtLink
    :to="`/ruches/${ruche.id}`"
    class="group block overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-sm transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-md"
  >
    <!-- Accent bar -->
    <div class="h-1" :class="accentColor" />

    <div class="p-4">
      <!-- Header: icon + numero + health badge -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
            :class="statutBgClass"
          >
            <UIcon name="i-lucide-box" class="h-5 w-5" :class="statutIconClass" />
          </div>
          <div class="min-w-0">
            <h3
              class="truncate font-semibold text-stone-900 transition-colors group-hover:text-amber-700"
            >
              {{ ruche.numero }}
            </h3>
            <NuxtLink
              v-if="rucherNom"
              :to="`/ruchers/${ruche.rucherId}`"
              class="text-xs text-stone-400 transition-colors hover:text-amber-600"
              @click.stop
            >
              {{ rucherNom }}
            </NuxtLink>
          </div>
        </div>

        <RuchesRucheHealthBadge
          :statut="ruche.statut"
          :qualite-reine="ruche.qualiteReine"
          :force-colonie="lastForceColonie"
          :sante-score="santeScore"
        />
      </div>

      <!-- Metrics compact line -->
      <div class="mt-3 flex items-center gap-1 text-xs text-stone-500">
        <span class="font-medium text-stone-700">{{ typeLabel }}</span>
        <span class="text-stone-300">·</span>
        <span :class="statutTextClass">{{ statutLabel }}</span>
        <template v-if="ruche.raceAbeille && ruche.raceAbeille !== 'inconnue'">
          <span class="text-stone-300">·</span>
          <span>{{ raceLabel }}</span>
        </template>
        <template v-if="ruche.nombreCadres || ruche.nombreHausses">
          <span class="text-stone-300">·</span>
          <span v-if="ruche.nombreCadres">{{ ruche.nombreCadres }}c</span>
          <span v-if="ruche.nombreCadres && ruche.nombreHausses">/</span>
          <span v-if="ruche.nombreHausses">{{ ruche.nombreHausses }}h</span>
        </template>
      </div>

      <!-- Metadata pills -->
      <div class="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          v-if="ruche.dateInstallation"
          class="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500"
        >
          <UIcon name="i-lucide-calendar" class="h-3 w-3" />
          {{ formattedDate }}
        </span>
        <span
          v-if="ruche.origineEssaim"
          class="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
        >
          {{ ruche.origineEssaim }}
        </span>
      </div>

      <!-- Footer: derniere intervention -->
      <div
        v-if="derniereIntervention"
        class="mt-3 border-t border-stone-100 pt-2.5 text-[11px] text-stone-400"
      >
        Derniere intervention {{ derniereIntervention }}
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Ruche } from '~/types/models';

const props = defineProps<{
  ruche: Ruche & { rucherNom?: string };
  lastForceColonie?: number | null;
  santeScore?: number | null;
  derniereInterventionDate?: string | null;
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

const derniereIntervention = computed(() => {
  if (!props.derniereInterventionDate) return null;
  const date = new Date(props.derniereInterventionDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return 'hier';
  if (diffDays < 30) return `il y a ${diffDays}j`;
  if (diffDays < 365) return `il y a ${Math.floor(diffDays / 30)} mois`;
  return `il y a ${Math.floor(diffDays / 365)} an(s)`;
});

const accentColor = computed(() => {
  const map: Record<string, string> = {
    active: 'bg-emerald-400',
    faible: 'bg-amber-400',
    orpheline: 'bg-amber-400',
    essaimee: 'bg-sky-400',
    morte: 'bg-red-400',
    vendue: 'bg-stone-300',
    fusionnee: 'bg-stone-300',
  };
  return map[props.ruche.statut] ?? 'bg-stone-300';
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

const statutTextClass = computed(() => {
  const map: Record<string, string> = {
    active: 'text-emerald-600',
    faible: 'text-amber-600',
    orpheline: 'text-amber-600',
    essaimee: 'text-sky-600',
    morte: 'text-red-600',
    vendue: 'text-stone-400',
    fusionnee: 'text-stone-400',
  };
  return map[props.ruche.statut] ?? 'text-stone-500';
});
</script>
