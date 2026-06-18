<!--
  MayaMark — le logo VIVANT de Maya : un rayon de miel (hexagone composé de 7 alvéoles).
  Le mouvement raconte l'état de Maya. REMPLACE l'ancien `.maya-avatar`
  (sparkles + dégradé honey→sage) partout dans l'app.

  ⚠️ Les keyframes et classes `.maya-state-*` sont GLOBALES : bloc Maya dans
  `app/assets/css/main.css`. Ce composant est purement présentiel.

  S'utilise <IaMayaMark … /> (auto-import Nuxt depuis app/components/ia/).

  Props :
    size   number   (défaut 28)  — px. < 18 ⇒ hexagone plein (favicon/puces)
    glow   boolean  (défaut false) — halo doux (présence)
    state  'static' | 'idle' | 'think' | 'listen' | 'alert' | 'loading' | 'success'

  Exemples :
    <IaMayaMark :size="40" glow state="idle" />
    <IaMayaMark :size="26" :state="copiloteStatus === 'streaming' ? 'think' : 'idle'" />
-->
<template>
  <!-- racine <span> (phrasing content) : valide dans un <h1>, <p>, <button>… -->
  <span
    class="maya-mark"
    :class="state !== 'static' ? `maya-state-${state}` : null"
    :style="{ width: size + 'px', height: size + 'px' }"
    role="img"
    aria-label="Maya"
  >
    <span v-if="glow" class="maya-halo" :style="{ inset: -(size * 0.3) + 'px' }" />
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      class="maya-svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient :id="cellId" cx="0.36" cy="0.28" r="0.9">
          <stop offset="0" stop-color="#ffd98a" />
          <stop offset="0.55" stop-color="#f6b552" />
          <stop offset="1" stop-color="#e89a2c" />
        </radialGradient>
        <radialGradient :id="baseId" cx="0.4" cy="0.3" r="0.95">
          <stop offset="0" stop-color="#dd9226" />
          <stop offset="1" stop-color="#c47c1b" />
        </radialGradient>
      </defs>

      <!-- Hexagone-base : 1er <polygon> → nth-of-type(1), jamais animé (le <defs> ne
           compte pas en :nth-of-type, d'où le ciblage par of-type dans main.css) -->
      <polygon
        :points="basePts"
        :fill="showCells ? `url(#${baseId})` : '#e6982c'"
        :stroke="showCells ? '#cf8420' : '#e6982c'"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <!-- 7 alvéoles : <polygon> nth-of-type(2) = centre, (3..8) = couronne — ciblées par main.css -->
      <template v-if="showCells">
        <polygon
          v-for="(p, i) in cellPts"
          :key="i"
          class="maya-cell"
          :points="p"
          :fill="`url(#${cellId})`"
          stroke="#f3ad44"
          stroke-width="1.3"
          stroke-linejoin="round"
        />
      </template>
    </svg>
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: number;
    glow?: boolean;
    state?: 'static' | 'idle' | 'think' | 'listen' | 'alert' | 'loading' | 'success';
  }>(),
  { size: 28, glow: false, state: 'static' },
);

// Ids uniques par instance, STABLES SSR↔client (useId) — évite la collision des
// <defs> quand plusieurs marks coexistent ET le mismatch d'hydratation que
// donnerait Math.random() (le SVG url(#…) doit matcher après hydratation).
const uid = useId();
const cellId = `maya-cell-${uid}`;
const baseId = `maya-base-${uid}`;

const showCells = computed(() => props.size >= 18);

// Géométrie : hexagone pointe-en-haut
function hexPts(cx: number, cy: number, r: number): string {
  return [-90, -30, 30, 90, 150, 210]
    .map((d) => {
      const t = (d * Math.PI) / 180;
      return `${(cx + r * Math.cos(t)).toFixed(2)},${(cy + r * Math.sin(t)).toFixed(2)}`;
    })
    .join(' ');
}
const S = 3.75; // rayon d'une alvéole
const DC = S * 1.732; // distance centre → alvéole de couronne
const basePts = hexPts(12, 12, 10.6);
const centers: Array<[number, number]> = [[12, 12]];
for (let k = 0; k < 6; k++) {
  const t = (k * 60 * Math.PI) / 180;
  centers.push([12 + DC * Math.cos(t), 12 + DC * Math.sin(t)]);
}
const cellPts = centers.map(([x, y]) => hexPts(x, y, S * 0.74));
</script>

<style scoped>
.maya-mark {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}
.maya-svg {
  position: relative;
  display: block;
  overflow: visible;
}
.maya-halo {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(230, 152, 44, 0.4),
    rgba(230, 152, 44, 0.12) 55%,
    transparent 72%
  );
  animation: maya-halo 3.6s ease-in-out infinite;
  pointer-events: none;
}
</style>
