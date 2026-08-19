<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Recoltes" description="Historique de toutes vos recoltes de miel">
      <template #actions>
        <UButton
          label="Nouvelle recolte"
          icon="i-lucide-plus"
          color="primary"
          @click="showForm = true"
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
        <option v-for="t in typesMiel" :key="t" :value="t">{{ t }}</option>
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
      <span>{{ totalRecoltes }} recolte{{ totalRecoltes > 1 ? 's' : '' }}</span>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="mt-6">
      <UiLoadingSkeleton variant="card" :count="6" />
    </div>

    <!-- Empty state -->
    <UiErrorState v-else-if="error" :error="error" :retry="refresh" />

    <UiEmptyState
      v-else-if="recoltes.length === 0 && !hasFilters"
      icon="i-lucide-droplets"
      title="La première miellée n'est pas loin 🍯"
      description="Enregistrez votre première récolte : kilos, variété et lot, et je calcule votre production et votre stock de miel."
      action-label="Nouvelle recolte"
      @action="showForm = true"
    />

    <!-- No results -->
    <div
      v-else-if="recoltes.length === 0 && hasFilters"
      class="mt-8 text-center text-sm text-stone-400"
    >
      Aucune récolte ne correspond à ces filtres — essayez d'élargir.
    </div>

    <!-- Grid -->
    <div v-else class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <ProductionRecolteCard v-for="recolte in recoltes" :key="recolte.id" :recolte="recolte" />
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

    <!-- Modal nouvelle recolte -->
    <UModal v-model:open="showForm">
      <template #content>
        <div class="p-6">
          <h2 class="mb-4 text-lg font-semibold text-stone-900">Nouvelle recolte</h2>
          <ProductionRecolteForm
            :ruchers="allRuchers"
            :ruchers-charges="!ruchersEnCours"
            :ruches="allRuches"
            submit-label="Enregistrer"
            :show-quantite="true"
            :loading="saving"
            @submit="handleCreate"
            @cancel="showForm = false"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { ApiListResponse } from '~/types/api';
import type { RecolteWithContext } from '~/composables/useProduction';
import type { RecolteFormData } from '~/components/production/RecolteForm.vue';
import type { Ruche } from '~/types/models';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { createRecolte } = useProduction();
const {
  ruchers: allRuchers,
  refresh: refreshRuchers,
  chargementInitial: ruchersEnCours,
} = useRuchers();

const search = ref('');
const filterRucher = ref('');
const filterType = ref('');
const currentPage = ref(1);
const showForm = ref(false);
const saving = ref(false);

const typesMiel = [
  'Toutes fleurs',
  'Acacia',
  'Tilleul',
  'Lavande',
  'Chataignier',
  'Colza',
  'Tournesol',
  'Bruyere',
  'Sapin',
  'Montagne',
  'Foret',
  'Autre',
];

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
  if (filterType.value) params.typeMiel = filterType.value;
  return params;
});

const {
  data: recoltesData,
  pending,
  error,
  refresh,
} = useFetch<ApiListResponse<RecolteWithContext>>('/api/production/recoltes', {
  key: 'recoltes-page-list',
  query: queryParams,
  lazy: true,
  dedupe: 'defer',
  watch: [queryParams],
});

onMounted(() => {
  refresh();
});

const recoltes = computed(() => recoltesData.value?.data ?? []);
const totalRecoltes = computed(() => recoltesData.value?.pagination?.total ?? 0);
const totalPages = computed(() => recoltesData.value?.pagination?.totalPages ?? 1);

// Fetch ruches for form
const { data: ruchesData, refresh: refreshRuches } = useFetch<
  ApiListResponse<Ruche & { rucherNom?: string }>
>('/api/ruches', {
  key: 'ruches-all-for-form',
  query: { limit: 200 },
  lazy: true,
  dedupe: 'defer',
});
const allRuches = computed(() => ruchesData.value?.data ?? []);

// Ensure ruchers and ruches are loaded when page opens
onMounted(() => {
  refreshRuchers();
  refreshRuches();
});

// Open form from query param
const route = useRoute();
if (route.query.action === 'nouvelle') {
  showForm.value = true;
}

async function handleCreate(data: RecolteFormData) {
  saving.value = true;
  try {
    await createRecolte({
      rucherId: data.rucherId || undefined,
      rucheId: data.rucheId || undefined,
      dateRecolte: new Date(data.dateRecolte).toISOString(),
      typeMiel: data.typeMiel || undefined,
      quantiteKg: data.quantiteKg ?? undefined,
      humidite: data.humidite ?? undefined,
      nombreHausses: data.nombreHausses ?? undefined,
      numeroLot: data.numeroLot || undefined,
      notes: data.notes || undefined,
    });
    notifications.success('Recolte enregistree');
    showForm.value = false;
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement"));
  } finally {
    saving.value = false;
  }
}
</script>
