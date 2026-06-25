<script setup lang="ts">
import { periodeLabel, indicePaysage, type Floraison } from '~/utils/floraisons';

const props = defineProps<{ floraison: Floraison }>();
const indice = computed(() => indicePaysage(props.floraison));
const periode = computed(() => periodeLabel(props.floraison));
const potentiel = computed(() => {
  const v = Number(props.floraison.potentielProductionKgRuche ?? 0);
  return v > 0 ? Math.round(v) : null;
});
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-[12px] border border-[var(--border-default)] bg-white p-3"
  >
    <span class="text-[22px] leading-none">{{ floraison.emoji ?? '🌼' }}</span>
    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between gap-2">
        <p class="truncate text-[14px] font-semibold text-[var(--text-primary)]">
          {{ floraison.nom }}
        </p>
        <span
          v-if="potentiel"
          class="shrink-0 text-[12px] font-semibold"
          style="color: var(--honey-deep)"
          >~{{ potentiel }} kg/ruche</span
        >
      </div>
      <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
        <span
          class="rounded-full px-2 py-0.5 font-medium"
          style="background: var(--surface-muted); color: var(--text-secondary)"
          >{{ periode }}</span
        >
        <span v-if="indice" class="text-[var(--text-tertiary)]">· {{ indice }}</span>
      </div>
    </div>
  </div>
</template>
