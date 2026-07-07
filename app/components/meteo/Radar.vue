<template>
  <div ref="chartRef" class="h-60 w-full" />
</template>

<script setup lang="ts">
import { echarts } from '~/utils/echarts';
import type { MeteoFacteur } from '~/composables/useMeteo';

const props = defineProps<{ facteurs: MeteoFacteur[] }>();

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

function render() {
  if (!chartRef.value) return;
  if (!chart) {
    if (chartRef.value.clientWidth === 0) return;
    chart = echarts.init(chartRef.value, 'warmPrecision');
  }
  chart.setOption({
    tooltip: {
      backgroundColor: '#fff',
      borderColor: '#e7e5e4',
      textStyle: { color: '#1c1917', fontSize: 12 },
    },
    radar: {
      indicator: props.facteurs.map((f) => ({ name: f.label, max: 100 })),
      radius: '64%',
      axisName: { color: '#78716c', fontSize: 11 },
      splitLine: { lineStyle: { color: '#e7e5e4' } },
      splitArea: { areaStyle: { color: ['#fafaf8', '#ffffff'] } },
      axisLine: { lineStyle: { color: '#e7e5e4' } },
    },
    series: [
      {
        type: 'radar',
        data: [{ value: props.facteurs.map((f) => f.valeur), name: 'Conditions de visite' }],
        symbolSize: 5,
        areaStyle: { color: 'rgba(245, 166, 35, 0.18)' },
        lineStyle: { color: '#f5a623', width: 2 },
        itemStyle: { color: '#f5a623' },
      },
    ],
  });
}

const observer = ref<ResizeObserver | null>(null);

onMounted(() => {
  observer.value = new ResizeObserver(() => {
    nextTick(() => {
      if (chart) chart.resize();
      else render();
    });
  });
  if (chartRef.value) observer.value.observe(chartRef.value);
  nextTick(render);
});

watch(() => props.facteurs, render, { deep: true });

onBeforeUnmount(() => {
  observer.value?.disconnect();
  chart?.dispose();
});
</script>
