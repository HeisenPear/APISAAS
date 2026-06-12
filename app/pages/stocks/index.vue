<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1
          class="font-display text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
        >
          Stocks
        </h1>
        <p class="mt-0.5 text-[13.5px] text-[var(--text-secondary)]">
          {{
            activeTab === 'produits'
              ? 'Vos produits à vendre — miel, pollen, conditionnés…'
              : "Votre matériel d'exploitation — cadres, hausses, outillage…"
          }}
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
          />
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
        <button
          class="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--honey)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--honey-dark)]"
          @click="activeTab === 'materiel' ? openAchatMateriel() : openCreateForm()"
        >
          <UIcon
            :name="activeTab === 'materiel' ? 'i-lucide-shopping-cart' : 'i-lucide-plus'"
            class="h-3.5 w-3.5"
          />
          {{ activeTab === 'materiel' ? 'Acheter du matériel' : 'Ajouter' }}
        </button>
      </div>
    </div>

    <!-- Onglets : Produits à vendre / Matériel -->
    <div class="mb-5 flex gap-1 border-b border-[var(--border-default)]">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="relative -mb-px px-4 py-2.5 text-[13.5px] font-medium transition-colors"
        :class="
          activeTab === tab.key
            ? 'text-[var(--honey-deep)]'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        "
        @click="activeTab = tab.key"
      >
        <span class="inline-flex items-center gap-1.5">
          <UIcon :name="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
          <span
            v-if="tab.count > 0"
            class="rounded-full bg-[var(--surface-muted)] px-1.5 text-[11px] tabular-nums text-[var(--text-tertiary)]"
          >
            {{ tab.count }}
          </span>
        </span>
        <span
          v-if="activeTab === tab.key"
          class="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--honey)]"
        />
      </button>
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

      <Transition name="tab" mode="out-in">
        <!-- ═══════════ ONGLET PRODUITS À VENDRE ═══════════ -->
        <div v-if="activeTab === 'produits'" key="produits">
          <!-- Stats pills miel -->
          <div class="mb-5 flex flex-wrap items-center gap-2">
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
            <span class="ml-auto text-[11px] text-[var(--text-quaternary)]">
              {{ stocksMiel.length }} stock{{ stocksMiel.length > 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Loading -->
          <div v-if="pending" class="mt-4">
            <UiLoadingSkeleton variant="card" :count="6" />
          </div>

          <template v-else>
            <!-- Bannière alerte miel -->
            <div
              v-if="alertCountMiel > 0"
              class="mb-5 flex items-start gap-3 rounded-[12px] border border-[var(--status-warn)] bg-[#fdf3e3] px-4 py-3"
            >
              <UIcon
                name="i-lucide-alert-triangle"
                class="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warn)]"
              />
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
              title="Vos pots sont encore vides ici 🍯"
              description="Ajoutez votre premier lot de miel et je tiens votre inventaire à jour — quantités, variétés et valeur."
              action-label="Ajouter du miel"
              @action="openCreateForm"
            />

            <!-- Groupes par variété -->
            <template v-else>
              <div v-for="groupe in groupesMielActifs" :key="groupe.groupe" class="mb-7">
                <p
                  class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
                >
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
              <p
                class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
              >
                Ventes par variété
              </p>
              <div
                class="overflow-hidden rounded-[12px] border border-[var(--border-default)] bg-white"
              >
                <table class="w-full text-[13px]">
                  <thead>
                    <tr class="border-b border-[var(--border-default)]">
                      <th
                        class="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
                      >
                        Variété
                      </th>
                      <th
                        class="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
                      >
                        Kg vendus
                      </th>
                      <th
                        class="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
                      >
                        CA HT
                      </th>
                      <th
                        class="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
                      >
                        Prix moy./kg
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="stat in statsMiel"
                      :key="stat.typeMiel"
                      class="border-b border-[var(--border-default)] last:border-0"
                    >
                      <td class="px-4 py-2.5">
                        <span class="font-medium text-[var(--text-primary)]">{{
                          varietelabelStocks(stat.typeMiel)
                        }}</span>
                      </td>
                      <td class="px-4 py-2.5 text-right text-[var(--text-secondary)]">
                        {{ Number(stat.totalKg).toFixed(1) }} kg
                      </td>
                      <td class="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">
                        {{ formatMoney(Number(stat.totalHt)) }}
                      </td>
                      <td class="px-4 py-2.5 text-right text-[var(--text-secondary)]">
                        {{ Number(stat.prixMoyen).toFixed(2) }} €/kg
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Autres produits à vendre (non-miel : pollen, propolis, conditionnés…) -->
            <div v-if="autresProduits.length > 0" class="mt-8">
              <p
                class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
              >
                Autres produits
                <span class="ml-1.5 font-normal text-[var(--text-quaternary)]"
                  >({{ autresProduits.length }})</span
                >
              </p>
              <TransitionGroup
                name="list"
                tag="div"
                class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                <StocksStockCard
                  v-for="stock in autresProduits"
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
        </div>

        <!-- ═══════════ ONGLET MATÉRIEL ═══════════ -->
        <div v-else key="materiel">
          <div v-if="pending" class="mt-4">
            <UiLoadingSkeleton variant="card" :count="6" />
          </div>
          <template v-else>
            <!-- KPIs matériel -->
            <div class="mb-5 flex flex-wrap items-center gap-2">
              <span
                v-if="valeurMateriel > 0"
                class="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-medium tabular-nums text-[var(--text-secondary)]"
              >
                <UIcon name="i-lucide-euro" class="h-3 w-3" />
                {{ valeurMateriel.toFixed(0) }} € de matériel
              </span>
              <span class="ml-auto text-[11px] text-[var(--text-quaternary)]">
                {{ stocksMateriel.length }} article{{ stocksMateriel.length > 1 ? 's' : '' }}
              </span>
            </div>

            <UiEmptyState
              v-if="stocksMateriel.length === 0"
              icon="i-lucide-package"
              title="Votre atelier est encore vide"
              description="Enregistrez un achat de matériel : il rejoint votre inventaire et la dépense est créée automatiquement en compta."
              action-label="Acheter du matériel"
              @action="openAchatMateriel"
            />

            <TransitionGroup
              v-else
              name="list"
              tag="div"
              class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <StocksStockCard
                v-for="stock in stocksMateriel"
                :key="stock.id"
                :stock="stock"
                @entree="openMouvementForm(stock, 'entree')"
                @sortie="openMouvementForm(stock, 'sortie')"
                @edit="openEditForm(stock)"
                @delete="handleDeleteStock(stock)"
              />
            </TransitionGroup>
          </template>
        </div>
      </Transition>

      <!-- ═══════════ MODAL CHOIX TYPE (création uniquement) ═══════════ -->
      <Teleport to="body">
        <Transition name="fade">
          <div
            v-if="showTypeChoice"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            @click.self="showTypeChoice = false"
          >
            <div
              class="w-full max-w-xs rounded-[18px] border border-[var(--border-default)] bg-white p-6 shadow-xl"
            >
              <div class="mb-5 flex items-center justify-between">
                <h3 class="text-[15px] font-semibold text-[var(--text-primary)]">
                  Quel type de stock ?
                </h3>
                <button
                  class="rounded-[8px] p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-muted)]"
                  @click="showTypeChoice = false"
                >
                  <UIcon name="i-lucide-x" class="h-4 w-4" />
                </button>
              </div>
              <div class="space-y-2.5">
                <!-- Miel -->
                <button
                  class="flex w-full items-center gap-3 rounded-[12px] border-2 border-[var(--honey-soft)] bg-[var(--honey-soft)] px-4 py-3 text-left transition-all hover:border-[var(--honey)] hover:bg-[var(--honey-soft)]"
                  @click="selectCreateType('miel')"
                >
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                    style="background: var(--honey)"
                  >
                    <UIcon name="i-lucide-droplets" class="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p class="text-[13px] font-semibold text-[var(--text-primary)]">Miel</p>
                    <p class="text-[11.5px] text-[var(--text-secondary)]">
                      Acacia, toutes fleurs, châtaignier…
                    </p>
                  </div>
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="ml-auto h-4 w-4 text-[var(--text-quaternary)]"
                  />
                </button>
                <!-- Autre produit -->
                <button
                  class="flex w-full items-center gap-3 rounded-[12px] border-2 border-[var(--border-default)] bg-[var(--surface-muted)] px-4 py-3 text-left transition-all hover:border-[var(--border-hover)] hover:bg-[var(--surface-card)]"
                  @click="selectCreateType('autre')"
                >
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-card)] border border-[var(--border-default)]"
                  >
                    <UIcon name="i-lucide-package" class="h-5 w-5 text-[var(--text-secondary)]" />
                  </div>
                  <div>
                    <p class="text-[13px] font-semibold text-[var(--text-primary)]">
                      Autre produit
                    </p>
                    <p class="text-[11.5px] text-[var(--text-secondary)]">
                      Gelée royale, pollen, propolis, matériel…
                    </p>
                  </div>
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="ml-auto h-4 w-4 text-[var(--text-quaternary)]"
                  />
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ═══════════ MODAL CRÉATION / ÉDITION ═══════════ -->
      <UModal v-model:open="showStockForm">
        <template #content>
          <div class="flex max-h-[90vh] flex-col">
            <div class="shrink-0 border-b border-[var(--border-default)] px-6 py-4">
              <h2 class="text-[17px] font-semibold text-[var(--text-primary)]">
                {{
                  editingStock
                    ? 'Modifier le stock'
                    : formType === 'miel'
                      ? 'Ajouter du miel'
                      : 'Ajouter un produit'
                }}
              </h2>
              <p
                v-if="!editingStock && formType === 'miel'"
                class="mt-0.5 text-[12px] text-[var(--text-tertiary)]"
              >
                TVA 5,5% automatique — Art. 278-0 bis A CGI
              </p>
            </div>
            <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <!-- Formulaire miel -->
              <StocksStockMielForm
                v-if="formType === 'miel'"
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
                <p
                  class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
                >
                  Photos
                </p>
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

      <!-- Modal achat de matériel -->
      <UModal v-model:open="showAchatMateriel">
        <template #content>
          <div class="flex max-h-[90vh] flex-col">
            <div class="shrink-0 border-b border-[var(--border-default)] px-6 py-4">
              <h2 class="text-[17px] font-semibold text-[var(--text-primary)]">
                Acheter du matériel
              </h2>
              <p class="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
                Entrée en stock + dépense comptable automatique
              </p>
            </div>
            <div class="flex-1 overflow-y-auto px-6 py-5">
              <StocksAchatMaterielForm
                :loading="saving"
                @submit="handleAchatMateriel"
                @cancel="showAchatMateriel = false"
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
              :stock-categorie="mouvementStockCategorie"
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
import type { StockMielFormData } from '~/components/stocks/StockMielForm.vue';
import type { StockFormData } from '~/components/stocks/StockForm.vue';
import type { AchatMaterielData } from '~/components/stocks/AchatMaterielForm.vue';
import { TYPES_MIEL } from '~/types/enums';
import { valeurStockMiel, poidsTotalMielKg } from '~/utils/stockMiel';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { createStock, updateStock, deleteStock, createMouvement, getAlertes } = useStocks();

