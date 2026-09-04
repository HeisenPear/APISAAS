<script setup lang="ts">
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UN REFUS DE MAYA, AVEC SA PORTE DE SORTIE — le même des deux côtés.
 *
 * ⚠️ CE COMPOSANT NAÎT D'UNE PORTE QUI N'EXISTAIT QUE D'UN CÔTÉ.
 *
 * `POST /api/ia/copilote` est gaté sur `copiloteIa`, faux en Découverte. Le
 * serveur répond alors 402 avec le code `PLAN_REQUIRED` et une phrase qui
 * nomme la formule — mais pas l'endroit où l'on change.
 *
 * La PAGE `/copilote` compensait : un titre lisible, la phrase, et un bouton
 * « Voir les plans ». La BULLE — montée sur toutes les pages, et la surface
 * principale de Maya — n'affichait qu'un cadenas et la phrase nue. Pas un
 * lien, pas un bouton. L'apiculteur en Découverte ouvrait la bulle, cliquait
 * l'une des trois amorces qu'elle lui tend, voyait sa question DISPARAÎTRE du
 * fil, et restait devant un encart miel sans rien de cliquable.
 *
 * C'est exactement ce que la règle du dépôt interdit : « ne jamais bloquer
 * sans porte de sortie ». Et le défaut n'est pas d'avoir oublié le bouton :
 * c'est que le refus était RENDU À DEUX ENDROITS. Deux rendus d'une même
 * règle finissent toujours par diverger — et c'est la divergence, pas la
 * règle, qui laisse l'apiculteur devant un mur.
 *
 * Il vit donc ici, une fois, et les deux surfaces l'appellent.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { computed } from 'vue';

const props = defineProps<{
  /** Le refus tel que la route l'a rendu (`code` + `message`). */
  erreur: { code?: string; message?: string };
  /**
   * `compacte` pour la bulle flottante (392 px de large), `pleine` pour la
   * page. Change la mise en page, JAMAIS la présence de la porte de sortie.
   */
  variante?: 'compacte' | 'pleine';
}>();

/**
 * Les codes qui désignent un mur de FORMULE — les seuls pour lesquels « voir
 * les plans » est une réponse. Une panne réseau n'a rien à faire ici : y
 * envoyer l'apiculteur lui ferait payer un abonnement pour rien.
 */
const CODES_DE_PLAN = new Set(['PLAN_REQUIRED', 'QUOTA_IA_ATTEINT', 'LIMIT_REACHED']);

const estMurDePlan = computed(() =>
  Boolean(props.erreur.code && CODES_DE_PLAN.has(props.erreur.code)),
);

/**
 * ⚠️ LE CADENAS EST LE VOCABULAIRE DU VERROU DE FORMULE, et il s'affichait sur
 * TOUT — y compris sur une coupure réseau.
 *
 * En transhumance, réseau faible : l'apiculteur demande « quelles ruches
 * visiter ? », le `fetch` échoue, et il voit un encart doré barré d'un cadenas
 * au-dessus de « Connexion interrompue ». Le pictogramme dit « c'est
 * verrouillé, il faut payer », le texte dit « c'est le réseau ». Sur un compte
 * Découverte — qui vient justement de heurter un vrai refus de plan présenté
 * avec le MÊME encart — les deux situations deviennent indiscernables.
 *
 * L'icône et la palette suivent donc le CODE, comme le fait déjà le titre.
 */
const CODES_RESEAU = /connexion|réseau|reseau/i;

const nature = computed<'plan' | 'reseau' | 'panne'>(() => {
  if (estMurDePlan.value) return 'plan';
  // Sans code, on lit la phrase : `useCopilote` pose « Connexion interrompue »
  // sans jamais poser de code. Le repli est prudent — « panne », pas « plan ».
  if (!props.erreur.code && CODES_RESEAU.test(props.erreur.message ?? '')) return 'reseau';
  return 'panne';
});

const icone = computed(() => {
  switch (nature.value) {
    case 'plan':
      return 'i-lucide-lock';
    case 'reseau':
      return 'i-lucide-wifi-off';
    default:
      return 'i-lucide-alert-triangle';
  }
});

const titre = computed(() => {
  switch (props.erreur.code) {
    case 'QUOTA_IA_ATTEINT':
      return 'Quota mensuel atteint';
    case 'PLAN_REQUIRED':
      return 'Fonctionnalité du plan supérieur';
    case 'LIMIT_REACHED':
      return 'Plafond de la formule atteint';
    default:
      return nature.value === 'reseau' ? 'Connexion perdue' : 'Copilote indisponible';
  }
});

/**
 * ⚠️ UN REFUS SANS PHRASE EST INTERDIT ICI, et le type le rendait possible :
 * `message` est OPTIONNEL dans `ErreurApi`. Un 402 mal formé, un proxy qui
 * mange le corps, et la bulle n'affichait qu'un cadenas — un mur muet, la
 * pire forme du refus que ce dépôt proscrit. On a toujours une phrase, et
 * elle nomme quand même où aller.
 */
const phrase = computed(
  () =>
    props.erreur.message?.trim() ||
    'Je ne peux pas répondre avec ta formule actuelle. Ouvre Réglages › Abonnement pour voir ce que chaque formule ouvre.',
);

const compacte = computed(() => props.variante === 'compacte');
</script>

<template>
  <div class="refus" :class="[`refus--${nature}`, { 'refus--compacte': compacte }]">
    <UIcon :name="icone" class="refus-icone" />
    <div class="refus-corps">
      <p class="refus-titre">{{ titre }}</p>
      <p class="refus-phrase">{{ phrase }}</p>
      <!--
        ⚠️ LA PORTE DE SORTIE. Elle est DANS ce composant, pas chez l'appelant :
        une porte qu'on peut oublier de brancher finit par manquer là où on
        regarde le moins — ici, la bulle, qui est pourtant la surface la plus
        vue du produit.
      -->
      <UButton
        v-if="estMurDePlan"
        to="/tarifs"
        size="xs"
        color="primary"
        class="refus-issue"
        @click.stop
      >
        Voir les plans
      </UButton>
    </div>
  </div>
</template>

<style scoped>
/*
 * La bulle est en CSS scopé de bout en bout, la page en Tailwind. On suit le
 * style du fichier qu'on écrit — et comme ce composant sert les deux, il porte
 * son propre style plutôt que d'hériter d'un des deux mondes.
 */
.refus {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: 12px;
  padding: 12px 14px;
}

/* Le miel est réservé au verrou de FORMULE — c'est ce qu'il signifie partout
   ailleurs dans l'application (FeatureGate, la jauge d'abonnement). */
.refus--plan {
  background: var(--honey-soft);
  color: var(--honey-deep);
}

/* Une panne n'est pas un mur : ton neutre, aucune couleur d'abonnement. */
.refus--reseau,
.refus--panne {
  background: var(--surface-2, rgba(0, 0, 0, 0.05));
  color: var(--text-secondary);
}

.refus--compacte {
  gap: 8px;
  padding: 10px 12px;
}

.refus-icone {
  height: 16px;
  width: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.refus-corps {
  /* Une piste 1fr ne descend jamais sous la largeur intrinsèque de son
     contenu : sans `min-width: 0`, une phrase longue pousse le bouton dehors. */
  min-width: 0;
  flex: 1;
}

.refus-titre {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.refus--compacte .refus-titre {
  font-size: 12.5px;
}

.refus-phrase {
  font-size: 12.5px;
  color: var(--text-secondary);
}

.refus-issue {
  margin-top: 8px;
}
</style>
