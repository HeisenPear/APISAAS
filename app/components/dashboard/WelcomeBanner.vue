<script setup lang="ts">
const authStore = useAuthStore();
const { dashboard } = useDashboard();

const daysSince = computed(() => {
  if (!authStore.profil?.createdAt) return 999;
  return Math.floor((Date.now() - new Date(authStore.profil.createdAt).getTime()) / 86_400_000);
});

const show = computed(() => daysSince.value <= 7);
const dismissed = ref(false);

const hasRucher = computed(() => (dashboard.value?.kpis.totalRuches ?? 0) > 0);
const hasRuches = computed(() => (dashboard.value?.kpis.totalRuches ?? 0) > 0);
const hasIntervention = computed(() => (dashboard.value?.activiteRecente.length ?? 0) > 0);

const steps = computed(() => [
  {
    label: 'Créer un rucher',
    done: hasRucher.value,
    to: '/ruchers/nouveau',
    icon: 'i-lucide-map-pin',
  },
  {
    label: 'Ajouter vos ruches',
    done: hasRuches.value,
    to: '/ruches/nouveau',
    icon: 'i-lucide-hexagon',
  },
  {
    label: 'Première intervention',
    done: hasIntervention.value,
    to: '/interventions/nouvelle',
    icon: 'i-lucide-clipboard-check',
  },
  {
    label: 'Explorer les analytics',
    done: false,
    to: '/analytics',
    icon: 'i-lucide-bar-chart-3',
  },
]);

const completedCount = computed(() => steps.value.filter((s) => s.done).length);
</script>

<template>
  <div v-if="show && !dismissed" class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
    <div class="mb-4 flex items-start justify-between">
      <div>
        <h3 class="text-base font-semibold text-stone-800">Bienvenue sur APIGO !</h3>
        <p class="mt-0.5 text-sm text-stone-500">
          {{ completedCount }}/{{ steps.length }} étapes complétées — démarrez en moins de 5 min
        </p>
      </div>
      <button
        class="rounded-lg p-1 text-stone-400 transition-colors hover:bg-amber-100 hover:text-stone-600"
        @click="dismissed = true"
      >
        <UIcon name="i-lucide-x" class="h-4 w-4" />
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <NuxtLink
        v-for="step in steps"
        :key="step.label"
        :to="step.to"
        class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-150"
        :class="
          step.done
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            : 'bg-white text-stone-600 shadow-sm hover:bg-amber-100 hover:text-stone-800'
        "
      >
        <UIcon
          :name="step.done ? 'i-lucide-check-circle' : step.icon"
          class="h-4 w-4 shrink-0"
          :class="step.done ? 'text-emerald-500' : 'text-amber-500'"
        />
        <span :class="step.done ? 'line-through opacity-60' : 'font-medium'">
          {{ step.label }}
        </span>
      </NuxtLink>
    </div>
  </div>
</template>
