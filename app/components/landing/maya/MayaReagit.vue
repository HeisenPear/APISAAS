<!--
  Chapitre 03 — « Elle réagit ».

  Un COMMUTATEUR, pas une grille : une seule mark en grand qui change d'état,
  et une barre d'onglets pour reprendre la main. Aligné sur la maquette —
  mark 168 px, cycle 3,6 s, onglets SOULIGNÉS (trait honey sous l'actif), et des
  légendes qui décrivent le MOUVEMENT, puisque c'est lui qu'on regarde.

  Trois détails, chacun pour une raison :
   · la légende réserve sa hauteur, sinon la barre d'onglets monte et descend à
     chaque cycle et l'œil suit le saut au lieu de la mark ;
   · l'onglet n'a AUCUNE transition — un retour différé se lit comme un clic raté ;
   · un clic arrête le défilement POUR DE BON : on ne reprend pas la main à
     quelqu'un qui vient de la prendre.
-->
<template>
  <LandingMayaChapitre numero="03" intitule="Elle réagit" ancre="reagit">
    <template #titre>Vous voyez ce qu’elle fait.</template>
    <template #chapo>
      Sept alvéoles pour tout langage. Son logo bouge selon ce qui l’occupe — vous savez qu’elle
      cherche, qu’elle écoute ou qu’elle a trouvé, sans lire une ligne.
    </template>

    <div
      class="rounded-[18px] border px-5 py-8 sm:px-8"
      style="border-color: var(--border-default); background: white"
      @pointerenter="suspendre"
      @pointerleave="reprendre"
    >
      <div class="flex flex-col items-center">
        <!-- `:key` force le remontage : la mark reprend ses keyframes au début,
             au lieu de reprendre le cycle de l'état précédent en cours de route. -->
        <div class="scene">
          <IaMayaMark :key="courant.etat" :size="168" glow :state="courant.etat" />
        </div>

        <!-- Hauteur réservée : la barre d'onglets ne bouge jamais -->
        <div class="legende mt-6 w-full max-w-lg text-center">
          <p class="text-[17px] font-semibold" style="color: var(--text-primary)">
            {{ courant.nom }}
          </p>
          <p class="mt-2 text-[14px] leading-relaxed" style="color: var(--text-secondary)">
            {{ courant.ligne }}
          </p>
          <p class="mt-2 text-[12.5px] leading-relaxed" style="color: var(--text-tertiary)">
            {{ courant.quand }}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="États de Maya"
          class="mt-7 flex flex-wrap justify-center gap-x-1 gap-y-2"
        >
          <button
            v-for="(e, i) in ETATS"
            :key="e.etat"
            type="button"
            role="tab"
            :aria-selected="i === index"
            :tabindex="i === index ? 0 : -1"
            class="onglet"
            :class="{ 'onglet-actif': i === index }"
            @click="choisir(i)"
            @keydown.left.prevent="naviguer(-1)"
            @keydown.right.prevent="naviguer(1)"
          >
            {{ e.nom }}
          </button>
        </div>

        <p class="mt-5 text-[11.5px]" style="color: var(--text-tertiary)">
          {{
            auto
              ? 'Elle passe d’un état à l’autre — touchez-en un pour la retenir.'
              : 'Vous menez. Les flèches ← → fonctionnent aussi.'
          }}
        </p>
      </div>
    </div>
  </LandingMayaChapitre>
</template>

<script setup lang="ts">
/**
 * Les six états de `IaMayaMark`. Les légendes décrivent ce que fait l'ANIMATION,
 * pas ce que fait le logiciel : c'est le mouvement qu'on est en train de
 * regarder, et le nommer est ce qui apprend à le lire.
 */
const ETATS = [
  {
    etat: 'idle' as const,
    nom: 'Repos',
    ligne: 'Elle veille, sans rien demander.',
    quand: 'Les alvéoles scintillent dans le désordre — un rythme organique, pas une horloge.',
  },
  {
    etat: 'think' as const,
    nom: 'Réflexion',
    ligne: 'Une vague part du centre : elle cherche.',
    quand: 'Elle recalcule un score, croise la météo, relit vos trois dernières visites.',
  },
  {
    etat: 'listen' as const,
    nom: 'Écoute',
    ligne: 'Votre voix entre.',
    quand: 'Onde concentrique. « Salut Maya » suffit à ouvrir la dictée, gants aux mains.',
  },
  {
    etat: 'alert' as const,
    nom: 'Alerte',
    ligne: 'Une alvéole s’embrase, les autres se taisent.',
    quand: 'Une seule chose compte à cet instant : elle ne noie pas l’urgence dans le décor.',
  },
  {
    etat: 'loading' as const,
    nom: 'Calcul',
    ligne: 'Une lueur tourne autour de la couronne.',
    quand: 'Le briefing du matin se prépare — tout le cheptel repassé en revue.',
  },
  {
    etat: 'success' as const,
    nom: 'Récolte',
    ligne: 'Le miel monte du bas vers le haut.',
    quand: 'C’est fait, enregistré, synchronisé. Le seul moment où elle se réjouit.',
  },
];

const index = ref(0);
const auto = ref(true);
const courant = computed(() => ETATS[index.value]!);
let minuteur: ReturnType<typeof setInterval> | null = null;

/** Le réglage système gagne : sans mouvement demandé, rien ne défile tout seul. */
function mouvementAccepte(): boolean {
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function demarrer(): void {
  if (minuteur || !auto.value || !mouvementAccepte()) return;
  minuteur = setInterval(() => {
    index.value = (index.value + 1) % ETATS.length;
  }, 3600);
}
function arreter(): void {
  if (minuteur) clearInterval(minuteur);
  minuteur = null;
}

/** Survol : suspension le temps qu'on lise. Le défilement reprend à la sortie. */
function suspendre(): void {
  arreter();
}
function reprendre(): void {
  demarrer();
}

function choisir(i: number): void {
  index.value = i;
  auto.value = false;
  arreter();
}

/** Flèches ← → : on déplace la sélection ET le focus, comme un vrai tablist. */
function naviguer(pas: number): void {
  const i = (index.value + pas + ETATS.length) % ETATS.length;
  choisir(i);
  nextTick(() => {
    document.querySelectorAll<HTMLElement>('[role="tab"]')[i]?.focus();
  });
}

onMounted(demarrer);
onBeforeUnmount(arreter);
</script>

<style scoped>
.scene {
  display: grid;
  place-items: center;
  min-height: 210px;
}

/* Mesurée sur la plus haute des six légendes. Sans elle, la barre d'onglets se
   décale à chaque changement d'état. */
.legende {
  min-height: 104px;
}

/* Onglets SOULIGNÉS, comme la maquette : trait honey sous l'actif, texte qui
   passe de gris à ink. Pas de pastille — elle alourdirait une barre de six. */
.onglet {
  border: 0;
  background: none;
  padding: 8px 14px;
  font-size: 13.5px;
  font-weight: 500;
  color: #706963;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  /* AUCUNE transition : le retour au clic doit être immédiat. */
}
.onglet:hover {
  color: var(--text-primary);
}
.onglet:focus-visible {
  outline: 2px solid var(--honey);
  outline-offset: 2px;
  border-radius: 6px;
}
.onglet-actif,
.onglet-actif:hover {
  color: #1c1c1e;
  font-weight: 600;
  border-bottom-color: var(--honey);
}
</style>
