<template>
  <div>
    <UiPageHeader
      title="Charges & Achats"
      description="Suivez vos depenses et charges"
      :breadcrumbs="[{ label: 'Finances', to: '/finances' }, { label: 'Achats' }]"
    >
      <template #actions>
        <UButton
          label="Nouvel achat"
          icon="i-lucide-plus"
          color="primary"
          @click="showForm = true"
        />
      </template>
    </UiPageHeader>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-16 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <!-- Empty -->
    <UiEmptyState
      v-else-if="achatsList.length === 0"
      icon="i-lucide-shopping-bag"
      title="Aucune charge"
      description="Enregistrez vos premieres depenses"
      action-label="Nouvel achat"
      @action="showForm = true"
    />

    <!-- List -->
    <div v-else class="space-y-2">
      <div
        v-for="achat in achatsList"
        :key="achat.id"
        class="flex items-center justify-between rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-stone-900">{{ achat.numero }}</span>
            <span
              v-if="achat.categorie"
              class="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs font-medium text-stone-600"
            >
              {{ categorieLabel(achat.categorie) }}
            </span>
          </div>
          <p class="mt-0.5 text-xs text-stone-400">
            {{ formatDate(achat.dateTransaction) }}
            <template v-if="achat.notes"> — {{ achat.notes }}</template>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm font-bold text-stone-900">{{
            formatMoney(Number(achat.total ?? 0))
          }}</span>
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="error"
            @click="handleDelete(achat.id)"
          />
        </div>
      </div>
    </div>

    <!-- Create modal -->
    <UModal v-model:open="showForm">
      <template #content>
        <div class="max-h-[80vh] overflow-y-auto p-6">
          <h2 class="mb-4 text-lg font-semibold text-stone-900">Nouvel achat</h2>
          <form class="space-y-4" @submit.prevent="handleCreate">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-sm text-stone-600">Date</label>
                <input
                  v-model="achatForm.dateTransaction"
                  type="date"
                  required
                  class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm text-stone-600">Categorie</label>
                <select
                  v-model="achatForm.categorie"
                  class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">Non categorise</option>
                  <option value="materiel">Materiel</option>
                  <option value="nourrissement">Nourrissement</option>
                  <option value="traitement">Traitement</option>
                  <option value="emballage">Emballage</option>
                  <option value="transport">Transport</option>
                  <option value="assurance">Assurance</option>
                  <option value="formation">Formation</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm text-stone-600">Description</label>
              <input
                v-model="achatForm.description"
                type="text"
                required
                placeholder="Ex: 10 cadres Dadant"
                class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="mb-1 block text-sm text-stone-600">Quantite</label>
                <input
                  v-model.number="achatForm.quantite"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm text-stone-600">Prix unitaire</label>
                <input
                  v-model.number="achatForm.prixUnitaire"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm text-stone-600">TVA</label>
                <select
                  v-model.number="achatForm.tauxTva"
                  class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option :value="5.5">5,5% — Alimentaire</option>
                  <option :value="10">10% — Intermediaire</option>
                  <option :value="20">20% — Normal</option>
                  <option :value="0">0% — Exonere</option>
                </select>
              </div>
            </div>

            <!-- Total preview -->
            <div class="rounded-xl bg-stone-50 p-3 text-right text-sm">
              <span class="text-stone-500">Total TTC: </span>
              <span class="font-bold text-stone-900">{{ formatMoney(achatTotal) }}</span>
            </div>

            <!-- Stock integration -->
            <div
              class="rounded-2xl border-2 border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white p-4"
            >
              <label class="flex cursor-pointer items-center gap-3">
                <input
                  v-model="achatForm.ajouterAuStock"
                  type="checkbox"
                  class="h-5 w-5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div class="flex items-center gap-2">
                  <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
                    <UIcon name="i-lucide-warehouse" class="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <span class="text-sm font-semibold text-stone-900">Ajouter au stock</span>
                    <p class="text-xs text-stone-500">
                      Met a jour automatiquement votre inventaire
                    </p>
                  </div>
                </div>
              </label>

              <div v-if="achatForm.ajouterAuStock" class="mt-4 space-y-3">
                <!-- Existing stock match -->
                <div v-if="matchingStocks.length > 0">
                  <p class="mb-2 text-xs font-medium text-emerald-800">
                    Produit existant dans vos stocks :
                  </p>
                  <div class="space-y-1.5">
                    <label
                      v-for="stock in matchingStocks"
                      :key="stock.id"
                      class="flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all"
                      :class="
                        achatForm.stockId === stock.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-stone-200 bg-white hover:border-emerald-300'
                      "
                    >
                      <input
                        v-model="achatForm.stockId"
                        type="radio"
                        :value="stock.id"
                        class="text-emerald-600 focus:ring-emerald-500"
                      />
                      <div class="flex-1">
                        <span class="text-sm font-medium text-stone-900">{{ stock.nom }}</span>
                        <span class="ml-2 text-xs text-stone-400"
                          >{{ Number(stock.quantite) }} {{ stock.unite ?? 'u' }} en stock</span
                        >
                      </div>
                    </label>
                    <label
                      class="flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all"
                      :class="
                        achatForm.stockId === ''
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-stone-200 bg-white hover:border-emerald-300'
                      "
                    >
                      <input
                        v-model="achatForm.stockId"
                        type="radio"
                        value=""
                        class="text-emerald-600 focus:ring-emerald-500"
                      />
                      <div class="flex items-center gap-1.5">
                        <UIcon name="i-lucide-plus-circle" class="h-4 w-4 text-emerald-600" />
                        <span class="text-sm font-medium text-emerald-700"
                          >Creer un nouveau produit</span
                        >
                      </div>
                    </label>
                  </div>
                </div>

                <!-- New stock fields (shown if no match or user chose "new") -->
                <div v-if="showNewStockFields" class="space-y-3 rounded-xl bg-white p-3">
                  <p class="text-xs font-medium text-stone-600">Nouveau produit en stock :</p>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="mb-1 block text-xs text-stone-500">Categorie de stock</label>
                      <select
                        v-model="achatForm.stockCategorie"
                        class="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="cadres">Cadres</option>
                        <option value="hausses">Hausses</option>
                        <option value="corps">Corps</option>
                        <option value="nourrissement">Nourrissement</option>
                        <option value="traitement">Traitement</option>
                        <option value="conditionnement">Conditionnement</option>
                        <option value="equipement">Equipement</option>
                        <option value="outillage">Outillage</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label class="mb-1 block text-xs text-stone-500">Unite</label>
                      <select
                        v-model="achatForm.stockUnite"
                        class="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="unites">Unites</option>
                        <option value="kg">Kilogrammes</option>
                        <option value="litres">Litres</option>
                        <option value="pots">Pots</option>
                        <option value="paquets">Paquets</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label class="mb-1 block text-xs text-stone-500">
                      <UIcon name="i-lucide-bell" class="inline h-3.5 w-3.5 text-amber-500" />
                      Alerte stock bas (seuil minimum)
                    </label>
                    <div class="flex items-center gap-2">
                      <input
                        v-model.number="achatForm.stockSeuilAlerte"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Ex: 5"
                        class="w-32 rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                      <span class="text-xs text-stone-400">{{
                        achatForm.stockUnite || 'unites'
                      }}</span>
                      <span class="ml-auto text-xs text-stone-400"
                        >Vous serez alerte en dessous de ce seuil</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm text-stone-600">Notes</label>
              <textarea
                v-model="achatForm.notes"
                :rows="2"
                class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                placeholder="Notes optionnelles..."
              />
            </div>

            <div class="flex justify-end gap-2">
              <UButton label="Annuler" variant="ghost" color="neutral" @click="showForm = false" />
              <UButton
                type="submit"
                label="Enregistrer"
                icon="i-lucide-check"
                color="primary"
                :loading="saving"
              />
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Transaction, Stock } from '~/types/models';
import type { ApiListResponse } from '~/types/api';

