<template>
  <div
    ref="el"
    class="w-full"
    :class="clickable ? 'cursor-pointer' : ''"
    :style="{ height: `${height}px` }"
  />
</template>

<script setup lang="ts">
import { echarts } from '~/utils/echarts';
import type { EChartsOption } from '~/utils/echarts';

interface ClickParams {
  name?: string;
  dataIndex?: number;
  seriesName?: string;
  value?: unknown;
}

const props = withDefaults(
  defineProps<{ option: Record<string, unknown>; height?: number; clickable?: boolean }>(),
  { height: 200, clickable: false },
);
const emit = defineEmits<{ click: [ClickParams] }>();

const el = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
let ro: ResizeObserver | null = null;

function render() {
  if (!el.value) return;
  if (!chart) {
    if (el.value.clientWidth === 0) return;
    chart = echarts.init(el.value, 'warmPrecision');
    chart.on('click', (params) => {
      const p = params as ClickParams;
      emit('click', {
        name: p.name,
        dataIndex: p.dataIndex,
        seriesName: p.seriesName,
        value: p.value,
      });
    });
  }
  chart.setOption(props.option as EChartsOption, true);
}

onMounted(() => {
  ro = new ResizeObserver(() => {
    if (chart) chart.resize();
    else render();
  });
  if (el.value) ro.observe(el.value);
  nextTick(render);
});

watch(() => props.option, render, { deep: true });

onBeforeUnmount(() => {
  ro?.disconnect();
  chart?.dispose();
});
</script>
