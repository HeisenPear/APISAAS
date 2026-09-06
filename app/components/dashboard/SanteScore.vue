<template>
  <div
    class="overflow-hidden rounded-[14px] border bg-white"
    style="border-color: var(--border-default)"
  >
    <!-- Header -->
    <div class="flex items-center gap-3 px-5 py-4">
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
        style="background: var(--sage-soft)"
      >
        <UIcon
          name="i-lucide-heart-pulse"
          class="h-[18px] w-[18px]"
          style="color: var(--sage-deep)"
        />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-[15px] font-semibold" style="color: var(--text-primary)">Santé</h3>
        <p class="text-[12px]" style="color: var(--text-tertiary)">Score des colonies</p>
      </div>
      <div class="flex items-baseline gap-1">
        <span class="text-[18px] font-bold tabular-nums" :style="{ color: globalColor }">
          {{ data.global }}
        </span>
        <span class="text-[12px]" style="color: var(--text-tertiary)">/100</span>
      </div>
    </div>

    <!-- Content -->
    <div class="px-5 pb-5">
      <div class="border-t pt-4" style="border-color: var(--border-default)">
        <!-- Jauge globale (UiRingGauge — design system) + scores par rucher -->
        <div class="flex items-center gap-5">
          <UiRingGauge :value="data.global" :size="80" :stroke="7" :color="globalColor">
            <span class="text-[11px] font-bold" :style="{ color: globalColor }">
              {{ globalLabel }}
            </span>
          </UiRingGauge>
          <div v-if="data.parRucher.length > 0" class="min-w-0 flex-1 space-y-2">
            <div v-for="r in topRuchers" :key="r.rucherId" class="flex items-center gap-2">
              <span class="w-20 truncate text-[11px]" style="color: var(--text-secondary)">{{
                r.nom
              }}</span>
              <div
                class="relative h-1.5 flex-1 overflow-hidden rounded-full"
                style="background: var(--surface-muted)"
              >
                <div
                  class="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                  :style="{ width: `${r.score}%`, backgroundColor: scoreColor(r.score) }"
                />
              </div>
              <span
                class="w-6 text-right text-[11px] font-semibold tabular-nums"
                :style="{ color: scoreColor(r.score) }"
              >
                {{ r.score }}
              </span>
            </div>
          </div>
        </div>

        <!-- Ruches en alerte -->
        <div v-if="alertHives.length > 0" class="mt-4">
          <h4
            class="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style="color: var(--text-tertiary)"
          >
            Ruches en alerte
          </h4>
          <div class="flex flex-wrap gap-1.5">
            <NuxtLink
              v-for="h in alertHives"
              :key="h.rucheId"
              :to="`/ruches/${h.rucheId}`"
              class="flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[12px] transition-colors hover:brightness-95"
              style="background: var(--surface-muted)"
            >
              <div
                class="h-1.5 w-1.5 rounded-full"
                :style="{ backgroundColor: scoreColor(h.score) }"
              />
              <span class="font-medium" style="color: var(--text-secondary)">{{ h.numero }}</span>
              <span class="font-bold tabular-nums" :style="{ color: scoreColor(h.score) }">{{
                h.score
              }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Aucune donnée -->
        <div v-if="data.parRuche.length === 0" class="flex flex-col items-center py-4 text-center">
          <p class="text-[12px]" style="color: var(--text-tertiary)">Aucune ruche enregistrée</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ScoreRuche {
  rucheId: string;
  numero: string;
  rucherId: string;
  score: number;
  dernierControle: string | null;
  statut: string;
}

interface ScoreRucher {
  rucherId: string;
  nom: string;
  score: number;
  nbRuches: number;
}

interface ScoreSante {
  global: number;
  parRucher: ScoreRucher[];
  parRuche: ScoreRuche[];
}

const props = defineProps<{ data: ScoreSante }>();

// Couleurs SÉMANTIQUES de santé (design system) : bon / à surveiller / critique.
function scoreColor(score: number): string {
  if (score >= 70) return 'var(--status-good)';
  if (score >= 40) return 'var(--status-warn)';
  return 'var(--status-bad)';
}

const globalColor = computed(() => scoreColor(props.data.global));

const globalLabel = computed(() => {
  const s = props.data.global;
  if (s >= 80) return 'Excellent';
  if (s >= 70) return 'Bon';
  if (s >= 50) return 'Correct';
  if (s >= 40) return 'Attention';
  return 'Critique';
});

const topRuchers = computed(() =>
  [...props.data.parRucher].sort((a, b) => a.score - b.score).slice(0, 4),
);

const alertHives = computed(() =>
  [...props.data.parRuche]
    .filter((h) => h.statut === 'active' && h.score < 50)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5),
);
</script>
