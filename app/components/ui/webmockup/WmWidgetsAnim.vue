<!--
  Le tableau de bord se compose sous les yeux du visiteur.

  POURQUOI UNE ANIMATION PLUTÔT QU'UNE PHRASE. « Tableau de bord personnalisable »
  ne veut rien dire pour personne : tous les logiciels l'écrivent. Voir neuf
  cartes se poser en trois colonnes, puis deux d'entre elles échanger leur place,
  se comprend sans légende — et c'est exactement ce que fait le produit
  (glisser-déposer, disposition enregistrée par navigateur).

  ⚠️ LES LIBELLÉS SONT CEUX DU CATALOGUE RÉEL (app/config/widgets.ts), et les
  plans indiqués sont les vrais verrous. Ne pas inventer de widget : le
  catalogue en compte 62 (28 blocs + 34 raccourcis), il y a de quoi choisir.
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
          <span
            v-for="w in colonne"
            :key="w.nom"
            class="wa-carte"
            :class="[`wa-${w.taille}`, { 'wa-verrou': w.plan !== 'Découverte' }]"
          >
            <span class="wa-nom">{{ w.nom }}</span>
            <span v-if="w.plan !== 'Découverte'" class="wa-plan">{{ w.plan }}</span>
          </span>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Total du catalogue réel : 28 blocs + 34 raccourcis (app/config/widgets.ts). */
const TOTAL_WIDGETS = 62;

interface Widget {
  nom: string;
  plan: 'Découverte' | 'Starter' | 'Pro';
  taille: 'petit' | 'moyen';
}

/**
 * Neuf widgets du catalogue, choisis pour montrer les trois paliers : ce qu'on
 * a dès le plan gratuit, ce qui s'ouvre en Starter, ce qui demande Pro.
 */
const DEPART: Widget[][] = [
  [
    { nom: 'Ruches', plan: 'Découverte', taille: 'petit' },
    { nom: 'Santé du cheptel', plan: 'Découverte', taille: 'moyen' },
    { nom: 'Balances connectées', plan: 'Starter', taille: 'moyen' },
  ],
  [
    { nom: 'Alertes à traiter', plan: 'Découverte', taille: 'moyen' },
    { nom: 'Production', plan: 'Starter', taille: 'moyen' },
    { nom: 'Trésorerie', plan: 'Pro', taille: 'petit' },
  ],
  [
    { nom: 'Chiffre d’affaires', plan: 'Découverte', taille: 'petit' },
    { nom: 'Reines actives', plan: 'Starter', taille: 'petit' },
    { nom: 'Transhumances prévues', plan: 'Pro', taille: 'moyen' },
  ],
];

const colonnes = ref<Widget[][]>(DEPART.map((c) => [...c]));
const sansMouvement = ref(false);

const el = ref<HTMLElement | null>(null);
let minuteur: ReturnType<typeof setInterval> | null = null;
let observateur: IntersectionObserver | null = null;

/**
 * Échange deux widgets entre deux colonnes — le geste que fait un apiculteur
 * qui range son tableau de bord. `TransitionGroup` anime le déplacement tout
 * seul, à condition que la clé suive l'élément (d'où `:key="w.nom"`).
 */
function permuter(): void {
  const a = Math.floor(Math.random() * 3);
  let b = Math.floor(Math.random() * 3);
  if (b === a) b = (b + 1) % 3;
  const i = Math.floor(Math.random() * colonnes.value[a]!.length);
  const j = Math.floor(Math.random() * colonnes.value[b]!.length);
  const copie = colonnes.value.map((c) => [...c]);
  const tmp = copie[a]![i]!;
  copie[a]![i] = copie[b]![j]!;
  copie[b]![j] = tmp;
  colonnes.value = copie;
}

onMounted(() => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    sansMouvement.value = true;
    return;
  }
  /**
   * On n'anime que sous les yeux du visiteur. Une permutation toutes les
   * 2,6 s dans un onglet d'arrière-plan, c'est de la batterie dépensée pour
   * personne — et le simulateur vit sur une page qu'on fait défiler longtemps.
   */
  if (typeof IntersectionObserver === 'undefined') return;
  observateur = new IntersectionObserver(
    ([e]) => {
      if (e?.isIntersecting) {
        minuteur ??= setInterval(permuter, 2600);
      } else if (minuteur) {
        clearInterval(minuteur);
        minuteur = null;
      }
    },
    { threshold: 0.25 },
  );
  if (el.value) observateur.observe(el.value);
});

onBeforeUnmount(() => {
  if (minuteur) clearInterval(minuteur);
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
}
.wa-col {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.wa-carte {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  border-radius: 8px;
  border: 1px solid var(--border-default);
  background: var(--surface-primary);
  padding: 7px 8px;
}
.wa-moyen {
  padding-top: 13px;
  padding-bottom: 13px;
}
.wa-nom {
  font-size: 9.5px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}
/* Le verrou de plan est une information, pas une décoration : on le nomme. */
.wa-verrou {
  border-style: dashed;
  border-color: color-mix(in srgb, var(--honey) 45%, transparent);
  background: var(--honey-soft);
}
.wa-plan {
  flex-shrink: 0;
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
.wa-carte-enter-active,
.wa-carte-leave-active {
  transition:
    opacity 320ms ease,
    transform 320ms var(--ease-out-expo, ease-out);
}
.wa-carte-leave-active {
  position: absolute;
}
.wa-carte-enter-from,
.wa-carte-leave-to {
  opacity: 0;
  transform: scale(0.94);
}

/* Mouvement réduit : la grille reste, l'échange s'arrête. Le visiteur voit
   quand même neuf widgets en trois colonnes, ce qui est l'essentiel. */
.wa-fige :deep(*) {
  transition: none !important;
}
</style>
