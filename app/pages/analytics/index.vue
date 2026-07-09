<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
          style="
            font-family:
              'SF Pro Display',
              -apple-system,
              BlinkMacSystemFont,
              sans-serif;
          "
        >
          Analytics
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Sachez ce que chaque rucher vous rapporte — et pourquoi.
        </p>
      </div>
      <select
        v-model="annee"
        class="h-9 rounded-[10px] border border-[var(--border-default)] bg-white px-3 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--honey)] focus:outline-none focus:ring-2 focus:ring-[var(--honey)]/20"
      >
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <UiFeatureGate feature="analyticsRentabilite" blur>
      <template #preview>
        <div class="space-y-8">
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div v-for="i in 4" :key="i" class="h-24 rounded-[14px] bg-[var(--surface-muted)]" />
          </div>
          <div class="h-64 rounded-[14px] bg-[var(--surface-muted)]" />
          <div class="h-56 rounded-[14px] bg-[var(--surface-muted)]" />
        </div>
      </template>

      <!-- Erreur -->
      <UiErrorState v-if="error" :error="error" :retry="refresh" />

      <!-- Loading -->
      <div v-else-if="pending" class="space-y-8">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div
            v-for="i in 4"
            :key="i"
            class="h-24 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
          />
        </div>
        <div class="h-64 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
      </div>

      <template v-else-if="analytics">
        <!-- KPI bandeau -->
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
            >
              Production miel
            </p>
            <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
              {{ Math.round(comp.totals.productionN) }}
              <span class="text-base font-normal text-[var(--text-tertiary)]">kg</span>
            </p>
            <p
              class="mt-1 text-[11px] font-medium"
              :class="deltaInfo(comp.totals.productionDeltaPct, comp.anneeN1).cls"
            >
              {{ deltaInfo(comp.totals.productionDeltaPct, comp.anneeN1).text }}
            </p>
          </div>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
            >
              Chiffre d'affaires
            </p>
            <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
              {{ comp.totals.caN.toLocaleString('fr-FR') }}
              <span class="text-base font-normal text-[var(--text-tertiary)]">€</span>
            </p>
            <p
              class="mt-1 text-[11px] font-medium"
              :class="deltaInfo(comp.totals.caDeltaPct, comp.anneeN1).cls"
            >
              {{ deltaInfo(comp.totals.caDeltaPct, comp.anneeN1).text }}
            </p>
          </div>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
            >
              Prix moyen
            </p>
            <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
              {{ analytics.rentabilite.prixMoyenKg.toLocaleString('fr-FR') }}
              <span class="text-base font-normal text-[var(--text-tertiary)]">€/kg</span>
            </p>
            <p class="mt-1 text-[11px] text-[var(--text-quaternary)]">réalisé (CA ÷ prod.)</p>
          </div>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
            >
              Marge estimée
            </p>
            <p
              class="mt-2 text-2xl font-semibold tabular-nums"
              :class="margeEstimee >= 0 ? 'text-[var(--sage-deep)]' : 'text-[var(--status-bad)]'"
            >
              {{ margeEstimee.toLocaleString('fr-FR') }}
              <span class="text-base font-normal text-[var(--text-tertiary)]">€</span>
            </p>
            <p class="mt-1 text-[11px] text-[var(--text-quaternary)]">valorisation − coûts</p>
          </div>
        </div>

        <!-- 01 — Rentabilité par rucher -->
        <section class="space-y-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            01 — Rentabilité par rucher
          </p>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <AnalyticsRentabiliteRuchers
              :ruchers="analytics.rentabilite.ruchers"
              :prix-moyen-kg="analytics.rentabilite.prixMoyenKg"
            />
          </div>
        </section>

        <!-- 02 — Comparaison entre saisons -->
        <section class="space-y-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            02 — Comparaison entre saisons
          </p>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <AnalyticsComparaisonSaisons
              :production="comp.production"
              :ca="comp.ca"
              :annee-n="comp.anneeN"
              :annee-n1="comp.anneeN1"
              :totals="comp.totals"
            />
          </div>
        </section>

        <!-- 03 — Météo & production -->
        <section class="space-y-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            03 — Météo & production
          </p>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <AnalyticsMeteoCorrelation :annee="annee" />
          </div>
        </section>

        <!-- 04 — Analyse pluriannuelle (Expert) -->
        <section class="space-y-3">
          <div class="flex items-center gap-2">
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
            >
              04 — Analyse pluriannuelle
            </p>
            <span
              class="rounded-full bg-[var(--sage-soft)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--sage-deep)]"
            >
              Expert
            </span>
          </div>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <UiFeatureGate feature="analyseMultiSaisons" blur>
              <template #preview>
                <div class="space-y-3">
                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div
                      v-for="i in 4"
                      :key="i"
                      class="h-14 rounded-[12px] bg-[var(--surface-muted)]"
                    />
                  </div>
                  <div class="h-44 rounded-[12px] bg-[var(--surface-muted)]" />
                </div>
              </template>
              <AnalyticsAnalysePluriannuelle />
            </UiFeatureGate>
          </div>
        </section>

        <!-- 05 — Activité -->
        <section class="space-y-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            05 — Activité & actions
          </p>
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <p
              class="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
            >
              Interventions par mois
            </p>
            <div ref="interventionsChartRef" class="h-48" />
          </div>

          <!-- Suggestions -->
          <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
            <div class="mb-4 flex items-center justify-between">
              <p
                class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
              >
                Suggestions d'actions
              </p>
              <div class="flex gap-2">
                <span
                  v-if="suggestions?.totalUrgentes"
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style="background: var(--status-bad); color: #fff; opacity: 0.9"
                >
                  {{ suggestions.totalUrgentes }} urgente{{
                    suggestions.totalUrgentes > 1 ? 's' : ''
                  }}
                </span>
                <span
                  v-if="suggestions?.totalAttention"
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style="background: var(--honey-soft); color: var(--honey-deep)"
                >
                  {{ suggestions.totalAttention }} attention
                </span>
              </div>
            </div>

            <div
              v-if="!suggestions?.suggestions.length"
              class="py-6 text-center text-sm text-[var(--text-tertiary)]"
            >
              Aucune suggestion — tout est en ordre !
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="s in suggestions.suggestions"
                :key="`${s.rucheId}-${s.titre}`"
                class="flex items-start gap-3 rounded-[10px] px-4 py-3"
                :class="urgenceClass(s.type)"
              >
                <UIcon
                  :name="urgenceIcon(s.type)"
                  class="mt-0.5 h-4 w-4 shrink-0"
                  :class="urgenceIconClass(s.type)"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-[var(--text-primary)]">{{ s.titre }}</p>
                  <p class="text-xs text-[var(--text-secondary)]">{{ s.detail }}</p>
                </div>
                <NuxtLink
                  :to="`/ruches/${s.rucheId}`"
                  class="shrink-0 text-xs font-medium text-[var(--honey-deep)] hover:underline"
                >
                  Ruche {{ s.rucheNumero }} →
                </NuxtLink>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- Empty state -->
      <UiEmptyState
        v-else
        icon="i-lucide-bar-chart-3"
        title="Pas assez de données"
        description="Enregistrez des interventions et des récoltes pour voir vos analytics."
        action-label="Enregistrer une intervention"
        @action="navigateTo('/interventions/nouvelle')"
      />
    </UiFeatureGate>
  </div>
