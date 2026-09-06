<!--
  Sparkline — micro-courbe (aire + ligne + point final). Carte récolte, tendance KPI…
  Cible : app/components/ui/Sparkline.vue → <UiSparkline :data="[420,1180,1840,2150,1320,380]" />
  NB : KpiCard.vue contient déjà une sparkline de fond ; ce composant est la version
  "premier plan" autonome (avec point de fin) pour les cartes type "Récolte 2025".
-->
<template>
  <svg :width="width" :height="height" class="spark">
    <path :d="area" :fill="fill" />
    <path :d="line" fill="none" :stroke="color" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    <circle v-if="dot" :cx="last[0]" :cy="last[1]" r="2.8" :fill="color" stroke="#fff" stroke-width="1.5" />
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
  { width: 130, height: 40, color: 'var(--honey)', fill: 'rgba(245,166,35,0.13)', dot: true }
);

const pts = computed<Array<[number, number]>>(() => {
  const d = props.data;
  const max = Math.max(...d);
  const min = Math.min(...d);
  const span = max - min || 1;
  return d.map((v, i) => [
    (i / (d.length - 1)) * (props.width - 6) + 3,
    props.height - 4 - ((v - min) / span) * (props.height - 10),
  ]);
});
const line = computed(() =>
  pts.value.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
);
const area = computed(
  () => `${line.value} L ${(props.width - 3).toFixed(1)} ${props.height} L 3 ${props.height} Z`
);
const last = computed(() => pts.value[pts.value.length - 1]);
</script>

<style scoped>
.spark {
  display: block;
  overflow: visible;
}
</style>
