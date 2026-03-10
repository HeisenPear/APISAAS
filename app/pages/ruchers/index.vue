<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Ruchers">
      <template #actions>
        <!-- Search -->
        <div class="relative">
          <UIcon
            name="i-lucide-search"
            class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-300"
          />
          <input
            v-model="search"
            type="text"
            placeholder="Rechercher…"
            class="h-8 w-40 rounded-lg border-0 bg-stone-100/80 pl-8 pr-3 text-xs text-stone-700 placeholder-stone-400 outline-none transition-all duration-200 focus:w-56 focus:bg-white focus:ring-1 focus:ring-amber-400/50"
          />
        </div>

        <!-- View toggle -->
        <div class="flex rounded-lg border border-stone-200 bg-white p-0.5">
          <button
            type="button"
            class="rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
            :class="
              viewMode === 'grid'
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:text-stone-700'
            "
            @click="viewMode = 'grid'"
          >
            <UIcon name="i-lucide-layout-grid" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
            :class="
              viewMode === 'map' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-700'
            "
            @click="viewMode = 'map'"
          >
            <UIcon name="i-lucide-map" class="h-4 w-4" />
          </button>
        </div>

        <UButton
          label="Nouveau rucher"
          icon="i-lucide-plus"
          color="primary"
          to="/ruchers/nouveau"
        />
      </template>
    </UiPageHeader>

    <!-- KPI bar -->
    <div class="mb-1 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <UiKpiCard icon="i-lucide-map-pin" label="Ruchers" :value="globalStats?.totalRuchers ?? 0" />
      <UiKpiCard
        icon="i-lucide-box"
        label="Ruches actives"
        :value="globalStats?.ruchesActives ?? 0"
        :suffix="globalStats ? ` / ${globalStats.totalRuches}` : undefined"
      />
      <UiKpiCard
        icon="i-lucide-droplets"
        label="Production saison"
        :value="globalStats?.productionSaison ?? 0"
        suffix=" kg"
      />
      <UiKpiCard icon="i-lucide-heart-pulse" label="Score sante" :value="0" suffix="%" />
    </div>

    <!-- Toolbar: segmented filter + stats pills -->
    <div class="mb-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <!-- Segmented filter -->
      <div class="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
        <button
          v-for="seg in segments"
          :key="seg.value"
          type="button"
          class="rounded-md px-3.5 py-1.5 text-xs font-medium transition-all duration-150"
          :class="
            activeSegment === seg.value
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          "
          @click="activeSegment = seg.value"
        >
          {{ seg.label }}
          <span v-if="seg.count > 0" class="ml-1 text-stone-300">{{ seg.count }}</span>
        </button>
      </div>

      <!-- Stats pills -->
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
        >
          <UIcon name="i-lucide-map-pin" class="h-3 w-3 text-stone-400" />
          {{ filteredRuchers.length }} rucher{{ filteredRuchers.length > 1 ? 's' : '' }}
        </span>
        <span
          class="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
        >
          <UIcon name="i-lucide-box" class="h-3 w-3 text-stone-400" />
          {{ totalRuchesInList }} ruche{{ totalRuchesInList > 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="mt-6">
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
      <UiLoadingSkeleton variant="card" :count="6" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="ruchers.length === 0"
      icon="i-lucide-map-pin"
      title="Aucun rucher"
      description="Commencez par creer votre premier rucher pour geopositionner vos ruches"
      action-label="Creer un rucher"
      @action="navigateTo('/ruchers/nouveau')"
    />

    <!-- No results for search/filter -->
    <div v-else-if="filteredRuchers.length === 0" class="mt-8 text-center text-sm text-stone-400">
      Aucun rucher ne correspond aux filtres selectionnes
    </div>

    <!-- Grid view -->
    <TransitionGroup
      v-else-if="viewMode === 'grid'"
      name="list"
      tag="div"
      class="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      <RuchersRucherCard
        v-for="rucher in filteredRuchers"
        :key="rucher.id"
        :rucher="rucher"
        :ruches-count="(rucher as any).ruchesCount ?? 0"
      />
    </TransitionGroup>

    <!-- Map view -->
    <div
      v-else
      class="relative mt-2 h-[calc(100vh-220px)] overflow-hidden rounded-2xl border border-stone-200/60"
    >
      <RuchersRucherMap
        :ruchers="filteredRuchers"
        :selected-id="selectedRucherId"
        @select="selectedRucherId = $event"
      />
      <RuchersRucherPanel
        :rucher="selectedRucher"
        :open="!!selectedRucherId"
        @close="selectedRucherId = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RuchersGlobalStats } from '~/composables/useRuchers';

definePageMeta({ layout: 'default' });

const { ruchers, pending, refresh, fetchRuchersStats } = useRuchers();
const viewMode = ref<'grid' | 'map'>('grid');
const selectedRucherId = ref<string | null>(null);
const search = ref('');
const activeSegment = ref('tous');
const globalStats = ref<RuchersGlobalStats | null>(null);

// Fetch stats
onMounted(async () => {
  refresh();
  try {
    globalStats.value = await fetchRuchersStats();
  } catch {
    // Stats are non-critical
  }
});

const selectedRucher = computed(
  () => ruchers.value.find((r) => r.id === selectedRucherId.value) ?? null,
);

// Segment counts
const actifsCount = computed(() => ruchers.value.filter((r) => r.actif).length);
const inactifsCount = computed(() => ruchers.value.filter((r) => !r.actif).length);

const segments = computed(() => [
  { value: 'tous', label: 'Tous', count: ruchers.value.length },
  { value: 'actifs', label: 'Actifs', count: actifsCount.value },
  { value: 'inactifs', label: 'Inactifs', count: inactifsCount.value },
]);

// Filtered ruchers
const filteredRuchers = computed(() => {
  let result = ruchers.value;

  // Segment filter
  if (activeSegment.value === 'actifs') {
    result = result.filter((r) => r.actif);
  } else if (activeSegment.value === 'inactifs') {
    result = result.filter((r) => !r.actif);
  }

  // Search filter
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(
      (r) =>
        r.nom.toLowerCase().includes(q) ||
        r.commune?.toLowerCase().includes(q) ||
        r.departement?.toLowerCase().includes(q),
    );
  }

  return result;
});

// Total ruches in filtered list
const totalRuchesInList = computed(() =>
  filteredRuchers.value.reduce(
    (sum, r) => sum + ((r as { ruchesCount?: number }).ruchesCount ?? 0),
    0,
  ),
);
</script>
