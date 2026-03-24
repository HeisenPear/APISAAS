<template>
  <span v-if="value === true">
    <UIcon
      name="i-lucide-check"
      class="mx-auto h-5 w-5"
      :class="highlight ? 'text-amber-500' : 'text-emerald-500'"
    />
  </span>
  <span v-else-if="value === false">
    <UIcon name="i-lucide-x" class="mx-auto h-5 w-5 text-stone-200" />
  </span>
  <span
    v-else
    class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="highlight ? 'bg-amber-100 text-amber-700 font-semibold' : 'bg-stone-100 text-stone-500'"
  >
    {{ value }}
  </span>
</template>

<script setup lang="ts">
defineProps<{
  value: boolean | string;
  highlight?: boolean;
}>();
</script>
