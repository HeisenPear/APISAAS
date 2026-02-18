<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
    <h3 class="mb-4 text-sm font-semibold text-stone-900">Chiffre d'affaires vs Charges</h3>
    <div ref="chartRef" class="h-72 w-full" />
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const props = defineProps<{
  labels: string[];
  ventes: number[];
  achats: number[];
}>();

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

function renderChart() {
  if (!chartRef.value) return;
  if (!chart) {
    chart = echarts.init(chartRef.value);
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
          html += `${p.marker} ${p.seriesName}: <strong>${p.value.toLocaleString('fr-FR')} €</strong><br/>`;
        }
        return html;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#78716c', fontSize: 12 },
    },
    grid: { left: 50, right: 20, top: 10, bottom: 40 },
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
        name: 'Ventes',
        type: 'bar',
        data: props.ventes,
        itemStyle: { color: '#f5a623', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 24,
      },
      {
        name: 'Charges',
        type: 'bar',
        data: props.achats,
        itemStyle: { color: '#e7e5e4', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 24,
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

watch(() => [props.labels, props.ventes, props.achats], renderChart, { deep: true });

onBeforeUnmount(() => {
  observer.value?.disconnect();
  chart?.dispose();
});
</script>
