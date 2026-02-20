<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
    <h3 class="text-sm font-semibold text-stone-900">Sante des colonies</h3>
    <p class="mb-4 text-xs text-stone-500">Score base sur les dernieres interventions</p>

    <!-- Global Score Gauge -->
    <div class="flex flex-col items-center">
      <div class="relative flex h-28 w-28 items-center justify-center">
        <svg class="absolute inset-0" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r="48" fill="none" stroke="#F0EDE8" stroke-width="8" />
          <circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            :stroke="globalColor"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 56 56)"
            class="transition-all duration-700 ease-out"
          />
        </svg>
        <div class="text-center">
          <span class="text-2xl font-bold" :style="{ color: globalColor }">
            {{ data.global }}
          </span>
          <span class="block text-[10px] text-stone-400">/100</span>
        </div>
      </div>
      <span class="mt-1 text-xs font-medium" :style="{ color: globalColor }">
        {{ globalLabel }}
      </span>
    </div>

    <!-- Scores par rucher -->
    <div v-if="data.parRucher.length > 0" class="mt-5">
      <h4 class="mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">Par rucher</h4>
      <div class="space-y-2">
        <div v-for="r in sortedRuchers" :key="r.rucherId" class="flex items-center gap-2">
          <span class="w-24 truncate text-xs text-stone-700">{{ r.nom }}</span>
          <div class="relative h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
            <div
              class="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
              :style="{ width: `${r.score}%`, backgroundColor: scoreColor(r.score) }"
            />
          </div>
          <span
            class="w-8 text-right text-xs font-semibold"
            :style="{ color: scoreColor(r.score) }"
          >
            {{ r.score }}
          </span>
        </div>
      </div>
    </div>

    <!-- Ruches en alerte -->
    <div v-if="alertHives.length > 0" class="mt-5">
      <h4 class="mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">
        Ruches en alerte
      </h4>
      <div class="space-y-1.5">
        <NuxtLink
          v-for="h in alertHives"
          :key="h.rucheId"
          :to="`/ruches/${h.rucheId}`"
          class="flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors duration-200 hover:bg-stone-50"
        >
          <div class="flex items-center gap-2">
            <div class="h-2 w-2 rounded-full" :style="{ backgroundColor: scoreColor(h.score) }" />
            <span class="text-xs font-medium text-stone-700">{{ h.numero }}</span>
            <span
              v-if="isStale(h.dernierControle)"
              class="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600"
            >
              donnees anciennes
            </span>
          </div>
          <span class="text-xs font-bold" :style="{ color: scoreColor(h.score) }">
            {{ h.score }}
          </span>
        </NuxtLink>
      </div>
    </div>

    <!-- No data state -->
    <div v-if="data.parRuche.length === 0" class="mt-4 text-center">
      <p class="text-xs text-stone-400">Aucune ruche enregistree</p>
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

const circumference = 2 * Math.PI * 48;

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

const sortedRuchers = computed(() => [...props.data.parRucher].sort((a, b) => a.score - b.score));

const alertHives = computed(() =>
  [...props.data.parRuche]
    .filter((h) => h.statut === 'active')
    .sort((a, b) => a.score - b.score)
    .slice(0, 5),
);

function isStale(dateStr: string | null): boolean {
  if (!dateStr) return true;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff > 30 * 24 * 60 * 60 * 1000;
}
</script>
