<template>
  <div class="overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-sm">
    <!-- Header -->
    <div class="flex items-center gap-3 px-5 py-4">
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
        <UIcon name="i-lucide-heart-pulse" class="h-[18px] w-[18px] text-emerald-600" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-[15px] font-semibold text-stone-900">Sante</h3>
        <p class="text-xs text-stone-500">Score des colonies</p>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="h-2 w-2 rounded-full" :style="{ backgroundColor: scoreColor(data.global) }" />
        <span class="text-lg font-bold tabular-nums" :style="{ color: scoreColor(data.global) }">
          {{ data.global }}
        </span>
        <span class="text-xs text-stone-400">/100</span>
      </div>
    </div>

    <!-- Content -->
    <div class="px-5 pb-5">
      <div class="border-t border-stone-100 pt-4">
        <!-- Global Score Gauge -->
        <div class="flex items-center gap-5">
          <div class="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <svg class="absolute inset-0" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#F0EDE8" stroke-width="6" />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                :stroke="globalColor"
                stroke-width="6"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="dashOffset"
                transform="rotate(-90 40 40)"
                class="transition-all duration-700 ease-out"
              />
            </svg>
            <span class="text-xs font-bold" :style="{ color: globalColor }">
              {{ globalLabel }}
            </span>
          </div>
          <div v-if="data.parRucher.length > 0" class="min-w-0 flex-1 space-y-2">
            <div v-for="r in topRuchers" :key="r.rucherId" class="flex items-center gap-2">
              <span class="w-20 truncate text-[11px] text-stone-600">{{ r.nom }}</span>
              <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
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

        <!-- Alert hives -->
        <div v-if="alertHives.length > 0" class="mt-4">
          <h4 class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Ruches en alerte
          </h4>
          <div class="flex flex-wrap gap-1.5">
            <NuxtLink
              v-for="h in alertHives"
              :key="h.rucheId"
              :to="`/ruches/${h.rucheId}`"
              class="flex items-center gap-1.5 rounded-lg bg-stone-50 px-2.5 py-1.5 text-xs transition-colors hover:bg-stone-100"
            >
              <div
                class="h-1.5 w-1.5 rounded-full"
                :style="{ backgroundColor: scoreColor(h.score) }"
              />
              <span class="font-medium text-stone-700">{{ h.numero }}</span>
              <span class="font-bold tabular-nums" :style="{ color: scoreColor(h.score) }">{{
                h.score
              }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- No data state -->
        <div v-if="data.parRuche.length === 0" class="flex flex-col items-center py-4 text-center">
          <p class="text-xs text-stone-400">Aucune ruche enregistree</p>
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

const circumference = 2 * Math.PI * 34;

const dashOffset = computed(() => {
  const pct = props.data.global / 100;
  return circumference * (1 - pct);
});

function scoreColor(score: number): string {
  if (score >= 70) return '#34A853';
  if (score >= 40) return '#F5A623';
  return '#D93025';
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
