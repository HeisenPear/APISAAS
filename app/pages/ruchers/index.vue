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
            aria-label="Affichage en grille"
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
            aria-label="Affichage sur carte"
            type="button"
            data-tutorial="ruchers-map"
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

    <!-- Loading — uniquement au tout premier chargement (jamais sur revalidation) -->
    <div v-if="chargementInitial">
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
        <div
          v-for="rucher in filteredRuchers"
          :key="rucher.id"
          class="grid grid-cols-[auto_1fr] items-center gap-3 lg:gap-4 lg:rounded-[14px] lg:border bg-white py-4 pl-1 lg:p-5 transition-all duration-[var(--duration-fast)] lg:hover:shadow-[var(--shadow-md)]"
          :class="
            selectedRucherId === rucher.id
              ? 'lg:border-[var(--honey)] lg:shadow-[0_0_0_4px_var(--honey-soft)]'
              : 'lg:border-[var(--border-default)]'
          "
        >
          <!-- Case de sélection — hors du lien (un bouton ne s'imbrique pas
               dans un lien) et dimensionnée pour un doigt ganté. -->
          <button
            type="button"
            class="flex h-11 w-11 shrink-0 items-center justify-center"
            :aria-label="`Sélectionner ${rucher.nom}`"
            :aria-pressed="selection.has(rucher.id)"
            @click="basculerSelection(rucher.id)"
          >
            <span
              class="flex h-6 w-6 items-center justify-center rounded-[7px] border transition-all duration-[var(--duration-fast)]"
              :class="
                selection.has(rucher.id)
                  ? 'border-[var(--honey)] bg-[var(--honey)] text-white'
                  : 'border-[var(--border-default)] bg-white text-transparent hover:border-[var(--honey)]'
              "
            >
              <UIcon name="i-lucide-check" class="h-3.5 w-3.5" />
            </span>
          </button>

          <NuxtLink
            :to="`/ruchers/${rucher.id}`"
            class="block min-w-0"
            @click.prevent="selectedRucherId = selectedRucherId === rucher.id ? null : rucher.id"
          >
            <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center">
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
                  <!-- Emplacement sur lequel le rucher est posé -->
                  <span
                    v-if="rucher.emplacementNom"
                    class="inline-flex items-center gap-1 rounded-full bg-[var(--honey-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--honey-deep)]"
                  >
                    <UIcon name="i-lucide-map-pin-plus" class="h-3 w-3" />
                    {{ rucher.emplacementNom }}
                  </span>
                </div>
                <p
                  class="mt-0.5 text-[13px] text-[var(--text-secondary)] flex items-center gap-1.5"
                >
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
        </div>
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

    <!-- Déplacement groupé : barre flottante + modale « d'ici → vers là » -->
    <DeplacementBarreSelection
      :nombre="selection.size"
      :libelle="['rucher', 'ruchers']"
      :detail="detailSelection"
      :tout-selectionne="toutSelectionne"
      :loading="deplacementEnCours"
      @tout="basculerTout"
      @annuler="selection.clear()"
      @action="showDeplacer = true"
    />
    <DeplacementModalDeplacer
      v-model="showDeplacer"
      mode="ruchers"
      :resume-origine="detailSelection"
      :destinations="destinationsEmplacements"
      :loading="deplacementEnCours"
      @confirmer="deplacerRuchers"
    />
  </div>
</template>

<script setup lang="ts">
import type { RuchersGlobalStats } from '~/composables/useRuchers';
import type { ConfirmationDeplacement } from '~/types/deplacement';

definePageMeta({ layout: 'default' });

const { ruchers, chargementInitial, fetchRuchersStats } = useRuchers();
const viewMode = ref<'grid' | 'map'>('grid');
const selectedRucherId = ref<string | null>(null);
const search = ref('');
const activeSegment = ref('tous');
const globalStats = ref<RuchersGlobalStats | null>(null);

