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
  <div
    ref="el"
    class="wa"
    :style="{
      '--wa-decollage': `${DECOLLAGE}ms`,
      '--wa-vol': `${VOL}ms`,
      '--wa-pose': `${POSE}ms`,
    }"
  >
    <div class="wa-tete">
      <span class="wa-titre">Votre tableau de bord</span>
      <span class="wa-compte">{{ TOTAL_WIDGETS }} widgets · glissez pour réorganiser</span>
    </div>

    <div class="wa-grille" :class="{ 'wa-fige': sansMouvement }">
      <div v-for="(colonne, c) in colonnes" :key="c" class="wa-col">
        <!--
          DEUX ÉLÉMENTS, DEUX RÔLES. La coque porte le DÉPLACEMENT, la carte
          porte le GESTE — voir la note « un transform par élément » plus bas.
        -->
        <TransitionGroup name="wa-case">
          <div
            v-for="(w, i) in colonne"
            :key="w.nom"
            class="wa-case"
            :class="{ 'wa-case-haut': saisie === w.nom }"
          >
            <div
              class="wa-carte"
              :class="{
                'wa-verrou': w.plan !== 'Découverte',
                'wa-pose': posees > c * 3 + i,
                'wa-saisie': saisie === w.nom,
              }"
            >
              <span class="wa-poignee" aria-hidden="true" />
              <WmWidgetMini :w="w" />
              <span v-if="w.plan !== 'Découverte'" class="wa-plan">{{ w.plan }}</span>
            </div>
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

/**
 * LA CHORÉGRAPHIE, EN SIX TEMPS — et pourquoi elle a été réécrite.
 *
 * On ne voyait NI le décollage NI le déplacement, pour deux raisons distinctes
 * qui se cumulaient :
 *
 * 1. Le décollage était coupé. `.wa-saisie` n'avait pas de transition propre :
 *    il héritait de celle de `.wa-carte` (520 ms), alors que la mutation
 *    survenait à 480 ms — le nœud changeait de place AVANT la fin de sa propre
 *    montée. Pire, `--ease-out-expo` termine 90 % du chemin en 130 ms : les
 *    3 px de levée se lisaient comme une secousse, pas comme une prise en main.
 *
 * 2. Le déplacement n'existait pas. Le geste tirait toujours DEUX COLONNES
 *    DIFFÉRENTES (`if (b === a) b = (b + 1) % …`). Or il y a un
 *    `TransitionGroup` PAR colonne : une carte qui change de colonne est
 *    détruite dans l'un et recréée dans l'autre, sans transition. Elle se
 *    téléportait. La ligne qui écartait `b === a` supprimait précisément le
 *    seul cas que Vue sait animer.
 *
 * Les durées sont exposées au CSS en propriétés personnalisées (voir le
 * `:style` du gabarit) : une seule déclaration, donc aucune dérive possible
 * entre le minuteur JavaScript et l'animation — c'est exactement l'écart qui
 * avait produit le défaut n°1.
 */
const DECOLLAGE = 300; // la carte monte, et on la voit monter
const PRISE = 240; // elle reste en l'air : l'œil enregistre « elle est saisie »
const VOL = 620; // elle rejoint son nouveau créneau
const POSE = 320; // elle se repose à plat
const REPOS = 1400; // un temps mort avant le geste suivant

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
  const colonne = colonnes.value[a]!;
  if (colonne.length < 2) {
    if (visible) plusTard(unGeste, REPOS);
    return;
  }

  const i = Math.floor(Math.random() * colonne.length);
  /**
   * ⚠️ LE CRÉNEAU D'ARRIVÉE EST DANS LA MÊME COLONNE, ET C'EST LE CŒUR DU
   * CORRECTIF.
   *
   * `TransitionGroup` n'anime QUE les déplacements internes à son instance, et
   * il y en a une par colonne. Un échange entre deux colonnes n'est pas un
   * déplacement pour lui : c'est une destruction et une création. La carte
   * disparaissait d'un côté pour réapparaître de l'autre, sans transition —
   * on ne pouvait pas la « voir se déplacer », quel que soit le réglage.
   *
   * En restant dans la colonne, les DEUX cartes échangées voyagent vraiment,
   * et le FLIP les anime sur la coque pendant que le geste tient sur la carte.
   *
   * On vise le créneau le plus ÉLOIGNÉ possible : un échange entre voisines
   * immédiates parcourt 70 px et se lit comme un clignotement, pas comme un
   * déplacement.
   */
  const j = i < colonne.length / 2 ? colonne.length - 1 : 0;

  saisie.value = colonne[i]!.nom;

  // Le décollage doit être TERMINÉ avant que la carte ne parte : c'est
  // l'inversion de cet ordre qui rendait la montée invisible.
  plusTard(() => {
    const copie = colonnes.value.map((c) => [...c]);
    const tmp = copie[a]![i]!;
    copie[a]![i] = copie[a]![j]!;
    copie[a]![j] = tmp;
    colonnes.value = copie;

    plusTard(() => {
      saisie.value = null; // la pose : la carte redescend à plat
      if (visible) plusTard(unGeste, POSE + REPOS);
    }, VOL);
  }, DECOLLAGE + PRISE);
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

