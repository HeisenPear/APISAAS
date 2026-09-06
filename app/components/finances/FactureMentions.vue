<template>
  <!-- Conditions de paiement — MENTIONS LÉGALES OBLIGATOIRES -->
  <div class="mt-8 space-y-3 border-t border-stone-200 pt-5">
    <h4 class="text-xs font-semibold uppercase tracking-wider text-stone-400">
      Conditions de règlement
    </h4>

    <div class="space-y-1.5 text-[11px] leading-relaxed text-stone-500">
      <!-- Délai + mode de paiement -->
      <p>
        <strong class="text-stone-600">Délai de paiement :</strong>
        {{
          echeanceFormatee
            ? `À réception, échéance le ${echeanceFormatee}`
            : 'Paiement comptant à réception de la facture'
        }}. <strong class="text-stone-600">Mode de règlement :</strong> {{ modePaiementLabel }}.
      </p>

      <!-- RIB (si activé dans les paramètres) -->
      <div
        v-if="afficheRib"
        class="mt-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 print:bg-gray-50"
      >
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          Coordonnées bancaires
        </p>
        <div class="grid grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-2">
          <p v-if="facturation.titulaire">
            <strong class="text-stone-600">Titulaire :</strong> {{ facturation.titulaire }}
          </p>
          <p v-if="facturation.banque">
            <strong class="text-stone-600">Banque :</strong> {{ facturation.banque }}
          </p>
          <p><strong class="text-stone-600">IBAN :</strong> {{ facturation.iban }}</p>
          <p v-if="facturation.bic">
            <strong class="text-stone-600">BIC :</strong> {{ facturation.bic }}
          </p>
        </div>
      </div>

      <!-- Escompte -->
      <p>
        <strong class="text-stone-600">Escompte :</strong>
        Pas d'escompte accordé en cas de paiement anticipé.
      </p>

      <!-- Pénalités de retard -->
      <p>
        <strong class="text-stone-600">Pénalités de retard :</strong>
        En cas de retard de paiement, des pénalités seront exigibles au taux annuel de
        {{ TAUX_PENALITES }} % (taux directeur BCE {{ TAUX_BCE }} % majoré de 10 points, art.
        L.441-10 du Code de commerce).
      </p>

      <!-- Indemnité forfaitaire -->
      <p>
        <strong class="text-stone-600">Indemnité de recouvrement :</strong>
        Tout retard de paiement entraînera l'exigibilité d'une indemnité forfaitaire pour frais de
        recouvrement de <strong>40 €</strong> (art. D.441-5 du Code de commerce). Une indemnisation
        complémentaire pourra être réclamée sur justificatifs.
      </p>

      <!-- ⚠️ TVA — DEUX MENTIONS CONTRADICTOIRES S'IMPRIMAIENT ENSEMBLE.
           Le `v-else` ci-dessous se rattachait au `v-if` des DÉBITS, son
           voisin immédiat, pas à celui de la franchise (un commentaire
           HTML n'interrompt pas la chaîne — vérifié en passant le motif au
           vrai `@vue/compiler-dom`, la lecture à l'œil ne tranche pas).

           Conséquence pour un apiculteur en franchise SANS option débits —
           le cas le plus courant du produit : la facture imprimait « TVA
           non applicable, art. 293 B » PUIS, juste dessous, « Taux
           applicable : … — Art. 278 et suivants », l'article qui FIXE les
           taux, sur un document qui venait de déclarer la TVA non
           applicable.

           Second défaut du même `v-else` : il rendait les débits et les
           taux EXCLUSIFS. Ce sont deux mentions indépendantes — l'une dit
           QUAND la taxe devient exigible, l'autre à QUEL taux — et un
           vendeur ayant opté pour les débits doit porter les deux. -->
      <template v-if="isFranchise">
        <p>
          <strong class="text-stone-600">TVA :</strong>
          TVA non applicable, article 293 B du Code général des impôts (franchise en base de TVA).
        </p>
      </template>
      <template v-else>
        <p>
          <strong class="text-stone-600">TVA :</strong>
          Taux applicable{{ tauxTvaList.length > 1 ? 's' : '' }} :
          <template v-for="(taux, i) in tauxTvaList" :key="taux">
            {{ taux }}%<template v-if="taux === 5.5"> (réduit)</template
            ><template v-else-if="taux === 10"> (intermédiaire)</template
            ><template v-else-if="taux === 20"> (normal)</template
            ><template v-if="i < tauxTvaList.length - 1">, </template>
          </template>
          — Art. 278 et suivants du CGI.
        </p>
        <!-- MENTION 4 : option pour le paiement de la taxe d'après les
             débits. Elle n'a de sens que si la TVA s'applique. -->
        <p v-if="optionTvaDebits" class="font-medium text-stone-600">
          Option pour le paiement de la taxe d'après les débits
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * LES MENTIONS OBLIGATOIRES D'UNE FACTURE — extraites pour être MESURABLES.
 *
 * ⚠️ CE COMPOSANT EXISTE PARCE QU'UN `v-else` S'ÉTAIT RATTACHÉ AU MAUVAIS
 * `v-if`. Le `v-else` des taux de TVA suivait le `v-if` des DÉBITS, son voisin
 * immédiat — un commentaire HTML n'interrompt pas la chaîne. Un apiculteur en
 * franchise SANS option débits, le cas le plus courant du produit, imprimait
 * donc DEUX mentions de TVA qui se contredisent :
 *
 *     « TVA non applicable, art. 293 B du CGI (franchise en base) »
 *     « TVA : Taux applicable : … — Art. 278 et suivants du CGI »
 *
 * la seconde invoquant l'article qui FIXE les taux, sur une pièce comptable qui
 * venait de déclarer la TVA non applicable.
 *
 * Tant que ces cent lignes vivaient au milieu d'une page de mille six cents,
 * aucun banc ne pouvait les exercer : il aurait fallu monter la page entière,
 * avec ses `useFetch`. Ici, quatre props suffisent — et le banc joue les quatre
 * combinaisons de (franchise × débits) au lieu de relire le gabarit.
 */
/**
 * Les coordonnées bancaires du vendeur, telles que ses réglages les portent.
 * Le type vit ici : c'est le seul composant qui les AFFICHE.
 */
export interface FacturationPrefs {
  iban?: string;
  bic?: string;
  banque?: string;
  titulaire?: string;
  modePaiement?: string;
  afficherRib?: boolean;
}

defineProps<{
  /**
   * Échéance DÉJÀ FORMATÉE par l'appelant, ou `null` (paiement comptant).
   * La mise en forme d'une date reste à la page : ce composant n'a pas à
   * connaître le fuseau ni la locale pour dire ce qu'il doit dire.
   */
  echeanceFormatee: string | null;
  modePaiementLabel: string;
  afficheRib: boolean;
  facturation: FacturationPrefs;
  /** Franchise en base (art. 293 B) — aucune TVA n'est facturée. */
  isFranchise: boolean;
  /** Option pour le paiement de la taxe d'après les débits (mention n°4). */
  optionTvaDebits: boolean;
  tauxTvaList: number[];
}>();

// Taux BCE en vigueur (1er semestre 2026) — art. L.441-10 Code de commerce
const TAUX_BCE = '2,15';
const TAUX_PENALITES = '12,15';
</script>