// Les ruchers se revalident seuls en arrière-plan (useCachedFetch) : pas de
// refresh() ici, qui doublait la requête et rallumait le skeleton à chaque
// ouverture de l'onglet.
onMounted(async () => {
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

// ─── Déplacement groupé de ruchers ────────────────────────────────────────
// Objectif : poser 1 rucher ou 200 sur un emplacement avec le même nombre de
// gestes — on sélectionne, on choisit la destination, c'est fait.

const notifications = useNotifications();
const { emit: busEmit } = useDataBus();
const selection = reactive(new Set<string>());
const showDeplacer = ref(false);
const deplacementEnCours = ref(false);

function basculerSelection(id: string) {
  if (selection.has(id)) selection.delete(id);
  else selection.add(id);
}

/** Tous les ruchers AFFICHÉS sont-ils cochés ? (la sélection peut en contenir d'autres) */
const toutSelectionne = computed(
  () => filteredRuchers.value.length > 0 && filteredRuchers.value.every((r) => selection.has(r.id)),
);

// Le bouton agit sur ce qui est à l'écran, sans vider ce qui a été coché sous
// un autre filtre — et rien n'est jamais effacé en silence.
function basculerTout() {
  if (toutSelectionne.value) filteredRuchers.value.forEach((r) => selection.delete(r.id));
  else filteredRuchers.value.forEach((r) => selection.add(r.id));
}

const ruchersSelectionnes = computed(() => ruchers.value.filter((r) => selection.has(r.id)));

/** « 3 ruchers · 240 ruches » — ce que l'apiculteur veut vérifier avant de valider. */
const detailSelection = computed(() => {
  const nb = ruchersSelectionnes.value.length;
  const ruches = ruchersSelectionnes.value.reduce((t, r) => t + (r.ruchesCount ?? 0), 0);
  const partRuchers = `${nb} rucher${nb > 1 ? 's' : ''}`;
  const base =
    ruches > 0 ? `${partRuchers} · ${ruches} ruche${ruches > 1 ? 's' : ''}` : partRuchers;
  const horsVue = nb - filteredRuchers.value.filter((r) => selection.has(r.id)).length;
  return horsVue > 0 ? `${base} · dont ${horsVue} hors filtre` : base;
});

// Emplacements proposés comme destinations, avec leur remplissage.
interface EmplacementDestination {
  id: string;
  nom: string;
  commune: string | null;
  capaciteMaxRuches: number | null;
  ruchesCount?: number;
}
const { data: emplacementsData, refresh: refreshEmplacements } = useCachedFetch<{
  data: EmplacementDestination[];
}>('/api/transhumance/emplacements', {
  key: 'transhumance-emplacements',
  query: { limit: 200, page: 1 },
  lazy: true,
});

const destinationsEmplacements = computed(() =>
  (emplacementsData.value?.data ?? []).map((e) => ({
    id: e.id,
    nom: e.nom,
    sousTitre: e.commune,
    occupe: e.ruchesCount ?? 0,
    capacite: e.capaciteMaxRuches,
  })),
);

async function deplacerRuchers(payload: ConfirmationDeplacement) {
  deplacementEnCours.value = true;
  try {
    const res = await appelApi<{
      data: {
        ruchersDeplaces: number;
        ruchesConcernees: number;
        destination: { nom: string } | null;
      };
    }>('/api/ruchers/deplacer', {
      method: 'POST',
      body: {
        rucherIds: [...selection],
        emplacementDestinationId: payload.destinationId,
        date: payload.date ? new Date(payload.date).toISOString() : undefined,
        notes: payload.notes || undefined,
      },
    });
    const { ruchersDeplaces, ruchesConcernees, destination } = res.data;
    notifications.success(
      `${ruchersDeplaces} rucher${ruchersDeplaces > 1 ? 's' : ''} (${ruchesConcernees} ruche${ruchesConcernees > 1 ? 's' : ''}) déplacé${ruchersDeplaces > 1 ? 's' : ''} vers ${destination?.nom ?? 'la destination'}`,
    );
    selection.clear();
    showDeplacer.value = false;
    busEmit('rucher:updated');
    busEmit('emplacement:updated');
    // Les jauges de remplissage des emplacements viennent de changer.
    await refreshEmplacements();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors du déplacement'));
  } finally {
    deplacementEnCours.value = false;
  }
}
</script>
