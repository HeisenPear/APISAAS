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
    ref="el"
    class="maya-mark"
    :class="state !== 'static' ? `maya-state-${state}` : null"
    :style="{ width: size + 'px', height: size + 'px' }"
    role="img"
    aria-label="Maya"
    @pointermove="surPointeur"
    @pointerleave="surSortie"
  >
    <span v-if="glow" class="maya-halo" :style="{ inset: -(size * 0.3) + 'px' }" />
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      class="maya-svg"
      :class="survol ? 'maya-svg-tenue' : null"
      :style="
        interactif
          ? { transform: `perspective(520px) rotateX(${bascule[0]}deg) rotateY(${bascule[1]}deg)` }
          : undefined
      "
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
          :class="survol ? 'maya-cell-tenue' : null"
          :points="p"
          :fill="`url(#${cellId})`"
          stroke="#f3ad44"
          stroke-width="1.3"
          stroke-linejoin="round"
          :style="
            interactif
              ? {
                  transform: `translate(${decalages[i]?.[0] ?? 0}px, ${
                    decalages[i]?.[1] ?? 0
                  }px) scale(${echelles[i] ?? 1})`,
                  transformOrigin: `${centers[i]?.[0]}px ${centers[i]?.[1]}px`,
                }
              : undefined
          "
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
    /**
     * Les alvéoles réagissent à la distance du curseur : celle qu'on survole
     * gonfle, ses voisines suivent de moins loin. Opt-in — sans ce drapeau, la
     * mark se comporte exactement comme avant, partout où elle est déjà posée.
     */
    interactif?: boolean;
  }>(),
  { size: 28, glow: false, state: 'static', interactif: false },
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

/**
 * Réaction au curseur (mode `interactif`).
 *
 * On écrit les échelles SYNCHRONEMENT dans le gestionnaire de pointeur, sans
 * passer par requestAnimationFrame : un rAF ne se déclenche pas dans une frame
 * masquée, et la mark se figerait à demi-gonflée si l'onglet passe en arrière-
 * plan pendant le survol.
 */
/**
 * La réponse est CONTINUE, pas par paliers.
 *
 * La première version classait les alvéoles en trois catégories — sous le
 * curseur, voisine, autre — et leur donnait 1,26 / 1,095 / 1. Trois valeurs
 * pour sept alvéoles : en glissant la souris, on ne voyait pas le rayon réagir,
 * on voyait des marches. Chaque franchissement de frontière produisait un saut,
 * et le saut est exactement ce qui trahit une animation programmée.
 *
 * Ici chaque alvéole lit sa PROPRE distance au curseur et la fait passer par une
 * gaussienne. Deux alvéoles séparées d'un cheveu ont deux échelles séparées d'un
 * cheveu : le rayon se déforme comme une surface, pas comme un menu.
 */
const AMPLITUDE = 0.3; // gonflement maximal, juste sous le curseur
const RAYON = 5.2; // portée de l'influence, en unités du viewBox
const MAGNETISME = 1.15; // attirance de l'alvéole vers le curseur, en unités
const INCLINAISON = 7; // degrés max de bascule de l'ensemble

const survol = ref(false);
const echelles = ref<number[]>(centers.map(() => 1));
const decalages = ref<Array<[number, number]>>(centers.map(() => [0, 0]));
const bascule = ref<[number, number]>([0, 0]);

function surPointeur(e: PointerEvent): void {
  if (!props.interactif) return;
  const boite = (e.currentTarget as HTMLElement).getBoundingClientRect();
  if (!boite.width) return;
  // Repère du viewBox (0→24), quelle que soit la taille rendue.
  const x = ((e.clientX - boite.left) / boite.width) * 24;
  const y = ((e.clientY - boite.top) / boite.height) * 24;

  const ech: number[] = [];
  const dec: Array<[number, number]> = [];

  for (const [cx, cy] of centers) {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy);
    // Cloche : 1 au contact, décroissance douce, ~0 au-delà de la portée.
    const influence = Math.exp(-((d / RAYON) ** 2));
    ech.push(1 + AMPLITUDE * influence);
    // L'alvéole se penche VERS le curseur — normalisée pour que le déplacement
    // ne dépende que de la direction, jamais de la distance brute.
    const norme = d || 1;
    dec.push([(dx / norme) * MAGNETISME * influence, (dy / norme) * MAGNETISME * influence]);
  }

  echelles.value = ech;
  decalages.value = dec;

  // Bascule de l'ensemble : le rayon se présente au curseur. L'axe X est inversé
  // — pointer en haut doit faire lever le bord haut, donc tourner vers l'avant.
  bascule.value = [(-(y - 12) / 12) * INCLINAISON, ((x - 12) / 12) * INCLINAISON];
  survol.value = true;
}

function surSortie(): void {
  survol.value = false;
  echelles.value = centers.map(() => 1);
  decalages.value = centers.map(() => [0, 0]);
  bascule.value = [0, 0];
}

// Perf terrain (handoff §8) : on met l'animation en pause quand la mark sort de
// l'écran (la classe .maya-paused est gérée dans main.css). Inutile pour l'état
// figé. SSR-safe : tout se passe au montage client, avec garde IntersectionObserver.
const el = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
onMounted(() => {
  if (props.state === 'static' || typeof IntersectionObserver === 'undefined' || !el.value) return;
  observer = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (e) el.value?.classList.toggle('maya-paused', !e.isIntersecting);
    },
    { rootMargin: '120px' },
  );
  observer.observe(el.value);
});
onBeforeUnmount(() => observer?.disconnect());
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
/* ⚠️ La transition ne vaut QUE pour le mode interactif.
   Posée sur toutes les alvéoles, elle se battait avec les keyframes d'état —
   qui animent elles aussi `transform` — et faisait saccader la mark PARTOUT
   dans l'application, pas seulement sur la landing.

   Pendant le survol, l'échelle est pilotée à la main : on coupe l'animation CSS,
   qui écrirait le même `transform` et gagnerait. À la sortie, la classe tombe et
   le scintillement reprend de lui-même. */
.maya-cell-tenue {
  animation: none !important;
  /* ATTAQUE courte : l'alvéole doit coller au curseur. Au-delà de ~130 ms elle
     traîne derrière, et on ne sent plus la main mais le logiciel. */
  transition: transform 130ms var(--ease-out-quart, ease-out);
}

/* RELÂCHEMENT long : quand le curseur sort, le rayon revient en se posant. Cette
   asymétrie — attaque vive, retour ample — est ce qui donne l'impression d'une
   matière qui a de l'inertie plutôt que d'un état qui bascule. Ciblé par
   `:not()` pour n'exister QUE hors survol, en mode interactif. */
.maya-svg[style]:not(.maya-svg-tenue) .maya-cell {
  transition: transform 620ms var(--ease-out-expo, ease-out);
}

/* La bascule de l'ensemble suit la même règle que les alvéoles. */
.maya-svg[style] {
  transition: transform 620ms var(--ease-out-expo, ease-out);
}
.maya-svg-tenue {
  transition: transform 130ms var(--ease-out-quart, ease-out) !important;
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
