<template>
  <!-- Card variant -->
  <div v-if="variant === 'card'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div
      v-for="i in count"
      :key="i"
      class="animate-pulse rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm"
    >
      <div class="flex items-start justify-between">
        <div class="h-10 w-10 rounded-xl bg-stone-100" />
        <div class="h-5 w-14 rounded-full bg-stone-100" />
      </div>
      <div class="mt-4 space-y-2">
        <div class="h-7 w-24 rounded-lg bg-stone-100" />
        <div class="h-4 w-32 rounded-lg bg-stone-50" />
      </div>
    </div>
  </div>

  <!-- Row variant -->
  <div v-else-if="variant === 'row'" class="space-y-3">
    <div v-for="i in count" :key="i" class="flex animate-pulse items-center gap-4">
      <div class="h-10 w-10 shrink-0 rounded-xl bg-stone-100" />
      <div class="flex-1 space-y-2">
        <div class="h-4 w-3/4 rounded-lg bg-stone-100" />
        <div class="h-3 w-1/2 rounded-lg bg-stone-50" />
      </div>
      <div class="h-4 w-16 rounded-lg bg-stone-100" />
    </div>
  </div>

  <!-- Stat variant -->
  <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div
      v-for="i in count"
      :key="i"
      class="animate-pulse rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm"
    >
      <div class="h-10 w-10 rounded-xl bg-stone-100" />
      <div class="mt-3 space-y-2">
        <div class="h-7 w-20 rounded-lg bg-stone-100" />
        <div class="h-4 w-28 rounded-lg bg-stone-50" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number;
    variant?: 'card' | 'row' | 'stat';
  }>(),
  {
    count: 6,
    variant: 'card',
  },
);
</script>
