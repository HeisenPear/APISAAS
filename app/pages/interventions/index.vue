<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Interventions" description="Toutes vos actions sur les ruches">
      <template #actions>
        <UButton
          label="Nouvelle intervention"
          icon="i-lucide-plus"
          color="primary"
          to="/interventions/nouvelle"
        />
      </template>
    </UiPageHeader>

    <!-- Filters -->
    <div class="mt-5 flex flex-wrap items-center gap-3">
      <UInput v-model="search" icon="i-lucide-search" placeholder="Rechercher..." class="w-64" />

      <select
        v-model="filterRucher"
        class="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option value="">Tous les ruchers</option>
        <option v-for="r in allRuchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
      </select>

      <select
        v-model="filterType"
        class="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option value="">Tous les types</option>
        <option v-for="meta in allTypes" :key="meta.type" :value="meta.type">
          {{ meta.label }}
        </option>
      </select>

      <UButton
        v-if="hasFilters"
        label="Reinitialiser"
        variant="ghost"
        color="neutral"
        size="sm"
        icon="i-lucide-x"
        @click="resetFilters"
      />
    </div>

    <!-- Stats -->
    <div class="mt-4 flex items-center gap-4 text-sm text-stone-500">
      <span>{{ totalItems }} intervention{{ totalItems > 1 ? 's' : '' }}</span>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="mt-6">
      <UiLoadingSkeleton variant="card" :count="6" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="interventions.length === 0 && !hasFilters"
      icon="i-lucide-activity"
      title="Aucune intervention"
      description="Enregistrez votre premiere intervention pour suivre vos ruches"
      action-label="Nouvelle intervention"
      @action="navigateTo('/interventions/nouvelle')"
    />

    <!-- No results -->
    <div
      v-else-if="interventions.length === 0 && hasFilters"
      class="mt-8 text-center text-sm text-stone-400"
    >
      Aucune intervention ne correspond aux filtres
    </div>

    <!-- Timeline grouped by month -->
    <div v-else class="mt-6 space-y-8">
      <div v-for="group in groupedByMonth" :key="group.month">
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
          {{ group.month }}
        </h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InterventionsInterventionCard
            v-for="item in group.items"
            :key="item.id"
            :intervention="item"
          />
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex justify-center">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          size="sm"
          :disabled="currentPage <= 1"
          @click="currentPage--"
        />
        <span class="text-sm text-stone-500">Page {{ currentPage }} / {{ totalPages }}</span>
        <UButton
          icon="i-lucide-chevron-right"
          variant="ghost"
          color="neutral"
          size="sm"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiListResponse } from '~/types/api';
import type { InterventionWithContext } from '~/types/interventions';
import { INTERVENTION_META } from '~/types/interventions';

definePageMeta({ layout: 'default' });

const { ruchers: allRuchers } = useRuchers();
const allTypes = [
  ...Object.values(INTERVENTION_META),
  { type: 'visite_printemps', label: 'Visite de printemps' },
  { type: 'traitement', label: 'Traitement' },
  { type: 'hivernage', label: 'Mise en hivernage' },
];

const search = ref('');
const filterRucher = ref('');
const filterType = ref('');
const currentPage = ref(1);

const hasFilters = computed(
  () => search.value !== '' || filterRucher.value !== '' || filterType.value !== '',
);

function resetFilters() {
  search.value = '';
  filterRucher.value = '';
  filterType.value = '';
  currentPage.value = 1;
}

watch([search, filterRucher, filterType], () => {
  currentPage.value = 1;
});

const queryParams = computed(() => {
  const params: Record<string, string | number> = {
    page: currentPage.value,
    limit: 18,
  };
  if (search.value) params.search = search.value;
  if (filterRucher.value) params.rucherId = filterRucher.value;
  if (filterType.value) params.type = filterType.value;
  return params;
});

const {
  data: interventionsData,
  pending,
  refresh,
} = useFetch<ApiListResponse<InterventionWithContext>>('/api/interventions', {
  key: 'interventions-page-list',
  query: queryParams,
  lazy: true,
  dedupe: 'defer',
  watch: [queryParams],
});

onMounted(() => {
  refresh();
});

const interventions = computed(() => interventionsData.value?.data ?? []);
const totalItems = computed(() => interventionsData.value?.pagination?.total ?? 0);
const totalPages = computed(() => interventionsData.value?.pagination?.totalPages ?? 1);

const groupedByMonth = computed(() => {
  const groups = new Map<string, InterventionWithContext[]>();
  for (const item of interventions.value) {
    const date = new Date(item.dateVisite);
    const monthKey = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (!groups.has(monthKey)) groups.set(monthKey, []);
    groups.get(monthKey)!.push(item);
  }
  return [...groups.entries()].map(([month, items]) => ({ month, items }));
});
</script>
