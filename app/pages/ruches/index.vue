<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1
          class="text-[26px] font-semibold tracking-[-0.02em]"
          style="font-family: 'SF Pro Display', -apple-system, system-ui, sans-serif"
        >
          Ruches
        </h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          {{ totalRuches }} ruche{{ totalRuches > 1 ? 's' : '' }}
          <template v-if="globalStats">
            · <span class="text-[var(--status-good)]">{{ globalStats.actives }} saines</span>
            <template v-if="globalStats.faibles > 0"> · <span class="text-[var(--status-warn)]">{{ globalStats.faibles }} à surveiller</span></template>
          </template>
        </p>
      </div>
      <UButton label="Nouvelle ruche" icon="i-lucide-plus" color="primary" to="/ruches/nouveau" />
    </div>

    <!-- KPI strip -->
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
        <p class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1">Total ruches</p>
        <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">{{ globalStats?.totalRuches ?? totalRuches }}</p>
      </div>
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
        <p class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1">En bonne santé</p>
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full inline-block" style="background-color: var(--status-good)" />
          <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">{{ globalStats?.actives ?? 0 }}</p>
        </div>
      </div>
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
        <p class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1">À surveiller</p>
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full inline-block" style="background-color: var(--status-warn)" />
          <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">{{ globalStats?.faibles ?? 0 }}</p>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <!-- Segmented filter -->
      <div class="flex items-center gap-1 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-1">
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
          @click="selectSegment(seg.value)"
        >
          {{ seg.label }}
          <span v-if="seg.count > 0" class="ml-1 text-[var(--text-tertiary)]">{{ seg.count }}</span>
        </button>
      </div>

      <!-- Right: search + rucher filter + reset -->
      <div class="flex items-center gap-2">
        <!-- Search -->
        <div class="relative">
          <UIcon
            name="i-lucide-search"
            class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <input
            v-model="search"
            type="text"
            placeholder="Rechercher…"
            class="h-8 w-36 rounded-[8px] border border-[var(--border-default)] bg-[var(--surface-muted)] pl-8 pr-3 text-[12.5px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-all duration-200 focus:w-48 focus:bg-white focus:ring-1 focus:ring-[var(--honey)]"
          >
        </div>

        <!-- Rucher filter -->
        <select
          v-model="filterRucher"
          class="h-8 rounded-[8px] border border-[var(--border-default)] bg-white px-2.5 text-[12.5px] text-[var(--text-secondary)] outline-none focus:border-[var(--honey)] focus:ring-1 focus:ring-[var(--honey)]"
        >
          <option value="">Tous les ruchers</option>
          <option v-for="r in allRuchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
        </select>

        <!-- Reset -->
        <button
          v-if="hasFilters"
          type="button"
          class="px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium border border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          @click="resetFilters"
        >
          Réinitialiser
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending">
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
      class="py-12 text-center text-[13.5px] text-[var(--text-tertiary)]"
    >
      Aucune ruche ne correspond aux filtres sélectionnés
    </div>

    <!-- Table grouped by rucher -->
    <div v-else class="space-y-6">
      <div v-for="[rucherId, group] in groupedByRucher" :key="rucherId">
        <!-- Section label (rucher) -->
        <div class="mb-2">
          <div class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-1.5">
            <NuxtLink :to="`/ruchers/${rucherId}`" class="hover:underline inline-flex items-center gap-1.5">
              <UIcon name="i-lucide-map-pin" class="h-3 w-3" />
              {{ group.nom }}
              <span class="font-normal text-[var(--text-tertiary)] normal-case tracking-normal">— {{ group.ruches.length }} ruche{{ group.ruches.length > 1 ? 's' : '' }}</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden">
          <!-- Table head -->
          <div class="grid bg-[var(--surface-muted)] border-b border-[var(--border-default)]" style="grid-template-columns: 2rem 1fr 1fr 1fr 1fr 1fr 2rem">
            <div class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium" />
            <div class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">Numéro</div>
            <div class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">Type / Race</div>
            <div class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">Cadres</div>
            <div class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">Santé</div>
            <div class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium">Dernière visite</div>
            <div class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium" />
          </div>

          <!-- Table rows -->
          <TransitionGroup name="list" tag="div">
            <div
              v-for="ruche in group.ruches"
              :key="ruche.id"
              class="grid border-t border-[var(--border-faint)] hover:bg-[var(--surface-muted)] transition-colors duration-150 group"
              style="grid-template-columns: 2rem 1fr 1fr 1fr 1fr 1fr 2rem"
            >
              <!-- Color accent -->
              <div class="flex items-center justify-center px-2 py-3">
                <span
                  class="w-1.5 h-6 rounded-full"
                  :class="{
                    'bg-[var(--status-good)]': ruche.statut === 'active',
                    'bg-[var(--status-warn)]': ruche.statut === 'faible' || ruche.statut === 'orpheline',
                    'bg-[var(--status-bad)]': ruche.statut === 'morte',
                    'bg-[var(--text-quaternary)]': ruche.statut === 'vendue' || ruche.statut === 'fusionnee',
                    'bg-[var(--status-info)]': ruche.statut === 'essaimee',
                  }"
                />
              </div>

              <!-- Numéro -->
              <div class="px-3 py-3 flex items-center">
                <NuxtLink
                  :to="`/ruches/${ruche.id}`"
                  class="text-[13.5px] font-semibold text-[var(--text-primary)] hover:text-[var(--honey-deep)] transition-colors"
                >
                  {{ ruche.numero }}
                </NuxtLink>
              </div>

              <!-- Type / Race -->
              <div class="px-3 py-3 flex items-center gap-1.5">
                <span class="text-[13px] text-[var(--text-primary)]">{{ typeLabel(ruche.type) }}</span>
                <span v-if="ruche.raceAbeille && ruche.raceAbeille !== 'inconnue'" class="text-[12px] text-[var(--text-tertiary)]">· {{ ruche.raceAbeille }}</span>
              </div>

              <!-- Cadres -->
              <div class="px-3 py-3 flex items-center">
                <span class="text-[13px] text-[var(--text-secondary)]">{{ ruche.nombreCadres ?? '—' }}</span>
              </div>

              <!-- Santé -->
              <div class="px-3 py-3 flex items-center">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="{
                    'bg-[var(--sage-soft)] text-[var(--sage-deep)]': ruche.statut === 'active',
                    'bg-[var(--honey-soft)] text-[var(--honey-deep)]': ruche.statut === 'faible' || ruche.statut === 'orpheline',
                    'bg-red-50 text-red-700': ruche.statut === 'morte',
                    'bg-blue-50 text-blue-700': ruche.statut === 'essaimee',
                    'bg-[var(--surface-muted)] text-[var(--text-tertiary)]': ruche.statut === 'vendue' || ruche.statut === 'fusionnee',
                  }"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="{
                      'bg-[var(--status-good)]': ruche.statut === 'active',
                      'bg-[var(--status-warn)]': ruche.statut === 'faible' || ruche.statut === 'orpheline',
                      'bg-[var(--status-bad)]': ruche.statut === 'morte',
                      'bg-[var(--status-info)]': ruche.statut === 'essaimee',
                      'bg-[var(--text-quaternary)]': ruche.statut === 'vendue' || ruche.statut === 'fusionnee',
                    }"
                  />
                  {{ statutLabel(ruche.statut) }}
                </span>
              </div>

              <!-- Dernière visite -->
              <div class="px-3 py-3 flex items-center">
                <span class="text-[12.5px] text-[var(--text-tertiary)]">—</span>
              </div>

              <!-- Actions -->
              <div class="px-2 py-3 flex items-center justify-center">
                <NuxtLink
                  :to="`/ruches/${ruche.id}`"
                  class="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <UIcon name="i-lucide-chevron-right" class="h-4 w-4" />
                </NuxtLink>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-2 pt-2">
      <button
        class="px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium border border-[var(--border-default)] bg-white text-[var(--text-secondary)] disabled:opacity-40 hover:text-[var(--text-primary)] transition-colors"
        :disabled="currentPage <= 1"
        @click="currentPage--"
      >
        <UIcon name="i-lucide-chevron-left" class="h-3.5 w-3.5" />
      </button>
      <span class="flex items-center px-3 text-[12.5px] text-[var(--text-secondary)]">
        Page {{ currentPage }} / {{ totalPages }}
      </span>
      <button
        class="px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium border border-[var(--border-default)] bg-white text-[var(--text-secondary)] disabled:opacity-40 hover:text-[var(--text-primary)] transition-colors"
        :disabled="currentPage >= totalPages"
        @click="currentPage++"
      >
        <UIcon name="i-lucide-chevron-right" class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RucheWithStats } from '~/types/models';
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

