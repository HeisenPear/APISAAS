<template>
  <p
    v-if="message"
    class="mt-2 rounded-[10px] border border-[var(--clay)] bg-[var(--clay-soft)] px-3 py-2 text-xs leading-snug text-[var(--clay-deep)]"
  >
    {{ message }}
  </p>
</template>

<script setup lang="ts">
import { messageDeSilence, silenceEnJours } from '~/utils/frelonFiabilite';

/**
 * ANNONCER LA DISPARITION AVANT QU'ELLE N'ARRIVE.
 *
 * Un signalement qui s'efface sans prévenir est une information perdue :
 * l'apiculteur qui croise ce nid chaque semaine n'a aucune raison de le
 * confirmer s'il ignore qu'il va partir. Le dernier mois, la fiche dit combien
 * de temps il reste ET le geste qui annule le compte à rebours — les boutons
 * de vote sont juste en dessous.
 *
 * ⚠️ EXTRAIT DE LA PAGE POUR POUVOIR ÊTRE MONTÉ. Tant que ces quelques lignes
 * vivaient au milieu des 785 de `/frelon`, avec sa carte Leaflet et ses
 * `useFetch`, aucun banc ne les exerçait : une revue a mesuré que remplacer le
 * calcul par `return null` laissait TOUT vert. C'est le piège nommé au §3 de
 * CLAUDE.md — « un composant se monte, et personne ne le faisait » — et il
 * couvrait ici la moitié « prévenir » du chantier.
 */
const props = defineProps<{
  /** Création, dernière observation, ou dernière confirmation — la plus récente. */
  dernierSigneDeVie?: string | null;
  /** Injectable pour les bancs ; l'instant courant sinon. */
  maintenant?: Date;
}>();

const message = computed(() => {
  if (!props.dernierSigneDeVie) return null;
  return messageDeSilence(silenceEnJours(props.dernierSigneDeVie, props.maintenant ?? new Date()));
});
</script>
