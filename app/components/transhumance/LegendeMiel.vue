<script setup lang="ts">
import { COULEUR_MIEL } from '~/utils/zonesMelliferes';
import type { Floraison } from '~/utils/floraisons';

const props = defineProps<{ floraisons: Floraison[] }>();

const entries = computed(() =>
  Object.keys(COULEUR_MIEL).map((type) => ({
    type,
    couleur: COULEUR_MIEL[type]!,
    emoji: props.floraisons.find((f) => f.typeMiel === type)?.emoji ?? '',
  })),
);
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
    <span class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
      Miels
    </span>
    <span
      v-for="e in entries"
      :key="e.type"
      class="flex items-center gap-1.5 text-[12px] capitalize text-[var(--text-secondary)]"
    >
      <span class="h-3 w-3 shrink-0 rounded-[3px]" :style="{ background: e.couleur }" />
      {{ e.emoji }} {{ e.type }}
    </span>
  </div>
</template>
