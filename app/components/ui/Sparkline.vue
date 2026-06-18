<!--
  Sparkline — micro-courbe (aire + ligne + point final). Carte récolte, tendance KPI…
  Usage : <UiSparkline :data="[420,1180,1840,2150,1320,380]" />
  Version « premier plan » autonome (avec point de fin) vs la sparkline de fond de KpiCard.
-->
<template>
  <svg :width="width" :height="height" class="spark" aria-hidden="true" focusable="false">
    <path :d="area" :fill="fill" />
    <path
      :d="line"
      fill="none"
      :stroke="color"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle
      v-if="dot"
      :cx="last[0]"
      :cy="last[1]"
      r="2.8"
      :fill="color"
      stroke="#fff"
      stroke-width="1.5"
    />
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    fill?: string;
    dot?: boolean;
  }>(),
  { width: 130, height: 40, color: 'var(--honey)', fill: 'rgba(245,166,35,0.13)', dot: true },
);

const pts = computed<Array<[number, number]>>(() => {
  const d = props.data.length ? props.data : [0];
  const max = Math.max(...d);
  const min = Math.min(...d);
  const span = max - min || 1;
  return d.map((v, i) => [
    (i / Math.max(1, d.length - 1)) * (props.width - 6) + 3,
    props.height - 4 - ((v - min) / span) * (props.height - 10),
  ]);
});
const line = computed(() =>
  pts.value.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' '),
);
const area = computed(
  () => `${line.value} L ${(props.width - 3).toFixed(1)} ${props.height} L 3 ${props.height} Z`,
);
// Fallback [0,0] : pts a toujours ≥1 élément, mais noUncheckedIndexedAccess l'ignore.
const last = computed<[number, number]>(() => pts.value[pts.value.length - 1] ?? [0, 0]);
</script>

<style scoped>
.spark {
  display: block;
  overflow: visible;
}
</style>
