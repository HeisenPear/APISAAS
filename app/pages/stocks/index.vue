<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 class="font-display text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Stocks
        </h1>
        <p class="mt-0.5 text-[13.5px] text-[var(--text-secondary)]">
          Gérez votre inventaire de miel et de matériel
        </p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Search -->
        <div class="relative hidden sm:block">
          <UIcon
            name="i-lucide-search"
            class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-quaternary)]"
          />
          <input
            v-model="search"
            type="text"
            placeholder="Rechercher…"
            class="h-9 w-44 rounded-[8px] border border-[var(--border-default)] bg-white pl-8 pr-3 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-quaternary)] outline-none transition-all focus:w-56 focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
          >
        </div>
        <!-- Alerte badge -->
        <NuxtLink
          v-if="alertCount > 0"
          to="/stocks/alertes"
          class="relative flex h-9 w-9 items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-500 transition-colors hover:bg-red-100"
        >
          <UIcon name="i-lucide-alert-triangle" class="h-4 w-4" />
          <span
            class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
          >
            {{ alertCount }}
          </span>
        </NuxtLink>
        <!-- Bouton ajouter contextuel -->
        <button
          class="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--honey)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--honey-dark)]"
          @click="openCreateForm"
        >
          <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
          {{ activeTab === 'miel' ? 'Ajouter du miel' : 'Nouvel article' }}
        </button>
      </div>
    </div>

    <UiFeatureGate feature="stocksBasique" blur>
      <template #preview>
        <div class="space-y-4">
          <div class="h-10 w-64 rounded-[8px] bg-[var(--surface-muted)]" />
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div v-for="i in 6" :key="i" class="h-28 rounded-[14px] bg-[var(--surface-muted)]" />
          </div>
        </div>
      </template>

      <!-- Tabs principaux -->
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="inline-flex rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-0.5">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-[8px] px-3.5 py-1.5 text-[12px] font-medium transition-all duration-150"
            :class="
              activeTab === tab.value
                ? 'bg-white text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            "
            @click="activeTab = tab.value"
          >
            <UIcon :name="tab.icon" class="h-3.5 w-3.5" />
            {{ tab.label }}
            <span
              v-if="tab.count > 0"
              class="ml-0.5 text-[var(--text-quaternary)]"
            >{{ tab.count }}</span>
          </button>
        </div>

        <!-- Stats pills miel -->
        <div v-if="activeTab === 'miel'" class="flex flex-wrap items-center gap-2">
          <span
            v-if="totalKgMiel > 0"
            class="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--honey-soft)] px-2.5 py-1 text-[11px] font-medium tabular-nums text-[var(--honey-deep)]"
          >
            <UIcon name="i-lucide-weight" class="h-3 w-3" />
            {{ totalKgMiel.toFixed(1) }} kg
          </span>
          <span
            v-if="valeurMiel > 0"
            class="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--honey-soft)] px-2.5 py-1 text-[11px] font-medium tabular-nums text-[var(--honey-deep)]"
          >
            <UIcon name="i-lucide-euro" class="h-3 w-3" />
            {{ valeurMiel.toFixed(0) }} €
          </span>
          <span
            v-if="alertCountMiel > 0"
            class="inline-flex items-center gap-1.5 rounded-[6px] bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-500"
          >
            <UIcon name="i-lucide-alert-triangle" class="h-3 w-3" />
            {{ alertCountMiel }} alerte{{ alertCountMiel > 1 ? 's' : '' }}
          </span>
        </div>
        <!-- Stats pills autres -->
        <div v-else class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
            <UIcon name="i-lucide-package" class="h-3 w-3 text-[var(--text-tertiary)]" />
            {{ stocksActifs.length }} article{{ stocksActifs.length > 1 ? 's' : '' }}
          </span>
          <span
            v-if="valeurAutres > 0"
            class="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-medium tabular-nums text-[var(--text-secondary)]"
          >
            <UIcon name="i-lucide-euro" class="h-3 w-3" />
            {{ valeurAutres.toFixed(0) }} €
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="mt-4">
        <UiLoadingSkeleton variant="card" :count="6" />
      </div>

      <template v-else>
        <!-- ═══════════ TAB MIEL ═══════════ -->
        <template v-if="activeTab === 'miel'">
          <!-- Bannière alerte miel -->
          <div
            v-if="alertCountMiel > 0"
            class="mb-5 flex items-start gap-3 rounded-[12px] border border-[var(--status-warn)] bg-[#fdf3e3] px-4 py-3"
          >
            <UIcon name="i-lucide-alert-triangle" class="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warn)]" />
            <div>
              <p class="text-[13px] font-semibold text-[var(--text-primary)]">
                {{ alertCountMiel }} stock{{ alertCountMiel > 1 ? 's' : '' }} de miel en alerte
              </p>
              <NuxtLink
                to="/stocks/alertes"
                class="text-[12px] font-medium text-[var(--status-warn)] hover:underline"
              >
                Voir les alertes →
              </NuxtLink>
            </div>
          </div>

          <!-- Empty state miel -->
          <UiEmptyState
            v-if="stocksMiel.length === 0"
            icon="i-lucide-droplets"
            title="Aucun stock de miel"
            description="Ajoutez votre premier stock de miel pour suivre votre inventaire"
            action-label="Ajouter du miel"
            @action="openCreateForm"
          />

          <!-- Groupes par variété -->
          <template v-else>
            <div
              v-for="groupe in groupesMielActifs"
              :key="groupe.groupe"
              class="mb-7"
            >
              <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
                {{ groupe.groupe }}
                <span class="ml-1.5 font-normal text-[var(--text-quaternary)]">
                  ({{ groupe.stocks.length }})
                </span>
              </p>
              <TransitionGroup
                name="list"
                tag="div"
                class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                <StocksStockMielCard
                  v-for="stock in groupe.stocks"
                  :key="stock.id"
                  :stock="stock"
                  @entree="openMouvementForm(stock, 'entree')"
                  @sortie="openMouvementForm(stock, 'sortie')"
                  @edit="openEditForm(stock)"
                  @delete="handleDeleteStock(stock)"
                />
              </TransitionGroup>
            </div>
          </template>

          <!-- Ventes par variété -->
          <div v-if="statsMiel && statsMiel.length > 0" class="mt-8">
            <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">Ventes par variété</p>
            <div class="overflow-hidden rounded-[12px] border border-[var(--border-default)] bg-white">
              <table class="w-full text-[13px]">
                <thead>
                  <tr class="border-b border-[var(--border-default)]">
                    <th class="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Variété</th>
                    <th class="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Kg vendus</th>
                    <th class="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">CA HT</th>
                    <th class="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Prix moy./kg</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stat in statsMiel" :key="stat.typeMiel" class="border-b border-[var(--border-default)] last:border-0">
                    <td class="px-4 py-2.5">
                      <span class="font-medium text-[var(--text-primary)]">{{ varietelabelStocks(stat.typeMiel) }}</span>
                    </td>
                    <td class="px-4 py-2.5 text-right text-[var(--text-secondary)]">{{ Number(stat.totalKg).toFixed(1) }} kg</td>
                    <td class="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">{{ formatMoney(Number(stat.totalHt)) }}</td>
                    <td class="px-4 py-2.5 text-right text-[var(--text-secondary)]">{{ Number(stat.prixMoyen).toFixed(2) }} €/kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- ═══════════ TAB AUTRES PRODUITS ═══════════ -->
        <template v-else-if="activeTab === 'produits'">
          <UiEmptyState
            v-if="stocksProduits.length === 0"
            icon="i-lucide-flask-conical"
            title="Aucun autre produit"
            description="Gelée royale, pollen, propolis, hydromel…"
            action-label="Ajouter un produit"
            @action="openCreateForm"
          />
          <div v-else>
            <TransitionGroup
              name="list"
              tag="div"
              class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <StocksStockCard
                v-for="stock in stocksProduits"
                :key="stock.id"
                :stock="stock"
                @click="openEditForm(stock)"
                @entree="openMouvementForm(stock, 'entree')"
                @sortie="openMouvementForm(stock, 'sortie')"
                @edit="openEditForm(stock)"
                @delete="handleDeleteStock(stock)"
              />
            </TransitionGroup>
          </div>
        </template>

        <!-- ═══════════ TAB MATÉRIEL ═══════════ -->
        <template v-else>
          <UiEmptyState
            v-if="stocksMateriel.length === 0"
            icon="i-lucide-warehouse"
            title="Aucun article en stock"
            description="Cadres, hausses, équipement, traitements…"
            action-label="Ajouter un article"
            @action="openCreateForm"
          />
          <div v-else>
            <div
              v-for="group in groupesMateriel"
              :key="group.categorie"
              class="mb-7"
            >
              <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
                {{ categorieLabels[group.categorie] || group.categorie }}
                <span class="ml-1.5 font-normal text-[var(--text-quaternary)]">
                  ({{ group.items.length }})
                </span>
              </p>
              <TransitionGroup
                name="list"
                tag="div"
                class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
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
              </TransitionGroup>
            </div>
          </div>
        </template>
      </template>

      <!-- ═══════════ MODAL CRÉATION / ÉDITION ═══════════ -->
      <UModal v-model:open="showStockForm">
        <template #content>
          <div class="flex max-h-[90vh] flex-col">
            <div class="shrink-0 border-b border-[var(--border-default)] px-6 py-4">
              <h2 class="text-[17px] font-semibold text-[var(--text-primary)]">
                {{ editingStock ? 'Modifier' : (activeTab === 'miel' ? 'Ajouter du miel' : 'Nouvel article') }}
              </h2>
              <p v-if="!editingStock && activeTab === 'miel'" class="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                TVA 5,5% automatique — Art. 278-0 bis A CGI
              </p>
            </div>
            <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <!-- Formulaire miel -->
              <StocksStockMielForm
                v-if="activeTab === 'miel' || editingStock?.categorieVente === 'miel'"
                :loading="saving"
                :initial="editingMielInitial"
                :submit-label="editingStock ? 'Enregistrer' : 'Ajouter au stock'"
                :show-quantite="!editingStock"
                @submit="handleMielSubmit"
                @cancel="showStockForm = false"
              />
              <!-- Formulaire générique -->
              <StocksStockForm
                v-else
                :loading="saving"
                :initial="editingGenericInitial"
                :submit-label="editingStock ? 'Enregistrer' : 'Créer'"
                :show-quantite="!editingStock"
                @submit="handleStockSubmit"
                @cancel="showStockForm = false"
              />
              <!-- Photos (edit only) -->
              <div v-if="editingStock" class="border-t border-[var(--border-default)] pt-4">
                <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">Photos</p>
                <UiPhotoUploader
                  v-model="stockPhotos"
                  bucket="produits-photos"
                  :entity-id="editingStock.id"
                  :max-photos="5"
                  @update:model-value="saveStockPhotos"
                />
              </div>
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
    </UiFeatureGate>
  </div>
