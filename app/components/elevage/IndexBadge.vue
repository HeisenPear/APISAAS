<script setup lang="ts">
import { indexTier } from '~/utils/selectionReines';

const props = withDefaults(
  defineProps<{
    index: number | null | undefined;
    completeness?: number;
    size?: 'sm' | 'md';
  }>(),
  { size: 'md', completeness: undefined },
);

const tier = computed(() => indexTier(props.index ?? null));
</script>

<template>
  <span
    v-if="index !== null && index !== undefined && tier"
    class="inline-flex items-center gap-1.5"
  >
    <span
      class="font-semibold tabular-nums"
      :class="size === 'sm' ? 'text-[13px]' : 'text-[15px]'"
      :style="{ color: tier.color }"
    >
      {{ Math.round(index) }}
    </span>
    <span
      class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
      :style="{
        color: tier.color,
        background: `color-mix(in srgb, ${tier.color} 12%, transparent)`,
      }"
    >
      {{ tier.label }}
    </span>
    <UTooltip
      v-if="completeness !== undefined && completeness < 1"
      text="Part du modèle couverte par les traits renseignés"
    >
      <span class="cursor-help text-[10px] text-[var(--text-tertiary)]">
        · {{ Math.round(completeness * 100) }}%
      </span>
    </UTooltip>
  </span>
  <span v-else class="text-xs text-[var(--text-tertiary)]">—</span>
</template>
