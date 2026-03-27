<template>
  <div>
    <UiPageHeader
      title="Ventes & Factures"
      description="Gérez vos ventes et facturez vos clients"
      :breadcrumbs="[{ label: 'Finances', to: '/finances' }, { label: 'Ventes' }]"
    >
      <template #actions>
        <UButton
          label="Nouvelle vente"
          icon="i-lucide-plus"
          color="primary"
          @click="showForm = true"
        />
      </template>
    </UiPageHeader>

    <!-- KPI strip -->
    <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-stone-200/60 bg-white px-4 py-3 shadow-sm">
        <p class="text-xs font-medium text-stone-400">Total encaissé</p>
        <p class="mt-0.5 text-lg font-bold text-stone-900">{{ formatMoney(kpi.encaisse) }}</p>
      </div>
      <div class="rounded-xl border border-stone-200/60 bg-white px-4 py-3 shadow-sm">
        <p class="text-xs font-medium text-stone-400">En attente</p>
        <p class="mt-0.5 text-lg font-bold text-amber-600">{{ formatMoney(kpi.enAttente) }}</p>
      </div>
      <div class="rounded-xl border border-stone-200/60 bg-white px-4 py-3 shadow-sm">
        <p class="text-xs font-medium text-stone-400">En retard</p>
        <p class="mt-0.5 text-lg font-bold text-red-500">{{ formatMoney(kpi.enRetard) }}</p>
      </div>
      <div class="rounded-xl border border-stone-200/60 bg-white px-4 py-3 shadow-sm">
        <p class="text-xs font-medium text-stone-400">Factures</p>
        <p class="mt-0.5 text-lg font-bold text-stone-900">{{ ventesList.length }}</p>
      </div>
    </div>

    <!-- Search + Filter tabs -->
    <div class="mb-4 space-y-3">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher par numéro, client…"
        class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      />
      <div class="flex gap-1.5 overflow-x-auto pb-0.5">
        <button
          v-for="tab in TABS"
          :key="tab.value"
          class="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            activeTab === tab.value
              ? 'bg-stone-900 text-white'
              : 'bg-white text-stone-500 hover:bg-stone-50 border border-stone-200'
          "
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
          <span v-if="tabCount(tab.value) > 0 && tab.value !== 'toutes'" class="ml-1 opacity-60">{{
            tabCount(tab.value)
          }}</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-[68px] animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <!-- Empty -->
    <UiEmptyState
      v-else-if="filtered.length === 0"
      icon="i-lucide-receipt"
      :title="ventesList.length === 0 ? 'Aucune vente' : 'Aucun résultat'"
      :description="
        ventesList.length === 0
          ? 'Enregistrez votre première vente'
          : 'Essayez un autre filtre ou mot-clé'
      "
      :action-label="ventesList.length === 0 ? 'Nouvelle vente' : undefined"
      @action="showForm = true"
    />

    <!-- List -->
    <div v-else class="space-y-2">
      <div
        v-for="vente in filtered"
        :key="vente.id"
        class="group flex items-center gap-3 rounded-2xl border border-stone-200/60 bg-white px-4 py-3 shadow-sm transition-colors hover:border-stone-300/60 hover:bg-stone-50/40"
      >
        <!-- Status dot -->
        <div class="h-2 w-2 shrink-0 rounded-full" :class="statutDot(vente.statut)" />

        <!-- Main info (clickable) -->
        <NuxtLink :to="`/finances/facture/${vente.id}`" class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-stone-900">{{ vente.numero }}</span>
            <span
              class="rounded-md px-1.5 py-0.5 text-xs font-medium"
              :class="statutClass(vente.statut)"
            >
              {{ statutLabel(vente.statut) }}
            </span>
          </div>
          <p class="mt-0.5 truncate text-xs text-stone-400">
            {{ formatDate(vente.dateTransaction) }}
            <template v-if="vente.clientNom || vente.clientEntreprise">
              · {{ vente.clientEntreprise || vente.clientNom }}
            </template>
          </p>
        </NuxtLink>

        <!-- Amount -->
        <span class="shrink-0 text-sm font-bold text-stone-900">
          {{ formatMoney(Number(vente.total ?? 0)) }}
        </span>

        <!-- Actions -->
        <div
          class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <UTooltip text="Voir la facture">
            <UButton
              icon="i-lucide-eye"
              size="xs"
              variant="ghost"
              color="neutral"
              :to="`/finances/facture/${vente.id}`"
            />
          </UTooltip>
          <UTooltip text="Imprimer / PDF">
            <UButton
              icon="i-lucide-printer"
              size="xs"
              variant="ghost"
              color="neutral"
              :to="`/finances/facture/${vente.id}?print=1`"
            />
          </UTooltip>
          <UTooltip v-if="vente.statut === 'brouillon'" text="Marquer envoyée">
            <UButton
              icon="i-lucide-send"
              size="xs"
              variant="ghost"
              color="primary"
              @click.prevent="changeStatut(vente.id, 'envoyee')"
            />
          </UTooltip>
          <UTooltip v-if="vente.statut === 'envoyee'" text="Marquer payée">
            <UButton
              icon="i-lucide-check-circle"
              size="xs"
              variant="ghost"
              color="success"
              @click.prevent="changeStatut(vente.id, 'payee')"
            />
          </UTooltip>
          <UTooltip text="Supprimer">
            <UButton
              icon="i-lucide-trash-2"
              size="xs"
              variant="ghost"
              color="error"
              @click.prevent="handleDelete(vente.id)"
            />
          </UTooltip>
        </div>
      </div>
    </div>

    <!-- Create modal -->
    <UModal v-model:open="showForm">
      <template #content>
        <div class="max-h-[80vh] overflow-y-auto p-6">
          <h2 class="mb-4 text-lg font-semibold text-stone-900">Nouvelle vente</h2>
          <FinancesVenteForm
            v-model="venteForm"
            :clients="clientsList"
            :stocks="stocksList"
            @submit="handleCreate"
          />
          <div class="mt-4 flex justify-end gap-2">
            <UButton label="Annuler" variant="ghost" color="neutral" @click="showForm = false" />
            <UButton
              label="Enregistrer"
              icon="i-lucide-check"
              color="primary"
              :loading="saving"
              @click="handleCreate"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Client, Stock } from '~/types/models';
