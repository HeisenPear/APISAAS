<template>
  <ol class="space-y-3">
    <li v-for="(phase, i) in phases" :key="phase.id" class="flex items-start gap-3">
      <span
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
        >{{ i + 1 }}</span
      >
      <div>
        <p class="text-sm font-semibold text-[var(--text-primary)]">{{ phase.titre }}</p>
        <p class="text-xs text-[var(--text-secondary)]">{{ phase.corps }}</p>
      </div>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { phasesDuTheme } from '~/config/guides-contenu';

/**
 * LES PHASES D'UN THÈME, RENDUES DEPUIS LA SOURCE PARTAGÉE.
 *
 * ⚠️ CHAQUE `Guide*.vue` PORTAIT SON PROPRE `<ol>` EN DUR — cinquante-sept
 * explications au total, écrites dans des gabarits. Les visites guidées, elles,
 * en portaient vingt-trois autres, écrites séparément sur les mêmes sujets.
 * Deux textes pour la même chose, condamnés à diverger : corriger une phrase
 * n'en corrigeait qu'une moitié, et la visite guidée était bien plus pauvre que
 * la documentation d'à côté.
 *
 * La phrase vit désormais dans `app/config/guides-contenu.ts`. Ce composant la
 * rend ; `tutorials.ts` en dérive ses étapes. Écrite une fois, lue aux deux
 * endroits.
 */
const props = defineProps<{ theme: string }>();

const phases = computed(() => phasesDuTheme(props.theme));
</script>
