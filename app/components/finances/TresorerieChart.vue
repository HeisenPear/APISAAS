<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
    <h3 class="mb-4 text-sm font-semibold text-stone-900">Trajectoire de trésorerie projetée</h3>
    <div ref="chartRef" class="h-80 w-full" />
  </div>
</template>

<script setup lang="ts">
import { echarts } from '~/utils/echarts';

const props = defineProps<{
  labels: string[];
  entrees: number[];
  sorties: number[];
  solde: number[];
}>();

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

function renderChart() {
  if (!chartRef.value) return;
  if (!chart) {
    if (chartRef.value.clientWidth === 0) return;
    chart = echarts.init(chartRef.value, 'warmPrecision');
  }
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e7e5e4',
      textStyle: { color: '#1c1917', fontSize: 12 },
      formatter: (
        params: Array<{ seriesName: string; value: number; marker: string; axisValue?: string }>,
      ) => {
        let html = `<strong>${params[0]?.axisValue ?? ''}</strong><br/>`;
        for (const p of params) {
          html += `${p.marker} ${p.seriesName}: <strong>${Math.round(p.value).toLocaleString('fr-FR')} €</strong><br/>`;
        }
        return html;
      },
    },
    legend: { bottom: 0, textStyle: { color: '#78716c', fontSize: 12 } },
    grid: { left: 55, right: 20, top: 12, bottom: 40 },
    xAxis: {
      type: 'category',
      data: props.labels,
      axisLine: { lineStyle: { color: '#e7e5e4' } },
      axisLabel: { color: '#78716c', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f5f5f4' } },
      axisLabel: { color: '#a8a29e', fontSize: 11, formatter: '{value} €' },
    },
    series: [
      {
        name: 'Entrées',
        type: 'bar',
        data: props.entrees,
        itemStyle: { color: '#f5a623', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 18,
      },
      {
        name: 'Sorties',
        type: 'bar',
        data: props.sorties,
        itemStyle: { color: '#e7e5e4', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 18,
      },
      {
        name: 'Solde projeté',
        type: 'line',
        data: props.solde,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#7a9676', width: 2.5 },
        itemStyle: { color: '#7a9676' },
        areaStyle: { color: 'rgba(122, 150, 118, 0.10)' },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#b87959', type: 'dashed', width: 1 },
          data: [{ yAxis: 0 }],
        },
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

watch(() => [props.labels, props.entrees, props.sorties, props.solde], renderChart, { deep: true });

onBeforeUnmount(() => {
  observer.value?.disconnect();
  chart?.dispose();
});
</script>
