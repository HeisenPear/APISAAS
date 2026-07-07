<template>
  <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
    <h3 class="mb-4 text-sm font-semibold text-stone-900">Chiffre d'affaires vs Charges</h3>
    <div ref="chartRef" class="h-72 w-full" />
  </div>
</template>

<script setup lang="ts">
import { echarts, barHoney, barClay } from '~/utils/echarts';

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
          html += `${p.marker} ${p.seriesName}: <strong>${p.value.toLocaleString('fr-FR')} €</strong><br/>`;
        }
        return html;
      },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#78716c', fontSize: 12 },
    },
    grid: { left: 8, right: 14, top: 14, bottom: 40, containLabel: true },
    xAxis: { type: 'category', data: props.labels },
    yAxis: { type: 'value', axisLabel: { formatter: '{value} €' } },
    series: [
      {
        name: 'Ventes',
        type: 'bar',
        data: props.ventes,
        itemStyle: { color: barHoney(), borderRadius: [5, 5, 0, 0] },
        barMaxWidth: 24,
      },
      {
        name: 'Charges',
        type: 'bar',
        data: props.achats,
        itemStyle: { color: barClay(), borderRadius: [5, 5, 0, 0] },
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
