<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
    <h3 class="text-sm font-semibold text-stone-900">Sante des colonies</h3>
    <p class="text-xs text-stone-500">Repartition par statut</p>
    <div ref="chartRef" class="mt-4 h-[260px] w-full" />
  </div>
</template>

<script setup lang="ts">
import { echarts } from '~/utils/echarts';

const props = defineProps<{
  data: Array<{ statut: string; count: number }>;
}>();

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const colorMap: Record<string, string> = {
  active: '#34A853',
  faible: '#F5A623',
  orpheline: '#4285F4',
  essaimee: '#9C978E',
  morte: '#D93025',
  vendue: '#6B6860',
  fusionnee: '#8E7CC3',
};

const labelMap: Record<string, string> = {
  active: 'Actives',
  faible: 'Faibles',
  orpheline: 'Orphelines',
  essaimee: 'Essaimees',
  morte: 'Mortes',
  vendue: 'Vendues',
  fusionnee: 'Fusionnees',
};

function renderChart() {
  if (!chart) return;
  const total = props.data.reduce((s, d) => s + d.count, 0);
  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#6B6860', fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: `{a|${total}}\n{b|colonies}`,
          rich: {
            a: { fontSize: 24, fontWeight: 'bold', color: '#1A1A18', lineHeight: 30 },
            b: { fontSize: 12, color: '#9C978E', lineHeight: 18 },
          },
        },
        emphasis: {
          label: { show: true },
        },
        data: props.data.map((d) => ({
          name: labelMap[d.statut] ?? d.statut,
          value: d.count,
          itemStyle: { color: colorMap[d.statut] ?? '#9C978E' },
        })),
      },
    ],
    animationDuration: 800,
    animationEasing: 'cubicOut',
  });
}

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

watch(
  () => props.data,
  () => renderChart(),
  { deep: true },
);

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  resizeObserver?.disconnect();
  chart?.dispose();
});
</script>
