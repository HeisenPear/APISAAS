<!--
  WidgetPreview — aperçu d'un widget dans le tiroir « Ajouter ».

  On rend le VRAI composant (avec les vraies données) en miniature rognée. Mais un
  widget lourd (graphe ECharts, widget qui charge ses données) peut échouer dans ce
  contexte réduit : `onErrorCaptured` intercepte l'erreur pour qu'elle ne casse PAS
  tout le tiroir, et on retombe sur une carte icône + nom + description.
-->
<template>
  <div
    v-if="!erreur"
    class="pointer-events-none relative max-h-[148px] overflow-hidden"
    aria-hidden="true"
  >
    <component :is="composant" v-bind="widgetProps" />
    <div
      class="absolute inset-x-0 bottom-0 h-10"
      style="background: linear-gradient(to top, white, transparent)"
    />
  </div>

  <!-- Repli propre si le rendu du composant échoue (ou composant introuvable) -->
  <div v-else class="flex items-center gap-2.5 p-4">
    <div
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--honey-soft)]"
    >
      <UIcon :name="icon" class="h-4 w-4" style="color: var(--honey-deep)" />
    </div>
    <div class="min-w-0">
      <p class="truncate text-[13px] font-semibold" style="color: var(--text-primary)">
        {{ label }}
      </p>
      <p class="text-[11.5px] leading-snug" style="color: var(--text-tertiary)">
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

const props = defineProps<{
  composant?: Component;
  widgetProps: Record<string, unknown>;
  icon: string;
  label: string;
  description: string;
}>();

// Composant absent = repli direct ; sinon on tente le rendu et on capte l'erreur.
const erreur = ref(!props.composant);
onErrorCaptured(() => {
  erreur.value = true;
  return false; // stoppe la propagation → le tiroir reste intact
});
</script>
