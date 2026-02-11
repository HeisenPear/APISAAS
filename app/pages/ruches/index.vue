<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Ruches" description="Gerez vos colonies et suivez leur evolution">
      <template #actions>
        <UButton label="Nouvelle ruche" icon="i-lucide-plus" color="primary" to="/ruches/nouveau" />
      </template>
    </UiPageHeader>

    <!-- Filters -->
    <div class="mt-5 flex flex-wrap items-center gap-3">
      <!-- Search -->
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Rechercher par numero..."
        class="w-64"
      />

      <!-- Rucher filter -->
      <select
        v-model="filterRucher"
        class="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option value="">Tous les ruchers</option>
        <option v-for="r in allRuchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
      </select>

      <!-- Statut filter -->
      <select
        v-model="filterStatut"
        class="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option value="">Tous les statuts</option>
        <option value="active">Active</option>
        <option value="faible">Faible</option>
        <option value="orpheline">Orpheline</option>
        <option value="essaimee">Essaimee</option>
        <option value="morte">Morte</option>
        <option value="vendue">Vendue</option>
        <option value="fusionnee">Fusionnee</option>
      </select>

      <!-- Reset -->
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

    <!-- Stats bar -->
    <div class="mt-4 flex items-center gap-4 text-sm text-stone-500">
      <span>{{ totalRuches }} ruche{{ totalRuches > 1 ? 's' : '' }}</span>
      <span v-if="activeCount > 0" class="flex items-center gap-1">
        <span class="h-2 w-2 rounded-full bg-emerald-500" />
        {{ activeCount }} active{{ activeCount > 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="mt-6">
      <UiLoadingSkeleton variant="card" :count="6" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="ruches.length === 0 && !hasFilters"
      icon="i-lucide-box"
      title="Aucune ruche"
      description="Ajoutez votre premiere ruche pour commencer le suivi de vos colonies"
      action-label="Ajouter une ruche"
      @action="navigateTo('/ruches/nouveau')"
    />

    <!-- No results for filters -->
    <div
      v-else-if="ruches.length === 0 && hasFilters"
      class="mt-8 text-center text-sm text-stone-400"
    >
      Aucune ruche ne correspond aux filtres selectionnes
    </div>

    <!-- Grid -->
    <div v-else class="animate-stagger mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <RuchesRucheCard v-for="ruche in ruches" :key="ruche.id" :ruche="ruche" />
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
import type { Ruche } from '~/types/models';
import type { ApiListResponse } from '~/types/api';

definePageMeta({ layout: 'default' });

const { ruchers: allRuchers } = useRuchers();

const search = ref('');
const filterRucher = ref('');
const filterStatut = ref('');
const currentPage = ref(1);

const hasFilters = computed(
  () => search.value !== '' || filterRucher.value !== '' || filterStatut.value !== '',
);

function resetFilters() {
  search.value = '';
  filterRucher.value = '';
  filterStatut.value = '';
  currentPage.value = 1;
}

// Reset page when filters change
watch([search, filterRucher, filterStatut], () => {
  currentPage.value = 1;
});

const queryParams = computed(() => {
  const params: Record<string, string | number> = {
    page: currentPage.value,
    limit: 18,
  };
  if (search.value) params.search = search.value;
  if (filterRucher.value) params.rucherId = filterRucher.value;
  if (filterStatut.value) params.statut = filterStatut.value;
  return params;
});

const { data: ruchesData, pending } = useFetch<ApiListResponse<Ruche & { rucherNom?: string }>>(
  '/api/ruches',
  {
    query: queryParams,
    lazy: true,
    watch: [queryParams],
  },
);

const ruches = computed(() => ruchesData.value?.data ?? []);
const totalRuches = computed(() => ruchesData.value?.pagination?.total ?? 0);
const totalPages = computed(() => ruchesData.value?.pagination?.totalPages ?? 1);

const activeCount = computed(() => ruches.value.filter((r) => r.statut === 'active').length);
</script>
