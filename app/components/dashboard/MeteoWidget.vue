<template>
  <UiExpandableCard
    title="Meteo"
    :subtitle="meteo?.rucherNom ?? 'Chargement...'"
    icon-container-class="bg-sky-50"
    icon-class="text-sky-600"
    :default-expanded="true"
  >
    <template #icon>
      <span v-if="meteo" class="text-lg">{{ meteo.actuel.icon }}</span>
      <UIcon v-else name="i-lucide-cloud-sun" class="h-[18px] w-[18px] text-sky-600" />
    </template>

    <template #header-right>
      <span v-if="meteo" class="text-xl font-bold tabular-nums text-stone-900">
        {{ meteo.actuel.temperature }}°
      </span>
    </template>

    <!-- Skeleton -->
    <div v-if="pending" class="space-y-3">
      <div class="h-6 w-32 animate-pulse rounded-lg bg-stone-100" />
      <div class="h-16 animate-pulse rounded-xl bg-stone-100" />
    </div>

    <!-- No GPS -->
    <div v-else-if="error" class="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3">
      <UIcon name="i-lucide-map-pin-off" class="h-5 w-5 shrink-0 text-stone-400" />
      <p class="text-sm text-stone-500">
        Ajoutez les coordonnees GPS d'un rucher pour voir la meteo.
      </p>
    </div>

    <!-- Real data -->
    <template v-else-if="meteo">
      <!-- Current conditions summary -->
      <div class="flex items-center gap-3">
        <div class="flex-1">
          <p class="text-sm font-medium text-stone-700">{{ meteo.actuel.label }}</p>
          <div class="mt-1 flex items-center gap-3 text-xs text-stone-500">
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-wind" class="h-3 w-3" />
              {{ meteo.actuel.vent }} km/h
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-droplets" class="h-3 w-3" />
              {{ meteo.actuel.humidite }}%
            </span>
          </div>
        </div>
        <div
          class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
          :class="
            meteo.actuel.conditionsOptimales
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          "
        >
          <div
            class="h-1.5 w-1.5 rounded-full"
            :class="meteo.actuel.conditionsOptimales ? 'bg-emerald-500' : 'bg-amber-500'"
          />
          {{ meteo.actuel.conditionsOptimales ? 'Visite OK' : 'Defavorable' }}
        </div>
      </div>

      <!-- 3-day forecast strip -->
      <div v-if="forecast3.length" class="mt-4 flex gap-2">
        <div
          v-for="day in forecast3"
          :key="day.date"
          class="flex flex-1 flex-col items-center gap-1.5 rounded-xl bg-stone-50/80 px-2 py-3"
        >
          <span class="text-[11px] font-semibold uppercase tracking-wide text-stone-400">{{
            day.label
          }}</span>
          <span class="text-xl">{{ day.icon }}</span>
          <div class="flex items-baseline gap-0.5 tabular-nums">
            <span class="text-sm font-bold text-stone-800">{{ day.tempMax }}°</span>
            <span class="text-xs text-stone-400">{{ day.tempMin }}°</span>
          </div>
          <div
            class="h-1 w-4 rounded-full"
            :class="
              day.scoreVisite >= 70
                ? 'bg-emerald-400'
                : day.scoreVisite >= 40
                  ? 'bg-amber-400'
                  : 'bg-red-300'
            "
          />
        </div>
      </div>

      <!-- Weather alert -->
      <div
        v-if="meteo.alertes.length > 0"
        class="mt-3 flex items-center gap-2.5 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
      >
        <UIcon name="i-lucide-alert-triangle" class="h-4 w-4 shrink-0" />
        <span>{{ meteo.alertes[0] }}</span>
      </div>

      <!-- Link -->
      <NuxtLink
        to="/meteo"
        class="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-amber-600 transition-colors hover:text-amber-700"
      >
        Previsions detaillees
        <UIcon name="i-lucide-arrow-right" class="h-3 w-3" />
      </NuxtLink>
    </template>
  </UiExpandableCard>
</template>

<script setup lang="ts">
const { ruchers } = useRuchers();

const rucherId = computed(() => {
  const r = ruchers.value?.find((r) => r.latitude != null && r.longitude != null);
  return r?.id ?? null;
});

const { meteo, pending, error } = useMeteo(rucherId);

const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const forecast3 = computed(() => {
  if (!meteo.value?.previsions?.length) return [];
  return meteo.value.previsions.slice(0, 3).map((p, i) => {
    let label: string;
    if (i === 0) label = 'Auj.';
    else if (i === 1) label = 'Dem.';
    else label = dayNames[new Date(p.date).getDay()] ?? '';
    return {
      date: p.date,
      label,
      icon: p.icon,
      tempMax: Math.round(p.tempMax),
      tempMin: Math.round(p.tempMin),
      scoreVisite: p.scoreVisite,
    };
  });
});
</script>