</template>

<script setup lang="ts">
import type { Stock, PhotoEntry } from '~/types/models';
import type { ApiListResponse } from '~/types/api';
import type { StockFormData } from '~/components/stocks/StockForm.vue';
import type { StockMielFormData } from '~/components/stocks/StockMielForm.vue';
import { TYPES_MIEL } from '~/types/enums';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { createStock, updateStock, deleteStock, createMouvement, getAlertes } = useStocks();

const search = ref('');
const activeTab = ref<'miel' | 'produits' | 'materiel'>('miel');
const showStockForm = ref(false);
const showMouvementForm = ref(false);
const saving = ref(false);
const editingStock = ref<Stock | null>(null);
const stockPhotos = ref<PhotoEntry[]>([]);
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

const { data: stocksData, pending, refresh } = useFetch<ApiListResponse<Stock>>('/api/stocks', {
  key: 'stocks-page-list',
  query: computed(() => {
    const p: Record<string, string | number> = { limit: 100 };
    if (search.value) p.search = search.value;
    return p;
  }),
  lazy: true,
  dedupe: 'defer',
});

const { on: onStockEvent } = useDataBus();
onStockEvent(['stock:created', 'stock:updated', 'stock:deleted', 'stock:mouvement'], () => {
  refresh();
});

