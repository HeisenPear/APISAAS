<!--
  Le tableau de bord se compose sous les yeux du visiteur.

  POURQUOI UNE ANIMATION PLUTÔT QU'UNE PHRASE. « Tableau de bord
  personnalisable » ne veut rien dire pour personne : tous les logiciels
  l'écrivent. Voir neuf cartes se poser, puis l'une d'elles se soulever et
  changer de colonne, se comprend sans légende — et c'est exactement ce que
  fait le produit (glisser-déposer, disposition enregistrée par navigateur).

  DEUX CORRECTIONS PAR RAPPORT À LA PREMIÈRE VERSION :

  · Les cartes étaient des rectangles portant un nom. On y lisait le PLAN d'un
    tableau de bord, pas un tableau de bord. Chaque carte rend maintenant une
    miniature fidèle de son widget réel — jauge annulaire, barres de récolte,
    lignes d'alerte, courbe de poids (voir WmWidgetMini.vue).

  · Les cartes s'échangeaient au hasard, deux à la fois, sans que rien ne
    signale un geste. On voyait des blocs sauter. Une carte est désormais
    SAISIE (elle se soulève, s'incline, prend une ombre et une poignée), puis
    déposée ailleurs. C'est la grammaire du glisser-déposer : sans elle,
    l'animation ne raconte pas ce qu'elle veut raconter.
-->
<template>
  <div ref="el" class="wa">
    <div class="wa-tete">
      <span class="wa-titre">Votre tableau de bord</span>
      <span class="wa-compte">{{ TOTAL_WIDGETS }} widgets · glissez pour réorganiser</span>
    </div>

    <div class="wa-grille" :class="{ 'wa-fige': sansMouvement }">
      <div v-for="(colonne, c) in colonnes" :key="c" class="wa-col">
        <TransitionGroup name="wa-carte">
          <div
            v-for="(w, i) in colonne"
            :key="w.nom"
            class="wa-carte"
            :class="{
              'wa-saisie': saisie === w.nom,
              'wa-verrou': w.plan !== 'Découverte',
              'wa-pose': posees > c * 3 + i,
            }"
          >
            <span class="wa-poignee" aria-hidden="true" />
            <WmWidgetMini :w="w" />
            <span v-if="w.plan !== 'Découverte'" class="wa-plan">{{ w.plan }}</span>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import WmWidgetMini from './WmWidgetMini.vue';
import { COLONNES, type WidgetMini } from './widgets-mini';

/** Total du catalogue réel : 28 blocs + 34 raccourcis (app/config/widgets.ts). */
const TOTAL_WIDGETS = 62;

/** Durées du cycle, en millisecondes. Nommées : elles se répondent. */
const SAISIE = 480; // la carte se soulève, avant tout déplacement
const DEPOSE = 700; // le temps que `TransitionGroup` finit son mouvement
const REPOS = 1500; // un temps mort, pour que l'œil se repose entre deux gestes

const colonnes = ref<WidgetMini[][]>(COLONNES.map((c) => [...c]));
const sansMouvement = ref(false);
/** Nombre de cartes déjà posées : pilote la composition initiale. */
const posees = ref(0);
/** Nom de la carte actuellement soulevée, s'il y en a une. */
const saisie = ref<string | null>(null);

const el = ref<HTMLElement | null>(null);
let observateur: IntersectionObserver | null = null;
let visible = false;
const minuteurs = new Set<ReturnType<typeof setTimeout>>();

/** Tout `setTimeout` passe par ici : rien ne survit au démontage. */
function plusTard(fn: () => void, delai: number): void {
  const t = setTimeout(() => {
    minuteurs.delete(t);
    fn();
  }, delai);
  minuteurs.add(t);
}

function toutAnnuler(): void {
  for (const t of minuteurs) clearTimeout(t);
  minuteurs.clear();
}

/**
 * Un geste complet : on saisit une carte, on la dépose dans une autre colonne,
 * on relâche. Le déplacement N'A LIEU QU'APRÈS la saisie — c'est ce décalage
 * qui fait lire un geste plutôt qu'une permutation.
 *
 * `TransitionGroup` anime le déplacement tout seul, à condition que la clé
 * suive l'élément (d'où `:key="w.nom"`).
 */
function unGeste(): void {
  const a = Math.floor(Math.random() * colonnes.value.length);
  let b = Math.floor(Math.random() * colonnes.value.length);
  if (b === a) b = (b + 1) % colonnes.value.length;
  const i = Math.floor(Math.random() * colonnes.value[a]!.length);
  const j = Math.floor(Math.random() * colonnes.value[b]!.length);

  saisie.value = colonnes.value[a]![i]!.nom;

  plusTard(() => {
    const copie = colonnes.value.map((c) => [...c]);
    const tmp = copie[a]![i]!;
    copie[a]![i] = copie[b]![j]!;
    copie[b]![j] = tmp;
    colonnes.value = copie;
    plusTard(() => {
      saisie.value = null;
      if (visible) plusTard(unGeste, REPOS);
    }, DEPOSE);
  }, SAISIE);
}

