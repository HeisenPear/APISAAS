<template>
  <div class="overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-sm">
    <!-- Header -->
    <div class="flex items-center gap-3 px-5 py-4">
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
        <UIcon name="i-lucide-bar-chart-3" class="h-[18px] w-[18px] text-amber-600" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="text-[15px] font-semibold text-stone-900">Production</h3>
        <p :key="activePeriod" class="text-xs text-stone-500 transition-opacity duration-300">
          {{ periodSubtitle }}
        </p>
      </div>
      <span
        v-if="currentTotal > 0"
        :key="`total-${activePeriod}`"
        class="text-sm font-bold tabular-nums text-stone-800"
      >
        {{ currentTotal }} <span class="text-xs font-normal text-stone-400">kg</span>
      </span>
    </div>

    <!-- Period segmented control -->
    <div class="relative mx-5 flex rounded-xl bg-stone-100 p-1">
      <!-- Sliding pill indicator -->
      <div
        class="absolute inset-y-1 rounded-lg bg-white shadow-sm ring-1 ring-stone-200/60 transition-all duration-300 ease-[var(--ease-out-expo)]"
        :style="pillStyle"
      />
      <button
        v-for="(tab, i) in tabs"
        :key="tab.key"
        :ref="
          (el) => {
            tabRefs[i] = el as HTMLButtonElement;
          }
        "
        type="button"
        class="relative z-10 flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors duration-200"
        :class="activePeriod === tab.key ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'"
        @click="activePeriod = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Chart with crossfade -->
    <div class="relative px-5 pb-5 pt-3">
      <div
        ref="chartRef"
        class="h-[220px] w-full transition-opacity duration-300 ease-out"
        :class="transitioning ? 'opacity-0' : 'opacity-100'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { echarts } from '~/utils/echarts';

type Period = 'mensuelle' | 'hebdo' | 'quotidien';

interface ProdPoint {
  label: string;
  total: number;
}

interface ProdResponse {
  mensuelle: ProdPoint[];
  hebdo: ProdPoint[];
  quotidien: ProdPoint[];
}

const props = defineProps<{
  data: Array<{ mois: number; total: number }>;
}>();

const tabs = [
  { key: 'mensuelle' as Period, label: 'Mois' },
  { key: 'hebdo' as Period, label: 'Semaine' },
  { key: 'quotidien' as Period, label: 'Jour' },
];

const activePeriod = ref<Period>('mensuelle');
const transitioning = ref(false);
const tabRefs = ref<(HTMLButtonElement | null)[]>([]);

// Sliding pill position
const pillStyle = computed(() => {
  const idx = tabs.findIndex((t) => t.key === activePeriod.value);
  const count = tabs.length;
  const pct = 100 / count;
  return {
    left: `calc(${idx * pct}% + 4px)`,
    width: `calc(${pct}% - 8px)`,
  };
});

const { data: prodData } = useFetch<ProdResponse>('/api/dashboard/production', {
  key: 'dashboard-production',
  lazy: true,
});

const periodSubtitle = computed(() => {
  switch (activePeriod.value) {
    case 'hebdo':
      return 'Recoltes par semaine (12 sem.)';
    case 'quotidien':
      return 'Recoltes par jour (30j)';
    default:
      return 'Recoltes en kg par mois';
  }
});

const currentSeries = computed<ProdPoint[]>(() => {
  if (!prodData.value) {
    if (activePeriod.value === 'mensuelle') {
      const moisLabels = [
        'Jan',
        'Fev',
        'Mar',
        'Avr',
        'Mai',
        'Juin',
        'Juil',
        'Aou',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return props.data.map((d, i) => ({ label: moisLabels[i] ?? '', total: d.total }));
    }
    return [];
  }
  return prodData.value[activePeriod.value];
});

const currentTotal = computed(() => {
  const sum = currentSeries.value.reduce((acc, d) => acc + d.total, 0);
  return Math.round(sum * 10) / 10;
});

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

function renderChart() {
  if (!chart) return;
  const series = currentSeries.value;
  const labels = series.map((d) => d.label);
  const values = series.map((d) => d.total);

  chart.setOption(
    {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#F0EDE8',
        borderWidth: 1,
        textStyle: { color: '#1C1C1E', fontSize: 12 },
        formatter: (params: unknown) => {
          const arr = params as Array<{ name: string; value: number }>;
          if (!arr?.[0]) return '';
          return `<span style="font-weight:600">${arr[0].name}</span><br/>${arr[0].value} kg`;
        },
      },
      grid: { top: 12, right: 12, bottom: 24, left: 36 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#A8A29E',
          fontSize: 10,
          interval: activePeriod.value === 'quotidien' ? 4 : 0,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F0EDE8', type: 'dashed' } },
        axisLabel: { color: '#A8A29E', fontSize: 10, formatter: '{value}' },
      },
      series: [
        {
          type: 'line',
          data: values,
          smooth: 0.4,
          symbol: 'circle',
          symbolSize: activePeriod.value === 'quotidien' ? 3 : 5,
          showSymbol: false,
          emphasis: { itemStyle: { borderWidth: 2, borderColor: '#fff' }, scale: true },
          lineStyle: { color: '#F5A623', width: 3 },
          itemStyle: { color: '#F5A623' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 166, 35, 0.2)' },
              { offset: 1, color: 'rgba(245, 166, 35, 0.01)' },
            ]),
          },
          animationDuration: 800,
          animationDurationUpdate: 600,
          animationEasing: 'cubicInOut',
          animationEasingUpdate: 'cubicInOut',
        },
      ],
    },
    true,
  );
}

// Crossfade transition on period change
watch(activePeriod, () => {
  transitioning.value = true;
  setTimeout(() => {
    renderChart();
    nextTick(() => {
      transitioning.value = false;
    });
  }, 150);
});

// React to data loading
watch(
  () => prodData.value,
  () => renderChart(),
);

function handleResize() {
  chart?.resize();
}

onMounted(() => {
  if (!chartRef.value) return;
  resizeObserver = new ResizeObserver(() => {
    if (!chart && chartRef.value && chartRef.value.clientWidth > 0) {
      chart = echarts.init(chartRef.value);
      renderChart();
      window.addEventListener('resize', handleResize);
    } else if (chart) {
      chart.resize();
    }
  });
  resizeObserver.observe(chartRef.value);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  resizeObserver?.disconnect();
  chart?.dispose();
});
</script>
