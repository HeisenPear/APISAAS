<script setup lang="ts">
interface Prediction {
  scoreActuel: number;
  scorePrediction30j: number;
  tendance: 'hausse' | 'stable' | 'baisse';
  risques: string[];
  suggestions: string[];
  urgence: 'normale' | 'attention' | 'urgente';
}

const props = defineProps<{
  rucheId?: string;
  /** Mode teaser (FeatureGate) : données fictives, aucun appel réseau. */
  preview?: boolean;
}>();

// Données fictives pour le teaser flouté des comptes sans la feature Pro.
const MOCK: Prediction = {
  scoreActuel: 78,
  scorePrediction30j: 84,
  tendance: 'hausse',
  risques: ['Niveau de varroa à surveiller'],
  suggestions: ['Contrôler le varroa au prochain passage', 'Continuer le suivi régulier'],
  urgence: 'normale',
};

const { data, pending, error } = useFetch<{ data: Prediction }>(
  () => `/api/ruches/${props.rucheId}/prediction`,
  {
    key: () => `prediction-${props.rucheId}`,
    lazy: true,
    immediate: !props.preview && !!props.rucheId,
  },
);

const prediction = computed<Prediction | null>(() =>
  props.preview ? MOCK : (data.value?.data ?? null),
);
const loading = computed(() => !props.preview && pending.value);

const URGENCE = {
  normale: { label: 'Normale', color: 'var(--sage-deep)', bg: 'var(--sage-soft)' },
  attention: { label: 'À surveiller', color: 'var(--honey-deep)', bg: 'var(--honey-soft)' },
  urgente: { label: 'Urgent', color: 'var(--clay-deep)', bg: 'var(--clay-soft)' },
} as const;

const TENDANCE = {
  hausse: { icon: 'i-lucide-trending-up', color: 'var(--sage-deep)', label: 'En hausse' },
  stable: { icon: 'i-lucide-minus', color: 'var(--text-tertiary)', label: 'Stable' },
  baisse: { icon: 'i-lucide-trending-down', color: 'var(--clay-deep)', label: 'En baisse' },
} as const;

function scoreColor(s: number): string {
  if (s >= 70) return 'var(--sage-deep)';
  if (s >= 45) return 'var(--honey-deep)';
  return 'var(--clay-deep)';
}
</script>

<template>
  <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="flex items-center gap-2 text-[15px] font-semibold text-[var(--text-primary)]">
        <UIcon name="i-lucide-sparkles" class="h-4 w-4 text-[var(--honey-deep)]" />
        Score prédictif de santé
      </h2>
      <span
        v-if="prediction"
        class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
        :style="{
          color: URGENCE[prediction.urgence].color,
          background: URGENCE[prediction.urgence].bg,
        }"
      >
        {{ URGENCE[prediction.urgence].label }}
      </span>
    </div>

    <div v-if="loading" class="h-24 animate-pulse rounded-[12px] bg-[var(--surface-muted)]" />

    <p v-else-if="error || !prediction" class="text-[13px] text-[var(--text-tertiary)]">
      Pas encore assez de visites pour projeter la santé. Saisissez quelques interventions et la
      prédiction s'activera.
    </p>

    <template v-else>
      <!-- Scores : aujourd'hui → projection 30 j -->
      <div class="flex items-center gap-3">
        <div class="flex-1 text-center">
          <p
            class="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Aujourd'hui
          </p>
          <p
            class="text-[30px] font-bold tracking-[-0.02em]"
            :style="{ color: scoreColor(prediction.scoreActuel) }"
          >
            {{ prediction.scoreActuel
            }}<span class="text-[14px] font-medium text-[var(--text-tertiary)]">/100</span>
          </p>
        </div>
        <div
          class="flex flex-col items-center"
          :style="{ color: TENDANCE[prediction.tendance].color }"
        >
          <UIcon :name="TENDANCE[prediction.tendance].icon" class="h-6 w-6" />
          <span class="mt-0.5 text-[10px] font-medium">{{
            TENDANCE[prediction.tendance].label
          }}</span>
        </div>
        <div class="flex-1 text-center">
          <p
            class="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
          >
            Projeté à 30 j
          </p>
          <p
            class="text-[30px] font-bold tracking-[-0.02em]"
            :style="{ color: scoreColor(prediction.scorePrediction30j) }"
          >
            {{ prediction.scorePrediction30j
            }}<span class="text-[14px] font-medium text-[var(--text-tertiary)]">/100</span>
          </p>
        </div>
      </div>

      <!-- Risques -->
      <div v-if="prediction.risques.length" class="mt-5">
        <p
          class="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--clay-deep)]"
        >
          Risques détectés
        </p>
        <ul class="space-y-1.5">
          <li
            v-for="r in prediction.risques"
            :key="r"
            class="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]"
          >
            <UIcon
              name="i-lucide-alert-triangle"
              class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--clay)]"
            />
            {{ r }}
          </li>
        </ul>
      </div>

      <!-- Recommandations -->
      <div v-if="prediction.suggestions.length" class="mt-4">
        <p
          class="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--honey-deep)]"
        >
          Recommandations
        </p>
        <ul class="space-y-1.5">
          <li
            v-for="s in prediction.suggestions"
            :key="s"
            class="flex items-start gap-2 text-[13px] text-[var(--text-secondary)]"
          >
            <UIcon
              name="i-lucide-lightbulb"
              class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--honey)]"
            />
            {{ s }}
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
