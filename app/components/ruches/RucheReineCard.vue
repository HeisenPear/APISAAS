<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white shadow-sm">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-stone-100 px-5 py-4">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
          <UIcon name="i-lucide-crown" class="h-4 w-4 text-honey-deep" />
        </div>
        <h3 class="text-sm font-semibold uppercase tracking-wider text-stone-400">Reine</h3>
      </div>
      <button
        class="rounded-lg px-2.5 py-1 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
        @click="$emit('addEvent')"
      >
        + Événement
      </button>
    </div>

    <div class="p-5">
      <!-- Présence indicator -->
      <div class="mb-4 flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl" :class="presenceBgClass">
          <UIcon name="i-lucide-crown" class="h-5 w-5" :class="presenceIconClass" />
        </div>
        <div>
          <p class="text-sm font-semibold text-stone-900">{{ presenceLabel }}</p>
          <p v-if="reineInfo.reineCouleur" class="flex items-center gap-1.5 text-xs text-stone-400">
            <span
              class="inline-block h-3 w-3 rounded-full border border-stone-200"
              :style="{ backgroundColor: couleurHex }"
            />
            Marquage {{ reineInfo.reineCouleur }}
            <span v-if="reineInfo.reineAnnee"> · {{ reineInfo.reineAnnee }}</span>
          </p>
          <p v-else-if="reineInfo.reineAnnee" class="text-xs text-stone-400">
            Née en {{ reineInfo.reineAnnee }}
          </p>
          <p v-if="reineRaceLabel" class="mt-0.5 text-xs text-stone-400">
            Race : <span class="font-medium text-stone-600">{{ reineRaceLabel }}</span>
          </p>
        </div>
      </div>

      <!-- Metrics grid -->
      <div v-if="hasMetrics" class="mb-4 grid grid-cols-3 gap-2">
        <div
          v-if="reineInfo.reineQualitePonte != null"
          class="rounded-xl bg-stone-50 p-2.5 text-center"
        >
          <p class="text-[10px] font-medium uppercase tracking-wide text-stone-400">Ponte</p>
          <div class="mt-1 flex justify-center">
            <RuchesStarRating :value="reineInfo.reineQualitePonte" :max="5" />
          </div>
        </div>
        <div v-if="reineInfo.reineDouceur != null" class="rounded-xl bg-stone-50 p-2.5 text-center">
          <p class="text-[10px] font-medium uppercase tracking-wide text-stone-400">Douceur</p>
          <div class="mt-1 flex justify-center">
            <RuchesStarRating :value="reineInfo.reineDouceur" :max="5" />
          </div>
        </div>
        <div
          v-if="reineInfo.reineProlificite != null"
          class="rounded-xl bg-stone-50 p-2.5 text-center"
        >
          <p class="text-[10px] font-medium uppercase tracking-wide text-stone-400">Prolific.</p>
          <div class="mt-1 flex justify-center">
            <RuchesStarRating :value="reineInfo.reineProlificite" :max="5" />
          </div>
        </div>
      </div>

      <!-- Dernière introduction -->
      <div v-if="reineInfo.reineDateIntroduction" class="mb-4 text-xs text-stone-400">
        Introduite {{ introductionRelative }}
      </div>

      <!-- Historique events (derniers 3) -->
      <div v-if="evenements.length > 0" class="space-y-2">
        <p class="text-[10px] font-medium uppercase tracking-wider text-stone-400">
          Historique reine
        </p>
        <div
          v-for="ev in evenements.slice(0, 3)"
          :key="ev.id"
          class="flex items-center gap-2.5 rounded-xl bg-stone-50 px-3 py-2"
        >
          <div
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
            :class="eventBgClass(ev.typeEvenement)"
          >
            <UIcon
              :name="eventIcon(ev.typeEvenement)"
              class="h-3.5 w-3.5"
              :class="eventIconClass(ev.typeEvenement)"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-medium text-stone-700">
              {{ eventLabel(ev.typeEvenement) }}
            </p>
          </div>
          <span class="shrink-0 text-[10px] text-stone-400">{{
            relativeDate(ev.dateEvenement)
          }}</span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="py-2 text-center text-xs text-stone-400">
        Aucun événement reine enregistré
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ReineInfo {
  reinePresente?: boolean | null;
  reineCouleur?: string | null;
  reineAnnee?: number | null;
  reineRace?: string | null;
  reineOrigine?: string | null;
  reineDateIntroduction?: string | null;
  reineQualitePonte?: number | null;
  reineDouceur?: number | null;
  reineProlificite?: number | null;
}

