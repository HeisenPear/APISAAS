<template>
  <div class="space-y-4">
    <div v-if="pending" class="h-56 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />

    <template v-else-if="meteo?.available">
      <!-- Coefficient + insight -->
      <div class="flex items-start gap-3 rounded-[12px] bg-[var(--surface-muted)] p-4">
        <div
          class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[10px] text-white"
          :style="{ background: forceColor }"
        >
          <span class="text-sm font-bold tabular-nums leading-none">{{ coefLabel }}</span>
          <span class="mt-0.5 text-[8px] uppercase tracking-wide opacity-90">r</span>
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wide" :style="{ color: forceColor }">
            Corrélation {{ meteo.force }}
          </p>
          <p class="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
            {{ meteo.insight }}
          </p>
        </div>
      </div>

      <div ref="chartRef" class="h-56" />
    </template>

    <UiEmptyState
      v-else
      icon="i-lucide-cloud-sun"
      title="Corrélation météo indisponible"
      :description="
        meteo?.raison || 'Ajoutez les coordonnées GPS de vos ruchers pour activer cette analyse.'
      "
    />
  </div>
</template>

<script setup lang="ts">
import { echarts, barHoney } from '~/utils/echarts';

interface CorrelationPoint {
  mois: number;
  production: number;
  favorabilite: number;
  tMax: number;
  sunHours: number;
}
interface MeteoResponse {
  available: boolean;
  annee: number;
  raison?: string;
  coefficient?: number;
  force?: string;
  points?: CorrelationPoint[];
  insight?: string;
}

const props = defineProps<{ annee: number }>();

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const { data: raw, pending } = useFetch('/api/analytics/meteo', {
  query: computed(() => ({ annee: props.annee })),
  watch: [() => props.annee],
  lazy: true,
});

const meteo = computed(() => (raw.value as { data: MeteoResponse } | null)?.data ?? null);

const coefLabel = computed(() => {
  const c = meteo.value?.coefficient ?? 0;
  return `${c >= 0 ? '+' : '−'}${Math.abs(c).toFixed(2).replace('.', ',')}`;
});
const forceColor = computed(() => {
  switch (meteo.value?.force) {
    case 'forte':
      return '#ec9914';
    case 'modérée':
      return '#7a9676';
    default:
      return '#a8a29e';
  }
});

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

function renderChart() {
  const pts = meteo.value?.points;
  if (!chartRef.value || !pts) return;
  if (!chart) {
    if (chartRef.value.clientWidth === 0) return;
    chart = echarts.init(chartRef.value, 'warmPrecision');
  }
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ dataIndex: number }>) => {
        const i = params[0]?.dataIndex ?? 0;
        const p = pts[i];
        if (!p) return '';
        return `<strong>${MOIS[i]}</strong><br/>Production : <strong>${p.production} kg</strong><br/>Favorabilité : <strong>${p.favorabilite}/100</strong><br/>Temp. max : ${p.tMax} °C · Soleil : ${p.sunHours} h/j`;
      },
    },
    legend: { bottom: 0, textStyle: { color: '#78716c', fontSize: 11 } },
    grid: { left: 6, right: 6, top: 14, bottom: 32, containLabel: true },
    xAxis: { type: 'category', data: MOIS },
    yAxis: [
      { type: 'value', name: 'kg', nameTextStyle: { color: '#a8a29e', fontSize: 10 } },
      {
        type: 'value',
        name: 'météo',
        min: 0,
        max: 100,
        nameTextStyle: { color: '#a8a29e', fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Production (kg)',
        type: 'bar',
        data: pts.map((p) => p.production),
        barMaxWidth: 18,
        itemStyle: { color: barHoney(), borderRadius: [4, 4, 0, 0] },
      },
      {
        name: 'Favorabilité météo',
        type: 'line',
        yAxisIndex: 1,
        data: pts.map((p) => p.favorabilite),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#5e7ba8', width: 2.5 },
        itemStyle: { color: '#5e7ba8' },
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

watch(meteo, () => nextTick(renderChart), { deep: true });

onBeforeUnmount(() => {
  observer.value?.disconnect();
  chart?.dispose();
});
</script>
