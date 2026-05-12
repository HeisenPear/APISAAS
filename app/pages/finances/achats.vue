<template>
  <div>
    <!-- Back nav -->
    <NuxtLink
      to="/finances"
      class="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Finances
    </NuxtLink>

    <!-- Header -->
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="font-display text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Charges & Achats</h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">Suivez vos dépenses et charges</p>
      </div>
      <button
        class="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--honey)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--honey-dark)]"
        @click="showForm = true"
      >
        <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
        Nouvel achat
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-[68px] animate-pulse rounded-[10px] bg-[var(--surface-muted)]" />
    </div>

    <!-- Empty -->
    <UiEmptyState
      v-else-if="achatsList.length === 0"
      icon="i-lucide-shopping-bag"
      title="Aucune charge"
      description="Enregistrez vos premières dépenses"
      action-label="Nouvel achat"
      @action="showForm = true"
    />

    <!-- List -->
    <div v-else class="space-y-2">
      <div
        v-for="achat in achatsList"
        :key="achat.id"
        class="flex items-center gap-4 rounded-[10px] border border-[var(--border-default)] bg-white px-4 py-3.5 transition-all hover:border-[var(--border-hover)] hover:shadow-sm"
      >
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--surface-muted)]">
          <UIcon name="i-lucide-shopping-bag" class="h-4 w-4 text-[var(--text-tertiary)]" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-[14px] font-semibold text-[var(--text-primary)]">{{ achat.numero }}</span>
            <span
              v-if="achat.categorie"
              class="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]"
            >
              {{ categorieLabel(achat.categorie) }}
            </span>
          </div>
          <p class="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
            {{ formatDate(achat.dateTransaction) }}
            <template v-if="achat.notes"> · {{ achat.notes }}</template>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[14px] font-semibold text-[var(--text-primary)]">{{ formatMoney(Number(achat.total ?? 0)) }}</span>
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

    <!-- Modal création -->
    <UModal v-model:open="showForm" title="Nouvel achat">
      <template #content>
        <div class="max-h-[85vh] overflow-y-auto p-6">
          <form class="space-y-4" @submit.prevent="handleCreate">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Date</label>
                <input
                  v-model="achatForm.dateTransaction"
                  type="date"
                  required
                  class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                >
              </div>
              <div>
                <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Catégorie</label>
                <select
                  v-model="achatForm.categorie"
                  class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                >
                  <option value="">Non catégorisé</option>
                  <option value="materiel">Matériel</option>
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
              <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Description</label>
              <input
                v-model="achatForm.description"
                type="text"
                required
                placeholder="Ex : 10 cadres Dadant"
                class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-quaternary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
              >
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Quantité</label>
                <input
                  v-model.number="achatForm.quantite"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                >
              </div>
              <div>
                <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Prix unitaire</label>
                <input
                  v-model.number="achatForm.prixUnitaire"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                >
              </div>
              <div>
                <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">TVA</label>
                <select
                  v-model.number="achatForm.tauxTva"
                  class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                >
                  <option :value="5.5">5,5 % — Alimentaire</option>
                  <option :value="10">10 % — Intermédiaire</option>
                  <option :value="20">20 % — Normal</option>
                  <option :value="0">0 % — Exonéré</option>
                </select>
              </div>
            </div>

            <!-- Total preview -->
            <div class="rounded-[10px] bg-[var(--surface-muted)] px-4 py-3 text-right">
              <span class="text-[12px] text-[var(--text-tertiary)]">Total TTC : </span>
              <span class="text-[14px] font-bold text-[var(--text-primary)]">{{ formatMoney(achatTotal) }}</span>
            </div>

            <!-- Intégration stock -->
            <div class="rounded-[12px] border border-emerald-200/60 bg-emerald-50/40 p-4">
              <label class="flex cursor-pointer items-center gap-3">
                <input
                  v-model="achatForm.ajouterAuStock"
                  type="checkbox"
                  class="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--honey)]"
                >
                <div class="flex items-center gap-2">
                  <div class="flex h-7 w-7 items-center justify-center rounded-[8px] bg-emerald-500">
                    <UIcon name="i-lucide-warehouse" class="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <span class="text-[13px] font-semibold text-[var(--text-primary)]">Ajouter au stock</span>
                    <p class="text-[11px] text-[var(--text-tertiary)]">Met à jour automatiquement votre inventaire</p>
                  </div>
                </div>
              </label>

              <div v-if="achatForm.ajouterAuStock" class="mt-4 space-y-3">
                <!-- Stocks correspondants -->
                <div v-if="matchingStocks.length > 0">
                  <p class="mb-2 text-[11px] font-medium text-emerald-800">Produit existant dans vos stocks :</p>
                  <div class="space-y-1.5">
                    <label
                      v-for="stock in matchingStocks"
                      :key="stock.id"
                      class="flex cursor-pointer items-center gap-3 rounded-[10px] border-2 p-3 transition-all"
                      :class="achatForm.stockId === stock.id ? 'border-emerald-500 bg-emerald-50' : 'border-[var(--border-default)] bg-white hover:border-emerald-300'"
                    >
                      <input
                        v-model="achatForm.stockId"
                        type="radio"
                        :value="stock.id"
                        class="accent-emerald-600"
                      >
                      <div class="flex-1">
                        <span class="text-[13px] font-medium text-[var(--text-primary)]">{{ stock.nom }}</span>
                        <span class="ml-2 text-[11px] text-[var(--text-tertiary)]">{{ Number(stock.quantite) }} {{ stock.unite ?? 'u' }} en stock</span>
                      </div>
                    </label>
                    <label
                      class="flex cursor-pointer items-center gap-3 rounded-[10px] border-2 p-3 transition-all"
                      :class="achatForm.stockId === '' ? 'border-emerald-500 bg-emerald-50' : 'border-[var(--border-default)] bg-white hover:border-emerald-300'"
                    >
                      <input
                        v-model="achatForm.stockId"
                        type="radio"
                        value=""
                        class="accent-emerald-600"
                      >
                      <div class="flex items-center gap-1.5">
                        <UIcon name="i-lucide-plus-circle" class="h-4 w-4 text-emerald-600" />
                        <span class="text-[13px] font-medium text-emerald-700">Créer un nouveau produit</span>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Nouveau produit -->
                <div v-if="showNewStockFields" class="space-y-3 rounded-[10px] bg-white p-3">
                  <p class="text-[11px] font-medium text-[var(--text-secondary)]">Nouveau produit en stock :</p>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="mb-1 block text-[11px] text-[var(--text-tertiary)]">Catégorie de stock</label>
                      <select
                        v-model="achatForm.stockCategorie"
                        class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-2.5 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                      >
                        <option value="cadres">Cadres</option>
                        <option value="hausses">Hausses</option>
                        <option value="corps">Corps</option>
                        <option value="nourrissement">Nourrissement</option>
                        <option value="traitement">Traitement</option>
                        <option value="conditionnement">Conditionnement</option>
                        <option value="equipement">Équipement</option>
                        <option value="outillage">Outillage</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label class="mb-1 block text-[11px] text-[var(--text-tertiary)]">Unité</label>
                      <select
                        v-model="achatForm.stockUnite"
                        class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-2.5 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                      >
                        <option value="unites">Unités</option>
                        <option value="kg">Kilogrammes</option>
                        <option value="litres">Litres</option>
                        <option value="pots">Pots</option>
                        <option value="paquets">Paquets</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label class="mb-1 block text-[11px] text-[var(--text-tertiary)]">
                      <UIcon name="i-lucide-bell" class="inline h-3.5 w-3.5 text-[var(--honey)]" />
                      Alerte stock bas (seuil minimum)
                    </label>
                    <div class="flex items-center gap-2">
                      <input
                        v-model.number="achatForm.stockSeuilAlerte"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Ex : 5"
                        class="w-32 rounded-[10px] border border-[var(--border-default)] bg-white px-2.5 py-2 text-[13px] text-[var(--text-primary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                      >
                      <span class="text-[11px] text-[var(--text-tertiary)]">{{ achatForm.stockUnite || 'unités' }}</span>
                      <span class="ml-auto text-[11px] text-[var(--text-quaternary)]">Alerte en dessous de ce seuil</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]">Notes</label>
              <textarea
                v-model="achatForm.notes"
                :rows="2"
                class="w-full rounded-[10px] border border-[var(--border-default)] bg-white px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-quaternary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
                placeholder="Notes optionnelles…"
              />
            </div>

            <div class="flex justify-end gap-2 border-t border-[var(--border-default)] pt-4">
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
      ? 'Achat enregistré et stock mis à jour'
      : 'Achat enregistré';
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
    notifications.success('Achat supprimé');
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

const CATEGORIES: Record<string, string> = {
  materiel: 'Matériel',
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
