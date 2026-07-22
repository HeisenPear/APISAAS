<template>
  <div
    class="cine-birth"
    :class="{ 'is-play': play, 'is-born': born }"
    :style="{ width: `${size}px`, height: `${size}px`, position: 'relative' }"
    aria-hidden="true"
  >
    <div class="cine-halo cine-halo-1" />
    <div class="cine-halo cine-halo-2" />
    <div class="cine-ring cine-ring-1" />
    <div class="cine-ring cine-ring-2" />

    <svg
      viewBox="0 0 100 100"
      :width="size"
      :height="size"
      style="position: relative; display: block; overflow: visible"
    >
      <defs>
        <radialGradient :id="`${uid}-cell`" cx="0.36" cy="0.28" r="0.9">
          <stop offset="0" stop-color="#ffe0a0" />
          <stop offset="0.55" stop-color="#f6b552" />
          <stop offset="1" stop-color="#e2951f" />
        </radialGradient>
        <radialGradient :id="`${uid}-base`" cx="0.4" cy="0.3" r="0.95">
          <stop offset="0" stop-color="#c8801f" />
          <stop offset="1" stop-color="#a86814" />
        </radialGradient>
      </defs>

      <polygon
        class="cine-base"
        :points="BASE"
        :fill="`url(#${uid}-base)`"
        stroke="#b0731a"
        stroke-width="2.4"
        stroke-linejoin="round"
      />
      <polygon
        v-for="(pts, i) in ALVEOLES"
        :key="i"
        class="cine-cell"
        :points="pts"
        :fill="`url(#${uid}-cell)`"
        stroke="#f3ad44"
        stroke-width="1.4"
        stroke-linejoin="round"
        :style="styleAlveole(i)"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
/**
 * LA NAISSANCE DE MAYA — les 7 alvéoles convergent vers le rayon de miel.
 *
 * Jouée UNE SEULE FOIS, à la toute première ouverture. Jamais rejouée au retour
 * de Stripe : on ne fait pas renaître Maya parce que l'apiculteur est allé payer.
 *
 * Géométrie et délais reportés de `design/maya/mockup/onboarding/cinematic.jsx`,
 * qui fait foi. Styles : `app/assets/css/maya-onboarding.css`.
 */
withDefaults(defineProps<{ size?: number; play?: boolean; born?: boolean }>(), {
  size: 240,
  play: false,
  born: false,
});

// Identifiant unique : deux marks sur un même écran partageraient sinon leurs
// dégradés SVG, et la seconde hériterait des couleurs de la première.
const uid = `birth-${Math.random().toString(36).slice(2, 8)}`;

/** Hexagone centré, sommet en haut — même construction que la maquette. */
function hexagone(cx: number, cy: number, r: number): string {
  return [-90, -30, 30, 90, 150, 210]
    .map((deg) => {
      const t = (deg * Math.PI) / 180;
      return `${(cx + r * Math.cos(t)).toFixed(2)},${(cy + r * Math.sin(t)).toFixed(2)}`;
    })
    .join(' ');
}

const COTE = 3.75;
const ENTRAXE = COTE * 1.732 * 4.16;

const BASE = hexagone(50, 50, 44);

/** 1 alvéole au centre + 6 en couronne. */
const ALVEOLES = (() => {
  const centres: Array<[number, number]> = [[50, 50]];
  for (let k = 0; k < 6; k++) {
    const t = (k * 60 * Math.PI) / 180;
    centres.push([50 + ENTRAXE * Math.cos(t), 50 + ENTRAXE * Math.sin(t)]);
  }
  return centres.map(([x, y]) => hexagone(x, y, COTE * 3.05));
})();

/** Point de départ de chaque alvéole, hors champ — valeurs de la maquette. */
const DEPARTS: Array<[number, number]> = [
  [0, -8],
  [66, -70],
  [92, 20],
  [58, 84],
  [-52, 74],
  [-92, -6],
  [-44, -78],
];

function styleAlveole(i: number): Record<string, string> {
  const [tx, ty] = DEPARTS[i] ?? [0, 0];
  return {
    '--tx': `${tx}px`,
    '--ty': `${ty}px`,
    '--rot': `${i % 2 ? 40 : -40}deg`,
    animationDelay: `${(0.15 + i * 0.13).toFixed(2)}s`,
  };
}
</script>

<!--
  Le CSS du cinématique n'est PAS global : ~29 Ko qui ne servent qu'à
  l'onboarding n'ont rien à faire sur toutes les pages. Il est donc importé par
  les composants qui l'utilisent — Vite le dédoublonne si plusieurs l'importent.
-->
<style src="~/assets/css/maya-onboarding.css"></style>
