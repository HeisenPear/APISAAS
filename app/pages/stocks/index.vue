<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Stocks" description="Inventaire de votre materiel et fournitures">
      <template #actions>
        <div class="flex items-center gap-2">
          <UButton
            label="Alertes"
            icon="i-lucide-alert-triangle"
            variant="outline"
            :color="alertCount > 0 ? 'error' : 'neutral'"
            to="/stocks/alertes"
          >
            <template v-if="alertCount > 0" #trailing>
              <span class="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {{ alertCount }}
              </span>
            </template>
          </UButton>
          <UButton
            label="Nouvel article"
            icon="i-lucide-plus"
            color="primary"
            @click="openCreateForm"
          />
        </div>
      </template>
    </UiPageHeader>

    <!-- Filters -->
    <div class="mt-5 flex flex-wrap items-center gap-3">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Rechercher un article..."
        class="w-64"
      />

      <select
        v-model="filterCategorie"
        class="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      >
        <option value="">Toutes les categories</option>
        <option v-for="cat in CATEGORIE_STOCK" :key="cat" :value="cat">
          {{ categorieLabels[cat] || cat }}
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
      <span>{{ totalStocks }} article{{ totalStocks > 1 ? 's' : '' }}</span>
      <span v-if="totalValue > 0" class="flex items-center gap-1">
        Valeur totale : {{ totalValue.toFixed(2) }} EUR
      </span>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="mt-6">
      <UiLoadingSkeleton variant="card" :count="6" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="filteredStocks.length === 0 && !hasFilters"
      icon="i-lucide-warehouse"
      title="Aucun article en stock"
      description="Ajoutez vos premiers articles pour gerer votre inventaire"
      action-label="Ajouter un article"
      @action="openCreateForm"
    />

    <!-- No results -->
    <div
      v-else-if="filteredStocks.length === 0 && hasFilters"
      class="mt-8 text-center text-sm text-stone-400"
    >
      Aucun article ne correspond aux filtres
    </div>

    <!-- Grid by categories -->
    <template v-else>
      <div v-for="group in groupedByCategory" :key="group.categorie" class="mt-6">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
          {{ categorieLabels[group.categorie] || group.categorie }}
          <span class="ml-1 text-stone-300">({{ group.items.length }})</span>
        </h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StocksStockCard
            v-for="stock in group.items"
            :key="stock.id"
            :stock="stock"
            @entree="openMouvementForm(stock, 'entree')"
            @sortie="openMouvementForm(stock, 'sortie')"
            @edit="openEditForm(stock)"
          />
        </div>
      </div>
    </template>

    <!-- Modal creation/edition -->
    <UModal v-model:open="showStockForm">
      <template #content>
        <div class="p-6">
          <h2 class="mb-4 text-lg font-semibold text-stone-900">
            {{ editingStock ? "Modifier l'article" : 'Nouvel article' }}
          </h2>
          <StocksStockForm
            :loading="saving"
            :initial="editingInitial"
            :submit-label="editingStock ? 'Enregistrer' : 'Creer'"
            :show-quantite="!editingStock"
            @submit="handleStockSubmit"
            @cancel="showStockForm = false"
          />
        </div>
      </template>
    </UModal>

    <!-- Modal mouvement -->
    <UModal v-model:open="showMouvementForm">
      <template #content>
        <div class="p-6">
          <StocksMouvementForm
            :mouvement-type="mouvementType"
            :stock-nom="mouvementStockNom"
            :loading="saving"
            @submit="handleMouvementSubmit"
            @cancel="showMouvementForm = false"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Stock } from '~/types/models';
import type { ApiListResponse } from '~/types/api';
import type { StockFormData } from '~/components/stocks/StockForm.vue';
import { CATEGORIE_STOCK } from '~/types/enums';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { createStock, updateStock, createMouvement, getAlertes } = useStocks();

const search = ref('');
const filterCategorie = ref('');
const showStockForm = ref(false);
const showMouvementForm = ref(false);
const saving = ref(false);
const editingStock = ref<Stock | null>(null);
const mouvementStock = ref<Stock | null>(null);
const mouvementType = ref<'entree' | 'sortie' | 'ajustement'>('entree');
const alertCount = ref(0);