const allStocks = computed(() => stocksData.value?.data ?? []);

// Filtrage par tabs
const stocksMiel = computed(() =>
  allStocks.value.filter((s) => s.categorieVente === 'miel'),
);

const CATEGORIES_VENTE_PRODUITS = [
  'gelee_royale', 'pollen', 'propolis_alimentaire', 'pain_abeille',
  'cire_alimentaire', 'vinaigre_miel', 'hydromel', 'propolis_teinture',
  'cosmetique', 'cire_technique',
];
const stocksProduits = computed(() =>
  allStocks.value.filter(
    (s) => s.categorieVente && CATEGORIES_VENTE_PRODUITS.includes(s.categorieVente) && s.categorieVente !== 'miel',
  ),
);

const stocksMateriel = computed(() =>
  allStocks.value.filter(
    (s) =>
      !s.categorieVente ||
      ['materiel_apicole', 'equipement_apiculteur', 'conditionnement', 'nourrissement',
        'essaim', 'reine', 'ruche_peuplee', 'traitement_veterinaire', 'autre'].includes(s.categorieVente),
  ),
);

const stocksActifs = computed(() => {
  if (activeTab.value === 'miel') return stocksMiel.value;
  if (activeTab.value === 'produits') return stocksProduits.value;
  return stocksMateriel.value;
});

