<script setup lang="ts">
const props = defineProps<{
  current: number;
  max: number;
  label: string;
  compact?: boolean;
}>();

const percent = computed(() =>
  props.max === Infinity || props.max === 0 ? 0 : Math.round((props.current / props.max) * 100),
);

const barColor = computed(() => {
  if (props.max === Infinity) return 'bg-green-500';
  if (percent.value >= 100) return 'bg-red-500';
  if (percent.value >= 80) return 'bg-amber-500';
  return 'bg-green-500';
});

const textColor = computed(() => {
  if (percent.value >= 100) return 'text-red-600 font-semibold';
  return '';
});

const display = computed(() =>
  props.max === Infinity ? `${props.current}` : `${props.current}/${props.max}`,
);
</script>

<template>
  <div v-if="max !== Infinity" :class="compact ? 'flex items-center gap-2' : ''">
    <div v-if="!compact" class="flex justify-between text-xs text-stone-500 mb-1">
      <span>{{ label }}</span>
      <span :class="textColor">{{ display }}</span>
    </div>
    <div
      class="h-1.5 bg-stone-700 rounded-full overflow-hidden"
      :class="compact ? 'w-16' : 'w-full'"
    >
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="barColor"
        :style="{ width: `${Math.min(percent, 100)}%` }"
      />
    </div>
    <span v-if="compact" class="text-xs text-stone-400">{{ display }}</span>
  </div>
</template>
