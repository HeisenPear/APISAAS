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

      <!-- 7 alvéoles : <polygon> nth-of-type(2) = centre, (3..8) = couronne — ciblées par main.css

           ⚠️ AUCUN `transform-origin` ICI, ET C'EST ESSENTIEL.
           `.maya-cell` porte `transform-box: fill-box` (main.css) : le repère de
           l'origine devient la boîte de l'alvéole ELLE-MÊME, coin haut-gauche à
           (0,0). Y écrire les coordonnées SVG du centre — `12px 12px` pour
           l'alvéole centrale — place donc le pivot une dizaine d'unités HORS de
           l'alvéole, et un style en ligne bat la feuille. Mesuré : curseur pile
           sur l'alvéole centrale, elle gonflait bien… en se déplaçant de 45 px,
           presque sa propre largeur, et chaque voisine partait dans sa
           direction. C'était ça, « le positionnement ne ressemble à rien ».
           `transform-origin: center` de main.css fait exactement ce qu'il faut :
           chaque alvéole pivote sur son propre centre. -->
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
                }
              : undefined
          "
        />
      </template>
    </svg>
  </span>
</template>

<script setup lang="ts">
import { AMPLITUDE, SEUIL_REPOS, influenceA, deplacementVers } from '~/utils/magnetismeAlveoles';

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
 * RÉACTION AU CURSEUR — trois règles, chacune payée par un défaut.
 *
 * 1. AUCUNE TRANSITION PENDANT LE SUIVI.
 *    `pointermove` arrive déjà à la fréquence de l'écran : le flux d'événements
 *    EST l'animation. Y ajouter une transition de 130 ms, comme je l'avais fait,
 *    garantit 130 ms de retard en permanence — à 400 px/s, cinquante pixels de
 *    traîne. On n'anime donc que le RELÂCHEMENT, quand le curseur s'éloigne.
 *
 * 2. AUCUNE BASCULE 3D.
 *    Une rotation en perspective déplace visuellement chaque alvéole, alors que
 *    le calcul de distance se fait dans le repère non transformé. L'alvéole qui
 *    gonfle n'est plus celle qu'on survole — et comme la bascule dépend
 *    elle-même du curseur, la cible fuit pendant qu'on la vise. Deux effets qui
 *    se contredisent : on garde celui qui répond à la main.
 *
 * 3. ON SUIT LA FENÊTRE, PAS LE SURVOL.
 *    Écouter l'élément impose une frontière : rien, rien, rien, puis tout d'un
 *    coup au franchissement. En écoutant la fenêtre, l'influence décroît
 *    naturellement avec la distance : le rayon sent la main APPROCHER, et il n'y
 *    a plus ni entrée ni sortie à gérer.
 */
/**
 * 4. LA PHYSIQUE VIT DANS `~/utils/magnetismeAlveoles`, PAS ICI.
 *    Elle a produit deux défauts visibles et aucun n'était lisible dans le
 *    code — seulement à la main, sur la page. Isolée, elle est tenue par des
 *    bancs qui décrivent la sensation attendue plutôt que la formule.
 */

const survol = ref(false);
const echelles = ref<number[]>(centers.map(() => 1));
const decalages = ref<Array<[number, number]>>(centers.map(() => [0, 0]));

/**
 * La boîte est mise en cache : `getBoundingClientRect` force un calcul de mise
 * en page, et le faire à chaque `pointermove` coûterait une image sur deux.
 * On l'invalide au défilement et au redimensionnement, seuls moments où elle
 * peut bouger.
 */
let boite: DOMRect | null = null;
function oublierBoite(): void {
  boite = null;
}

function auRepos(): void {
  survol.value = false;
  echelles.value = centers.map(() => 1);
  decalages.value = centers.map(() => [0, 0]);
}