// KPIs miel
const totalKgMiel = computed(() =>
  stocksMiel.value.reduce((sum, s) => sum + Number(s.quantite), 0),
);
const valeurMiel = computed(() =>
  stocksMiel.value.reduce((sum, s) => sum + Number(s.quantite) * Number(s.prixUnitaire ?? 0), 0),
);
const alertCountMiel = computed(() =>
  stocksMiel.value.filter((s) => s.seuilAlerte && Number(s.quantite) <= Number(s.seuilAlerte)).length,
);
const valeurAutres = computed(() =>
  stocksActifs.value.reduce((sum, s) => sum + Number(s.quantite) * Number(s.prixUnitaire ?? 0), 0),
);

// Tabs definition
const tabs = computed(() => [
  {
    value: 'miel' as const,
    label: 'Miel',
    icon: 'i-lucide-droplets',
    count: stocksMiel.value.length,
  },
  {
    value: 'produits' as const,
    label: 'Autres produits',
    icon: 'i-lucide-flask-conical',
    count: stocksProduits.value.length,
  },
  {
    value: 'materiel' as const,
    label: 'Matériel',
    icon: 'i-lucide-wrench',
    count: stocksMateriel.value.length,
  },
]);

// Grouper les stocks de miel par groupe botanique
const groupesMielActifs = computed(() => {
  const grouped = new Map<string, Stock[]>();
  for (const s of stocksMiel.value) {
    const typeMeta = TYPES_MIEL.find((t) => t.value === s.typeMiel);
    const groupe = typeMeta?.groupe ?? 'Autre';
    if (!grouped.has(groupe)) grouped.set(groupe, []);
    grouped.get(groupe)!.push(s);
  }
  // Ordre prédéfini des groupes
  const ordre = ['Monofloraux', 'Polyfloraux', 'Miellats', 'Autre'];
  return ordre
    .filter((g) => grouped.has(g))
    .map((groupe) => ({ groupe, stocks: grouped.get(groupe)! }));
});

// Grouper le matériel par catégorie
const groupesMateriel = computed(() => {
  const groups = new Map<string, Stock[]>();
  for (const stock of stocksMateriel.value) {
    const cat = stock.categorie;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(stock);
  }
  return [...groups.entries()].map(([categorie, items]) => ({ categorie, items }));
});

