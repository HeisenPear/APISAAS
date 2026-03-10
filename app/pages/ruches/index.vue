<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Ruches">
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

        <UButton label="Nouvelle ruche" icon="i-lucide-plus" color="primary" to="/ruches/nouveau" />
      </template>
    </UiPageHeader>

    <!-- KPI bar -->
    <div class="mb-1 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <UiKpiCard
        icon="i-lucide-box"
        label="Total ruches"
        :value="globalStats?.totalRuches ?? totalRuches"
      />
      <UiKpiCard icon="i-lucide-heart-pulse" label="Actives" :value="globalStats?.actives ?? 0" />
      <UiKpiCard
        icon="i-lucide-droplets"
        label="Production saison"
        :value="globalStats?.productionTotale ?? 0"
        suffix=" kg"
      />
      <UiKpiCard
        icon="i-lucide-activity"
        label="Interventions ce mois"
        :value="globalStats?.interventionsMois ?? 0"
      />
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
          @click="selectSegment(seg.value)"
        >
          {{ seg.label }}
          <span v-if="seg.count > 0" class="ml-1 text-stone-300">{{ seg.count }}</span>
        </button>
      </div>

      <!-- Secondary filters + stats pills -->
      <div class="flex items-center gap-2">
        <!-- Rucher filter -->
        <select
          v-model="filterRucher"
          class="h-7 rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
        >
          <option value="">Tous les ruchers</option>
          <option v-for="r in allRuchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
        </select>

        <!-- Reset -->
        <UButton
          v-if="hasFilters"
          variant="ghost"
          color="neutral"
          size="xs"
          icon="i-lucide-x"
          @click="resetFilters"
        />

        <span
          class="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
        >
          <UIcon name="i-lucide-box" class="h-3 w-3 text-stone-400" />
          {{ totalRuches }} ruche{{ totalRuches > 1 ? 's' : '' }}
        </span>
        <span
          v-if="globalStats && globalStats.actives > 0"
          class="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
        >
          <span class="h-2 w-2 rounded-full bg-emerald-500" />
          {{ globalStats.actives }} active{{ globalStats.actives > 1 ? 's' : '' }}
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

    <!-- Grid grouped by rucher -->
    <div v-else class="mt-2 space-y-6">
      <div v-for="[rucherId, group] in groupedByRucher" :key="rucherId">
        <!-- Section header -->
        <NuxtLink
          :to="`/ruchers/${rucherId}`"
          class="mb-3 flex items-center gap-2 transition-colors hover:text-amber-700"
        >
          <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
            <UIcon name="i-lucide-map-pin" class="h-3.5 w-3.5 text-amber-600" />
          </div>
          <h3 class="text-sm font-semibold text-stone-700">{{ group.nom }}</h3>
          <span
            class="rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-stone-400"
          >
            {{ group.ruches.length }}
          </span>
        </NuxtLink>

        <!-- Cards grid -->
        <TransitionGroup
          name="list"
          tag="div"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <RuchesRucheCard
            v-for="ruche in group.ruches"
            :key="ruche.id"
            :ruche="ruche"
            :last-force-colonie="(ruche as any).lastForceColonie"
            :sante-score="(ruche as any).santeScore"
          />
        </TransitionGroup>
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
import type { Ruche } from '~/types/models';
import type { ApiListResponse } from '~/types/api';
import type { RuchesGlobalStats } from '~/composables/useRuches';

definePageMeta({ layout: 'default' });

const { ruchers: allRuchers } = useRuchers();
const { fetchRuchesStats } = useRuches();

const search = ref('');
const filterRucher = ref('');
const filterStatut = ref('');
const activeSegment = ref('tous');
const currentPage = ref(1);
const globalStats = ref<RuchesGlobalStats | null>(null);

const hasFilters = computed(
  () =>
    search.value !== '' ||
    filterRucher.value !== '' ||
    filterStatut.value !== '' ||
    activeSegment.value !== 'tous',
);

function resetFilters() {
  search.value = '';
  filterRucher.value = '';
  filterStatut.value = '';
  activeSegment.value = 'tous';
  currentPage.value = 1;
}

function selectSegment(value: string) {
  activeSegment.value = value;
  // Map segment to statut filter
  if (value === 'tous') filterStatut.value = '';
  else if (value === 'actives') filterStatut.value = 'active';
  else if (value === 'faibles') filterStatut.value = 'faible';
  else filterStatut.value = '';
  currentPage.value = 1;
}

// Reset page when filters change
watch([search, filterRucher], () => {
  currentPage.value = 1;
});

const queryParams = computed(() => {
  const params: Record<string, string | number> = {
    page: currentPage.value,
    limit: 100,
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

// Group ruches by rucher
interface RucherGroup {
  nom: string;
  ruches: (Ruche & { rucherNom?: string })[];
}

const groupedByRucher = computed(() => {
  const map = new Map<string, RucherGroup>();
  for (const ruche of ruches.value) {
    const id = ruche.rucherId;
    if (!map.has(id)) {
      map.set(id, { nom: ruche.rucherNom ?? 'Sans rucher', ruches: [] });
    }
    map.get(id)!.ruches.push(ruche);
  }
  return map;
});

// Segment counts (from global stats)
const segments = computed(() => [
  { value: 'tous', label: 'Toutes', count: globalStats.value?.totalRuches ?? 0 },
  { value: 'actives', label: 'Actives', count: globalStats.value?.actives ?? 0 },
  { value: 'faibles', label: 'Faibles', count: globalStats.value?.faibles ?? 0 },
]);

// Fetch stats on mount
onMounted(async () => {
  try {
    globalStats.value = await fetchRuchesStats();
  } catch {
    // Stats are non-critical
  }
});
</script>