import type { ApiListResponse } from '~/types/api';

definePageMeta({ layout: 'default' });

const route = useRoute();
const notifications = useNotifications();
const { createVente, updateStatut, deleteFacture } = useFinances();

const searchQuery = ref('');
const searchDebounced = refDebounced(searchQuery, 300);
const showForm = ref(route.query.new === '1');
const saving = ref(false);
const activeTab = ref('toutes');

const TABS = [
  { label: 'Toutes', value: 'toutes' },
  { label: 'Brouillon', value: 'brouillon' },
  { label: 'Envoyée', value: 'envoyee' },
  { label: 'Payée', value: 'payee' },
  { label: 'En retard', value: 'en_retard' },
];

interface VenteRow {
  id: string;
  numero: string | null;
  dateTransaction: string | Date;
  statut: string;
  total: string | null;
  clientNom: string | null;
  clientEntreprise: string | null;
}

const venteForm = ref({
  clientId: (route.query.clientId as string) || undefined,
  dateTransaction: new Date().toISOString().slice(0, 10),
  dateEcheance: undefined as string | undefined,
  lignes: [{ description: '', quantite: 1, prixUnitaire: 0, total: 0, tauxTva: 5.5 }],
  notes: undefined as string | undefined,
  categorieOperation: 'livraison_biens' as 'livraison_biens' | 'prestation_services' | 'mixte',
});

const {
  data: ventesData,
  status,
  refresh,
} = useFetch<ApiListResponse<VenteRow>>('/api/finances/ventes', {
  query: { limit: 100, search: searchDebounced },
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
});

const { data: clientsData } = useFetch<ApiListResponse<Client>>('/api/clients', {
  query: { limit: 100 },
  key: 'ventes-clients',
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
});

const { data: stocksData } = useFetch<ApiListResponse<Stock>>('/api/stocks', {
  query: { limit: 100 },
  key: 'ventes-stocks',
  default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
});

const loading = computed(() => status.value === 'pending');
const ventesList = computed(() => ventesData.value?.data ?? []);
const clientsList = computed(() => clientsData.value?.data ?? []);
const stocksList = computed(() => stocksData.value?.data ?? []);

const filtered = computed(() => {
  let list = ventesList.value;
  if (activeTab.value !== 'toutes') {
    list = list.filter((v) => v.statut === activeTab.value);
  }
  return list;
});

const kpi = computed(() => {
  const all = ventesList.value;
  return {
    encaisse: all.filter((v) => v.statut === 'payee').reduce((s, v) => s + Number(v.total ?? 0), 0),
    enAttente: all
      .filter((v) => v.statut === 'envoyee')
      .reduce((s, v) => s + Number(v.total ?? 0), 0),
    enRetard: all
      .filter((v) => v.statut === 'en_retard')
      .reduce((s, v) => s + Number(v.total ?? 0), 0),
  };
});

function tabCount(tab: string) {
  if (tab === 'toutes') return ventesList.value.length;
  return ventesList.value.filter((v) => v.statut === tab).length;
}

async function handleCreate() {
  saving.value = true;
  try {
    await createVente({
      clientId: venteForm.value.clientId,
      dateTransaction: venteForm.value.dateTransaction,
      dateEcheance: venteForm.value.dateEcheance,
      lignes: venteForm.value.lignes,
      notes: venteForm.value.notes,
      categorieOperation: venteForm.value.categorieOperation,
    });
    notifications.success('Vente créée');
    showForm.value = false;
    venteForm.value = {
      clientId: undefined,
      dateTransaction: new Date().toISOString().slice(0, 10),
      dateEcheance: undefined,
      lignes: [{ description: '', quantite: 1, prixUnitaire: 0, total: 0, tauxTva: 5.5 }],
      notes: undefined,
      categorieOperation: 'livraison_biens',
    };
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la création'));
  } finally {
    saving.value = false;
  }
}

async function changeStatut(id: string, statut: 'envoyee' | 'payee') {
  try {
    await updateStatut(id, statut);
    notifications.success('Statut mis à jour');
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

async function handleDelete(id: string) {
  if (!confirm('Supprimer cette vente ?')) return;
  try {
    await deleteFacture(id);
    notifications.success('Vente supprimée');
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

function statutDot(statut: string) {
  switch (statut) {
    case 'payee':
      return 'bg-emerald-400';
    case 'envoyee':
      return 'bg-blue-400';
    case 'en_retard':
      return 'bg-red-400';
    case 'annulee':
      return 'bg-stone-300';
    default:
      return 'bg-amber-400';
  }
}

function statutClass(statut: string) {
  switch (statut) {
    case 'payee':
      return 'bg-emerald-50 text-emerald-700';
    case 'envoyee':
      return 'bg-blue-50 text-blue-700';
    case 'en_retard':
      return 'bg-red-50 text-red-700';
    case 'annulee':
      return 'bg-stone-100 text-stone-500';
    default:
      return 'bg-amber-50 text-amber-700';
  }
}

function statutLabel(statut: string) {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    envoyee: 'Envoyée',
    payee: 'Payée',
    en_retard: 'En retard',
    annulee: 'Annulée',
  };
  return labels[statut] ?? statut;
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
