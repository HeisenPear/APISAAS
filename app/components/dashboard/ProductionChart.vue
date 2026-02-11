<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
    <h3 class="text-sm font-semibold text-stone-900">Production mensuelle</h3>
    <p class="text-xs text-stone-500">Recoltes en kg par mois</p>
    <div ref="chartRef" class="mt-4 h-[260px] w-full" />
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';

const props = defineProps<{
  data: Array<{ mois: number; total: number }>;
}>();

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;

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

function renderChart() {
  if (!chart) return;
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = params as Array<{ name: string; value: number }>;
        if (!arr || !arr[0]) return '';
        return `${arr[0].name}: <b>${arr[0].value} kg</b>`;
      },
    },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: {
      type: 'category',
      data: moisLabels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9C978E', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F3F2EF' } },
      axisLabel: { color: '#9C978E', fontSize: 11, formatter: '{value} kg' },
    },
    series: [
      {
        type: 'line',
        data: props.data.map((d) => d.total),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#F5A623', width: 2.5 },
        itemStyle: { color: '#F5A623' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 166, 35, 0.25)' },
            { offset: 1, color: 'rgba(245, 166, 35, 0.02)' },
          ]),
        },
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
  if (chartRef.value) {
    chart = echarts.init(chartRef.value);
    renderChart();
    window.addEventListener('resize', handleResize);
  }
});

watch(() => props.data, renderChart, { deep: true });

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chart?.dispose();
});
</script>
