<template>
  <div class="flex items-center gap-0.5">
    <span
      v-for="i in max"
      :key="i"
      class="h-3 w-3 rounded-sm"
      :class="i <= value ? filledClass : 'bg-stone-200'"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ value: number; max?: number; color?: string }>(), {
  max: 5,
  color: 'amber',
});

const filledClass = computed(() => {
  const map: Record<string, string> = {
    amber: 'bg-amber-400',
    green: 'bg-amber-400',
    blue: 'bg-blue-400',
  };
  return map[props.color] ?? 'bg-amber-400';
});
</script>