definePageMeta({ layout: 'default' });

const route = useRoute();
const notifications = useNotifications();
const { createAchat, deleteFacture } = useFinances();

const showForm = ref(route.query.new === '1');
const saving = ref(false);

const achatForm = reactive({
  dateTransaction: new Date().toISOString().slice(0, 10),
  categorie: '',
  description: '',
  quantite: 1,
  prixUnitaire: 0,
  tauxTva: 20,
  notes: '',
  ajouterAuStock: true,
  stockId: '',
  stockCategorie: 'autre',
  stockUnite: 'unites',
  stockSeuilAlerte: 0,
});

const { data: stocksData } = useFetch<ApiListResponse<Stock>>('/api/stocks', {
  query: { limit: 200 },
  key: 'achats-stocks',
  default: () => ({ data: [], pagination: { page: 1, limit: 200, total: 0, totalPages: 0 } }),
});

const allStocks = computed(() => stocksData.value?.data ?? []);

const matchingStocks = computed(() => {
  const query = achatForm.description.toLowerCase().trim();
  if (!query || query.length < 2) return allStocks.value.slice(0, 5);
  return allStocks.value.filter(
    (s) => s.nom.toLowerCase().includes(query) || query.includes(s.nom.toLowerCase()),
  );
});

const showNewStockFields = computed(
  () => achatForm.ajouterAuStock && (matchingStocks.value.length === 0 || achatForm.stockId === ''),
);

