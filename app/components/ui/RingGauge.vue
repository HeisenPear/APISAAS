<!--
  RingGauge — jauge anneau (miel). Butinage, force colonie, % d'objectif…
  Usage : <UiRingGauge :value="92" :size="94"><…/></UiRingGauge>
  Léger (SVG inline, zéro dépendance). Pour les séries/comparaisons, garder ECharts.
-->
<template>
  <div class="ring-gauge" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" class="ring-svg" aria-hidden="true" focusable="false">
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        fill="none"
        :stroke="track"
        :stroke-width="stroke"
      />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        fill="none"
        :stroke="color"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="c.toFixed(1)"
        :stroke-dashoffset="offset.toFixed(1)"
        class="ring-arc"
      />
    </svg>
    <div class="ring-center"><slot /></div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value?: number; // 0–100
    size?: number;
    stroke?: number;
    color?: string;
    track?: string;
  }>(),
  { value: 0, size: 88, stroke: 9, color: 'var(--honey)', track: '#f1e3c8' },
);

const r = computed(() => (props.size - props.stroke) / 2);
const c = computed(() => 2 * Math.PI * r.value);
const offset = computed(() => c.value * (1 - Math.max(0, Math.min(100, props.value)) / 100));
</script>

<style scoped>
/* NB : pas de classe « ring » — c'est une UTILITAIRE Tailwind (box-shadow) qui
   dessinait un liseré carré sombre autour de la jauge. */
.ring-gauge {
  position: relative;
  flex-shrink: 0;
}
.ring-svg {
  transform: rotate(-90deg);
  display: block;
}
.ring-arc {
  transition: stroke-dashoffset 0.6s var(--ease-out-expo, ease);
}
.ring-center {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
}
</style>