</template>

<script setup lang="ts">
import { echarts, barSage } from '~/utils/echarts';

definePageMeta({ layout: 'default' });

const annee = ref(new Date().getFullYear());
const years = computed(() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => current - i);
});

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

interface CompMois {
  mois: number;
  n: number;
  n1: number;
  delta: number;
}
interface RentabiliteRucher {
  rucherId: string;
  nom: string;
  nbRuches: number;
  productionKg: number;
  kgParRuche: number;
  valorisationEur: number;
  coutsEur: number;
  margeEur: number;
}
interface AnalyticsData {
  annee: number;
  interventionsMensuelles: Array<{ mois: number; count: number }>;
  rentabilite: { prixMoyenKg: number; coutsTotal: number; ruchers: RentabiliteRucher[] };
  comparaison: {
    anneeN: number;
    anneeN1: number;
    production: CompMois[];
    ca: CompMois[];
    totals: {
      productionN: number;
      productionN1: number;
      productionDeltaPct: number | null;
      caN: number;
      caN1: number;
      caDeltaPct: number | null;
    };
  };
}

const {
  data: analyticsRaw,
  pending,
  error,
  refresh,
} = useFetch('/api/analytics', {
  query: computed(() => ({ annee: annee.value })),
  watch: [annee],
  lazy: true,
});
const { data: suggestionsRaw } = useFetch('/api/analytics/suggestions', { lazy: true });

