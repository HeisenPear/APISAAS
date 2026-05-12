<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]" style="font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif">
          Analytics
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Pilotez votre activité apicole avec des données précises
        </p>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="annee"
          class="h-9 rounded-[10px] border border-[var(--border-default)] bg-white px-3 text-xs font-medium text-[var(--text-primary)] focus:border-[var(--honey)] focus:outline-none focus:ring-2 focus:ring-[var(--honey)]/20"
        >
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
    </div>

    <UiFeatureGate feature="analyticsRentabilite" blur>
      <template #preview>
        <div class="space-y-8">
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div v-for="i in 3" :key="i" class="h-24 rounded-[14px] bg-[var(--surface-muted)]" />
          </div>
          <div class="h-64 rounded-[14px] bg-[var(--surface-muted)]" />
          <div class="h-48 rounded-[14px] bg-[var(--surface-muted)]" />
        </div>
      </template>

      <!-- Loading -->
      <div v-if="pending" class="space-y-8">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
        </div>
        <div class="h-64 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
      </div>

      <template v-else-if="analytics">
        <!-- 01 — Rentabilité -->
        <section class="space-y-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            01 — Rentabilité
          </p>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">CA / ruche</p>
              <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                {{ analytics.ruches.total > 0 ? Math.round(totalCA / analytics.ruches.total) : '—' }} <span class="text-base font-normal text-[var(--text-tertiary)]">€</span>
              </p>
            </div>
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Production totale</p>
              <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                {{ totalProduction }} <span class="text-base font-normal text-[var(--text-tertiary)]">kg</span>
              </p>
            </div>
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Chiffre d'affaires</p>
              <p class="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                {{ totalCA }} <span class="text-base font-normal text-[var(--text-tertiary)]">€</span>
              </p>
            </div>
          </div>

          <!-- Production chart -->
          <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
            <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Production mensuelle (kg)
            </p>
            <div ref="productionChartRef" class="h-48" />
          </div>
        </section>

        <!-- 02 — Production -->
        <section class="space-y-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            02 — Production
          </p>
          <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
            <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Ruches actives vs total
            </p>
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p class="text-[11px] text-[var(--text-tertiary)]">Total</p>
                <p class="mt-1 text-xl font-semibold text-[var(--text-primary)]">{{ analytics.ruches.total }}</p>
              </div>
              <div>
                <p class="text-[11px] text-[var(--text-tertiary)]">Actives</p>
                <p class="mt-1 text-xl font-semibold text-[var(--sage-deep)]">{{ analytics.ruches.actives }}</p>
              </div>
              <div>
                <p class="text-[11px] text-[var(--text-tertiary)]">Faibles</p>
                <p class="mt-1 text-xl font-semibold text-[var(--status-warn)]">{{ analytics.ruches.faibles }}</p>
              </div>
              <div>
                <p class="text-[11px] text-[var(--text-tertiary)]">Mortes</p>
                <p class="mt-1 text-xl font-semibold text-[var(--status-bad)]">{{ analytics.ruches.mortes }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 03 — Activité -->
        <section class="space-y-4">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
            03 — Activité
          </p>
          <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
            <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Interventions par mois
            </p>
            <div ref="interventionsChartRef" class="h-48" />
          </div>

          <!-- Suggestions -->
          <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
            <div class="mb-4 flex items-center justify-between">
              <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                Suggestions d'actions
              </p>
              <div class="flex gap-2">
                <span
                  v-if="suggestions?.totalUrgentes"
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style="background:var(--status-bad);color:#fff;opacity:0.9"
                >
                  {{ suggestions.totalUrgentes }} urgente{{ suggestions.totalUrgentes > 1 ? 's' : '' }}
                </span>
                <span
                  v-if="suggestions?.totalAttention"
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style="background:var(--honey-soft);color:var(--honey-deep)"
                >
                  {{ suggestions.totalAttention }} attention
                </span>
              </div>
            </div>

            <div v-if="!suggestions?.suggestions.length" class="py-6 text-center text-sm text-[var(--text-tertiary)]">
              Aucune suggestion — tout est en ordre !
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="s in suggestions.suggestions"
                :key="`${s.rucheId}-${s.titre}`"
                class="flex items-start gap-3 rounded-[10px] px-4 py-3"
                :class="urgenceClass(s.type)"
              >
                <UIcon :name="urgenceIcon(s.type)" class="mt-0.5 h-4 w-4 shrink-0" :class="urgenceIconClass(s.type)" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-[var(--text-primary)]">{{ s.titre }}</p>
                  <p class="text-xs text-[var(--text-secondary)]">{{ s.detail }}</p>
                </div>
                <NuxtLink :to="`/ruches/${s.rucheId}`" class="shrink-0 text-xs font-medium text-[var(--honey-deep)] hover:underline">
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
import { echarts } from '~/utils/echarts';

definePageMeta({ layout: 'default' });

const annee = ref(new Date().getFullYear());
const years = computed(() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => current - i);
});

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const { data: analyticsRaw, pending } = useFetch('/api/analytics', {
  query: computed(() => ({ annee: annee.value })),
  watch: [annee],
  lazy: true,
});

