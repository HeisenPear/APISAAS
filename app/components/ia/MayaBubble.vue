<!--
  MayaBubble — la surface UNIQUE de Maya (§7bis handoff). VRAI « morph » : un bouton
  ink en bas à droite dont l'EN-TÊTE EST le bouton, et qui se DÉPLIE en fenêtre de
  conversation (la coquille grandit depuis le coin). Fidèle à la maquette
  design/maya (proto « Maya - Bulle »). Rendu 100 % DÉTERMINISTE : le corps du fil
  est branché sur le vrai moteur local (`useCopilote` → `IaCopiloteMessage` : blocs,
  confirmations, undo). Monté une fois dans layouts/default.vue dès que la présence
  n'est pas « pause » (desktop + mobile). Le mode « partout » vs « discrète » ne change
  PAS la bulle (toujours là) mais les surfaces proactives (DashboardMayaCard).
-->
<template>
  <div class="maya-bubble-root">
    <!-- infobulle de sollicitation quand fermé + proposition en attente (dormant tant
         qu'aucune vraie proposition proactive n'est branchée → pas de badge factice) -->
    <div v-if="!open && hasAlert" class="maya-bubble-tip maya-msg-in">
      Une proposition pour toi 🐝
    </div>

    <!-- LA COQUILLE : bouton (fermé) ⇆ fenêtre (ouvert), un seul élément qui se morphe -->
    <!--
      ⚠️ FERMÉE, LA COQUILLE N'ÉTAIT MASQUÉE QUE PAR `opacity: 0`. L'opacité ne
      retire ni du parcours de tabulation, ni de l'arbre d'accessibilité : SEPT
      contrôles restaient atteignables au Tab — dont le champ de saisie, le
      micro et « Envoyer » — hors de la boîte visible. Le navigateur DÉFILAIT
      même la coquille pour les atteindre malgré `overflow: hidden`, et le
      repère Maya sortait du bouton pour ne jamais y revenir : le lanceur
      devenait un carré noir vide.

      Un apiculteur au clavier voyait son focus disparaître pendant sept
      arrêts, tapait sa phrase en croyant être dans un champ de la page, et
      Maya répondait dans une fenêtre fermée — proposition d'écriture et
      boutons « Confirmer / Annuler » compris, invisibles eux aussi.

      `inert` retire les deux d'un coup, et laisse l'animation de morph
      intacte, ce que `v-if` aurait cassé.

      Symétriquement, le seul élément VISIBLE était le seul inatteignable au
      clavier : un `<div>` cliquable sans rôle, sans nom, sans tabindex.
    -->
    <div
      :class="['maya-shell', { 'is-open': open }, !open ? 'maya-launch' : null]"
      :style="shellStyle"
      :role="open ? undefined : 'button'"
      :tabindex="open ? undefined : 0"
      :aria-label="open ? undefined : 'Ouvrir Maya, ton copilote apicole'"
      :aria-expanded="open"
      @click="!open && maya.openBubble()"
      @keydown="surToucheDuLanceur"
    >
      <!-- en-tête = le bouton : noir plein fermé, dégradé chaud + lueur une fois déplié -->
      <div class="maya-head" :class="{ 'is-open': open }">
        <div class="maya-head-glow" :style="{ opacity: open ? 1 : 0 }" />
        <div class="maya-head-orb" :style="{ opacity: open ? 1 : 0 }" />

        <div
          class="maya-head-mark"
          :style="{ top: open ? '14px' : '12px', left: open ? '16px' : '12px' }"
        >
          <IaMayaMark :size="34" :glow="open" :state="headState" />
        </div>
        <span v-if="!open && hasAlert" class="maya-badge">1</span>

        <!-- titre + actions : apparaissent une fois déplié -->
        <div class="maya-head-body" :inert="!open" :style="{ opacity: open ? 1 : 0 }">
          <div class="maya-head-title">
            <div class="maya-name">Maya</div>
            <div class="maya-status">
              <span class="maya-dot" :style="{ background: streaming ? '#f5a623' : '#c9873d' }" />
              {{ statusLabel }}
            </div>
          </div>
          <button
            v-if="messages.length"
            type="button"
            class="maya-head-btn"
            title="Nouvelle discussion"
            aria-label="Nouvelle discussion"
            :disabled="streaming"
            @click.stop="reset"
          >
            <UIcon name="i-lucide-square-pen" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="maya-head-btn"
            title="Réglages de Maya"
            aria-label="Réglages de Maya"
            @click.stop="maya.openSettings()"
          >
            <UIcon name="i-lucide-settings-2" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="maya-head-btn"
            title="Réduire"
            aria-label="Réduire"
            @click.stop="maya.closeBubble()"
          >
            <UIcon name="i-lucide-chevron-down" class="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <!-- corps : le VRAI fil déterministe (visible seulement ouvert) -->
      <div ref="scrollEl" class="maya-body" :inert="!open" :style="{ opacity: open ? 1 : 0 }">
        <!-- accueil + amorces au tap -->
        <div v-if="!messages.length" class="maya-empty">
          <IaMayaMark :size="46" glow state="idle" />
          <p class="maya-empty-title">Bonjour {{ prenom }} 🐝</p>
          <p class="maya-empty-sub">
            J'agis sur tes données et je réponds à tes questions d'apiculture — jamais je n'invente.
          </p>
          <div class="maya-chips">
            <button
              v-for="s in exemples"
              :key="s"
              type="button"
              class="maya-chip"
              @click.stop="envoyer(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <IaCopiloteMessage
          v-for="(m, i) in messages"
          :key="i"
          :message="m"
          :is-last="i === messages.length - 1"
          @confirm="confirmerAction"
          @cancel="annulerAction"
          @undo="annulerEcriture"
          @confirm-plan="confirmerPlan"
          @cancel-plan="annulerPlanProposition"
          @undo-plan="annulerLotExecute"
          @suggest="envoyer"
        />

        <div v-if="streaming && activite" class="maya-typing">
          <span /><span /><span /> {{ activite }}
        </div>

        <!--
          ⚠️ LE REFUS EST RENDU PAR LE COMPOSANT PARTAGÉ, et c'est le fond de la
          correction. Il n'y avait ici qu'un cadenas et la phrase nue : pas un
          lien, pas un bouton. Un compte Découverte cliquait l'une des amorces
          que la bulle lui tend, voyait sa question disparaître du fil, et
          restait devant un mur. La page `/copilote`, elle, offrait bien la
          sortie — deux rendus d'une même règle, et la divergence du côté le
          plus regardé.
        -->
        <IaCopiloteRefus v-if="erreur" :erreur="erreur" variante="compacte" />

        <!--
          ⚠️ MAYA MUETTE, ET L'ÉCRAN QUI DIT « je t'écoute ». Depuis qu'elle
          refuse les voix servies à distance, un appareil sans voix française
          EMBARQUÉE la laisse silencieuse : la boucle tourne, l'anneau du micro
          brille, et pas un mot ne sort. L'apiculteur, gants aux mains,
          téléphone posé sur la ruche, répète, attend, puis retire ses gants
          pour découvrir la réponse ÉCRITE. On le dit — une fois, sans alarme,
          et en nommant ce qui débloque.
        -->
        <p v-if="maya.modeVocal && !voixSupporte" class="maya-sans-voix">
          Ton appareil n’a pas de voix française installée : je t’écoute, mais je te réponds
          <strong>par écrit</strong>. Ajoute une voix française dans les réglages de ton téléphone
          pour que je parle.
        </p>
      </div>

      <!-- pied : saisie (déterministe : surtout pour préciser, l'action reste au tap) -->
      <div class="maya-foot" :inert="!open" :style="{ opacity: open ? 1 : 0 }">
        <form class="maya-input-row" @submit.prevent="submit">
          <input
            v-model="brouillon"
            :placeholder="placeholderChamp"
            :disabled="streaming"
            @keydown.enter.prevent="submit"
            @input="surSaisieClavier"
            @click.stop
          />
          <!-- Micro : masqué si le navigateur ne sait pas reconnaître la parole
               (Firefox), pour ne jamais montrer un bouton mort. -->
          <button
            v-if="dicteeSupportee"
            type="button"
            class="maya-mic"
            :class="{ 'is-live': dicteeActive, 'is-vocal': maya.modeVocal }"
            :disabled="streaming"
            :aria-label="
              maya.modeVocal
                ? 'Quitter le mode vocal'
                : dicteeActive
                  ? 'Arrêter la dictée'
                  : 'Dicter à la voix'
            "
            @click.stop="basculerDictee"
          >
            <UIcon name="i-lucide-mic" class="h-[17px] w-[17px]" />
          </button>
          <button
            type="submit"
            class="maya-send"
            :disabled="streaming || !brouillon.trim()"
            aria-label="Envoyer"
            @click.stop
          >
            <UIcon name="i-lucide-arrow-up" class="h-[17px] w-[17px]" />
          </button>
        </form>
        <div v-if="dicteeErreur" class="maya-dictee-erreur">
          {{ dicteeErreur }}
          <!-- Même journal que sur la page Maya : une panne micro ne se
               diagnostique qu'avec la séquence vécue, et la bulle est l'endroit
               où la dictée se lance le plus souvent. -->
          <details v-if="dicteeJournal.length" class="maya-dictee-detail">
            <summary>Détail technique</summary>
            <pre>{{ dicteeJournal.join('\n') }}</pre>
          </details>
        </div>
        <div class="maya-disclaimer">
          Maya suit des règles apicoles éprouvées · tu gardes la main sur tout
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const maya = useMayaStore();
const authStore = useAuthStore();
const prenom = computed(() => authStore.profil?.prenom || '');

const {
  messages,
  streaming,
  activite,
  erreur,
  envoyer,
  confirmerAction,
  annulerAction,
  annulerEcriture,
  confirmerPlan,
  annulerPlanProposition,
  annulerLotExecute,
  reset,
} = useCopilote();

const brouillon = ref('');
const scrollEl = ref<HTMLElement | null>(null);

// Dictée vocale (Web Speech API — cf. useDictee). On remplit le brouillon au fil
// de la parole. Au DOIGT, on n'envoie jamais tout seul : l'apiculteur garde le
// dernier regard. En MODE VOCAL, c'est le silence qui envoie — il n'a pas de
// main libre pour appuyer, et c'est tout l'objet du mode.
const {
  supporte: dicteeSupportee,
  actif: dicteeActive,
  erreur: dicteeErreur,
  demarrer: demarrerDicteeReco,
  arreter: arreterDicteeReco,
  journal: dicteeJournal,
} = useDictee();

/**
 * L'ONGLET EST-IL SOUS LES YEUX DE L'APICULTEUR ?
 *
 * ⚠️ LE RÉVEIL AVAIT CE GARDE, LA BOUCLE NON — et c'est l'asymétrie qui coûte.
 * `useReveilMaya` lâche le micro dès que l'onglet passe en arrière-plan ; la
 * boucle vocale, elle, le gardait ouvert, transcrivait ce qui se disait dans la
 * pièce, envoyait chaque énoncé comme une question, et pouvait ÉCRIRE sur un
 * « oui » adressé à quelqu'un d'autre.
 *
 * ⚠️ ET LA PROMESSE EST ÉCRITE : le réglage « Salut Maya » annonce
 * « Fonctionne quand l'app est ouverte à l'écran, jamais en arrière-plan ni
 * téléphone verrouillé ». Depuis que ce texte décrit la boucle ENTIÈRE — écoute
 * automatique, envoi au silence, réponse à voix haute — il engage aussi la
 * boucle. Un interrupteur qui ouvre un microphone ne peut pas dire une chose et
 * en faire une autre.
 *
 * Deux agents de revue ont disputé ce point : l'un mesurait une écriture
 * onglet caché, l'autre montrait qu'elle se produit à l'identique onglet
 * VISIBLE — donc que le masquage n'en est pas la cause. Les deux ont raison, et
 * ça ne change pas la conclusion : un « oui » prononcé devant un écran qu'on
 * regarde est un accord ; le même mot, dit à quelqu'un d'autre pendant que le
 * téléphone est dans la poche, n'en est pas un.
 */
const ongletVisible = ref(true);

function surVisibilite(): void {
  ongletVisible.value = !document.hidden;
}

onMounted(() => {
  document.addEventListener('visibilitychange', surVisibilite);
  surVisibilite();
});
onUnmounted(() => document.removeEventListener('visibilitychange', surVisibilite));

const voix = useVoixMaya();
/**
 * ⚠️ LIÉ AU PREMIER NIVEAU, PAS LU EN `voix.supporte` DANS LE GABARIT.
 * Vue ne déballe automatiquement que les `ref` exposées à la racine du `setup` ;
 * la propriété d'un objet ordinaire, elle, reste une `ref`. Écrire
 * `voix.supporte` dans le gabarit rendrait un objet — toujours vrai — et l'avis
 * « pas de voix » ne s'afficherait jamais, sans qu'aucun outil ne le signale.
 */
const voixSupporte = voix.supporte;

/**
 * ⚠️ UN SEUL GESTIONNAIRE, SANS MODIFICATEUR — ET C'EST UNE CORRECTION D'UNE
 * CORRECTION.
 *
 * Le clavier du lanceur était écrit `@keydown.space.prevent="!open && …"`. Le
 * compilateur Vue en fait `withKeys(withModifiers(fn, ['prevent']), ['space'])`,
 * et `withModifiers` appelle `preventDefault()` AVANT d'évaluer l'expression.
 * Le garde `!open` protégeait donc l'ACTION, jamais le `preventDefault` — qui
 * partait sur toute frappe d'Espace remontant depuis l'INTÉRIEUR de la coquille.
 *
 * Or la coquille contient la fenêtre entière. Bulle ouverte, l'apiculteur tapait
 * « ajoute une ruche 12 au rucher des Tilleuls » et lisait
 * « ajouteuneruche12aurucherdesTilleuls » : l'insertion d'un caractère est
 * l'action par défaut du keydown, et on venait de l'annuler. Au clavier, pire :
 * Entrée et Espace sur « Confirmer » n'activaient plus le bouton — une écriture
 * proposée ne pouvait plus être ni validée ni refusée sans souris.
 *
 * Le correctif qui rendait la bulle FERMÉE inoffensive avait rendu la bulle
 * OUVERTE inutilisable. On ne coupe donc la touche que si l'on agit vraiment.
 */
function surToucheDuLanceur(e: KeyboardEvent): void {
  if (maya.bubbleOpen) return;
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  maya.openBubble();
}
/** Maya est en train de parler : le micro lui laisse la place (cf. useVoixMaya). */
const enParole = ref(false);
/**
 * La dernière bulle DÉJÀ lue à voix haute.
 *
 * ⚠️ SANS ELLE, MAYA RELIT LA RÉPONSE PRÉCÉDENTE. Quand une requête échoue,
 * `useCopilote` RETIRE la question et la bulle vide (`splice`) : la dernière
 * bulle redevient alors la réponse d'AVANT. La boucle la relisait donc — avec
 * sa consigne « dis oui pour confirmer » — pour une proposition qui n'existe
 * plus. L'apiculteur entend deux fois la même chose et dit oui à un vide.
 */
let dejaDite: unknown = null;

/**
 * ⚠️ LA SEULE PORTE PAR LAQUELLE MAYA PARLE, ET ELLE FERME LE MICRO.
 *
 * Trois branches parlaient sans le couper : « D'accord, je laisse tomber »,
 * « Je n'ai rien en attente », et l'adieu. Sur un téléphone posé près d'une
 * ruche, haut-parleur allumé, le micro l'entend : le silence de fin d'énoncé
 * tombe sur SA propre phrase, qui repart comme une question. Elle se répond à
 * elle-même, et chaque réponse relance la suivante.
 *
 * ⚠️ LE CHIEN DE GARDE A DÉMÉNAGÉ DANS `useVoixMaya`, ET C'ÉTAIT NÉCESSAIRE.
 * Il vivait ici sous forme d'une course contre trente secondes fixes — or
 * 79 des 484 textes du savoir dépassent cette durée (la fiche varroa fait
 * 1 227 caractères, près d'une minute de synthèse) : la borne coupait Maya au
 * milieu d'une phrase. Elle suit maintenant la LONGUEUR du texte, et elle est
 * posée là où la promesse est faite, ce qui la rend vraie pour tous ses
 * appelants — `dire()` rend désormais la main sur `taire()`, sur un second
 * `dire()`, au démontage et sur un navigateur muet.
 */
async function parler(texte: string): Promise<void> {
  arreterDicteeReco();
  enParole.value = true;
  try {
    await voix.dire(texte);
  } finally {
    enParole.value = false;
    voix.taire();
  }
  // On relit l'état APRÈS l'attente : pendant qu'elle parlait, l'apiculteur a pu
  // fermer la bulle ou couper le micro. Le rouvrir alors serait rallumer un
  // micro que quelqu'un vient d'éteindre.
  if (maya.modeVocal && !streaming.value) demarrerEcouteVocale();
}

/** Sortie du mode vocal demandée À LA VOIX : on le dit, puis on se tait. */
async function quitterALaVoix(): Promise<void> {
  maya.quitterModeVocal();
  arreterDicteeReco();
  enParole.value = true;
  try {
    await voix.dire('D’accord, je te laisse. Redis « Salut Maya » quand tu veux.');
  } finally {
    enParole.value = false;
  }
}

/** Ce que la dictée écrit dans le champ, dans les deux modes. */
function recevoirTexte(texte: string): void {
  brouillon.value = texte;
}

/** Écoute manuelle : le texte se pose dans le champ, l'envoi reste au doigt. */
function demarrerDicteeManuelle(): void {
  demarrerDicteeReco(recevoirTexte);
}

/**
 * Écoute de la BOUCLE VOCALE : la fin d'un énoncé (un silence après le dernier
 * mot) envoie la question toute seule.
 */
/**
 * ⚠️ PAS DE GARDE DE VISIBILITÉ ICI, ET C'EST DÉLIBÉRÉ. Il y en a eu un ; aucune
 * mutation ne le tuait — l'observateur de `ongletVisible` coupe déjà le mode
 * vocal avant que cette fonction ne puisse être rappelée, y compris dans la
 * course « l'onglet se cache pendant que Maya parle ». Un garde mort donne
 * l'illusion d'une protection et détourne de celle qui travaille vraiment.
 */
function demarrerEcouteVocale(): void {
  if (streaming.value || enParole.value || maya.transfertVocal) return;
  demarrerDicteeReco(recevoirTexte, {
    surEnonce: (texte) => {
      if (!maya.modeVocal || streaming.value) return;
      brouillon.value = '';
      if (repondreAUneDemande(texte)) return;
      envoyer(texte);
    },
  });
}

/**
 * RÉPONDRE « OUI » OU « NON » À LA VOIX — sinon la boucle s'arrête au premier
 * geste utile.
 *
 * ⚠️ SANS ÇA, LE MODE VOCAL EST UN DEMI-MODE. Maya demande « Je crée le client
 * Jean ? » et attend un clic sur « Confirmer » : c'est-à-dire exactement ce que
 * le mode existe pour éviter. L'apiculteur s'essuie les mains, cherche le
 * téléphone, vise un bouton — au moment précis où le contact vocal servait le
 * plus.
 *
 * ⚠️ ET « RIEN NE S'ÉCRIT SANS ACCORD » RESTE ENTIER : un « oui » prononcé EST
 * l'accord, donné par la même personne au même instant. Seul le canal change.
 * Le tri, lui, est strict (cf. `lireAccord`) : au moindre mot hors vocabulaire,
 * la phrase repart comme une question et la demande reste en attente.
 *
 * Rend `true` si l'énoncé a été consommé comme une réponse.
 */
function repondreAUneDemande(texte: string): boolean {
  /**
   * ⚠️ UN FIL VIDE N'EST PAS UNE RAISON DE SE TAIRE, et un `if (!dernier)
   * return false` en tête l'a été. Juste après « Salut Maya », avant que Maya
   * n'ait dit quoi que ce soit, l'apiculteur qui se ravise et dit « stop »
   * voyait son mot partir comme une QUESTION : Maya lui répondait à côté et le
   * micro restait ouvert. Or « stop » ne dépend d'aucune bulle — il ferme
   * l'écoute, point. Seules les branches qui agissent SUR une bulle en ont
   * besoin, et elles ne sont atteintes que si l'état en déclare une.
   */
  const dernier = messages.value.at(-1);

  /**
   * ⚠️ LA DÉCISION VIT DANS `~/utils/accordVocal`, PAS ICI, et ce n'est pas du
   * rangement. Aucun banc du dépôt n'importe un `.vue` : tant que ce choix
   * habitait le corps du composant, le lexique était mesuré au mot près et le
   * GESTE qu'il déclenche ne l'était pas du tout — sur le seul chemin du
   * produit où la parole écrit en base. Ici, on ne fait plus qu'exécuter.
   */
  const { geste, quitter } = decisionVocale(lireAccord(texte), {
    enAttente: dernier?.pendingPlan ? 'plan' : dernier?.pending ? 'action' : null,
    defaisable: dernier?.undoPlan ? 'plan' : dernier?.undo ? 'action' : null,
  });

  switch (geste) {
    case null:
      return false;
    case 'confirmer-plan':
      if (dernier) confirmerPlan(dernier);
      break;
    case 'confirmer-action':
      if (dernier) confirmerAction(dernier);
      break;
    case 'renoncer-plan':
      if (dernier) annulerPlanProposition(dernier);
      if (!quitter) void parler('D’accord, je laisse tomber.');
      break;
    case 'renoncer-action':
      if (dernier) annulerAction(dernier);
      if (!quitter) void parler('D’accord, je laisse tomber.');
      break;
    case 'defaire-plan':
      if (dernier) annulerLotExecute(dernier);
      break;
    case 'defaire-action':
      if (dernier) annulerEcriture(dernier);
      break;
    case 'rien-en-attente':
      void parler('Je n’ai rien en attente. Dis-moi ce que tu veux faire.');
      break;
    case 'quitter':
      break;
  }
  // ⚠️ LA SORTIE SE FAIT APRÈS LE GESTE, JAMAIS AVANT. « stop » devant une
  // proposition veut dire les deux : n'écris pas ça, ET arrête d'écouter.
  // Quitter d'abord aurait laissé la proposition ouverte derrière un micro
  // fermé — un piège qu'on ne peut plus refuser qu'au doigt.
  if (quitter) void quitterALaVoix();
  return true;
}

function basculerDictee() {
  /**
   * ⚠️ ON DÉCIDE SUR LE MODE, PAS SUR L'ÉTAT DU MICRO — et c'est une correction.
   *
   * La condition portait sur `dicteeActive`. Or en mode vocal le micro est
   * FERMÉ pendant que Maya réfléchit ou parle : le bouton, dont l'étiquette
   * annonce « Quitter le mode vocal », tombait alors dans la branche
   * « démarrer » — il OUVRAIT le micro et laissait la boucle en place. Le geste
   * faisait l'inverse exact de ce qu'il promettait, au seul moment où
   * l'apiculteur cherche à reprendre la main.
   */
  if (maya.modeVocal || dicteeActive.value) {
    arreterDicteeReco();
    // Couper le micro sort du mode vocal : un micro qui se rouvre après qu'on
    // l'a explicitement éteint est la seule chose qu'on ne peut pas se permettre.
    maya.quitterModeVocal();
    voix.taire();
    dejaDite = null;
  } else {
    demarrerDicteeManuelle();
  }
}

// Réveil vocal : « Salut Maya, comment vont mes ruches ? » → la commande dictée
// dans la foulée est envoyée directement. La bulle est déjà ouverte (le store
// l'a fait). On consomme la commande une seule fois.
watch(
  () => maya.commandeVocale,
  (cmd) => {
    if (!cmd) return;
    maya.commandeVocale = null;
    if (!streaming.value) envoyer(cmd);
  },
);

/**
 * LE PASSAGE DE RELAIS DU MICRO — du réveil vocal à la dictée.
 *
 * Le réveil garde le micro jusqu'à la fin de la phrase (cf. `transfertVocal`).
 * Quand il le rend, la dictée prend le relais SEULE : c'est ce qui fait qu'après
 * « Salut Maya », l'apiculteur n'a plus qu'à parler.
 */
watch(
  () => maya.transfertVocal,
  (transfert) => {
    if (transfert || !maya.modeVocal) return;
    // Une commande vient d'être livrée : elle part à l'instant, et c'est la fin
    // du flux qui rendra le micro. Démarrer ici ne ferait que l'ouvrir pour le
    // refermer aussitôt.
    if (maya.commandeVocale) return;
    demarrerEcouteVocale();
  },
);

/**
 * LA BOUCLE — écouter, envoyer, répondre à voix haute, réécouter.
 *
 * ⚠️ LE MICRO SE TAIT PENDANT QUE MAYA PARLE, et ce n'est pas négociable : sur
 * un téléphone posé près d'une ruche, haut-parleur allumé, le micro l'entend.
 * Sans cette coupure, elle se répondrait à elle-même, indéfiniment. La BOUCLE,
 * elle, ne s'arrête jamais : la parole rendue, l'écoute repart d'elle-même sans
 * que l'apiculteur ait à toucher quoi que ce soit.
 */
watch(streaming, (enCours, avant) => {
  if (!maya.modeVocal) return;
  if (enCours && !avant) {
    // Maya réfléchit, puis va parler : on lui laisse le micro.
    arreterDicteeReco();
    return;
  }
  if (!enCours && avant) void repondrePuisReecouter();
});

async function repondrePuisReecouter(): Promise<void> {
  if (!maya.modeVocal) return;

  const dernier = messages.value.at(-1);
  /**
   * ⚠️ LA RÈGLE VIT DANS `~/utils/paroleMaya`, PAS ICI. Aucun banc du dépôt
   * n'importe un `.vue` : tant qu'elle habitait ce composant, « Maya relit la
   * réponse précédente au lieu de dire l'échec » ne pouvait être vu par
   * personne. Ici, on ne fait plus qu'exécuter.
   */
  const aDire = paroleDeLaReponse({
    erreur: erreur.value?.message,
    derniere: dernier
      ? {
          role: dernier.role,
          content: dernier.content,
          attendUnAccord: Boolean(dernier.pending || dernier.pendingPlan),
        }
      : null,
    dejaDite: dernier !== undefined && dernier === dejaDite,
  });

  if (aDire === null) {
    if (maya.modeVocal && !streaming.value) demarrerEcouteVocale();
    return;
  }
  if (dernier) dejaDite = dernier;
  await parler(aDire);
}

/**
 * PASSER EN ARRIÈRE-PLAN SORT DU MODE VOCAL.
 *
 * ⚠️ ET ON NE ROUVRE PAS AU RETOUR. Revenir sur l'onglet n'est pas un accord :
 * rallumer le micro sur ce simple geste, c'est exactement « un micro qui se
 * rouvre tout seul », la seule chose que ce dépôt refuse. L'apiculteur redit
 * « Salut Maya », ou touche le micro — deux gestes qu'il a voulus.
 */
watch(ongletVisible, (visible) => {
  if (visible || !maya.modeVocal) return;
  arreterDicteeReco();
  voix.taire();
  maya.quitterModeVocal();
});

/**
 * UNE PANNE MICRO SORT DU MODE VOCAL — sinon l'en-tête ment.
 *
 * ⚠️ La dictée renonce (micro pris par une autre application, service
 * injoignable) et pose son message d'erreur ; la boucle, elle, restait « en
 * mode vocal » : l'en-tête affichait « mode vocal · je t'écoute » devant un
 * micro éteint. L'apiculteur parlait dans le vide, et rien à l'écran ne le
 * démentait.
 */
watch(dicteeErreur, (message) => {
  if (!message || !maya.modeVocal) return;
  maya.quitterModeVocal();
  voix.taire();
});

/**
 * FERMER LA BULLE COUPE TOUT — et c'était un défaut.
 *
 * La dictée survivait à la fermeture : le micro restait pris, l'indicateur
 * d'enregistrement restait allumé, le brouillon continuait de se remplir dans
 * une fenêtre que plus personne ne voyait — et le réveil vocal ne pouvait pas
 * reprendre, puisqu'il cède la place à toute dictée en cours. Le composant, lui,
 * n'est jamais démonté (c'est le bouton flottant) : `onScopeDispose` ne se
 * déclenchait donc jamais.
 */
watch(
  () => maya.bubbleOpen,
  (ouverte) => {
    if (ouverte) return;
    arreterDicteeReco();
    voix.taire();
    maya.quitterModeVocal();
    // La prochaine ouverture repart d'une page blanche : sans ça, la première
    // réponse de la conversation suivante serait tue comme « déjà dite ».
    dejaDite = null;
  },
);

/** Taper, c'est reprendre la main : le micro se tait et la boucle s'arrête. */
function surSaisieClavier(): void {
  if (!maya.modeVocal) return;
  arreterDicteeReco();
  voix.taire();
  maya.quitterModeVocal();
}

const exemples = [
  'Comment vont mes ruches ?',
  'Quel temps pour visiter ?',
  'Faire une intervention',
];

// `open` = état de la bulle porté par le store (ouvrable aussi par la BottomNav mobile).
const open = computed(() => maya.bubbleOpen);

// hasAlert : DOIT venir d'une vraie proposition proactive (essaimage, gel, retard).
// Tant que le déclencheur proactif n'est pas branché (Volet moteur), on le laisse à
// false → pas de badge « 1 » factice (règle projet : zéro donnée inventée).
const hasAlert = ref(false);

// États du logo câblés sur le vrai statut : fermé+alerte → alert ; ouvert+stream → think.
const headState = computed<'alert' | 'idle' | 'think'>(() => {
  if (!open.value) return hasAlert.value ? 'alert' : 'idle';
  return streaming.value ? 'think' : 'idle';
});

const statusLabel = computed(() => {
  if (streaming.value) return activite.value ?? 'réfléchit…';
  if (enParole.value) return 'te répond…';
  /**
   * ⚠️ « je t'écoute » RESTE VRAI SANS VOIX — c'est écouter qui compte ici —
   * mais l'apiculteur lit la ligne comme la promesse d'un échange parlé. On
   * dit donc ce qui se passera vraiment.
   */
  if (maya.modeVocal && !voixSupporte.value)
    return dicteeActive.value ? 'mode vocal · je réponds par écrit' : 'mode vocal · sans voix';
  if (maya.modeVocal) return dicteeActive.value ? 'mode vocal · je t’écoute' : 'mode vocal';
  return 'Prête à aider';
});

/**
 * Le champ dit CE QUI SE PASSE, pas ce qu'on pourrait faire.
 *
 * En mode vocal, l'apiculteur ne regarde pas l'écran — mais quand il y revient,
 * il doit comprendre en un coup d'œil pourquoi son micro est allumé et pourquoi
 * sa phrase est partie sans qu'il appuie sur rien.
 */
const placeholderChamp = computed(() => {
  if (enParole.value) return 'Maya te répond…';
  if (maya.modeVocal && dicteeActive.value)
    return voix.supporte.value
      ? 'Je t’écoute — fais une pause pour envoyer'
      : 'Je t’écoute — ma réponse s’écrira ici';
  if (dicteeActive.value) return 'Je t’écoute…';
  return 'Écrire à Maya…';
});

// Morph : la coquille grandit depuis le bouton. Dimensions responsives (clamp mobile).
const shellStyle = computed(() => ({
  width: open.value ? 'min(392px, calc(100vw - 24px))' : '58px',
  height: open.value ? 'min(580px, calc(100dvh - 120px))' : '58px',
  borderRadius: open.value ? '22px' : '18px',
  background: open.value ? 'linear-gradient(180deg,#fdf8ef,#fbf1de)' : '#111112',
  boxShadow: open.value
    ? '0 28px 70px rgba(40,30,20,0.32), 0 0 0 1px rgba(180,140,80,0.18)'
    : '0 12px 30px rgba(28,28,30,0.34)',
}));

function submit(): void {
  const q = brouillon.value.trim();
  if (!q || streaming.value) return;
  brouillon.value = '';
  envoyer(q);
}

// Suit le flux : auto-scroll en bas quand un message arrive / stream.
watch(
  [messages, streaming, open],
  async () => {
    await nextTick();
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight;
  },
  { deep: true },
);

// Échap ferme la fenêtre.
function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && maya.bubbleOpen) maya.closeBubble();
}
onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.maya-bubble-root {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: var(--z-fab, 60);
}
@media (max-width: 639px) {
  /* Au-dessus de la BottomNav (58px + safe-area). */
  .maya-bubble-root {
    right: 16px;
    bottom: calc(58px + env(safe-area-inset-bottom, 0px) + 14px);
  }
  /* Le lanceur flottant FERMÉ (et son infobulle) est remplacé sur mobile par la
     bulle centrale de la BottomNav (speed-dial « Parler à Maya · Créer ») → on le
     masque. Le panneau OUVERT (`.maya-shell.is-open`), lui, reste affiché. */
  .maya-shell.maya-launch,
  .maya-bubble-tip {
    display: none;
  }
}
.maya-bubble-tip {
  position: absolute;
  right: 68px;
  bottom: 16px;
  white-space: nowrap;
  background: var(--surface-card, #fff);
  border: 1px solid var(--border-default);
  border-radius: 12px 12px 4px 12px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  box-shadow: var(--shadow-md);
}

/* la coquille qui se morphe */
.maya-shell {
  position: absolute;
  right: 0;
  bottom: 0;
  overflow: hidden;
  transition:
    width 0.5s cubic-bezier(0.32, 1.02, 0.38, 1),
    height 0.54s cubic-bezier(0.32, 1.02, 0.38, 1),
    border-radius 0.5s ease,
    box-shadow 0.5s ease,
    background 0.4s ease;
}

.maya-head {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 62px;
  overflow: hidden;
  background: #111112;
  transition: background 0.45s ease;
}
.maya-head.is-open {
  background: linear-gradient(135deg, #2c2218, #1a1a1c);
}
.maya-head-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(130% 120% at 20% -20%, rgba(245, 166, 35, 0.42), transparent 60%);
  transition: opacity 0.5s ease 0.1s;
}
.maya-head-orb {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  left: -14px;
  top: -50px;
  background: radial-gradient(circle, rgba(245, 166, 35, 0.5), transparent 70%);
  filter: blur(6px);
  animation: maya-float 6.5s ease-in-out infinite;
  transition: opacity 0.5s ease 0.1s;
}
.maya-head-mark {
  position: absolute;
  transition:
    top 0.5s cubic-bezier(0.32, 1.02, 0.38, 1),
    left 0.5s cubic-bezier(0.32, 1.02, 0.38, 1);
}
.maya-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 99px;
  background: var(--status-bad, #b54545);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
  border: 2px solid #111112;
}
.maya-head-body {
  position: absolute;
  top: 0;
  left: 60px;
  right: 10px;
  height: 62px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.25s 0.2s;
}
.maya-head-title {
  flex: 1;
  min-width: 0;
}
.maya-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 15px;
  color: #fff;
}
.maya-status {
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.62);
  display: flex;
  align-items: center;
  gap: 5px;
}
.maya-dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  flex-shrink: 0;
}
.maya-head-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
}
.maya-head-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}
.maya-head-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.maya-body {
  position: absolute;
  top: 62px;
  left: 0;
  right: 0;
  bottom: 74px;
  overflow: auto;
  padding: 16px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: opacity 0.3s 0.22s;
}
.maya-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  padding: 14px 6px 4px;
}
.maya-empty-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.maya-empty-sub {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
  max-width: 30ch;
}
.maya-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 7px;
  margin-top: 6px;
}
.maya-chip {
  border-radius: 999px;
  border: 1px solid var(--border-default);
  background: #fff;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.maya-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(28, 28, 30, 0.08);
}
.maya-typing {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-tertiary);
}
.maya-typing span {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: var(--honey);
  animation: maya-glow-pulse 1.2s ease-in-out infinite;
}
.maya-typing span:nth-child(2) {
  animation-delay: 0.15s;
}
.maya-typing span:nth-child(3) {
  animation-delay: 0.3s;
}
.maya-erreur {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  color: var(--honey-deep);
  background: var(--honey-soft);
  border-radius: 12px;
  padding: 10px 12px;
}

