<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
    <h3 class="mb-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
      Sante de la colonie
    </h3>

    <!-- Skeleton -->
    <div v-if="pending" class="flex flex-col items-center gap-3">
      <div class="h-20 w-20 animate-pulse rounded-full bg-stone-100" />
      <div class="h-3 w-24 animate-pulse rounded bg-stone-100" />
    </div>

    <template v-else-if="scoreData">
      <!-- Gauge -->
      <div class="flex flex-col items-center">
        <div class="relative flex h-20 w-20 items-center justify-center">
          <svg class="absolute inset-0" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#F0EDE8" stroke-width="6" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              :stroke="color"
              stroke-width="6"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              transform="rotate(-90 40 40)"
              class="transition-all duration-700 ease-out"
            />
          </svg>
          <div class="text-center">
            <span class="text-xl font-bold" :style="{ color }">{{ scoreData.score }}</span>
            <span class="block text-[9px] text-stone-400">/100</span>
          </div>
        </div>
        <span class="mt-1.5 text-xs font-semibold" :style="{ color }">{{ label }}</span>
      </div>

      <!-- Dernier controle -->
      <div class="mt-4 flex items-center justify-between text-xs text-stone-500">
        <span>Dernier controle</span>
        <span class="font-medium text-stone-700">{{ dernierControleFormatted }}</span>
      </div>

      <!-- Facteurs (ruche individuelle) -->
      <template v-if="scoreData.facteurs">
        <div class="mt-3 space-y-1.5">
          <div v-if="scoreData.facteurs.forceColonie != null" class="flex items-center gap-2">
            <span class="w-28 text-xs text-stone-500">Force colonie</span>
            <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div
                class="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-500"
                :style="{ width: `${(scoreData.facteurs.forceColonie / 5) * 100}%` }"
              />
            </div>
            <span class="w-4 text-right text-xs font-medium text-stone-700">
              {{ scoreData.facteurs.forceColonie }}
            </span>
          </div>
          <div v-if="scoreData.facteurs.couvain != null" class="flex items-center gap-2">
            <span class="w-28 text-xs text-stone-500">Couvain</span>
            <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div
                class="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-500"
                :style="{ width: `${(scoreData.facteurs.couvain / 5) * 100}%` }"
              />
            </div>
            <span class="w-4 text-right text-xs font-medium text-stone-700">
              {{ scoreData.facteurs.couvain }}
            </span>
          </div>
          <div v-if="scoreData.facteurs.reserves != null" class="flex items-center gap-2">
            <span class="w-28 text-xs text-stone-500">Reserves</span>
            <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div
                class="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-500"
                :style="{ width: `${(scoreData.facteurs.reserves / 5) * 100}%` }"
              />
            </div>
            <span class="w-4 text-right text-xs font-medium text-stone-700">
              {{ scoreData.facteurs.reserves }}
            </span>
          </div>
          <div v-if="scoreData.facteurs.varroa != null" class="flex items-center justify-between">
            <span class="text-xs text-stone-500">Varroa</span>
            <span
              class="text-xs font-medium"
              :class="
                scoreData.facteurs.varroa <= 1
                  ? 'text-emerald-600'
                  : scoreData.facteurs.varroa <= 3
                    ? 'text-amber-600'
                    : 'text-red-600'
              "
            >
              {{ scoreData.facteurs.varroa }}%
            </span>
          </div>
          <div v-if="scoreData.facteurs.reineVue != null" class="flex items-center justify-between">
            <span class="text-xs text-stone-500">Reine vue</span>
            <UIcon
              :name="scoreData.facteurs.reineVue ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              class="h-3.5 w-3.5"
              :class="scoreData.facteurs.reineVue ? 'text-emerald-500' : 'text-red-400'"
            />
          </div>
        </div>
      </template>

      <!-- Breakdown par ruche (rucher) -->
      <template v-if="scoreData.parRuche && scoreData.parRuche.length > 0">
        <div class="mt-4 space-y-1.5">
          <div
            v-for="r in scoreData.parRuche.slice(0, 6)"
            :key="r.rucheId"
            class="flex items-center gap-2"
          >
            <NuxtLink
              :to="`/ruches/${r.rucheId}`"
              class="w-14 truncate text-xs text-stone-700 hover:text-amber-600 transition-colors"
            >
              {{ r.numero }}
            </NuxtLink>
            <div class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div
                class="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                :style="{ width: `${r.score}%`, backgroundColor: rColor(r.score) }"
              />
            </div>
            <span class="w-7 text-right text-xs font-semibold" :style="{ color: rColor(r.score) }">
              {{ r.score }}
            </span>
          </div>
        </div>
        <p v-if="scoreData.parRuche.length > 6" class="mt-2 text-center text-[10px] text-stone-400">
          + {{ scoreData.parRuche.length - 6 }} autres ruches
        </p>
      </template>

      <!-- Pas encore d'intervention -->
      <p v-if="!scoreData.dernierControle" class="mt-3 text-center text-xs text-stone-400">
        Aucune intervention enregistree
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Facteurs {
  forceColonie: number | null;
  couvain: number | null;
  reserves: number | null;
  reineVue: boolean | null;
  varroa: number | null;
  comportement: string | null;
}

interface RucheScore {
  rucheId: string;
  numero: string;
  score: number;
  dernierControle: string | null;
  statut: string;
}

interface ScoreData {
  score: number;
  dernierControle: string | null;
  facteurs?: Facteurs | null;
  parRuche?: RucheScore[];
}

const props = defineProps<{
  scoreData: ScoreData | null;
  pending?: boolean;
}>();

const circumference = 2 * Math.PI * 34;

const color = computed(() => {
  const s = props.scoreData?.score ?? 0;
  if (s >= 70) return '#34A853';
  if (s >= 40) return '#F5A623';
  return '#D93025';
});

const dashOffset = computed(() => {
  const pct = (props.scoreData?.score ?? 0) / 100;
  return circumference * (1 - pct);
});

const label = computed(() => {
  const s = props.scoreData?.score ?? 0;
  if (s >= 80) return 'Excellent';
  if (s >= 70) return 'Bon';
  if (s >= 50) return 'Correct';
  if (s >= 40) return 'Attention';
  return 'Critique';
});

const dernierControleFormatted = computed(() => {
  const d = props.scoreData?.dernierControle;
  if (!d) return 'Jamais';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
});

function rColor(score: number): string {
  if (score >= 70) return '#34A853';
  if (score >= 40) return '#F5A623';
  return '#D93025';
}
</script>
