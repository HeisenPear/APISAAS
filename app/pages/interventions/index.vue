<template>
  <div class="space-y-6">
    <!-- Header -->
    <!-- Sans `flex-wrap`, « Groupée » + « Nouvelle » poussaient le titre et le
         bouton d'action sortait de l'écran sur un téléphone de 360 px. -->
    <div class="flex flex-wrap items-start justify-between gap-3">
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
          Interventions
        </h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          {{ totalItems }} intervention{{ totalItems > 1 ? 's' : '' }} enregistrée{{
            totalItems > 1 ? 's' : ''
          }}
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <UButton
          label="Groupée"
          icon="i-lucide-layers"
          variant="outline"
          color="neutral"
          to="/interventions/groupe"
        />
        <UButton
          data-tutorial="btn-nouvelle-intervention"
          label="Nouvelle"
          icon="i-lucide-plus"
          color="primary"
          to="/interventions/nouvelle"
        />
      </div>
    </div>

    <!-- Tabs -->
    <!-- Une barre d'onglets soulignée ne peut pas passer à la ligne sans casser
         son trait : elle défile. `shrink-0` empêche les onglets de se comprimer
         jusqu'à l'illisible, `[scrollbar-width:none]` évite la barre grise sous
         le trait actif. -->
    <div
      class="flex items-center gap-0 overflow-x-auto border-b border-[var(--border-default)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <button
        v-for="seg in segments"
        :key="seg.value"
        type="button"
        class="relative shrink-0 px-4 py-2.5 text-[13px] font-medium transition-colors"
        :class="
          activeSegment === seg.value
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        "
        @click="setSegment(seg.value)"
      >
        {{ seg.label }}
        <span v-if="seg.count > 0" class="ml-1.5 text-[11px] text-[var(--text-tertiary)]">{{
          seg.count
        }}</span>
        <!-- Active underline -->
        <span
          v-if="activeSegment === seg.value"
          class="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
          style="background-color: var(--honey)"
        />
      </button>
    </div>

    <!-- Filters toolbar -->
    <div class="flex flex-wrap items-center gap-2">
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
          class="h-8 w-40 rounded-lg border border-[var(--border-default)] bg-[var(--surface-muted)] pl-8 pr-3 text-[12.5px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-all duration-200 focus:w-52 focus:bg-white focus:ring-1 focus:ring-[var(--honey)]"
        />
      </div>
      <!-- Rucher filter -->
      <select
        v-model="filterRucher"
        class="h-8 rounded-lg border border-[var(--border-default)] bg-white px-2 text-[12.5px] text-[var(--text-secondary)] focus:border-[var(--honey)] focus:outline-none focus:ring-1 focus:ring-[var(--honey)]/30"
      >
        <option value="">Tous les ruchers</option>
        <option v-for="r in allRuchers" :key="r.id" :value="r.id">{{ r.nom }}</option>
      </select>
      <!-- Reset -->
      <button
        v-if="hasFilters"
        type="button"
        class="inline-flex items-center gap-1 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        @click="resetFilters"
      >
        <UIcon name="i-lucide-x" class="h-3 w-3" />
        Réinitialiser
      </button>
    </div>

    <!-- Erreur -->
    <UiErrorState v-if="error" :error="error" :retry="refresh" />

    <!-- Loading — uniquement quand rien n'est encore affichable -->
    <div v-else-if="chargementInitial">
      <UiLoadingSkeleton variant="card" :count="6" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="visibleInterventions.length === 0 && !hasFilters"
      icon="i-lucide-activity"
      title="Pas encore de visite notée"
      description="Notez votre première intervention — ou dictez-la simplement à Maya — et tout l'historique de vos ruches se construira ici."
      action-label="Nouvelle intervention"
      @action="navigateTo('/interventions/nouvelle')"
    />

    <!-- No results -->
    <div
      v-else-if="visibleInterventions.length === 0 && hasFilters"
      class="py-8 text-center text-[13px] text-[var(--text-tertiary)]"
    >
      Rien ne correspond à ces filtres — essayez d'élargir un peu.
    </div>

    <!-- Main layout: timeline + sidebar -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-7">
      <!-- Left: timeline grouped by month -->
      <div class="space-y-8" data-tutorial="interventions-list">
        <div v-for="group in groupedByMonth" :key="group.month">
          <!-- Month header -->
          <div class="mm-sect lg:mb-4 lg:flex lg:items-center lg:gap-3 lg:pt-0 lg:pb-0">
            <h3
              class="mm-sect-t lg:text-[19px] lg:font-semibold lg:tracking-[-0.015em] lg:color-inherit"
              style="
                font-family:
                  'SF Pro Display',
                  -apple-system,
                  system-ui,
                  sans-serif;
              "
            >
              {{ group.month }}
            </h3>
            <span
              class="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[11.5px] font-medium text-[var(--text-tertiary)]"
            >
              {{ group.items.length }}
            </span>
          </div>
          <!-- Intervention rows/cards -->
          <TransitionGroup name="list" tag="div" class="mm-list lg:space-y-2.5">
            <NuxtLink
              v-for="item in group.items"
              :key="item.id"
              :to="`/interventions/${item.id}`"
              class="flex items-center gap-3 bg-white lg:rounded-[12px] lg:border lg:border-[var(--border-default)] p-4 transition-all lg:hover:shadow-[var(--shadow-sm)]"
            >
              <!-- Left: accent bar + hour -->
              <div class="flex flex-col items-center gap-1 shrink-0">
                <div
                  class="w-[3px] h-8 rounded-full"
                  :style="
                    new Date(item.dateVisite) <= new Date()
                      ? 'background-color: var(--sage)'
                      : 'background-color: var(--honey)'
                  "
                />
                <span class="font-mono text-[11px] text-[var(--text-tertiary)] hidden lg:block">
                  {{
                    item.dateVisite
                      ? new Date(item.dateVisite).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'
                  }}
                </span>
              </div>
              <!-- Center: content -->
              <div class="min-w-0 flex-1">
                <h4
                  class="text-[15px] font-semibold text-[var(--text-primary)]"
                  style="
                    font-family:
                      'SF Pro Display',
                      -apple-system,
                      system-ui,
                      sans-serif;
                  "
                >
                  {{ libelleTypeIntervention(item.type) }}
                </h4>
                <p class="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                  {{
                    [item.rucheNumero, item.rucherNom, item.emplacementNom]
                      .filter(Boolean)
                      .join(' — ')
                  }}
                </p>
                <p
                  v-if="item.notes"
                  class="mt-0.5 text-[12px] text-[var(--text-tertiary)] line-clamp-1"
                >
                  {{ item.notes }}
                </p>
              </div>
              <!-- Right: state + chevron -->
              <div class="flex items-center gap-2 shrink-0">
                <span
                  class="hidden lg:inline rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
                  :style="
                    new Date(item.dateVisite) <= new Date()
                      ? 'background: var(--sage-soft); color: var(--sage-deep)'
                      : 'background: var(--honey-soft); color: var(--honey-deep)'
                  "
                >
                  {{ new Date(item.dateVisite) <= new Date() ? 'Réalisé' : 'Planifié' }}
                </span>
                <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-[#c7c2b9]" />
              </div>
            </NuxtLink>
          </TransitionGroup>
        </div>
      </div>

      <!-- Right: sidebar panel -->
      <div class="hidden lg:block">
        <div
          class="sticky top-24 rounded-[14px] border border-[var(--border-default)] bg-white p-4 space-y-4"
        >
          <!-- Quick stats -->
          <div>
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3"
            >
              Résumé
            </p>
            <div class="space-y-2">
              <div class="flex items-center justify-between text-[13px]">
                <span class="text-[var(--text-secondary)]">Ce mois</span>
                <span class="font-semibold text-[var(--text-primary)]">{{ kpiCeMois }}</span>
              </div>
              <div class="flex items-center justify-between text-[13px]">
                <span class="text-[var(--text-secondary)]">Ruches couvertes</span>
                <span class="font-semibold text-[var(--text-primary)]">{{
                  kpiRuchesCouvertes
                }}</span>
              </div>
              <div class="flex items-center justify-between text-[13px]">
                <span class="text-[var(--text-secondary)]">Durée moyenne</span>
                <span class="font-semibold text-[var(--text-primary)]">{{ kpiDureeMoy }} min</span>
              </div>
            </div>
          </div>
          <!-- Raccourcis -->
          <div>
            <p
              class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-3"
            >
              Raccourcis
            </p>
            <div class="space-y-1.5">
              <NuxtLink
                to="/interventions/nouvelle"
                class="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              >
                <UIcon name="i-lucide-plus" class="h-4 w-4 text-[var(--honey)]" />
                Nouvelle intervention
              </NuxtLink>
              <NuxtLink
                to="/interventions/groupe"
                class="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              >
                <UIcon name="i-lucide-layers" class="h-4 w-4 text-[var(--sage)]" />
                Campagne groupée
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          size="sm"
          :disabled="currentPage <= 1"
          @click="currentPage--"
        />
        <span class="text-[13px] text-[var(--text-tertiary)]"
          >Page {{ currentPage }} / {{ totalPages }}</span
        >
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
import { libelleTypeIntervention, type InterventionWithContext } from '~/types/interventions';

definePageMeta({ layout: 'default' });

const { ruchers: allRuchers } = useRuchers();

// ── Segments ──────────────────────────────────────────────
type Segment = 'tous' | 'controles' | 'traitements' | 'recoltes' | 'autre';

const SEGMENT_TYPES: Record<Exclude<Segment, 'tous'>, string[]> = {
  controles: ['controle'],
  // `traitement` manquait alors qu'il est bel et bien écrit en base : ces
  // lignes-là ne se comptaient nulle part non plus.
  traitements: ['varroa', 'sanitaire', 'traitement'],
  recoltes: ['recolte', 'pesee'],
  autre: [
    'materiel',
    'nourrissement',
    'essaimage',
    'division',
    'deplacement',
    // Les types posés par la transhumance et le déplacement EN MASSE. Sans eux,
    // un apiculteur qui venait de déplacer deux cents ruchers ne retrouvait
    // aucune de ces lignes ailleurs que sous « Tous » — elles n'étaient
    // comptées dans aucun onglet et disparaissaient dès qu'il en choisissait un.
    'deplacement_rucher',
    'visite_emplacement',
    'visite_rucher',
    'rendez_vous_pro',
    'multi',
    'reine',
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
  error,
  refresh,
  chargementInitial,
} = useCachedFetch<ApiListResponse<InterventionWithContext>>('/api/interventions', {
  key: 'interventions-page-list',
  query: queryParams,
  lazy: true,
  dedupe: 'defer',
  watch: [queryParams],
});

// DataBus: rafraîchir la liste quand une intervention est créée/supprimée (même page)
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