const analytics = computed(
  () => (analyticsRaw.value as { data: AnalyticsData } | null)?.data ?? null,
);
const comp = computed(() => analytics.value!.comparaison);
const margeEstimee = computed(() =>
  (analytics.value?.rentabilite.ruchers ?? []).reduce((s, r) => s + r.margeEur, 0),
);

const suggestions = computed(
  () =>
    (suggestionsRaw.value as { data: unknown } | null)?.data as {
      suggestions: Array<{
        type: string;
        rucheId: string;
        rucheNumero: string;
        titre: string;
        detail: string;
      }>;
      totalUrgentes: number;
      totalAttention: number;
    } | null,
);

// Chip de variation N vs N-1.
function deltaInfo(delta: number | null, anneeRef: number) {
  if (delta === null || delta === undefined)
    return { text: `pas de ${anneeRef}`, cls: 'text-[var(--text-quaternary)]' };
  const pos = delta >= 0;
  return {
    text: `${pos ? '▲ +' : '▼ '}${delta}% vs ${anneeRef}`,
    cls: pos ? 'text-[var(--sage-deep)]' : 'text-[var(--status-bad)]',
  };
}

const interventionsChartOption = computed(() => {
  const data = analytics.value?.interventionsMensuelles ?? [];
  const values = Array.from(
    { length: 12 },
    (_, i) => data.find((r) => r.mois === i + 1)?.count ?? 0,
  );
  return {
    grid: { left: 8, right: 10, top: 12, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: MOIS },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Interventions',
        type: 'bar',
        data: values,
        barMaxWidth: 24,
        itemStyle: { color: barSage(), borderRadius: [5, 5, 0, 0] },
      },
    ],
  };
});

const interventionsChartRef = ref<HTMLElement | null>(null);
let interventionsChart: echarts.ECharts | null = null;
let interventionsResizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (interventionsChartRef.value) {
    interventionsResizeObserver = new ResizeObserver(() => {
      if (
        !interventionsChart &&
        interventionsChartRef.value &&
        interventionsChartRef.value.clientWidth > 0
      ) {
        interventionsChart = echarts.init(interventionsChartRef.value, 'warmPrecision');
        interventionsChart.setOption(interventionsChartOption.value);
      } else if (interventionsChart) {
        interventionsChart.resize();
      }
    });
    interventionsResizeObserver.observe(interventionsChartRef.value);
  }
});

onUnmounted(() => {
  interventionsResizeObserver?.disconnect();
  interventionsChart?.dispose();
});

watch(interventionsChartOption, (option) => interventionsChart?.setOption(option), {
  flush: 'post',
});

function urgenceClass(type: string) {
  if (type === 'urgente') return 'bg-red-50';
  if (type === 'attention') return 'bg-[var(--honey-soft)]';
  return 'bg-[var(--surface-muted)]';
}
function urgenceIcon(type: string) {
  if (type === 'urgente') return 'i-lucide-alert-circle';
  if (type === 'attention') return 'i-lucide-alert-triangle';
  return 'i-lucide-info';
}
function urgenceIconClass(type: string) {
  if (type === 'urgente') return 'text-red-500';
  if (type === 'attention') return 'text-[var(--honey-deep)]';
  return 'text-[var(--text-quaternary)]';
}
</script>
