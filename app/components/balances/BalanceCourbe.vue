<template>
  <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-[15px] font-semibold text-[var(--text-primary)]">Poids de la colonie</h2>
        <p class="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
          Poids net {{ avecTemperature ? '· température extérieure en 2ᵉ axe' : '' }}
        </p>
      </div>

      <!-- Segments de période -->
      <div
        class="inline-flex rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-0.5"
      >
        <button
          v-for="p in PERIODES"
          :key="p.value"
          type="button"
          class="rounded-[8px] px-3 py-1.5 text-[12px] font-medium transition-all duration-150"
          :class="
            periode === p.value
              ? 'bg-white text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          "
          @click="emit('update:periode', p.value)"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div v-if="pending" class="h-72 animate-pulse rounded-[12px] bg-[var(--surface-muted)]" />

    <div
      v-else-if="!mesures.length"
      class="flex h-72 flex-col items-center justify-center rounded-[12px] border border-dashed border-[var(--border-default)] text-center"
    >
      <UIcon name="i-lucide-chart-spline" class="h-7 w-7 text-[var(--text-tertiary)]" />
      <p class="mt-2 text-[13.5px] text-[var(--text-secondary)]">
        Aucune mesure sur cette période.
      </p>
      <p class="mt-1 max-w-xs text-[12px] text-[var(--text-tertiary)]">
        Dès que la balance aura envoyé ses premiers points, la courbe apparaîtra ici.
      </p>
    </div>

    <div v-show="!pending && mesures.length" ref="chartRef" class="h-72 w-full" />
  </div>
</template>

<script setup lang="ts">
import { echarts } from '~/utils/echarts';
import { PERIODES, labelTemps, nombre, type PeriodeBalance } from '~/config/balances';
import type { Mesure } from '~/composables/useBalances';

const props = defineProps<{
  mesures: Mesure[];
  periode: PeriodeBalance;
  pending?: boolean;
}>();

const emit = defineEmits<{ 'update:periode': [PeriodeBalance] }>();

const labels = computed(() => props.mesures.map((m) => labelTemps(m.mesureeAt, props.periode)));
const poids = computed(() =>
  props.mesures.map((m) => nombre(m.poidsNetKg) ?? nombre(m.poidsKg) ?? null),
);
const temperatures = computed(() => props.mesures.map((m) => nombre(m.temperatureC)));
const avecTemperature = computed(() => temperatures.value.some((t) => t !== null));

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

function renderChart() {
  if (!chartRef.value || !props.mesures.length) return;
  if (!chart) {
    if (chartRef.value.clientWidth === 0) return;
    chart = echarts.init(chartRef.value, 'warmPrecision');
  }

  chart.setOption(
    {
      tooltip: {
        trigger: 'axis',
        formatter: (params: Array<{ dataIndex: number }>) => {
          const i = params[0]?.dataIndex ?? 0;
          const m = props.mesures[i];
          if (!m) return '';
          const p = nombre(m.poidsNetKg) ?? nombre(m.poidsKg);
          const v = nombre(m.variation24hKg);
          const t = nombre(m.temperatureC);
          const quand = new Date(m.mesureeAt).toLocaleString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });
          let html = `<strong>${quand}</strong><br/>Poids net : <strong>${p === null ? '—' : `${p.toFixed(1)} kg`}</strong>`;
          if (v !== null)
            html += `<br/>Sur 24 h : <strong>${v > 0 ? '+' : ''}${v.toFixed(1)} kg</strong>`;
          if (t !== null) html += `<br/>Température : ${t.toFixed(1)} °C`;
          return html;
        },
      },
      legend: { bottom: 0, textStyle: { color: '#78716c', fontSize: 11 } },
      grid: { left: 6, right: 6, top: 16, bottom: 34, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels.value,
        axisLabel: { hideOverlap: true },
      },
      yAxis: [
        {
          type: 'value',
          name: 'kg',
          scale: true,
          nameTextStyle: { color: '#706963', fontSize: 10 },
        },
        {
          type: 'value',
          name: '°C',
          scale: true,
          nameTextStyle: { color: '#706963', fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      dataZoom: [{ type: 'inside', throttle: 60 }],
      series: [
        {
          name: 'Poids net',
          type: 'line',
          data: poids.value,
          smooth: true,
          showSymbol: false,
          connectNulls: true,
          lineStyle: { color: '#f5a623', width: 2.5 },
          itemStyle: { color: '#f5a623' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 166, 35, 0.22)' },
              { offset: 1, color: 'rgba(245, 166, 35, 0.01)' },
            ]),
          },
        },
        ...(avecTemperature.value
          ? [
              {
                name: 'Température',
                type: 'line',
                yAxisIndex: 1,
                data: temperatures.value,
                smooth: true,
                showSymbol: false,
                connectNulls: true,
                lineStyle: { color: '#b87959', width: 1.6, type: 'dashed' },
                itemStyle: { color: '#b87959' },
              },
            ]
          : []),
      ],
    },
    { replaceMerge: ['series'] },
  );
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

watch(
  () => [props.mesures, props.periode],
  () => nextTick(renderChart),
  { deep: true },
);

onBeforeUnmount(() => {
  observer.value?.disconnect();
  chart?.dispose();
});
</script>