function surPointeur(e: PointerEvent): void {
  if (!el.value) return;
  if (!boite) boite = el.value.getBoundingClientRect();
  if (!boite.width) return;

  // Repère du viewBox (0→24), quelle que soit la taille rendue. Les valeurs
  // hors [0,24] sont normales et voulues : c'est le curseur qui approche.
  const x = ((e.clientX - boite.left) / boite.width) * 24;
  const y = ((e.clientY - boite.top) / boite.height) * 24;

  const ech: number[] = [];
  const dec: Array<[number, number]> = [];
  let maxInfluence = 0;

  for (const [cx, cy] of centers) {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy);
    // Cloche : 1 au contact, décroissance douce, ~0 au-delà de la portée.
    const influence = influenceA(d);
    if (influence > maxInfluence) maxInfluence = influence;

    ech.push(1 + AMPLITUDE * influence);
    dec.push(deplacementVers(dx, dy, influence));
  }

  // Trop loin : on rend la main au scintillement au lieu de figer le rayon dans
  // un état « presque au repos » qui ne reprendrait jamais son animation.
  if (maxInfluence < SEUIL_REPOS) {
    if (survol.value) auRepos();
    return;
  }

  echelles.value = ech;
  decalages.value = dec;
  survol.value = true;
}

// Perf terrain (handoff §8) : on met l'animation en pause quand la mark sort de
// l'écran (la classe .maya-paused est gérée dans main.css). Inutile pour l'état
// figé. SSR-safe : tout se passe au montage client, avec garde IntersectionObserver.
const el = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

/**
 * Le magnétisme reste du MOUVEMENT décoratif : qui a demandé qu'on l'en épargne
 * ne le reçoit pas. La mark garde son état figé, parfaitement lisible — c'est
 * une réponse au curseur qu'on retire, pas une information.
 */
function mouvementRefuse(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

onMounted(() => {
  if (!props.interactif || mouvementRefuse()) return;
  // `passive` : on ne préviendra jamais le défilement, autant le dire au moteur.
  window.addEventListener('pointermove', surPointeur, { passive: true });
  window.addEventListener('scroll', oublierBoite, { passive: true });
  window.addEventListener('resize', oublierBoite);
});
onBeforeUnmount(() => {
  if (!props.interactif) return;
  window.removeEventListener('pointermove', surPointeur);
  window.removeEventListener('scroll', oublierBoite);
  window.removeEventListener('resize', oublierBoite);
});

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
/* ⚠️ Les transitions ne valent QUE pour le mode interactif.
   Posées sur toutes les alvéoles, elles se battaient avec les keyframes d'état —
   qui animent elles aussi `transform` — et faisaient saccader la mark PARTOUT
   dans l'application, pas seulement sur la landing.

   PENDANT LE SUIVI : aucune transition. Le flux de `pointermove` est déjà à la
   fréquence de l'écran ; une transition n'ajouterait que du retard. C'était le
   défaut de la version précédente — 130 ms de traîne en permanence, ressenties
   comme un décalage entre la main et le rayon.

   L'animation d'état est coupée pendant le suivi : elle écrirait le même
   `transform` et gagnerait. */
/* Sélecteur volontairement plus spécifique que `.maya-cell[style]` ci-dessous
   (0,3,0 contre 0,2,0). Écrit `.maya-cell-tenue` seul, il PERDRAIT contre la
   règle de relâchement, et les 640 ms s'appliqueraient pendant le suivi — soit
   exactement le retard qu'on vient de supprimer. */
.maya-cell[style].maya-cell-tenue {
  animation: none !important;
  transition: none;
}

/* AU RELÂCHEMENT : là, et seulement là, le rayon revient en se posant. La classe
   `maya-cell-tenue` tombe, cette règle prend le relais, et le scintillement
   reprend de lui-même une fois le retour terminé.

   `[style]` restreint la règle aux alvéoles du mode interactif : ce sont les
   seules à porter un `transform` en ligne. Sans ce filtre, la transition
   s'appliquerait aux marks de TOUTE l'application et rebattrait leurs keyframes
   d'état — c'est précisément le défaut corrigé plus haut, qu'il serait facile de
   réintroduire ici. */
.maya-cell[style] {
  transition: transform 640ms var(--ease-out-expo, ease-out);
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
