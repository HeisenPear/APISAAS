<script setup lang="ts">
const props = defineProps<{
  current: number;
  /** null (ou Infinity) = illimité */
  max: number | null;
  label: string;
  compact?: boolean;
}>();

const unlimited = computed(() => props.max == null || props.max === Infinity);

const percent = computed(() =>
  unlimited.value || props.max === 0
    ? 0
    : Math.round((props.current / (props.max as number)) * 100),
);

const barColor = computed(() => {
  if (percent.value >= 100) return 'bg-red-500';
  if (percent.value >= 80) return 'bg-amber-500';
  return 'bg-amber-500';
});

const textColor = computed(() => (percent.value >= 100 ? 'text-red-600 font-semibold' : ''));

const display = computed(() =>
  unlimited.value ? `${props.current}` : `${props.current}/${props.max}`,
);
</script>

<template>
  <div :class="compact ? 'flex items-center gap-2' : ''">
    <div v-if="!compact" class="mb-1 flex justify-between text-xs text-stone-500">
      <span>{{ label }}</span>
      <span :class="unlimited ? 'text-stone-400' : textColor">
        {{ display }}<template v-if="unlimited"> · illimité</template>
      </span>
    </div>

    <!-- Barre de progression : uniquement pour les plans à limite finie -->
    <div
      v-if="!unlimited"
      class="h-1.5 overflow-hidden rounded-full bg-stone-700"
      :class="compact ? 'w-16' : 'w-full'"
    >
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="barColor"
        :style="{ width: `${Math.min(percent, 100)}%` }"
      />
    </div>

    <span v-if="compact" class="text-xs text-stone-400">
      {{ display }}<template v-if="unlimited"> · ∞</template>
    </span>
  </div>
</template>
