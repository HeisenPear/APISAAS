<template>
  <div
    class="rounded-2xl border border-stone-200/60 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm"
  >
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold text-stone-900">Meteo</h3>
        <p class="truncate text-xs text-stone-500">{{ meteo?.rucherNom ?? 'Chargement...' }}</p>
      </div>
      <NuxtLink to="/meteo" class="text-xs text-amber-600 hover:text-amber-700">
        Voir tout →
      </NuxtLink>
    </div>

    <!-- Skeleton -->
    <div v-if="pending" class="mt-4 space-y-2">
      <div class="h-10 w-24 animate-pulse rounded-lg bg-sky-100" />
      <div class="h-4 w-32 animate-pulse rounded bg-sky-100" />
    </div>

    <!-- Pas de GPS -->
    <div v-else-if="error" class="mt-4 text-xs text-stone-400">
      Ajoutez les coordonnées GPS de votre rucher pour voir la météo.
    </div>

    <!-- Données réelles -->
    <template v-else-if="meteo">
      <div class="mt-4 flex items-end gap-4">
        <div class="flex items-start gap-1">
          <span class="text-3xl">{{ meteo.actuel.icon }}</span>
          <p class="text-4xl font-bold tabular-nums text-stone-900">
            {{ meteo.actuel.temperature }}°
          </p>
        </div>
        <div class="mb-1 space-y-0.5">
          <p class="text-sm text-stone-600">{{ meteo.actuel.label }}</p>
          <p class="text-xs text-stone-400">
            <UIcon name="i-lucide-wind" class="mr-0.5 inline h-3 w-3" />
            {{ meteo.actuel.vent }} km/h
          </p>
        </div>
      </div>

      <!-- Indicateur conditions visite -->
      <div
        class="mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
        :class="
          meteo.actuel.conditionsOptimales
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700'
        "
      >
        <UIcon
          :name="
            meteo.actuel.conditionsOptimales ? 'i-lucide-check-circle' : 'i-lucide-alert-circle'
          "
          class="h-3.5 w-3.5"
        />
        {{
          meteo.actuel.conditionsOptimales
            ? 'Bonnes conditions pour visiter'
            : 'Conditions defavorables'
        }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const { ruchers } = useRuchers();

// Premier rucher avec GPS
const rucherId = computed(() => {
  const r = ruchers.value?.find((r) => r.latitude != null && r.longitude != null);
  return r?.id ?? null;
});

const { meteo, pending, error } = useMeteo(rucherId);
</script>