interface EvenementReine {
  id: string;
  typeEvenement: string;
  dateEvenement: string;
  couleur?: string | null;
}

const props = defineProps<{
  reineInfo: ReineInfo;
  evenements: EvenementReine[];
}>();

defineEmits<{ addEvent: [] }>();

const COULEUR_HEX: Record<string, string> = {
  blanc: '#FFFFFF',
  jaune: '#F5C842',
  rouge: '#EF4444',
  vert: '#22C55E',
  bleu: '#3B82F6',
};

const couleurHex = computed(() => COULEUR_HEX[props.reineInfo.reineCouleur ?? ''] ?? '#D6D3D1');

const RACE_LABELS: Record<string, string> = {
  noire: 'Noire (Mellifera)',
  buckfast: 'Buckfast',
  carnica: 'Carnica',
  italienne: 'Italienne (Ligustica)',
  caucasienne: 'Caucasienne',
  hybride: 'Hybride',
  inconnue: '',
};

const reineRaceLabel = computed(() => {
  const r = props.reineInfo.reineRace;
  if (!r || r === 'inconnue') return '';
  return RACE_LABELS[r] ?? r;
});

const presenceLabel = computed(() => {
  if (props.reineInfo.reinePresente === true) return 'Reine présente';
  if (props.reineInfo.reinePresente === false) return 'Reine absente';
  return 'Statut inconnu';
});

const presenceBgClass = computed(() => {
  if (props.reineInfo.reinePresente === true) return 'bg-amber-50';
  if (props.reineInfo.reinePresente === false) return 'bg-red-50';
  return 'bg-stone-100';
});

const presenceIconClass = computed(() => {
  if (props.reineInfo.reinePresente === true) return 'text-honey-deep';
  if (props.reineInfo.reinePresente === false) return 'text-red-500';
  return 'text-stone-400';
});

const hasMetrics = computed(
  () =>
    props.reineInfo.reineQualitePonte != null ||
    props.reineInfo.reineDouceur != null ||
    props.reineInfo.reineProlificite != null,
);

const introductionRelative = computed(() => {
  if (!props.reineInfo.reineDateIntroduction) return '';
  const diff = Date.now() - new Date(props.reineInfo.reineDateIntroduction).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 30) return `il y a ${days}j`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an(s)`;
});

function relativeDate(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'auj.';
  if (days === 1) return 'hier';
  if (days < 30) return `${days}j`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}a`;
}

const EVENT_META: Record<string, { label: string; icon: string; bg: string; color: string }> = {
  introduction: {
    label: 'Introduction',
    icon: 'i-lucide-arrow-down-circle',
    bg: 'bg-amber-50',
    color: 'text-honey-deep',
  },
  marquage: {
    label: 'Marquage',
    icon: 'i-lucide-paint-bucket',
    bg: 'bg-blue-50',
    color: 'text-blue-600',
  },
  clipping: {
    label: 'Clipping',
    icon: 'i-lucide-scissors',
    bg: 'bg-purple-50',
    color: 'text-purple-600',
  },
  remplacement: {
    label: 'Remplacement',
    icon: 'i-lucide-refresh-cw',
    bg: 'bg-amber-50',
    color: 'text-honey-deep',
  },
  perte: {
    label: 'Perte',
    icon: 'i-lucide-alert-triangle',
    bg: 'bg-red-50',
    color: 'text-red-600',
  },
  ponte_vue: {
    label: 'Ponte vue',
    icon: 'i-lucide-eye',
    bg: 'bg-stone-100',
    color: 'text-stone-500',
  },
  cellule_royale_trouvee: {
    label: 'Cellule royale',
    icon: 'i-lucide-hexagon',
    bg: 'bg-amber-50',
    color: 'text-amber-500',
  },
  elevage: {
    label: 'Élevage',
    icon: 'i-lucide-sprout',
    bg: 'bg-amber-50',
    color: 'text-honey-deep',
  },
};

function eventLabel(type: string) {
  return EVENT_META[type]?.label ?? type;
}
function eventIcon(type: string) {
  return EVENT_META[type]?.icon ?? 'i-lucide-circle';
}
function eventBgClass(type: string) {
  return EVENT_META[type]?.bg ?? 'bg-stone-100';
}
function eventIconClass(type: string) {
  return EVENT_META[type]?.color ?? 'text-stone-400';
}
</script>
