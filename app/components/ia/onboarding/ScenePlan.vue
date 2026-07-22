<template>
  <div class="cine-plans">
    <button
      v-for="p in FORMULES"
      :key="p.value"
      class="cine-planc"
      :class="{ 'is-on': modele === p.value }"
      type="button"
      @click.stop="modele = p.value"
    >
      <span class="cine-planc-name">{{ p.nom }}</span>
      <span class="cine-planc-price">{{ p.prix }}</span>
      <span class="cine-planc-cap">{{ p.cap }}</span>
    </button>

    <!-- CGV : obligatoires dès qu'un paiement est engagé. Jamais pré-cochées. -->
    <label v-if="modele !== 'decouverte'" class="cine-hint">
      <input v-model="cgv" type="checkbox" />
      J’accepte les conditions générales de vente.
    </label>
  </div>
</template>

<script setup lang="ts">
import { PLAN_CONFIGS, type Plan } from '~/config/plans';

/**
 * Scène « formule » — LE point qui casse tout si on l'ignore.
 *
 * Choisir ici n'est pas un simple choix animé : sauf en Découverte, la
 * validation SORT de l'application vers Stripe et y revient. La reprise est
 * gérée par la page (`?checkout=success`), pas ici.
 *
 * Les plafonds de ruches viennent de `plans.ts`, JAMAIS codés en dur : la
 * maquette les écrivait à la main, ils auraient divergé au premier changement
 * de tarif.
 */
const modele = defineModel<'decouverte' | 'trial' | 'starter' | 'pro' | 'expert'>({
  required: true,
});
const cgv = defineModel<boolean>('cgv', { required: true });

function plafond(p: Plan): string {
  const n = PLAN_CONFIGS[p]?.limites?.ruches;
  if (n === undefined) return '';
  return n === Infinity ? 'ruches illimitées' : `jusqu’à ${n} ruche${n > 1 ? 's' : ''}`;
}

const FORMULES = [
  { value: 'decouverte' as const, nom: 'Découverte', prix: 'Gratuit', cap: plafond('decouverte') },
  { value: 'trial' as const, nom: 'Essai Pro', prix: '0 € aujourd’hui', cap: plafond('pro') },
  { value: 'starter' as const, nom: 'Starter', prix: '4,99 €/mois', cap: plafond('starter') },
  { value: 'pro' as const, nom: 'Pro', prix: '14,99 €/mois', cap: plafond('pro') },
  { value: 'expert' as const, nom: 'Expert', prix: '29,99 €/mois', cap: plafond('expert') },
];
</script>