/* ──────────────────────────────────────────────────────────────────────────
   UN TRANSFORM PAR ÉLÉMENT — la raison de la coque

   `TransitionGroup` déplace les cartes par FLIP : il pose lui-même un
   `transform: translate(dx, dy)` sur son enfant direct. Quand la carte soulevée
   portait AUSSI son propre transform (`translateY(-3px) scale(1.035) rotate(…)`),
   le FLIP l'écrasait : la carte retombait à plat à l'instant exact où elle
   partait, puis glissait. C'est ce décrochage qu'on lisait comme un « lag » —
   pas un problème de performance, un conflit de propriété.

   S'ajoutaient deux durées concurrentes sur `transform` (520 ms déclarée sur la
   carte, 620 ms sur la classe de mouvement) : la durée changeait selon celle qui
   gagnait la cascade.

   D'où la séparation : la COQUE ne porte que le déplacement (FLIP), la CARTE ne
   porte que le geste (soulèvement, inclinaison, composition). Deux transforms
   sur deux éléments ne se marchent plus dessus, et chacun garde sa durée. Bonus
   non négligeable : le transform de la carte n'affecte pas la mise en page, donc
   le rectangle mesuré par le FLIP reste stable même pendant un soulèvement.
   ────────────────────────────────────────────────────────────────────────── */
.wa-case {
  position: relative;
}
/* La carte saisie passe au-dessus de ses voisines — sur la COQUE, car c'est elle
   qui participe à l'empilement de la colonne. */
.wa-case-haut {
  z-index: 2;
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
    /* La POSE : quand `.wa-saisie` est retirée, c'est cette règle qui ramène la
       carte à plat. Elle sert aussi à la composition initiale. */
    transform var(--wa-pose, 320ms) var(--ease-out-expo, ease-out),
    border-color 320ms ease-out;
}

/* L'ombre du soulèvement vit sur un pseudo-élément dont on anime l'OPACITÉ.
   `box-shadow` en transition repeint à chaque image au lieu de se compositer ;
   sur neuf cartes qui bougent ensemble, c'est exactement ce qui fait tomber des
   images. Une opacité, elle, part sur la couche de composition. */
.wa-carte::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  box-shadow: 0 10px 22px -6px color-mix(in srgb, var(--text-primary) 26%, transparent);
  transition: opacity 320ms ease-out;
}
.wa-saisie::after {
  opacity: 1;
}

.wa-pose {
  opacity: 1;
  transform: none;
}

/* La carte saisie : soulevée, inclinée, ombrée. Les trois ensemble — une seule
   d'entre elles se lit comme un défaut d'affichage. */
/* Déclaré APRÈS `.wa-pose` : les deux classes ont le même poids (0,1,0), c'est
   donc l'ordre source qui décide. Inversé, le soulèvement ne se verrait jamais. */
.wa-saisie {
  opacity: 1;
  /* -9 px et non -3 : à 3 px, la levée passait sous le seuil de perception au
     milieu d'une grille qui bouge. Vérifié en géométrie : à 1024 px de fenêtre,
     le coin haut-droit monte d'environ 13 px pour -9 px de levée, et la garde
     entre deux lignes de texte reste de 25 px — aucun chevauchement possible. */
  transform: translateY(-9px) scale(1.04) rotate(-1.1deg);
  border-color: color-mix(in srgb, var(--honey) 60%, transparent);
  /* ⚠️ SA PROPRE TRANSITION, et c'est tout l'enjeu du correctif.
     Sans cette ligne, `.wa-saisie` héritait des 520 ms de `.wa-carte` alors que
     le déplacement partait à 480 : la montée était coupée avant sa fin. Et
     `--ease-out-expo` fait 90 % du chemin en 130 ms — une secousse, pas un
     décollage. Ici : une courbe à léger dépassement, qui donne le poids d'un
     objet qu'on soulève, sur une durée que le script garantit terminée avant
     le départ (`DECOLLAGE + PRISE` avant la mutation). */
  transition: transform var(--wa-decollage, 300ms) cubic-bezier(0.34, 1.24, 0.64, 1);
  will-change: transform;
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
   `wa-case-move` sur CHAQUE coque qui change de place, pas seulement sur celle
   qu'on a bougée : les voisines se réorganisent aussi, et c'est ce qui donne le
   sentiment d'une grille vivante plutôt que d'un simple échange. */
.wa-case-move {
  /* La durée vient du script (`--wa-vol`), pas d'un nombre recopié : le
     minuteur JavaScript et l'animation ne peuvent plus diverger. C'est
     précisément cette duplication qui avait laissé un décollage de 520 ms
     coupé à 480. */
  transition: transform var(--wa-vol, 620ms) var(--ease-out-expo, ease-out);
  /* Posé UNIQUEMENT pendant le mouvement : `will-change` en permanence force une
     couche par carte et coûte plus qu'il ne rapporte. */
  will-change: transform;
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
