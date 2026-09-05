<template>
  <div class="space-y-5">
    <!-- Header -->
    <!-- Sur un téléphone de 360 px, le titre et les deux boutons ne tiennent
         pas sur une ligne : sans `flex-wrap`, « Nouvelle ruche » sortait de
         l'écran et le shell le rognait (overflow-x-hidden) — bouton perdu,
         pas seulement mal placé. -->
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
          Ruches
        </h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          <!-- Signal discret : la liste reste affichée pendant qu'on met à
               jour (filtre, recherche, page), sans écran de chargement. -->
          <span
            v-if="revalidation"
            class="mr-1.5 inline-flex items-center gap-1 text-[12px] text-[var(--text-tertiary)]"
          >
            <UIcon name="i-lucide-loader-circle" class="h-3 w-3 animate-spin" />
            Mise à jour…
          </span>
          {{ totalRuches }} ruche{{ totalRuches > 1 ? 's' : '' }}
          <template v-if="globalStats">
            · <span class="text-[var(--status-good)]">{{ globalStats.actives }} saines</span>
            <template v-if="globalStats.faibles > 0">
              ·
              <span class="text-[var(--status-warn)]"
                >{{ globalStats.faibles }} à surveiller</span
              ></template
            >
          </template>
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <UButton
          label="Scanner"
          icon="i-lucide-scan-line"
          color="neutral"
          variant="outline"
          @click="scanOuvert = true"
        />
        <UButton label="Nouvelle ruche" icon="i-lucide-plus" color="primary" to="/ruches/nouveau" />
      </div>
    </div>

    <!-- Scanner QR auto-détecté : vise le QR d'une ruche → ouvre sa fiche. -->
    <UiScannerQr v-model:open="scanOuvert" />

    <!-- Maya, sur les colonies : visites en retard, scores fragiles. Se masque
         seule si rien ne le mérite (le contexte existait dans le moteur mais
         n'était affiché nulle part). -->
    <IaMayaContextCard contexte="ruches" />

    <!-- KPI strip -->
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
        <p
          class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1"
        >
          Total ruches
        </p>
        <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
          {{ globalStats?.totalRuches ?? totalRuches }}
        </p>
      </div>
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
        <p
          class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1"
        >
          En bonne santé
        </p>
        <div class="flex items-center gap-2">
          <span
            class="w-1.5 h-1.5 rounded-full inline-block"
            style="background-color: var(--status-good)"
          />
          <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
            {{ globalStats?.actives ?? 0 }}
          </p>
        </div>
      </div>
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
        <p
          class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1"
        >
          À surveiller
        </p>
        <div class="flex items-center gap-2">
          <span
            class="w-1.5 h-1.5 rounded-full inline-block"
            style="background-color: var(--status-warn)"
          />
          <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
            {{ globalStats?.faibles ?? 0 }}
          </p>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <!-- Segmented filter -->
      <div
        class="flex flex-wrap items-center gap-1 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-1"
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
          @click="selectSegment(seg.value)"
        >
          {{ seg.label }}
          <span v-if="seg.count > 0" class="ml-1 text-[var(--text-tertiary)]">{{ seg.count }}</span>
        </button>
      </div>

      <!-- Right: search + rucher filter + reset -->
      <!-- `flex-wrap` : recherche + filtre + bascule font 354 px à eux seuls.
           Sur 360 px, la bascule liste/grille passait entièrement hors écran
           et devenait incliquable. -->
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
            class="h-8 w-36 rounded-[8px] border border-[var(--border-default)] bg-[var(--surface-muted)] pl-8 pr-3 text-[12.5px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition-all duration-200 focus:w-48 focus:bg-white focus:ring-1 focus:ring-[var(--honey)]"
          />
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

        <!-- Bascule vue liste / grille compacte (repérage visuel quand on a
             beaucoup de ruches) -->
        <div
          class="flex items-center gap-0.5 rounded-[8px] border border-[var(--border-default)] bg-white p-0.5"
        >
          <button
            v-for="v in [
              { id: 'liste', icon: 'i-lucide-list', t: 'Vue liste' },
              { id: 'grille', icon: 'i-lucide-grid-3x3', t: 'Vue grille compacte' },
            ]"
            :key="v.id"
            type="button"
            :title="v.t"
            class="flex h-7 w-7 items-center justify-center rounded-[6px] transition-colors"
            :style="
              viewMode === v.id
                ? 'background: var(--honey-soft); color: var(--honey-deep);'
                : 'color: var(--text-tertiary);'
            "
            @click="setView(v.id as 'liste' | 'grille')"
          >
            <UIcon :name="v.icon" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Erreur -->
    <UiErrorState v-if="error" :error="error" :retry="refresh" />

    <!-- Loading -->
    <div v-else-if="chargementInitial">
      <UiLoadingSkeleton variant="card" :count="6" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="ruches.length === 0 && !hasFilters"
      icon="i-lucide-box"
      title="Aucune ruche"
      description="Ajoutez votre première ruche pour commencer le suivi de vos colonies"
      benefit="Chaque visite se saisit en 30 s, même hors-ligne"
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

    <!-- Ruches groupées par rucher (vue liste OU grille) -->
    <div v-else class="space-y-6">
      <!-- Légende des couleurs (vue grille) -->
      <div
        v-if="viewMode === 'grille'"
        class="flex flex-wrap items-center gap-3 text-[11.5px]"
        style="color: var(--text-tertiary)"
      >
        <span v-for="l in legende" :key="l.label" class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-[3px]" :style="`background:${l.color}`" />
          {{ l.label }}
        </span>
      </div>

      <div v-for="[rucherId, group] in groupedByRucher" :key="rucherId">
        <!-- Section label (rucher) -->
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div
            class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em]"
          >
            <NuxtLink
              :to="`/ruchers/${rucherId}`"
              class="hover:underline inline-flex items-center gap-1.5"
            >
              <UIcon name="i-lucide-map-pin" class="h-3 w-3" />
              {{ group.nom }}
              <span class="font-normal text-[var(--text-tertiary)] normal-case tracking-normal"
                >— {{ group.ruches.length }} ruche{{ group.ruches.length > 1 ? 's' : '' }}</span
              >
            </NuxtLink>
          </div>
          <!-- Un seul clic déplace TOUT le rucher, quelle que soit sa taille -->
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-[7px] px-2 py-1 text-[11.5px] font-medium text-[var(--text-tertiary)] transition-colors hover:bg-[var(--honey-soft)] hover:text-[var(--honey-deep)]"
            :title="`Déplacer les ${group.ruches.length} ruches de ${group.nom} vers un autre rucher`"
            @click="ouvrirDeplacementRucher(rucherId, group.nom, group.ruches.length)"
          >
            <UIcon name="i-lucide-move-right" class="h-3.5 w-3.5" />
            Déplacer tout le rucher
          </button>
        </div>

        <!-- Vue GRILLE : chaque ruche = une pastille colorée par statut, repérable
             d'un coup d'œil (idéal quand on a beaucoup de ruches). -->
        <div v-if="viewMode === 'grille'" class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="ruche in group.ruches"
            :key="ruche.id"
            :to="`/ruches/${ruche.id}`"
            class="flex h-11 min-w-[2.75rem] items-center justify-center rounded-[10px] px-1.5 text-[13px] font-bold text-white transition-transform hover:scale-110"
            :style="`background:${chipColor(ruche.statut)}`"
            :title="`Ruche ${ruche.numero} · ${statutLabel(ruche.statut)}`"
          >
            {{ ruche.numero }}
          </NuxtLink>
        </div>

        <!-- Vue LISTE : tableau détaillé -->
        <div
          v-else
          class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden"
        >
          <!-- Table head -->
          <div
            class="grid bg-[var(--surface-muted)] border-b border-[var(--border-default)]"
            style="grid-template-columns: 2rem 1fr 1fr 1fr 1fr 1fr 2rem"
          >
            <div
              class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium"
            />
            <div
              class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium"
            >
              Numéro
            </div>
            <div
              class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium"
            >
              Type / Race
            </div>
            <div
              class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium"
            >
              Cadres
            </div>
            <div
              class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium"
            >
              Santé
            </div>
            <div
              class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium"
            >
              Dernière visite
            </div>
            <div
              class="px-3 py-2.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium"
            />
          </div>

          <!-- Table rows -->
          <TransitionGroup name="list" tag="div">
            <div
              v-for="ruche in group.ruches"
              :key="ruche.id"
              class="grid border-t border-[var(--border-faint)] hover:bg-[var(--surface-muted)] transition-colors duration-150 group cursor-pointer"
              style="grid-template-columns: 2rem 1fr 1fr 1fr 1fr 1fr 2rem"
              @click="navigateTo(`/ruches/${ruche.id}`)"
            >
              <!-- Sélection (le statut reste lisible via la barre colorée à gauche) -->
              <div class="flex items-center justify-center gap-1.5 px-2 py-3">
                <span
                  class="w-1.5 h-6 rounded-full shrink-0"
                  :class="{
                    'bg-[var(--status-good)]': ruche.statut === 'active',
                    'bg-[var(--status-warn)]':
                      ruche.statut === 'faible' || ruche.statut === 'orpheline',
                    'bg-[var(--status-bad)]': ruche.statut === 'morte',
                    'bg-[var(--tint-idle)]':
                      ruche.statut === 'vendue' || ruche.statut === 'fusionnee',
                    'bg-[var(--status-info)]': ruche.statut === 'essaimee',
                  }"
                />
                <!-- Toujours visible : sur mobile il n'y a pas de survol, et
                     l'app se manipule avec des gants (cible ≥ 44 px). -->
                <button
                  type="button"
                  class="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center p-2.5"
                  :aria-label="`Sélectionner la ruche ${ruche.numero}`"
                  :aria-pressed="selection.has(ruche.id)"
                  @click.stop="basculerSelection(ruche.id)"
                >
                  <span
                    class="flex h-5 w-5 items-center justify-center rounded-[6px] border transition-all duration-[var(--duration-fast)]"
                    :class="
                      selection.has(ruche.id)
                        ? 'border-[var(--honey)] bg-[var(--honey)] text-white'
                        : 'border-[var(--border-default)] bg-white text-transparent'
                    "
                  >
                    <UIcon name="i-lucide-check" class="h-3 w-3" />
                  </span>
                </button>
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
                <span class="text-[13px] text-[var(--text-primary)]">{{
                  typeLabel(ruche.type)
                }}</span>
                <span
                  v-if="ruche.raceAbeille && ruche.raceAbeille !== 'inconnue'"
                  class="text-[12px] text-[var(--text-tertiary)]"
                  >· {{ ruche.raceAbeille }}</span
                >
              </div>

              <!-- Cadres -->
              <div class="px-3 py-3 flex items-center">
                <span class="text-[13px] text-[var(--text-secondary)]">{{
                  ruche.nombreCadres ?? '—'
                }}</span>
              </div>

              <!-- Santé -->
              <div class="px-3 py-3 flex items-center">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="{
                    'bg-[var(--sage-soft)] text-[var(--sage-deep)]': ruche.statut === 'active',
                    'bg-[var(--honey-soft)] text-[var(--honey-deep)]':
                      ruche.statut === 'faible' || ruche.statut === 'orpheline',
                    'bg-red-50 text-red-700': ruche.statut === 'morte',
                    'bg-blue-50 text-blue-700': ruche.statut === 'essaimee',
                    'bg-[var(--surface-muted)] text-[var(--text-tertiary)]':
                      ruche.statut === 'vendue' || ruche.statut === 'fusionnee',
                  }"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="{
                      'bg-[var(--status-good)]': ruche.statut === 'active',
                      'bg-[var(--status-warn)]':
                        ruche.statut === 'faible' || ruche.statut === 'orpheline',
                      'bg-[var(--status-bad)]': ruche.statut === 'morte',
                      'bg-[var(--status-info)]': ruche.statut === 'essaimee',
                      'bg-[var(--tint-idle)]':
                        ruche.statut === 'vendue' || ruche.statut === 'fusionnee',
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
        aria-label="Page précédente"
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
        aria-label="Page suivante"
        class="px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium border border-[var(--border-default)] bg-white text-[var(--text-secondary)] disabled:opacity-40 hover:text-[var(--text-primary)] transition-colors"
        :disabled="currentPage >= totalPages"
        @click="currentPage++"
      >
        <UIcon name="i-lucide-chevron-right" class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- Déplacement groupé de ruches vers un autre rucher -->
    <DeplacementBarreSelection
      :nombre="selection.size"
      :libelle="['ruche', 'ruches']"
      :detail="detailSelection"
      :tout-selectionne="toutSelectionne"
      :loading="deplacementEnCours"
      @tout="basculerTout"
      @annuler="selection.clear()"
      @action="ouvrirDeplacementSelection"
    />
    <DeplacementModalDeplacer
      v-model="showDeplacer"
      mode="ruches"
      :resume-origine="resumeOrigine"
      :destinations="destinationsRuchers"
      :loading="deplacementEnCours"
      @confirmer="deplacerRuches"
    />
  </div>
</template>

<script setup lang="ts">
import type { RucheWithStats } from '~/types/models';
import type { ApiListResponse } from '~/types/api';
import type { RuchesGlobalStats } from '~/composables/useRuches';
import type { ConfirmationDeplacement } from '~/types/deplacement';

definePageMeta({ layout: 'default' });

const { ruchers: allRuchers } = useRuchers();
const { fetchRuchesStats } = useRuches();

const scanOuvert = ref(false);
const search = ref('');
const filterRucher = ref('');
const filterStatut = ref('');
const activeSegment = ref('tous');

// Vue liste (tableau détaillé) ou grille compacte (pastilles) — persistée par
// appareil : un pro avec 100 ruches préfère la grille pour tout voir d'un coup.
const viewMode = ref<'liste' | 'grille'>('liste');
onMounted(() => {
  try {
    const v = localStorage.getItem('apigo_ruches_view');
    if (v === 'liste' || v === 'grille') viewMode.value = v;
  } catch {
    /* stockage indisponible */
  }
});
function setView(v: 'liste' | 'grille'): void {
  viewMode.value = v;
  try {
    localStorage.setItem('apigo_ruches_view', v);
  } catch {
    /* ignore */
  }
}

/** Couleur de pastille selon le statut (échelle chaude + statuts, zéro vert franc). */
function chipColor(statut: string): string {
  switch (statut) {
    case 'active':
      return 'var(--status-good)';
    case 'faible':
    case 'orpheline':
      return 'var(--status-warn)';
    case 'morte':
      return 'var(--status-bad)';
    case 'essaimee':
      return 'var(--status-info)';
    default:
      return 'var(--tint-idle)';
  }
}
const legende = [
  { label: 'Saine', color: 'var(--status-good)' },
  { label: 'À surveiller', color: 'var(--status-warn)' },
  { label: 'Morte', color: 'var(--status-bad)' },
  { label: 'Essaimée', color: 'var(--status-info)' },
  { label: 'Vendue / fusionnée', color: 'var(--tint-idle)' },
];
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

const {
  data: ruchesData,
  error,
  refresh,
  chargementInitial,
  revalidation,
} = useCachedFetch<ApiListResponse<RucheWithStats>>('/api/ruches', {
  key: 'ruches-page-list',
  query: queryParams,
  lazy: true,
  watch: [queryParams],
});

/**
 * ⚠️ LA LISTE DES RUCHES ÉMETTAIT SUR LE BUS SANS JAMAIS L'ÉCOUTER — et c'est
 * l'écran où « ajoute une ruche » atterrit. L'apiculteur dicte, Maya répond
 * « c'est noté », et la liste devant lui garde son ancien compte. Il redicte.
 */
const { on: surRuchesListe } = useDataBus();
surRuchesListe(['ruche:created', 'ruche:updated', 'ruche:deleted', 'rucher:updated'], () =>
  refresh(),
);

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
  // Tri NATUREL des numéros dans chaque rucher : « 2 » avant « 10 » avant « 100 »
  // (et gère « R-2 » avant « R-10 »). Sans ça, le tri alphabétique donnait
  // 1, 10, 100, 11… 2.
  for (const g of map.values()) {
    g.ruches.sort((a, b) =>
      String(a.numero).localeCompare(String(b.numero), 'fr', {
        numeric: true,
        sensitivity: 'base',
      }),
    );
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

// ─── Déplacement de ruches vers un autre rucher ───────────────────────────
// Deux entrées : la sélection fine (cases à cocher) et « déplacer tout le
// rucher », qui n'envoie que l'identifiant du rucher source — déplacer mille
// ruches ne coûte donc pas plus cher qu'en déplacer une.

const notifications = useNotifications();
const { emit: busEmit } = useDataBus();
const selection = reactive(new Set<string>());
const showDeplacer = ref(false);
const deplacementEnCours = ref(false);
/** Renseigné quand on déplace un rucher entier plutôt qu'une sélection. */
const rucherEntier = ref<{ id: string; nom: string; nbRuches: number } | null>(null);

function basculerSelection(id: string) {
  if (selection.has(id)) selection.delete(id);
  else selection.add(id);
}

/** Toutes les ruches AFFICHÉES sont-elles cochées ? (la sélection peut en contenir d'autres) */
const toutSelectionne = computed(
  () => ruches.value.length > 0 && ruches.value.every((r) => selection.has(r.id)),
);

// Le bouton agit sur ce qui est à l'écran : cocher tout ce qui est visible, ou
// le décocher — sans toucher à ce qui a été sélectionné sur d'autres pages.
function basculerTout() {
  if (toutSelectionne.value) ruches.value.forEach((r) => selection.delete(r.id));
  else ruches.value.forEach((r) => selection.add(r.id));
}

// La sélection SURVIT au changement de filtre et de page : on peut composer un
// lot en naviguant. Rien n'est effacé en douce — le compteur de la barre reste
// à l'écran et « Annuler » vide la sélection d'un geste.
const detailSelection = computed(() => {
  const n = selection.size;
  const horsVue = [...selection].filter((id) => !ruches.value.some((r) => r.id === id)).length;
  const base = `${n} ruche${n > 1 ? 's' : ''}`;
  return horsVue > 0 ? `${base} · dont ${horsVue} hors de la vue actuelle` : base;
});

const resumeOrigine = computed(() =>
  rucherEntier.value
    ? `${rucherEntier.value.nbRuches} ruche${rucherEntier.value.nbRuches > 1 ? 's' : ''} de ${rucherEntier.value.nom}`
    : detailSelection.value,
);

/** Ruchers proposés en destination, avec le nombre de ruches déjà présentes. */
const destinationsRuchers = computed(() => {
  const origines = rucherEntier.value
    ? new Set([rucherEntier.value.id])
    : new Set(ruches.value.filter((r) => selection.has(r.id)).map((r) => r.rucherId));
  return allRuchers.value.map((r) => ({
    id: r.id,
    nom: r.nom,
    sousTitre: r.commune,
    occupe: r.ruchesCount ?? 0,
    capacite: null,
    // Tout part déjà de ce rucher : le proposer n'aurait pas de sens.
    estActuelle: origines.size === 1 && origines.has(r.id),
  }));
});

function ouvrirDeplacementRucher(rucherId: string, nom: string, nbRuches: number) {
  selection.clear();
  rucherEntier.value = { id: rucherId, nom, nbRuches };
  showDeplacer.value = true;
}

function ouvrirDeplacementSelection() {
  rucherEntier.value = null;
  showDeplacer.value = true;
}

async function deplacerRuches(payload: ConfirmationDeplacement) {
  deplacementEnCours.value = true;
  try {
    const res = await appelApi<{
      data: { ruchesDeplacees: number; dejaSurPlace: number; destination: { nom: string } };
    }>('/api/ruches/deplacer', {
      method: 'POST',
      body: {
        ...(rucherEntier.value
          ? { rucherSourceId: rucherEntier.value.id }
          : { rucheIds: [...selection] }),
        rucherDestinationId: payload.destinationId,
        date: payload.date ? new Date(payload.date).toISOString() : undefined,
        motif: payload.motif,
        notes: payload.notes || undefined,
      },
    });
    const { ruchesDeplacees, destination } = res.data;
    notifications.success(
      ruchesDeplacees > 0
        ? `${ruchesDeplacees} ruche${ruchesDeplacees > 1 ? 's' : ''} déplacée${ruchesDeplacees > 1 ? 's' : ''} vers ${destination.nom}`
        : 'Ces ruches étaient déjà dans ce rucher',
    );
    selection.clear();
    rucherEntier.value = null;
    showDeplacer.value = false;
    busEmit('ruche:updated');
    busEmit('rucher:updated');
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors du déplacement'));
  } finally {
    deplacementEnCours.value = false;
  }
}
</script>
