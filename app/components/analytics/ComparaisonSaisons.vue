<template>
  <div class="space-y-4">
    <!-- Bascule Production / CA + delta global -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="inline-flex rounded-[10px] bg-[var(--surface-muted)] p-0.5">
        <button
          v-for="m in modes"
          :key="m.key"
          class="rounded-[8px] px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            mode === m.key
              ? 'bg-white text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-tertiary)]'
          "
          @click="mode = m.key"
        >
          {{ m.label }}
        </button>
      </div>

      <div v-if="delta !== null" class="flex items-center gap-1.5 text-sm">
        <UIcon
          :name="delta >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
          class="h-4 w-4"
          :class="delta >= 0 ? 'text-[var(--sage-deep)]' : 'text-[var(--status-bad)]'"
        />
        <span
          class="font-semibold tabular-nums"
          :class="delta >= 0 ? 'text-[var(--sage-deep)]' : 'text-[var(--status-bad)]'"
        >
          {{ delta >= 0 ? '+' : '' }}{{ delta }}%
        </span>
        <span class="text-[var(--text-tertiary)]">vs {{ anneeN1 }}</span>
      </div>
      <div v-else class="text-xs text-[var(--text-tertiary)]">
        Pas de {{ anneeN1 }} pour comparer
      </div>
    </div>

    <div ref="chartRef" class="h-56" />

    <!-- Totaux N vs N-1 -->
    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-[12px] bg-[var(--surface-muted)] px-4 py-3">
        <p class="text-[11px] text-[var(--text-tertiary)]">{{ anneeN }}</p>
        <p class="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
          {{ fmt(totalN) }}
        </p>
      </div>
      <div class="rounded-[12px] bg-[var(--surface-muted)] px-4 py-3">
        <p class="text-[11px] text-[var(--text-tertiary)]">{{ anneeN1 }}</p>
        <p class="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-secondary)]">
          {{ fmt(totalN1) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { echarts, barHoney } from '~/utils/echarts';

interface CompMois {
  mois: number;
  n: number;
  n1: number;
  delta: number;
}

const props = defineProps<{
  production: CompMois[];
  ca: CompMois[];
  anneeN: number;
  anneeN1: number;
  totals: {
    productionN: number;
    productionN1: number;
    productionDeltaPct: number | null;
    caN: number;
    caN1: number;
    caDeltaPct: number | null;
  };
}>();

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const modes = [
  { key: 'prod' as const, label: 'Production' },
  { key: 'ca' as const, label: "Chiffre d'affaires" },
];
const mode = ref<'prod' | 'ca'>('prod');

const serie = computed(() => (mode.value === 'prod' ? props.production : props.ca));
const unite = computed(() => (mode.value === 'prod' ? 'kg' : '€'));
const delta = computed(() =>
  mode.value === 'prod' ? props.totals.productionDeltaPct : props.totals.caDeltaPct,
);
const totalN = computed(() =>
  mode.value === 'prod' ? props.totals.productionN : props.totals.caN,
);
const totalN1 = computed(() =>
  mode.value === 'prod' ? props.totals.productionN1 : props.totals.caN1,
);

function fmt(n: number) {
  return `${Math.round(n).toLocaleString('fr-FR')} ${unite.value}`;
}

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

function renderChart() {
  if (!chartRef.value) return;
  if (!chart) {
    if (chartRef.value.clientWidth === 0) return;
    chart = echarts.init(chartRef.value, 'warmPrecision');
  }
  const s = serie.value;
  chart.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${Math.round(v)} ${unite.value}` },
    legend: { bottom: 0, textStyle: { color: '#78716c', fontSize: 11 } },
    grid: { left: 6, right: 12, top: 14, bottom: 32, containLabel: true },
    xAxis: { type: 'category', data: MOIS },
    yAxis: { type: 'value' },
    series: [
      {
        name: String(props.anneeN1),
        type: 'bar',
        data: s.map((m) => m.n1),
        barMaxWidth: 12,
        itemStyle: { color: '#d6d3d1', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: String(props.anneeN),
        type: 'bar',
        data: s.map((m) => m.n),
        barMaxWidth: 12,
        itemStyle: { color: barHoney(), borderRadius: [4, 4, 0, 0] },
      },
    ],
  });
}

const observer = ref<ResizeObserver | null>(null);

onMounted(() => {
  observer.value = new ResizeObserver(() => {
    nextTick(() => {
      if (chart) chart.resize();
      else renderChart();
    });
  });
  if (chartRef.value) observer.value.observe(chartRef.value);
  nextTick(renderChart);
});

watch([serie, () => props.anneeN], renderChart, { deep: true });

onBeforeUnmount(() => {
  observer.value?.disconnect();
  chart?.dispose();
});
</script>