const activeTab = ref<'produits' | 'materiel'>('produits');
const search = ref('');
const showTypeChoice = ref(false);
const showStockForm = ref(false);
const showMouvementForm = ref(false);
const showAchatMateriel = ref(false);
const saving = ref(false);
const editingStock = ref<Stock | null>(null);
const createType = ref<'miel' | 'autre'>('miel');
const stockPhotos = ref<PhotoEntry[]>([]);
const mouvementStock = ref<Stock | null>(null);
const mouvementType = ref<'entree' | 'sortie' | 'ajustement'>('entree');
const alertCount = ref(0);

// Le type de formulaire à afficher : miel pour les miels, autre pour le reste
const formType = computed(() =>
  editingStock.value
    ? editingStock.value.categorieVente === 'miel'
      ? 'miel'
      : 'autre'
    : createType.value,
);

const {
  data: stocksData,
  pending,
  refresh,
} = useFetch<ApiListResponse<Stock>>('/api/stocks', {
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

// Type effectif d'un article — robuste aux données legacy (créées avant le
// champ `type`, défaut 'materiel' en base). Un article avec une categorieVente
// ou un typeMiel renseigné est considéré comme produit à vendre même si son
// `type` n'a pas encore été backfillé.
function effectiveType(s: Stock): 'materiel' | 'produit_vente' {
  if (s.type === 'produit_vente') return 'produit_vente';
  if (s.type === 'materiel' && (s.categorieVente || s.typeMiel)) return 'produit_vente';
  return s.type ?? 'materiel';
}

const stocksProduits = computed(() =>
  allStocks.value.filter((s) => effectiveType(s) === 'produit_vente'),
);
const stocksMateriel = computed(() =>
  allStocks.value.filter((s) => effectiveType(s) === 'materiel'),
);

// Valeur d'un stock : quantite × contenance × prix/kg (mode poids) ou quantite × prix (mode format)
function stockValeur(s: Stock): number {
  const q = Number(s.quantite ?? 0);
  const p = Number(s.prixUnitaire ?? 0);
  if (s.modePrix === 'poids') {
    const c = Number(s.contenance ?? 0);
    if (c > 0) return Math.round((q * c * p + Number.EPSILON) * 100) / 100;
  }
  return Math.round((q * p + Number.EPSILON) * 100) / 100;
}

const valeurMateriel = computed(() =>
  stocksMateriel.value.reduce((sum, s) => sum + stockValeur(s), 0),
);

const tabs = computed(() => [
  {
    key: 'produits' as const,
    label: 'Produits à vendre',
    icon: 'i-lucide-droplets',
    count: stocksProduits.value.length,
  },
  {
    key: 'materiel' as const,
    label: 'Matériel',
    icon: 'i-lucide-package',
    count: stocksMateriel.value.length,
  },
]);

const stocksMiel = computed(() =>
  stocksProduits.value.filter((s) => s.categorieVente === 'miel' || s.typeMiel),
);

// Produits à vendre qui ne sont pas du miel
const autresProduits = computed(() =>
  stocksProduits.value.filter((s) => !(s.categorieVente === 'miel' || s.typeMiel)),
);

// KPIs miel — formule centralisée (n·m·p)/1000 avec gestion g/kg via conditionnement
const totalKgMiel = computed(() =>
  stocksMiel.value.reduce((sum, s) => sum + poidsTotalMielKg(s), 0),
);
// Valeur réelle du stock : V = (n · m · p) / 1000 — voir ~/utils/stockMiel.ts
const valeurMiel = computed(() => stocksMiel.value.reduce((sum, s) => sum + valeurStockMiel(s), 0));
const alertCountMiel = computed(
  () =>
    stocksMiel.value.filter((s) => s.seuilAlerte && Number(s.quantite) <= Number(s.seuilAlerte))
      .length,
);

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

// Stats ventes miel
interface StatMiel {
  typeMiel: string;
  totalKg: string;
  totalHt: string;
  prixMoyen: string;
  nbLignes: string;
}
const { data: statsMielData, refresh: refreshStatsMiel } = useFetch<{ data: StatMiel[] }>(
  '/api/finances/stats/miel',
  { key: 'stats-miel', lazy: true },
);
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

// Initials pour formulaires
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

const mouvementStockNom = computed(() => mouvementStock.value?.nom ?? '');
const mouvementStockQuantite = computed(() =>
  mouvementStock.value ? Number(mouvementStock.value.quantite) : undefined,
);
const mouvementStockUnite = computed(() => mouvementStock.value?.unite ?? undefined);
const mouvementStockCategorie = computed(() => mouvementStock.value?.categorie ?? undefined);

function openCreateForm() {
  editingStock.value = null;
  stockPhotos.value = [];
  showTypeChoice.value = true;
}

function selectCreateType(type: 'miel' | 'autre') {
  createType.value = type;
  showTypeChoice.value = false;
  showStockForm.value = true;
}

function openAchatMateriel() {
  showAchatMateriel.value = true;
}

async function handleAchatMateriel(data: AchatMaterielData) {
  saving.value = true;
  try {
    // L'achat crée la dépense Finances ET l'entrée stock (type materiel)
    await $fetch('/api/finances/achats', {
      method: 'POST',
      body: {
        dateTransaction: data.dateTransaction,
        tauxTva: data.tauxTva,
        statut: 'payee',
        notes: data.notes || undefined,
        categorie: 'materiel',
        lignes: [
          {
            description: data.nom,
            quantite: data.quantite,
            prixUnitaire: data.prixUnitaire,
            ajouterAuStock: true,
            stockType: 'materiel',
            stockCategorie: data.categorie,
            stockUnite: data.unite,
            stockSeuilAlerte: data.seuilAlerte ?? undefined,
          },
        ],
      },
    });
    notifications.success('C’est fait : stock complété et dépense enregistrée ✅');
    showAchatMateriel.value = false;
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement de l'achat"));
  } finally {
    saving.value = false;
  }
}

function openEditForm(stock: Stock) {
  editingStock.value = stock;
  stockPhotos.value = (stock as Stock & { photos?: PhotoEntry[] }).photos ?? [];
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
  if (
    !confirm(
      `Supprimer "${label}" ?\n\nTous les mouvements associés seront également supprimés. Cette action est irréversible.`,
    )
  )
    return;

  // Optimistic update — retire immédiatement de la liste locale
  const previous = stocksData.value?.data ? [...stocksData.value.data] : null;
  if (stocksData.value?.data) {
    stocksData.value.data = stocksData.value.data.filter((s) => s.id !== stock.id);
  }

  try {
    await deleteStock(stock.id);
    notifications.success('Stock supprimé');
    refresh();
    refreshStatsMiel();
  } catch (e: unknown) {
    // Rollback en cas d'erreur
    if (previous && stocksData.value) stocksData.value.data = previous;
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
      notifications.success('Miel ajouté à votre stock 🍯');
    }
    showStockForm.value = false;
    await refresh();
    await refreshStatsMiel();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
  }
}

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
    modePrix: (s.modePrix as 'format' | 'poids' | undefined) ?? 'format',
    contenance: s.contenance != null ? Number(s.contenance) : null,
    uniteContenance: s.uniteContenance ?? '',
    seuilAlerte: s.seuilAlerte ? Number(s.seuilAlerte) : null,
    prixUnitaire: s.prixUnitaire ? Number(s.prixUnitaire) : null,
    fournisseur: s.fournisseur ?? '',
    emplacement: s.emplacement ?? '',
    notes: s.notes ?? '',
  };
});

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
        modePrix: data.modePrix,
        contenance: data.contenance ?? undefined,
        uniteContenance: data.uniteContenance || undefined,
        seuilAlerte: data.seuilAlerte ?? undefined,
        prixUnitaire: data.prixUnitaire ?? undefined,
        fournisseur: data.fournisseur || undefined,
        emplacement: data.emplacement || undefined,
        notes: data.notes || undefined,
      });
      notifications.success('Produit modifié');
    } else {
      await createStock({
        nom: data.nom,
        type: 'produit_vente',
        categorie: data.categorie,
        categorieVente: data.categorieVente || undefined,
        tauxTva: data.tauxTva ?? undefined,
        quantite: data.quantite,
        unite: data.unite || undefined,
        modePrix: data.modePrix,
        contenance: data.contenance ?? undefined,
        uniteContenance: data.uniteContenance || undefined,
        seuilAlerte: data.seuilAlerte ?? undefined,
        prixUnitaire: data.prixUnitaire ?? undefined,
        fournisseur: data.fournisseur || undefined,
        emplacement: data.emplacement || undefined,
        notes: data.notes || undefined,
      });
      notifications.success('Produit créé');
    }
    showStockForm.value = false;
    await refresh();
    await refreshStatsMiel();
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
    await refreshStatsMiel();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