const { data: ruchesData, pending } = useFetch<ApiListResponse<RucheWithStats>>('/api/ruches', {
  query: queryParams,
  lazy: true,
  watch: [queryParams],
});

const ruches = computed(() => ruchesData.value?.data ?? ([] as RucheWithStats[]));
const totalRuches = computed(() => ruchesData.value?.pagination?.total ?? 0);
const totalPages = computed(() => ruchesData.value?.pagination?.totalPages ?? 1);

// Group ruches by rucher
interface RucherGroup {
  nom: string;
  ruches: RucheWithStats[];
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

// Labels for table display
const typeLabels: Record<string, string> = {
  dadant_10: 'Dadant 10',
  dadant_12: 'Dadant 12',
  langstroth: 'Langstroth',
  warre: 'Warré',
  voirnot: 'Voirnot',
  kenyane: 'Kenyane',
  autre: 'Autre',
};

const statutLabels: Record<string, string> = {
  active: 'Saine',
  faible: 'À surveiller',
  orpheline: 'Orpheline',
  essaimee: 'Essaimée',
  morte: 'Morte',
  vendue: 'Vendue',
  fusionnee: 'Fusionnée',
};

function typeLabel(type: string): string {
  return typeLabels[type] ?? type;
}

function statutLabel(statut: string): string {
  return statutLabels[statut] ?? statut;
}
</script>
