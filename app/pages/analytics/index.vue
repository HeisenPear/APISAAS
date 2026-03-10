<template>
  <div>
    <UiPageHeader title="Analytics">
      <template #actions>
        <select
          v-model="annee"
          class="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
        >
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </template>
    </UiPageHeader>

    <!-- Loading -->
    <div v-if="pending" class="space-y-6">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    </div>

    <template v-else-if="analytics">
      <!-- KPI row -->
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <UiKpiCard icon="i-lucide-box" label="Total ruches" :value="analytics.ruches.total" />
        <UiKpiCard icon="i-lucide-heart-pulse" label="Actives" :value="analytics.ruches.actives" />
        <UiKpiCard
          icon="i-lucide-droplets"
          label="Production totale"
          :value="totalProduction"
          suffix=" kg"
        />
        <UiKpiCard icon="i-lucide-euro" label="Chiffre d'affaires" :value="totalCA" suffix=" €" />
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Production mensuelle -->
        <div class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
            Production mensuelle (kg)
          </h2>
          <div ref="productionChartRef" class="h-48" />
        </div>

        <!-- Interventions par mois -->
        <div class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
          <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
            Interventions par mois
          </h2>
          <div ref="interventionsChartRef" class="h-48" />
        </div>
      </div>

      <!-- Suggestions -->
      <div class="mt-6 rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-stone-400">
            Suggestions d'actions
          </h2>
          <div class="flex gap-2">
            <span
              v-if="suggestions?.totalUrgentes"
              class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
            >
              {{ suggestions.totalUrgentes }} urgente{{ suggestions.totalUrgentes > 1 ? 's' : '' }}
            </span>
            <span
              v-if="suggestions?.totalAttention"
              class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
            >
              {{ suggestions.totalAttention }} attention
            </span>
          </div>
        </div>

        <div
          v-if="!suggestions?.suggestions.length"
          class="py-6 text-center text-sm text-stone-400"
        >
          Aucune suggestion — tout est en ordre !
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="s in suggestions.suggestions"
            :key="`${s.rucheId}-${s.titre}`"
            class="flex items-start gap-3 rounded-xl px-4 py-3"
            :class="urgenceClass(s.type)"
          >
            <UIcon
              :name="urgenceIcon(s.type)"
              class="mt-0.5 h-4 w-4 shrink-0"
              :class="urgenceIconClass(s.type)"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-stone-900">{{ s.titre }}</p>
              <p class="text-xs text-stone-500">{{ s.detail }}</p>
            </div>
            <NuxtLink
              :to="`/ruches/${s.rucheId}`"
              class="shrink-0 text-xs font-medium text-amber-600 hover:text-amber-700"
            >
              Ruche {{ s.rucheNumero }} →
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

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
  if (type === 'attention') return 'bg-amber-50';
  return 'bg-stone-50';
}

function urgenceIcon(type: string) {
  if (type === 'urgente') return 'i-lucide-alert-circle';
  if (type === 'attention') return 'i-lucide-alert-triangle';
  return 'i-lucide-info';
}

function urgenceIconClass(type: string) {
  if (type === 'urgente') return 'text-red-500';
  if (type === 'attention') return 'text-amber-500';
  return 'text-stone-400';
}
</script>