const { data: suggestionsRaw } = useFetch('/api/analytics/suggestions', { lazy: true });

const analytics = computed(
  () =>
    (analyticsRaw.value as { data: unknown } | null)?.data as {
      annee: number;
      productionMensuelle: Array<{ mois: number; type_produit: string; total_kg: number }>;
      interventionsMensuelles: Array<{ mois: number; count: number }>;
      chiffreAffaires: Array<{ mois: number; total: number }>;
      ruches: { total: number; actives: number; faibles: number; mortes: number };
    } | null,
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

const totalProduction = computed(() => {
  if (!analytics.value) return 0;
  return Math.round(analytics.value.productionMensuelle.reduce((s, r) => s + r.total_kg, 0));
});

const totalCA = computed(() => {
  if (!analytics.value) return 0;
  return Math.round(analytics.value.chiffreAffaires.reduce((s, r) => s + r.total, 0));
});

const productionChartOption = computed(() => {
  const data = analytics.value?.productionMensuelle ?? [];
  const mielData = Array.from({ length: 12 }, (_, i) => {
    const row = data.find((r) => r.mois === i + 1 && r.type_produit === 'miel');
    return row?.total_kg ?? 0;
  });

  return {
    grid: { left: 30, right: 10, top: 10, bottom: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: MOIS,
      axisLine: { lineStyle: { color: '#D6D3D1' } },
      axisLabel: { color: '#78716C', fontSize: 11 },
    },
    yAxis: { type: 'value', axisLabel: { color: '#78716C', fontSize: 11 } },
    series: [
      {
        name: 'Miel (kg)',
        type: 'bar',
        data: mielData,
        itemStyle: { color: '#F5A623', borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
});

const interventionsChartOption = computed(() => {
  const data = analytics.value?.interventionsMensuelles ?? [];
  const values = Array.from({ length: 12 }, (_, i) => {
    const row = data.find((r) => r.mois === i + 1);
    return row?.count ?? 0;
  });

  return {
    grid: { left: 30, right: 10, top: 10, bottom: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: MOIS,
      axisLine: { lineStyle: { color: '#D6D3D1' } },
      axisLabel: { color: '#78716C', fontSize: 11 },
    },
    yAxis: { type: 'value', axisLabel: { color: '#78716C', fontSize: 11 } },
    series: [
      {
        name: 'Interventions',
        type: 'line',
        data: values,
        smooth: true,
        lineStyle: { color: '#34A853', width: 2 },
        itemStyle: { color: '#34A853' },
        areaStyle: { color: 'rgba(52, 168, 83, 0.08)' },
      },
    ],
  };
});

const productionChartRef = ref<HTMLElement | null>(null);
const interventionsChartRef = ref<HTMLElement | null>(null);
let productionChart: echarts.ECharts | null = null;
let interventionsChart: echarts.ECharts | null = null;

let productionResizeObserver: ResizeObserver | null = null;
let interventionsResizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (productionChartRef.value) {
    productionResizeObserver = new ResizeObserver(() => {
      if (
        !productionChart &&
        productionChartRef.value &&
        productionChartRef.value.clientWidth > 0
      ) {
        productionChart = echarts.init(productionChartRef.value);
        productionChart.setOption(productionChartOption.value);
      } else if (productionChart) {
        productionChart.resize();
      }
    });
    productionResizeObserver.observe(productionChartRef.value);
  }
  if (interventionsChartRef.value) {
    interventionsResizeObserver = new ResizeObserver(() => {
      if (
        !interventionsChart &&
        interventionsChartRef.value &&
        interventionsChartRef.value.clientWidth > 0
      ) {
        interventionsChart = echarts.init(interventionsChartRef.value);
        interventionsChart.setOption(interventionsChartOption.value);
      } else if (interventionsChart) {
        interventionsChart.resize();
      }
    });
    interventionsResizeObserver.observe(interventionsChartRef.value);
  }
});

onUnmounted(() => {
  productionResizeObserver?.disconnect();
  interventionsResizeObserver?.disconnect();
  productionChart?.dispose();
  interventionsChart?.dispose();
});

watch(productionChartOption, (option) => productionChart?.setOption(option), { flush: 'post' });
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
