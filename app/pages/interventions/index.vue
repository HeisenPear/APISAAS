<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Interventions" description="Toutes vos actions sur les ruches">
      <template #actions>
        <!-- Search inline animée -->
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

        <UButton
          label="Groupée"
          icon="i-lucide-layers"
          variant="outline"
          color="neutral"
          to="/interventions/groupe"
        />
        <UButton
          label="Nouvelle intervention"
          icon="i-lucide-plus"
          color="primary"
          to="/interventions/nouvelle"
        />
      </template>
    </UiPageHeader>

    <!-- KPI bar -->
    <div class="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <UiKpiCard label="Total interventions" :value="totalItems" icon="i-lucide-activity" />
      <UiKpiCard label="Ce mois" :value="kpiCeMois" icon="i-lucide-calendar" />
      <UiKpiCard label="Ruches couvertes" :value="kpiRuchesCouvertes" icon="i-lucide-hexagon" />
      <UiKpiCard label="Durée moy." :value="kpiDureeMoy" icon="i-lucide-clock" suffix=" min" />
    </div>

    <!-- Toolbar : segmented filter + stats + filtre rucher -->
    <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          @click="setSegment(seg.value)"
        >
          {{ seg.label }}
          <span v-if="seg.count > 0" class="ml-1 text-stone-300">{{ seg.count }}</span>
        </button>
      </div>

      <!-- Stats pills + filtre rucher -->
      <div class="flex flex-wrap items-center gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
        >
          <UIcon name="i-lucide-activity" class="h-3 w-3 text-stone-400" />
          {{ totalItems }} intervention{{ totalItems > 1 ? 's' : '' }}
        </span>
        <span
          v-if="kpiCeMois > 0"
          class="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium tabular-nums text-amber-700"
        >
          <UIcon name="i-lucide-calendar" class="h-3 w-3 text-amber-400" />
          {{ kpiCeMois }} ce mois
        </span>

        <!-- Filtre rucher discret -->
        <select
          v-model="filterRucher"
          class="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
        >
          <option value="">Tous les ruchers</option>
          <option v-for="r in allRuchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
        </select>

        <button
          v-if="hasFilters"
          type="button"
          class="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600"
          @click="resetFilters"
        >
          <UIcon name="i-lucide-x" class="h-3 w-3" />
          Réinitialiser
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="mt-6">
      <UiLoadingSkeleton variant="card" :count="6" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="visibleInterventions.length === 0 && !hasFilters"
      icon="i-lucide-activity"
      title="Aucune intervention"
      description="Enregistrez votre première intervention pour suivre vos ruches"
      action-label="Nouvelle intervention"
      @action="navigateTo('/interventions/nouvelle')"
    />

    <!-- No results -->
    <div
      v-else-if="visibleInterventions.length === 0 && hasFilters"
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
        <TransitionGroup
          name="list"
          tag="div"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <InterventionsInterventionCard
            v-for="item in group.items"
            :key="item.id"
            :intervention="item"
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

definePageMeta({ layout: 'default' });

const { ruchers: allRuchers } = useRuchers();

// ── Segments ──────────────────────────────────────────────
type Segment = 'tous' | 'controles' | 'traitements' | 'recoltes' | 'autre';

const SEGMENT_TYPES: Record<Exclude<Segment, 'tous'>, string[]> = {
  controles: ['controle'],
  traitements: ['varroa', 'sanitaire'],
  recoltes: ['recolte', 'pesee'],
  autre: [
    'materiel',
    'nourrissement',
    'essaimage',
    'division',
    'deplacement',
    'commentaire',
    'empilement',
    'transvasement',
  ],
};

const activeSegment = ref<Segment>('tous');
const search = ref('');
const filterRucher = ref('');
const currentPage = ref(1);

function setSegment(val: Segment) {
  activeSegment.value = val;
}

const hasFilters = computed(
  () => search.value !== '' || filterRucher.value !== '' || activeSegment.value !== 'tous',
);

function resetFilters() {
  search.value = '';
  filterRucher.value = '';
  activeSegment.value = 'tous';
  currentPage.value = 1;
}

watch([search, filterRucher], () => {
  currentPage.value = 1;
});

const queryParams = computed(() => {
  const params: Record<string, string | number> = {
    page: currentPage.value,
    limit: 18,
  };
  if (search.value) params.search = search.value;
  if (filterRucher.value) params.rucherId = filterRucher.value;
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

// DataBus: rafraîchir la liste quand une intervention est créée/supprimée
const { on } = useDataBus();
on(['intervention:created', 'intervention:deleted'], () => {
  refresh();
});

const interventions = computed(() => interventionsData.value?.data ?? []);
const totalItems = computed(() => interventionsData.value?.pagination?.total ?? 0);
const totalPages = computed(() => interventionsData.value?.pagination?.totalPages ?? 1);

// ── KPIs (computed from loaded page data) ────────────────
const kpiCeMois = computed(() => {
  const now = new Date();
  return interventions.value.filter((i) => {
    const d = new Date(i.dateVisite);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
});

const kpiRuchesCouvertes = computed(() => {
  return new Set(interventions.value.map((i) => i.rucheId).filter(Boolean)).size;
});

const kpiDureeMoy = computed(() => {
  const withDuration = interventions.value.filter((i) => i.dureeMinutes);
  if (withDuration.length === 0) return 0;
  const total = withDuration.reduce((sum, i) => sum + (i.dureeMinutes ?? 0), 0);
  return Math.round(total / withDuration.length);
});

// ── Segment counts (client-side from loaded page) ────────
const segmentCounts = computed(() => {
  const counts: Record<Segment, number> = {
    tous: 0,
    controles: 0,
    traitements: 0,
    recoltes: 0,
    autre: 0,
  };
  for (const item of interventions.value) {
    counts.tous++;
    for (const [seg, types] of Object.entries(SEGMENT_TYPES) as [
      Exclude<Segment, 'tous'>,
      string[],
    ][]) {
      if (types.includes(item.type ?? '')) {
        counts[seg]++;
        break;
      }
    }
  }
  return counts;
});

const segments = computed(() => [
  { value: 'tous' as Segment, label: 'Tous', count: segmentCounts.value.tous },
  { value: 'controles' as Segment, label: 'Contrôles', count: segmentCounts.value.controles },
  { value: 'traitements' as Segment, label: 'Traitements', count: segmentCounts.value.traitements },
  { value: 'recoltes' as Segment, label: 'Récoltes', count: segmentCounts.value.recoltes },
  { value: 'autre' as Segment, label: 'Autre', count: segmentCounts.value.autre },
]);

// ── Segment filter (client-side on loaded page) ───────────
const visibleInterventions = computed(() => {
  if (activeSegment.value === 'tous') return interventions.value;
  const types = SEGMENT_TYPES[activeSegment.value];
  return interventions.value.filter((i) => types.includes(i.type ?? ''));
});

// ── Timeline groupée par mois ─────────────────────────────
const groupedByMonth = computed(() => {
  const groups = new Map<string, InterventionWithContext[]>();
  for (const item of visibleInterventions.value) {
    const date = new Date(item.dateVisite);
    const monthKey = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (!groups.has(monthKey)) groups.set(monthKey, []);
    groups.get(monthKey)!.push(item);
  }
  return [...groups.entries()].map(([month, items]) => ({ month, items }));
});
</script>