const achatTotal = computed(() => {
  const ht = achatForm.quantite * achatForm.prixUnitaire;
  return Math.round((ht + (ht * achatForm.tauxTva) / 100) * 100) / 100;
});

const {
  data: achatsData,
  status,
  refresh,
} = useFetch<ApiListResponse<Transaction>>('/api/finances/achats', {
  query: { limit: 100 },
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
});

const loading = computed(() => status.value === 'pending');
const achatsList = computed(() => achatsData.value?.data ?? []);

async function handleCreate() {
  saving.value = true;
  try {
    const ligne: Record<string, unknown> = {
      description: achatForm.description,
      quantite: achatForm.quantite,
      prixUnitaire: achatForm.prixUnitaire,
      total: achatForm.quantite * achatForm.prixUnitaire,
    };
    if (achatForm.ajouterAuStock) {
      ligne.ajouterAuStock = true;
      if (achatForm.stockId) {
        ligne.stockId = achatForm.stockId;
      } else {
        ligne.stockCategorie = achatForm.stockCategorie;
        ligne.stockUnite = achatForm.stockUnite;
        if (achatForm.stockSeuilAlerte > 0) {
          ligne.stockSeuilAlerte = achatForm.stockSeuilAlerte;
        }
      }
    }
    await createAchat({
      dateTransaction: achatForm.dateTransaction,
      lignes: [
        ligne as { description: string; quantite: number; prixUnitaire: number; total: number },
      ],
      tauxTva: achatForm.tauxTva,
      notes: achatForm.notes || undefined,
      categorie:
        (achatForm.categorie as
          | 'materiel'
          | 'nourrissement'
          | 'traitement'
          | 'emballage'
          | 'transport'
          | 'assurance'
          | 'formation'
          | 'autre') || undefined,
    });
    const msg = achatForm.ajouterAuStock
      ? 'Achat enregistre et stock mis a jour'
      : 'Achat enregistre';
    notifications.success(msg);
    showForm.value = false;
    Object.assign(achatForm, {
      description: '',
      quantite: 1,
      prixUnitaire: 0,
      notes: '',
      categorie: '',
      stockId: '',
      stockSeuilAlerte: 0,
    });
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  if (!confirm('Supprimer cet achat ?')) return;
  try {
    await deleteFacture(id);
    notifications.success('Achat supprime');
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

const CATEGORIES: Record<string, string> = {
  materiel: 'Materiel',
  nourrissement: 'Nourrissement',
  traitement: 'Traitement',
  emballage: 'Emballage',
  transport: 'Transport',
  assurance: 'Assurance',
  formation: 'Formation',
  autre: 'Autre',
};

function categorieLabel(cat: string | null) {
  return cat ? (CATEGORIES[cat] ?? cat) : '';
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}
</script>
