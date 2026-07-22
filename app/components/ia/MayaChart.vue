<template>
  <div class="rounded-[10px] border p-2" style="border-color: var(--border-default)">
    <p
      v-if="titre"
      class="mb-1 px-1 text-[11px] font-semibold"
      style="color: var(--text-secondary)"
    >
      {{ titre }}
    </p>
    <div ref="el" class="h-[150px] w-full" />
  </div>
</template>

<script setup lang="ts">
import { echarts, type ECharts, type EChartsOption } from '~/utils/echarts';

const props = defineProps<{
  titre?: string;
  forme?: 'barres' | 'ligne';
  serie: { label: string; valeur: number }[];
}>();

const el = ref<HTMLDivElement | null>(null);
let chart: ECharts | null = null;
let observer: ResizeObserver | null = null;

// Sans vert : `#7a9676` (ancien sauge) menait la palette, donc la PREMIÈRE
// série de chaque graphe de Maya sortait verte.
const COULEURS = ['#f5a623', '#9a8536', '#b87959', '#a86a13', '#d4891a'];

function buildOption(): EChartsOption {
  return {
    grid: { top: 12, right: 8, bottom: 22, left: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: props.serie.map((s) => s.label),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'rgba(214,211,209,0.6)' } },
      axisLabel: { color: '#a8a29e', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: 'rgba(214,211,209,0.4)' } },
      axisLabel: { color: '#a8a29e', fontSize: 10 },
    },
    series:
      props.forme === 'ligne'
        ? [
            {
              type: 'line',
              smooth: 0.4,
              symbol: 'circle',
              symbolSize: 5,
              data: props.serie.map((s) => s.valeur),
              lineStyle: { color: '#f5a623', width: 2.5 },
              itemStyle: { color: '#f5a623' },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(245,166,35,0.22)' },
                    { offset: 1, color: 'rgba(245,166,35,0)' },
                  ],
                },
              },
              animationDuration: 600,
            },
          ]
        : [
            {
              type: 'bar',
              barMaxWidth: 38,
              data: props.serie.map((s, i) => ({
                value: s.valeur,
                itemStyle: { color: COULEURS[i % COULEURS.length], borderRadius: [4, 4, 0, 0] },
              })),
              animationDuration: 500,
            },
          ],
  };
}

function render() {
  if (!el.value || chart || el.value.clientWidth === 0) return;
  chart = echarts.init(el.value, 'warmPrecision');
  chart.setOption(buildOption());
}

onMounted(() => {
  observer = new ResizeObserver(() => {
    if (!chart) render();
    else chart.resize();
  });
  if (el.value) observer.observe(el.value);
});

watch(
  () => props.serie,
  () => chart?.setOption(buildOption()),
  { deep: true },
);

onBeforeUnmount(() => {
  observer?.disconnect();
  chart?.dispose();
  chart = null;
});
</script>
