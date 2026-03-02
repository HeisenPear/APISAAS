<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Stocks">
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

        <!-- Alerte link -->
        <NuxtLink
          v-if="alertCount > 0"
          to="/stocks/alertes"
          class="relative flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-100"
        >
          <UIcon name="i-lucide-alert-triangle" class="h-4 w-4" />
          <span
            class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
          >
            {{ alertCount }}
          </span>
        </NuxtLink>

        <!-- CTA -->
        <UButton
          label="Nouvel article"
          icon="i-lucide-plus"
          color="primary"
          @click="openCreateForm"
        />
      </template>
    </UiPageHeader>

    <!-- Toolbar: segmented filter + stats -->
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
          @click="activeSegment = seg.value"
        >
          {{ seg.label }}
          <span v-if="seg.count > 0" class="ml-1 text-stone-300">{{ seg.count }}</span>
        </button>
      </div>

      <!-- Stats pills -->
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
        >
          <UIcon name="i-lucide-package" class="h-3 w-3 text-stone-400" />
          {{ totalStocks }} article{{ totalStocks > 1 ? 's' : '' }}
        </span>
        <span
          v-if="totalValue > 0"
          class="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium tabular-nums text-amber-700"
        >
          <UIcon name="i-lucide-euro" class="h-3 w-3 text-amber-400" />
          {{ totalValue.toFixed(2) }}
        </span>
        <span
          v-if="alertCount > 0"
          class="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600"
        >
          <UIcon name="i-lucide-alert-triangle" class="h-3 w-3" />
          {{ alertCount }} alerte{{ alertCount > 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="mt-6">
      <UiLoadingSkeleton variant="card" :count="6" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="segmentedStocks.length === 0 && !hasFilters"
      icon="i-lucide-warehouse"
      title="Aucun article en stock"
      description="Ajoutez vos premiers articles pour gérer votre inventaire"
      action-label="Ajouter un article"
      @action="openCreateForm"
    />

    <!-- No results -->
    <div
      v-else-if="segmentedStocks.length === 0 && hasFilters"
      class="mt-8 text-center text-sm text-stone-400"
    >
      Aucun article ne correspond aux filtres
    </div>

    <!-- Grid grouped by category -->
    <template v-else>
      <div v-for="group in groupedByCategory" :key="group.categorie" class="mt-6">
        <div class="mb-3 flex items-center gap-2.5">
          <div
            class="flex h-7 w-7 items-center justify-center rounded-lg"
            :class="categoryIconStyle(group.categorie).bg"
          >
            <UIcon
              :name="categoryIconStyle(group.categorie).icon"
              class="h-4 w-4"
              :class="categoryIconStyle(group.categorie).text"
            />
          </div>
          <h3 class="text-sm font-semibold text-stone-700">
            {{ categorieLabels[group.categorie] || group.categorie }}
          </h3>
          <span
            class="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-stone-400"
          >
            {{ group.items.length }}
          </span>
          <div class="flex-1 border-b border-stone-100" />
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StocksStockCard
            v-for="stock in group.items"
            :key="stock.id"
            :stock="stock"
            @click="openEditForm(stock)"
            @entree="openMouvementForm(stock, 'entree')"
            @sortie="openMouvementForm(stock, 'sortie')"
            @edit="openEditForm(stock)"
            @delete="handleDeleteStock(stock)"
          />
        </div>
      </div>
    </template>

    <!-- Modal creation/edition -->
    <UModal v-model:open="showStockForm">
      <template #content>
        <div class="flex max-h-[85vh] flex-col">
          <!-- Header fixe -->
          <div class="shrink-0 border-b border-stone-100 px-6 py-4">
            <h2 class="text-lg font-semibold text-stone-900">
              {{ editingStock ? "Modifier l'article" : 'Nouvel article' }}
            </h2>
            <p class="mt-0.5 text-xs text-stone-400">
              {{
                editingStock
                  ? 'Modifiez les informations ci-dessous'
                  : 'Remplissez les informations du nouvel article'
              }}
            </p>
          </div>
          <!-- Contenu scrollable -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <StocksStockForm
              :loading="saving"
              :initial="editingInitial"
              :submit-label="editingStock ? 'Enregistrer' : 'Créer'"
              :show-quantite="!editingStock"
              @submit="handleStockSubmit"
              @cancel="showStockForm = false"
            />
          </div>
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
            :stock-quantite="mouvementStockQuantite"
            :stock-unite="mouvementStockUnite"
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
import { FAMILLE_PAR_CATEGORIE_VENTE } from '~/types/enums';
import type { CategorieVente, FamilleStock } from '~/types/enums';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { createStock, updateStock, deleteStock, createMouvement, getAlertes } = useStocks();

const search = ref('');
const activeSegment = ref<FamilleStock>('tous');
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
  equipement: 'Équipement',
  outillage: 'Outillage',
  autre: 'Autre',
};

function categoryIconStyle(cat: string): { icon: string; bg: string; text: string } {
  const map: Record<string, { icon: string; bg: string; text: string }> = {
    cadres: { icon: 'i-lucide-square', bg: 'bg-amber-100', text: 'text-amber-600' },
    hausses: { icon: 'i-lucide-layers', bg: 'bg-amber-100', text: 'text-amber-600' },
    corps: { icon: 'i-lucide-box', bg: 'bg-amber-100', text: 'text-amber-600' },
    nourrissement: { icon: 'i-lucide-candy', bg: 'bg-blue-100', text: 'text-blue-600' },
    traitement: { icon: 'i-lucide-shield', bg: 'bg-emerald-100', text: 'text-emerald-600' },
    conditionnement: { icon: 'i-lucide-package', bg: 'bg-purple-100', text: 'text-purple-600' },
    equipement: { icon: 'i-lucide-hard-hat', bg: 'bg-orange-100', text: 'text-orange-600' },
    outillage: { icon: 'i-lucide-wrench', bg: 'bg-stone-200', text: 'text-stone-600' },
    autre: { icon: 'i-lucide-circle-dot', bg: 'bg-stone-200', text: 'text-stone-500' },
  };
  return map[cat] ?? map.autre!;
}

const hasFilters = computed(() => search.value !== '' || activeSegment.value !== 'tous');

const queryParams = computed(() => {
  const params: Record<string, string | number> = { limit: 100 };
  if (search.value) params.search = search.value;
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

/** Get famille for a stock item */
function getFamille(stock: Stock): FamilleStock {
  if (stock.categorieVente) {
    return FAMILLE_PAR_CATEGORIE_VENTE[stock.categorieVente as CategorieVente] ?? 'materiel';
  }
  // Fallback based on categorie stock
  const cat = stock.categorie;
  if (['conditionnement', 'nourrissement'].includes(cat)) return 'produits';
  if (['traitement'].includes(cat)) return 'elevage';
  return 'materiel';
}

/** Count per segment for badge */
const segmentCounts = computed(() => {
  const counts = { tous: 0, produits: 0, elevage: 0, materiel: 0 };
  for (const stock of filteredStocks.value) {
    counts.tous++;
    const f = getFamille(stock);
    if (f !== 'tous') counts[f]++;
  }
  return counts;
});

const segments = computed(() => [
  { value: 'tous' as FamilleStock, label: 'Tous', count: segmentCounts.value.tous },
  { value: 'produits' as FamilleStock, label: 'Produits', count: segmentCounts.value.produits },
  { value: 'elevage' as FamilleStock, label: 'Élevage', count: segmentCounts.value.elevage },
  { value: 'materiel' as FamilleStock, label: 'Matériel', count: segmentCounts.value.materiel },
]);

/** Final filtered list (search already applied via API, segment applied client-side) */
const segmentedStocks = computed(() => {
  if (activeSegment.value === 'tous') return filteredStocks.value;
  return filteredStocks.value.filter((s) => getFamille(s) === activeSegment.value);
});

/** Group segmented stocks by catégorie stock */
const groupedByCategory = computed(() => {
  const groups = new Map<string, Stock[]>();
  for (const stock of segmentedStocks.value) {
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
    categorieVente: s.categorieVente ?? '',
    tauxTva: s.tauxTva ? Number(s.tauxTva) : null,
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
const mouvementStockQuantite = computed(() =>
  mouvementStock.value ? Number(mouvementStock.value.quantite) : undefined,
);
const mouvementStockUnite = computed(() => mouvementStock.value?.unite ?? undefined);

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

async function handleDeleteStock(stock: Stock) {
  if (!confirm(`Supprimer "${stock.nom}" ? Cette action est irréversible.`)) return;
  try {
    await deleteStock(stock.id);
    notifications.success('Article supprimé');
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la suppression'));
  }
}

async function handleStockSubmit(data: StockFormData) {
  saving.value = true;
  try {
    if (editingStock.value) {
      await updateStock(editingStock.value.id, {
        nom: data.nom,
        categorie: data.categorie,
        categorieVente: data.categorieVente || undefined,
        tauxTva: data.tauxTva ?? undefined,
        unite: data.unite || undefined,
        seuilAlerte: data.seuilAlerte ?? undefined,
        prixUnitaire: data.prixUnitaire ?? undefined,
        fournisseur: data.fournisseur || undefined,
        emplacement: data.emplacement || undefined,
        notes: data.notes || undefined,
      });
      notifications.success('Article modifié');
    } else {
      await createStock({
        nom: data.nom,
        categorie: data.categorie,
        categorieVente: data.categorieVente || undefined,
        tauxTva: data.tauxTva ?? undefined,
        quantite: data.quantite,
        unite: data.unite || undefined,
        seuilAlerte: data.seuilAlerte ?? undefined,
        prixUnitaire: data.prixUnitaire ?? undefined,
        fournisseur: data.fournisseur || undefined,
        emplacement: data.emplacement || undefined,
        notes: data.notes || undefined,
      });
      notifications.success('Article créé');
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
    notifications.success(mouvementType.value === 'entree' ? 'Stock augmenté' : 'Stock diminué');
    showMouvementForm.value = false;
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
  }
}
</script>