.maya-sans-voix {
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-secondary);
  background: var(--surface-2, rgba(0, 0, 0, 0.04));
  border-radius: 10px;
  padding: 8px 10px;
}

.maya-foot {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px 12px;
  transition: opacity 0.3s 0.24s;
}
.maya-input-row {
  display: flex;
  align-items: center;
  gap: 9px;
  background: #fff;
  border: 1.5px solid var(--border-strong);
  border-radius: 14px;
  padding: 7px 8px 7px 14px;
  box-shadow: 0 4px 14px rgba(120, 100, 80, 0.06);
}
.maya-input-row input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-primary);
  font-family: inherit;
}
.maya-send {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 9px;
  border: none;
  background: linear-gradient(135deg, #f5a623, #e6982c);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: opacity 0.15s ease;
}
.maya-send:disabled {
  opacity: 0.45;
  cursor: default;
}
.maya-mic {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 9px;
  border: none;
  background: var(--honey-soft);
  color: var(--honey-deep);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}
.maya-mic:disabled {
  opacity: 0.45;
  cursor: default;
}
/* En écoute : la couleur signature + un halo qui bat, pour dire « je t'entends ». */
.maya-mic.is-live {
  background: linear-gradient(135deg, #f5a623, #e6982c);
  color: #fff;
  animation: maya-mic-pulse 1.4s ease-in-out infinite;
}
@keyframes maya-mic-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(245, 166, 35, 0.5);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(245, 166, 35, 0);
  }
}
/*
 * MODE VOCAL — un anneau permanent, même quand le micro se tait entre deux
 * tours. Sans lui, la boucle serait invisible dès que Maya parle ou réfléchit :
 * l'apiculteur croirait le mode terminé et se remettrait à taper, alors que sa
 * prochaine phrase partira toute seule. L'anneau dit « le contact est ouvert ».
 */
.maya-mic.is-vocal {
  outline: 2px solid var(--honey, #f5a623);
  outline-offset: 2px;
}
.maya-dictee-erreur {
  margin-top: 6px;
  text-align: center;
  font-size: 11px;
  color: var(--clay, #b87959);
}
.maya-dictee-detail {
  margin-top: 4px;
}
.maya-dictee-detail summary {
  cursor: pointer;
  font-size: 10.5px;
  text-decoration: underline dotted;
  text-underline-offset: 2px;
  color: var(--text-tertiary);
}
.maya-dictee-detail pre {
  margin-top: 4px;
  max-height: 120px;
  overflow: auto;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 10px;
  line-height: 1.5;
  background: var(--surface-muted);
  color: var(--text-secondary);
}
.maya-disclaimer {
  text-align: center;
  font-size: 10.5px;
  color: var(--text-tertiary);
  margin-top: 7px;
}

@media (prefers-reduced-motion: reduce) {
  .maya-shell,
  .maya-head-mark,
  .maya-head-orb,
  .maya-mic.is-live,
  .maya-mic.is-vocal {
    transition: none;
    animation: none;
  }
}
</style>
