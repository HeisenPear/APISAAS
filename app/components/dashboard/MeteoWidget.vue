<template>
  <div
    class="rounded-2xl border border-stone-200/60 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm"
  >
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold text-stone-900">Meteo</h3>
        <p class="text-xs text-stone-500">{{ rucherNom || 'Rucher principal' }}</p>
      </div>
      <UIcon name="i-lucide-cloud-sun" class="h-8 w-8 text-amber-400" />
    </div>

    <div class="mt-4 flex items-end gap-4">
      <p class="text-4xl font-bold tabular-nums text-stone-900">{{ temperature }}°</p>
      <div class="mb-1 space-y-0.5">
        <p class="text-sm text-stone-600">{{ ciel }}</p>
        <p class="text-xs text-stone-400">
          <UIcon name="i-lucide-wind" class="mr-0.5 inline h-3 w-3" />
          {{ vent }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    rucherNom?: string;
    temperature?: number;
    ciel?: string;
    vent?: string;
  }>(),
  {
    rucherNom: 'Mon rucher',
    temperature: 18,
    ciel: 'Partiellement nuageux',
    vent: '12 km/h',
  },
);
</script>
