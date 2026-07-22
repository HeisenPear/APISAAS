<template>
  <div class="cine-presence">
    <button
      v-for="p in MODES"
      :key="p.value"
      class="cine-pres"
      :class="{ 'is-on': modele === p.value }"
      type="button"
      @click.stop="modele = p.value"
    >
      <UIcon :name="p.icone" class="cine-pres-ico" />
      <p class="cine-pres-t">{{ p.titre }}</p>
      <p class="cine-pres-d">{{ p.detail }}</p>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Scène « présence » — le SEUL vrai choix de personnalité de Maya.
 *
 * Défaut « partout » (décision produit du 22/07/2026), aligné sur
 * `app/stores/maya.ts`. Le mode choisi ici pilote immédiatement toute
 * l'application : cartes proactives, bulle, ou retrait total.
 */
const modele = defineModel<'partout' | 'discrete' | 'pause'>({ required: true });

const MODES = [
  {
    value: 'partout' as const,
    icone: 'i-lucide-sparkle',
    titre: 'Partout',
    detail: 'Je prends les devants : priorités du jour, alertes, conseils.',
  },
  {
    value: 'discrete' as const,
    icone: 'i-lucide-message-circle',
    titre: 'Discrète',
    detail: 'Je me tiens prête dans un coin. Tu m’appelles quand tu veux.',
  },
  {
    value: 'pause' as const,
    icone: 'i-lucide-moon',
    titre: 'En pause',
    detail: 'Je me fais oublier. Tu me réactives quand tu le sens.',
  },
];
</script>
