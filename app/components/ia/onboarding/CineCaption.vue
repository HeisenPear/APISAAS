<template>
  <p class="cine-cap" :style="{ fontSize: `${size}px` }">
    <span v-for="(mot, i) in mots" :key="`${cle}-${i}`" class="cine-word" :style="delai(i)">
      {{ mot }}<span v-if="i < mots.length - 1">&nbsp;</span>
    </span>
  </p>
</template>

<script setup lang="ts">
/**
 * TYPO CINÉTIQUE — la phrase se révèle mot à mot, comme une voix qui parle.
 *
 * C'est ce qui donne à Maya l'impression de s'adresser à quelqu'un plutôt que
 * d'afficher un texte. Chaque mot entre avec un léger décalage.
 *
 * Le `key` inclut le texte : sans cela, Vue réutiliserait les mêmes nœuds d'une
 * scène à l'autre et l'animation ne rejouerait pas — la phrase suivante
 * apparaîtrait d'un bloc, sans la voix.
 *
 * Rythme repris de `design/maya/mockup/onboarding/` ; styles dans
 * `app/assets/css/maya-onboarding.css`.
 */
const props = withDefaults(defineProps<{ text: string; size?: number; pas?: number }>(), {
  size: 32,
  /** Décalage entre deux mots, en secondes. Au-delà de ~0,1 s ça traîne. */
  pas: 0.06,
});

const mots = computed(() => props.text.split(' ').filter(Boolean));

/** Change à chaque phrase → force le remontage, donc le rejeu de l'animation. */
const cle = computed(() => props.text);

function delai(i: number): Record<string, string> {
  return { animationDelay: `${(i * props.pas).toFixed(2)}s` };
}
</script>

<!--
  Le CSS du cinématique n'est PAS global : ~29 Ko qui ne servent qu'à
  l'onboarding n'ont rien à faire sur toutes les pages. Il est donc importé par
  les composants qui l'utilisent — Vite le dédoublonne si plusieurs l'importent.
-->
<style src="~/assets/css/maya-onboarding.css"></style>
