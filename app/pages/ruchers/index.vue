<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1
          class="text-[26px] font-semibold tracking-[-0.02em]"
          style="
            font-family:
              'SF Pro Display',
              -apple-system,
              system-ui,
              sans-serif;
          "
        >
          Ruchers
        </h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          {{ filteredRuchers.length }} emplacement{{
            filteredRuchers.length > 1 ? 's' : ''
          }}
          actif{{ filteredRuchers.length > 1 ? 's' : '' }}
        </p>
      </div>
      <UButton label="Nouveau rucher" icon="i-lucide-plus" color="primary" to="/ruchers/nouveau" />
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <!-- Filter buttons -->
      <div
        class="flex items-center gap-1 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-1"
      >
        <button
          v-for="seg in segments"
          :key="seg.value"
          type="button"
          class="rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150"
          :class="
            activeSegment === seg.value
              ? 'bg-white text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          "
          @click="activeSegment = seg.value"
        >
          {{ seg.label }}
          <span v-if="seg.count > 0" class="ml-1 text-[var(--text-tertiary)]">{{ seg.count }}</span>
        </button>
      </div>

      <!-- Right: search + view toggle -->
      <div class="flex items-center gap-2">
        <div class="relative">
          <UIcon
            name="i-lucide-search"
            class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <input
            v-model="search"
            type="text"
            placeholder="Rechercher…"
            class="h-8 w-40 rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] pl-8 pr-3 text-[12.5px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-all duration-200 focus:w-52 focus:bg-white focus:ring-1 focus:ring-[var(--honey)]"
          />
        </div>
        <div class="hidden lg:flex rounded-lg border border-[var(--border-default)] bg-white p-0.5">
          <button
            type="button"
            class="rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
            :class="
              viewMode === 'grid'
                ? 'bg-[var(--text-primary)] text-white'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            "
            @click="viewMode = 'grid'"
          >
            <UIcon name="i-lucide-layout-grid" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
            :class="
              viewMode === 'map'
                ? 'bg-[var(--text-primary)] text-white'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            "
            @click="viewMode = 'map'"
          >
            <UIcon name="i-lucide-map" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending">
      <div class="grid grid-cols-1 gap-3">
        <div
          v-for="i in 4"
          :key="i"
          class="h-24 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
        />
      </div>
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="ruchers.length === 0"
      icon="i-lucide-map-pin"
      title="Aucun rucher"
      description="Commencez par créer votre premier rucher pour géopositionner vos ruches"
      benefit="Géopositionnez vos ruchers et suivez leur météo en direct"
      action-label="Créer un rucher"
      @action="navigateTo('/ruchers/nouveau')"
    />

    <!-- No results for search/filter -->
    <div
      v-else-if="filteredRuchers.length === 0"
      class="py-8 text-center text-[13px] text-[var(--text-tertiary)]"
    >
      Aucun rucher ne correspond aux filtres sélectionnés
    </div>

    <!-- Grid view -->
    <template v-else-if="viewMode === 'grid'">
      <TransitionGroup
        name="list"
        tag="div"
        class="mm-list lg:space-y-3"
        data-tutorial="ruchers-list"
      >
        <NuxtLink
          v-for="rucher in filteredRuchers"
          :key="rucher.id"
          :to="`/ruchers/${rucher.id}`"
          class="block lg:rounded-[14px] lg:border bg-white py-4 lg:p-5 transition-all duration-[var(--duration-fast)] lg:hover:shadow-[var(--shadow-md)]"
          :class="
            selectedRucherId === rucher.id
              ? 'lg:border-[var(--honey)] lg:shadow-[0_0_0_4px_var(--honey-soft)]'
              : 'lg:border-[var(--border-default)]'
          "
          @click.prevent="selectedRucherId = selectedRucherId === rucher.id ? null : rucher.id"
        >
          <div class="grid grid-cols-[1fr_auto] gap-4 items-center">
            <!-- Left side -->
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3
                  class="text-[15px] lg:text-[17px] font-semibold truncate"
                  style="
                    font-family:
                      'SF Pro Display',
                      -apple-system,
                      system-ui,
                      sans-serif;
                  "
                >
                  {{ rucher.nom }}
                </h3>
                <span
                  v-if="!rucher.actif"
                  class="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style="background: var(--surface-muted); color: var(--text-tertiary)"
                >
                  Inactif
                </span>
              </div>
              <p class="mt-0.5 text-[13px] text-[var(--text-secondary)] flex items-center gap-1.5">
                <UIcon
                  v-if="rucher.commune"
                  name="i-lucide-map-pin"
                  class="h-3 w-3 shrink-0 text-[var(--text-tertiary)]"
                />
                <span>{{
                  [rucher.commune, rucher.departement].filter(Boolean).join(', ') ||
                  'Emplacement non défini'
                }}</span>
              </p>
            </div>

            <!-- Right side: stats -->
            <div class="flex items-center gap-2">
              <span class="text-[13px] font-semibold text-[var(--text-primary)]">{{
                rucher.ruchesCount ?? 0
              }}</span>
              <span class="text-[12px] text-[var(--text-tertiary)]">ruches</span>
              <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-[#c7c2b9]" />
            </div>
          </div>
        </NuxtLink>
      </TransitionGroup>
    </template>

    <!-- Map view -->
    <div
      v-else
      class="relative h-[max(60dvh,400px)] overflow-hidden rounded-[14px] border border-[var(--border-default)] lg:h-[calc(100dvh-220px)]"
    >
      <LazyRuchersRucherMap
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
</script>