/** Les cartes se posent une à une : le tableau de bord se CONSTRUIT. */
function composer(): void {
  const total = colonnes.value.reduce((n, c) => n + c.length, 0);
  for (let k = 1; k <= total; k++) plusTard(() => (posees.value = k), k * 70);
  plusTard(unGeste, total * 70 + 600);
}

onMounted(() => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    sansMouvement.value = true;
    posees.value = 99; // tout est déjà en place, rien ne bouge
    return;
  }
  /**
   * On n'anime que sous les yeux du visiteur. Un geste toutes les trois
   * secondes dans un onglet d'arrière-plan, c'est de la batterie dépensée pour
   * personne — et le simulateur vit sur une page qu'on fait défiler longtemps.
   */
  if (typeof IntersectionObserver === 'undefined') {
    posees.value = 99;
    return;
  }
  observateur = new IntersectionObserver(
    ([e]) => {
      const entre = Boolean(e?.isIntersecting);
      if (entre === visible) return;
      visible = entre;
      if (entre) {
        // Première entrée : on compose. Retours suivants : on reprend les gestes.
        if (posees.value === 0) composer();
        else plusTard(unGeste, 400);
      } else {
        toutAnnuler();
        saisie.value = null;
      }
    },
    { threshold: 0.25 },
  );
  if (el.value) observateur.observe(el.value);
});

onBeforeUnmount(() => {
  toutAnnuler();
  observateur?.disconnect();
});
</script>

<style scoped>
.wa {
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid var(--border-default);
  background: #fff;
  padding: 10px 12px 12px;
}
.wa-tete {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 9px;
}
.wa-titre {
  font-size: 12.5px;
  font-weight: 800;
  color: var(--text-primary);
}
.wa-compte {
  font-size: 10px;
  font-weight: 600;
  color: var(--honey-deep);
}
.wa-grille {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
  align-items: start;
}
.wa-col {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.wa-carte {
  position: relative;
  /* Colonne : la pastille de plan est DANS le flux, pas posée par-dessus.
     Posée en absolu, elle recouvrait le total « 2 670 € » de la trésorerie, le
     dernier mois du graphique de production et la courbe des balances — le même
     défaut de superposition que la barre de progression de /maya. */
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid var(--border-default);
  background: var(--surface-primary);
  padding: 8px 9px;
  /* Point de départ de la composition. `.wa-pose` les remet en place. */
  opacity: 0;
  transform: translateY(9px) scale(0.97);
  transition:
    opacity 420ms ease-out,
    transform 520ms var(--ease-out-expo, ease-out),
    box-shadow 320ms ease-out;
}
.wa-pose {
  opacity: 1;
  transform: none;
}

/* La carte saisie : soulevée, inclinée, ombrée. Les trois ensemble — une seule
   d'entre elles se lit comme un défaut d'affichage. */
.wa-saisie {
  z-index: 2;
  transform: translateY(-3px) scale(1.035) rotate(-1.1deg);
  border-color: color-mix(in srgb, var(--honey) 60%, transparent);
  box-shadow: 0 10px 22px -6px color-mix(in srgb, var(--text-primary) 26%, transparent);
}

/* La poignée de préhension : les six points du glisser-déposer, dessinés en
   dégradés radiaux plutôt qu'en six éléments. Invisible au repos. */
.wa-poignee {
  position: absolute;
  top: 7px;
  right: 7px;
  height: 9px;
  width: 6px;
  opacity: 0;
  transition: opacity 240ms ease-out;
  background-image: radial-gradient(circle, var(--text-tertiary) 44%, transparent 46%);
  background-size: 3px 3px;
  background-repeat: repeat;
}
.wa-saisie .wa-poignee {
  opacity: 0.75;
}

/* Le verrou de plan est une information, pas une décoration : on le nomme. */
.wa-verrou {
  border-style: dashed;
  border-color: color-mix(in srgb, var(--honey) 45%, transparent);
  background: var(--honey-soft);
}
.wa-plan {
  align-self: flex-end;
  margin-top: 5px;
  border-radius: 999px;
  background: #fff;
  padding: 1px 5px;
  font-size: 8px;
  font-weight: 800;
  color: var(--honey-deep);
}

/* Le déplacement d'une carte d'une colonne à l'autre. `TransitionGroup` pose
   `wa-carte-move` sur CHAQUE carte qui change de place, pas seulement sur celle
   qu'on a bougée : les voisines se réorganisent aussi, et c'est ce qui donne le
   sentiment d'une grille vivante plutôt que d'un simple échange. */
.wa-carte-move {
  transition: transform 620ms var(--ease-out-expo, ease-out);
}

/* Mouvement réduit : la grille reste, les gestes s'arrêtent. Le visiteur voit
   quand même les neuf widgets en trois colonnes, ce qui est l'essentiel. */
.wa-fige .wa-carte {
  opacity: 1;
  transform: none;
  transition: none;
}
.wa-fige :deep(*) {
  transition: none !important;
}
</style>