const categorieLabels: Record<string, string> = {
  cadres: 'Cadres',
  hausses: 'Hausses',
  corps: 'Corps de ruche',
  nourrissement: 'Nourrissement',
  traitement: 'Traitement',
  conditionnement: 'Conditionnement',
  equipement: 'Equipement',
  outillage: 'Outillage',
  autre: 'Autre',
};

const hasFilters = computed(() => search.value !== '' || filterCategorie.value !== '');

function resetFilters() {
  search.value = '';
  filterCategorie.value = '';
}

const queryParams = computed(() => {
  const params: Record<string, string | number> = { limit: 100 };
  if (search.value) params.search = search.value;
  if (filterCategorie.value) params.categorie = filterCategorie.value;
  return params;
});

const {
  data: stocksData,
  pending,
  refresh,
} = useFetch<ApiListResponse<Stock>>('/api/stocks', {
  key: 'stocks-page-list',
  query: queryParams,
  lazy: true,
  dedupe: 'defer',
  watch: [queryParams],
});

onMounted(() => {
  refresh();
});

const filteredStocks = computed(() => stocksData.value?.data ?? []);
const totalStocks = computed(() => stocksData.value?.pagination?.total ?? 0);

const totalValue = computed(() => {
  return filteredStocks.value.reduce((sum, s) => {
    const qty = Number(s.quantite);
    const prix = Number(s.prixUnitaire ?? 0);
    return sum + qty * prix;
  }, 0);
});

const groupedByCategory = computed(() => {
  const groups = new Map<string, Stock[]>();
  for (const stock of filteredStocks.value) {
    const cat = stock.categorie;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(stock);
  }
  return [...groups.entries()].map(([categorie, items]) => ({ categorie, items }));
});

// Load alerts count
onMounted(async () => {
  try {
    const alertes = await getAlertes();
    alertCount.value = alertes.length;
  } catch {
    // ignore
  }
});

const editingInitial = computed(() => {
  if (!editingStock.value) return undefined;
  const s = editingStock.value;
  return {
    nom: s.nom,
    categorie: s.categorie,
    quantite: Number(s.quantite),
    unite: s.unite ?? '',
    seuilAlerte: s.seuilAlerte ? Number(s.seuilAlerte) : null,
    prixUnitaire: s.prixUnitaire ? Number(s.prixUnitaire) : null,
    fournisseur: s.fournisseur ?? '',
    emplacement: s.emplacement ?? '',
    notes: s.notes ?? '',
  };
});

const mouvementStockNom = computed(() => mouvementStock.value?.nom ?? '');

function openCreateForm() {
  editingStock.value = null;
  showStockForm.value = true;
}

function openEditForm(stock: Stock) {
  editingStock.value = stock;
  showStockForm.value = true;
}

function openMouvementForm(stock: Stock, type: 'entree' | 'sortie') {
  mouvementStock.value = stock;
  mouvementType.value = type;
  showMouvementForm.value = true;
}

async function handleStockSubmit(data: StockFormData) {
  saving.value = true;
  try {
    if (editingStock.value) {
      await updateStock(editingStock.value.id, {
        nom: data.nom,
        categorie: data.categorie,
        unite: data.unite || undefined,
        seuilAlerte: data.seuilAlerte ?? undefined,
        prixUnitaire: data.prixUnitaire ?? undefined,
        fournisseur: data.fournisseur || undefined,
        emplacement: data.emplacement || undefined,
        notes: data.notes || undefined,
      });
      notifications.success('Article modifie');
    } else {
      await createStock({
        nom: data.nom,
        categorie: data.categorie,
        quantite: data.quantite,
        unite: data.unite || undefined,
        seuilAlerte: data.seuilAlerte ?? undefined,
        prixUnitaire: data.prixUnitaire ?? undefined,
        fournisseur: data.fournisseur || undefined,
        emplacement: data.emplacement || undefined,
        notes: data.notes || undefined,
      });
      notifications.success('Article cree');
    }
    showStockForm.value = false;
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
  }
}

async function handleMouvementSubmit(data: { quantite: number; motif: string }) {
  if (!mouvementStock.value) return;
  saving.value = true;
  try {
    await createMouvement({
      stockId: mouvementStock.value.id,
      type: mouvementType.value,
      quantite: data.quantite,
      motif: data.motif || undefined,
    });
    notifications.success(mouvementType.value === 'entree' ? 'Stock augmente' : 'Stock diminue');
    showMouvementForm.value = false;
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
  }
}
</script>