// Stats ventes miel
interface StatMiel { typeMiel: string; totalKg: string; totalHt: string; prixMoyen: string; nbLignes: string }
const { data: statsMielData } = useFetch<{ data: StatMiel[] }>('/api/finances/stats/miel', { key: 'stats-miel' });
const statsMiel = computed(() => statsMielData.value?.data ?? []);

function varietelabelStocks(typeMiel: string) {
  return TYPES_MIEL.find((t) => t.value === typeMiel)?.label ?? typeMiel;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

// Chargement alertes
onMounted(async () => {
  try {
    const alertes = await getAlertes();
    alertCount.value = alertes.length;
  } catch {
    // ignore
  }
});

// Computed initials pour formulaires
const editingMielInitial = computed(() => {
  if (!editingStock.value) return undefined;
  const s = editingStock.value;
  return {
    typeMiel: s.typeMiel ?? '',
    presentation: s.presentation ?? '',
    conditionnementMiel: s.conditionnement ?? 'vrac',
    quantite: Number(s.quantite),
    unite: s.unite ?? 'kg',
    prixUnitaire: s.prixUnitaire ? Number(s.prixUnitaire) : null,
    seuilAlerte: s.seuilAlerte ? Number(s.seuilAlerte) : null,
    anneeRecolte: s.anneeRecolte ?? null,
    numLot: s.numLot ?? '',
    origineGeo: s.origineGeo ?? '',
    notes: s.notes ?? '',
  };
});

const editingGenericInitial = computed(() => {
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
  stockPhotos.value = ((stock as Stock & { photos?: PhotoEntry[] }).photos) ?? [];
  showStockForm.value = true;
}

async function saveStockPhotos(updated: PhotoEntry[]) {
  stockPhotos.value = updated;
  if (!editingStock.value) return;
  try {
    await $fetch(`/api/stocks/${editingStock.value.id}`, {
      method: 'PUT',
      body: { photos: updated },
    });
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur sauvegarde photos'));
  }
}

function openMouvementForm(stock: Stock, type: 'entree' | 'sortie') {
  mouvementStock.value = stock;
  mouvementType.value = type;
  showMouvementForm.value = true;
}

async function handleDeleteStock(stock: Stock) {
  const label = stock.nom ?? 'ce stock';
  if (!confirm(`Supprimer "${label}" ?\n\nTous les mouvements associés seront également supprimés. Cette action est irréversible.`)) return;
  try {
    await deleteStock(stock.id);
    notifications.success('Stock supprimé');
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la suppression'));
  }
}

async function handleMielSubmit(data: StockMielFormData) {
  saving.value = true;
  try {
    if (editingStock.value) {
      await updateStock(editingStock.value.id, {
        nom: data.nom,
        categorie: data.categorie,
        categorieVente: data.categorieVente,
        tauxTva: data.tauxTva,
        unite: data.unite || undefined,
        seuilAlerte: data.seuilAlerte ?? undefined,
        prixUnitaire: data.prixUnitaire ?? undefined,
        notes: data.notes || undefined,
        typeMiel: data.typeMiel || undefined,
        presentation: data.presentation || undefined,
        conditionnementMiel: data.conditionnementMiel || undefined,
        anneeRecolte: data.anneeRecolte ?? undefined,
        numLot: data.numLot || undefined,
        origineGeo: data.origineGeo || undefined,
      });
      notifications.success('Stock modifié');
    } else {
      await createStock({
        nom: data.nom,
        categorie: data.categorie,
        categorieVente: data.categorieVente,
        tauxTva: data.tauxTva,
        quantite: data.quantite,
        unite: data.unite || undefined,
        seuilAlerte: data.seuilAlerte ?? undefined,
        prixUnitaire: data.prixUnitaire ?? undefined,
        notes: data.notes || undefined,
        typeMiel: data.typeMiel || undefined,
        presentation: data.presentation || undefined,
        conditionnementMiel: data.conditionnementMiel || undefined,
        anneeRecolte: data.anneeRecolte ?? undefined,
        numLot: data.numLot || undefined,
        origineGeo: data.origineGeo || undefined,
      });
      notifications.success('Stock de miel ajouté');
    }
    showStockForm.value = false;
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
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
