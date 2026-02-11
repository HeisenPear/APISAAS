<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Inspections" description="Historique de toutes vos visites au rucher">
      <template #actions>
        <div class="flex items-center gap-2">
          <UButton
            label="Mode terrain"
            icon="i-lucide-smartphone"
            variant="outline"
            color="neutral"
            to="/inspections/nouvelle?mode=terrain"
          />
          <UButton
            label="Nouvelle inspection"
            icon="i-lucide-plus"
            color="primary"
            to="/inspections/nouvelle"
          />
        </div>
      </template>
    </UiPageHeader>

    <!-- Filters -->
    <div class="mt-5 flex flex-wrap items-center gap-3">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Rechercher dans les notes..."
        class="w-64"
      />

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
        <option value="visite_printemps">Visite de printemps</option>
        <option value="controle">Controle</option>
        <option value="traitement">Traitement</option>
        <option value="recolte">Recolte</option>
        <option value="hivernage">Hivernage</option>
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
      <span>{{ totalInspections }} inspection{{ totalInspections > 1 ? 's' : '' }}</span>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="mt-6">
      <UiLoadingSkeleton variant="card" :count="6" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="inspections.length === 0 && !hasFilters"
      icon="i-lucide-clipboard-check"
      title="Aucune inspection"
      description="Enregistrez votre premiere visite pour suivre l'evolution de vos colonies"
      action-label="Nouvelle inspection"
      @action="navigateTo('/inspections/nouvelle')"
    />

    <!-- No results -->
    <div
      v-else-if="inspections.length === 0 && hasFilters"
      class="mt-8 text-center text-sm text-stone-400"
    >
      Aucune inspection ne correspond aux filtres
    </div>

    <!-- Timeline grouped by month -->
    <div v-else class="mt-6 space-y-8">
      <div v-for="group in groupedByMonth" :key="group.month">
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
          {{ group.month }}
        </h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InspectionsInspectionCard
            v-for="insp in group.items"
            :key="insp.id"
            :inspection="insp"
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
        <span class="text-sm text-stone-500"> Page {{ currentPage }} / {{ totalPages }} </span>
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
import type { InspectionWithContext } from '~/composables/useInspections';

definePageMeta({ layout: 'default' });

const { ruchers: allRuchers } = useRuchers();

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

const { data: inspectionsData, pending } = useFetch<ApiListResponse<InspectionWithContext>>(
  '/api/inspections',
  {
    query: queryParams,
    lazy: true,
    watch: [queryParams],
  },
);

const inspections = computed(() => inspectionsData.value?.data ?? []);
const totalInspections = computed(() => inspectionsData.value?.pagination?.total ?? 0);
const totalPages = computed(() => inspectionsData.value?.pagination?.totalPages ?? 1);

// Group inspections by month
const groupedByMonth = computed(() => {
  const groups = new Map<string, InspectionWithContext[]>();

  for (const insp of inspections.value) {
    const date = new Date(insp.dateVisite);
    const monthKey = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (!groups.has(monthKey)) groups.set(monthKey, []);
    groups.get(monthKey)!.push(insp);
  }

  return [...groups.entries()].map(([month, items]) => ({ month, items }));
});
</script>
