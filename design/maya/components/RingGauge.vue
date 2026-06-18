<!--
  RingGauge — jauge anneau (miel). Pour butinage, force colonie, % d'objectif, etc.
  Cible : app/components/ui/RingGauge.vue → <UiRingGauge :value="92" :size="94"><…/></UiRingGauge>
  Pour les gros graphiques (séries temporelles, comparaisons), garde ECharts (app/utils/echarts.ts).
  Cette jauge est volontairement légère (SVG inline, zéro dépendance).
-->
<template>
  <div class="ring" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" class="ring-svg">
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
  { value: 0, size: 88, stroke: 9, color: 'var(--honey)', track: '#f1e3c8' }
);

const r = computed(() => (props.size - props.stroke) / 2);
const c = computed(() => 2 * Math.PI * r.value);
const offset = computed(() => c.value * (1 - Math.max(0, Math.min(100, props.value)) / 100));
</script>

<style scoped>
.ring {
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
