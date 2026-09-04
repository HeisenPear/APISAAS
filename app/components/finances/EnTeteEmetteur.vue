<script setup lang="ts">
import { identiteEmetteur, type ProfilEmetteurDoc } from '~/config/identite-emetteur';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * QUI SIGNE LE DOCUMENT — UN SEUL BLOC, POUR TOUS LES DOCUMENTS.
 *
 * ⚠️ CE COMPOSANT EXISTE PARCE QUE LE BON DE LIVRAISON SORTAIT ANONYME.
 *
 * La facture portait cet en-tête depuis le chantier « nom et logo » : logo de
 * l'exploitation, nom commercial en grand, mention légale quand elle diffère,
 * adresse, SIRET, SIREN, NAPI. Le bon de livraison — celui qui part
 * PHYSIQUEMENT avec la marchandise, celui que le client a en main en même
 * temps que les pots — n'affichait RIEN : sa route ne joignait même pas
 * `profils`.
 *
 * Recopier soixante lignes de gabarit était la solution évidente, et c'est
 * exactement la faute que ce dépôt paie le plus cher : « deux portes vers le
 * même document doivent appeler la même fonction ». Un logo ajouté d'un côté,
 * une mention légale corrigée de l'autre, et les deux documents d'une même
 * vente cessent de se ressembler.
 *
 * ⚠️ LE REFUS EST VISIBLE À L'IMPRESSION, À DESSEIN. Les boutons refusent
 * d'imprimer une facture sans nom, mais un Ctrl+P ne passe par aucun bouton.
 * Plutôt qu'un en-tête muet qui ressemble à un document valide, le document
 * DIT ce qui lui manque.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const props = defineProps<{
  emetteur: ProfilEmetteurDoc | null | undefined;
  /**
   * Le logo est vendu en Pro et Expert. La porte de plan reste chez l'appelant :
   * c'est lui qui connaît le `useGating` de sa page, et une porte recopiée ici
   * deviendrait une seconde source de vérité sur le catalogue.
   */
  logoAutorise?: boolean;
}>();

const identite = computed(() => identiteEmetteur(props.emetteur));

/**
 * Une URL de logo cassée ne doit pas laisser un trou : on retombe sur
 * l'hexagone. Le drapeau ne se réarme pas — une image qui a échoué une fois
 * échouera au rendu suivant, et re-tenter ferait clignoter l'en-tête.
 */
const logoCasse = ref(false);
const logoAffiche = computed(() => {
  if (logoCasse.value) return null;
  if (props.logoAutorise === false) return null;
  return identite.value.logoUrl;
});
</script>

<template>
  <div class="max-w-[55%]">
    <div class="mb-1 flex items-center gap-2">
      <!--
        `crossorigin` est indispensable : html2canvas rend le PDF sur un
        canevas, et une image tierce sans en-tête CORS le « souille » — le PDF
        sortirait alors vide, sans la moindre erreur.
      -->
      <img
        v-if="logoAffiche"
        :src="logoAffiche"
        alt=""
        crossorigin="anonymous"
        class="h-8 w-8 rounded-lg object-contain"
        @error="logoCasse = true"
      />
      <div
        v-else
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 print:bg-amber-100"
      >
        <UIcon name="i-lucide-hexagon" class="h-5 w-5 text-honey-deep" />
      </div>
      <span v-if="identite.affichage" class="text-lg font-bold text-stone-900">
        {{ identite.affichage }}
      </span>
      <span v-else class="text-lg font-semibold italic text-[var(--clay-deep)]">
        Nom de l’émetteur non renseigné
      </span>
    </div>

    <!--
      La mention légale, quand le nom commercial la masque. L'apiculteur exerce
      en nom propre : son nom patronymique est une mention obligatoire, un nom
      commercial ne la remplace pas.
    -->
    <p v-if="identite.mentionLegaleNecessaire" class="text-sm text-stone-500">
      {{ identite.legal }}
    </p>

    <div class="mt-2 space-y-0.5 text-sm text-stone-500">
      <p v-if="emetteur?.adresse">{{ emetteur.adresse }}</p>
      <p v-if="emetteur?.codePostal || emetteur?.ville">
        {{ [emetteur.codePostal, emetteur.ville].filter(Boolean).join(' ') }}
      </p>
      <p v-if="emetteur?.telephone">Tel : {{ emetteur.telephone }}</p>
      <p v-if="emetteur?.email">{{ emetteur.email }}</p>
      <div class="mt-2 space-y-0.5 text-xs text-stone-400">
        <p v-if="emetteur?.siret">SIRET : {{ emetteur.siret }}</p>
        <p v-if="emetteur?.siret">SIREN : {{ emetteur.siret.slice(0, 9) }}</p>
        <p v-if="emetteur?.napi">N° NAPI : {{ emetteur.napi }}</p>
      </div>
    </div>
  </div>
</template>
