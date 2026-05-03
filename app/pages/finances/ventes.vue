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
        <h1 class="font-display text-[26px] font-semibold tracking-tight text-[var(--text-primary)]">Ventes</h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">Gérez vos ventes et facturez vos clients</p>
      </div>
      <button
        class="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--honey)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--honey-dark)]"
        @click="showForm = true"
      >
        <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
        Nouvelle vente
      </button>
    </div>

    <!-- KPI strip -->
    <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] px-4 py-3">
        <p class="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Encaissé</p>
        <p class="mt-1 text-[18px] font-bold text-[var(--status-good)]">{{ formatMoney(kpi.encaisse) }}</p>
      </div>
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] px-4 py-3">
        <p class="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">En attente</p>
        <p class="mt-1 text-[18px] font-bold text-[var(--honey-deep)]">{{ formatMoney(kpi.enAttente) }}</p>
      </div>
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] px-4 py-3">
        <p class="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">En retard</p>
        <p class="mt-1 text-[18px] font-bold text-[var(--status-bad)]">{{ formatMoney(kpi.enRetard) }}</p>
      </div>
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] px-4 py-3">
        <p class="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Factures</p>
        <p class="mt-1 text-[18px] font-bold text-[var(--text-primary)]">{{ ventesList.length }}</p>
      </div>
    </div>

    <!-- Search + Filter row -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <UIcon name="i-lucide-search" class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-quaternary)]" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher par numéro, client…"
          class="w-full rounded-[8px] border border-[var(--border-default)] bg-white py-2.5 pl-9 pr-4 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-quaternary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
        />
      </div>
      <div class="flex gap-1.5 overflow-x-auto pb-0.5">
        <button
          v-for="tab in TABS"
          :key="tab.value"
          class="shrink-0 rounded-[8px] px-3 py-1.5 text-[12px] font-medium transition-colors"
          :class="
            activeTab === tab.value
              ? 'bg-[var(--text-primary)] text-white'
              : 'bg-white border border-[var(--border-default)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          "
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
          <span v-if="tabCount(tab.value) > 0 && tab.value !== 'toutes'" class="ml-1 opacity-50">{{ tabCount(tab.value) }}</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-[60px] animate-pulse rounded-[8px] bg-[var(--surface-muted)]" />
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

    <!-- Table -->
    <div v-else class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-[var(--surface-muted)] border-b border-[var(--border-default)]">
            <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">N° facture</th>
            <th class="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] sm:table-cell">Client</th>
            <th class="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)] md:table-cell">Date</th>
            <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Total</th>
            <th class="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Statut</th>
            <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--border-faint)]">
          <tr
            v-for="vente in filtered"
            :key="vente.id"
            class="group transition-colors hover:bg-[var(--surface-muted)]/40"
          >
            <td class="px-4 py-3">
              <NuxtLink :to="`/finances/facture/${vente.id}`" class="text-[13px] font-semibold text-[var(--text-primary)] hover:text-[var(--honey-deep)] transition-colors">
                {{ vente.numero || '—' }}
              </NuxtLink>
            </td>
            <td class="hidden px-4 py-3 sm:table-cell">
              <span class="text-[12.5px] text-[var(--text-secondary)]">{{ vente.clientEntreprise || vente.clientNom || '—' }}</span>
            </td>
            <td class="hidden px-4 py-3 md:table-cell">
              <span class="text-[12.5px] text-[var(--text-secondary)]">{{ formatDate(vente.dateTransaction) }}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="text-[13px] font-bold text-[var(--text-primary)]">{{ formatMoney(Number(vente.total ?? 0)) }}</span>
            </td>
            <td class="px-4 py-3 text-center">
              <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="statutClass(vente.statut)">
                {{ statutLabel(vente.statut) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <UTooltip text="Voir la facture">
                  <UButton icon="i-lucide-eye" size="xs" variant="ghost" color="neutral" :to="`/finances/facture/${vente.id}`" />
                </UTooltip>
                <UTooltip text="Imprimer / PDF">
                  <UButton icon="i-lucide-printer" size="xs" variant="ghost" color="neutral" :to="`/finances/facture/${vente.id}?print=1`" />
                </UTooltip>
                <UTooltip v-if="vente.statut === 'brouillon'" text="Marquer envoyée">
                  <UButton icon="i-lucide-send" size="xs" variant="ghost" color="primary" @click.prevent="changeStatut(vente.id, 'envoyee')" />
                </UTooltip>
                <UTooltip v-if="vente.statut === 'envoyee'" text="Marquer payée">
                  <UButton icon="i-lucide-check-circle" size="xs" variant="ghost" color="success" @click.prevent="changeStatut(vente.id, 'payee')" />
                </UTooltip>
                <UTooltip text="Supprimer">
                  <UButton icon="i-lucide-trash-2" size="xs" variant="ghost" color="error" @click.prevent="handleDelete(vente.id)" />
                </UTooltip>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Footer total -->
      <div v-if="filtered.length > 0" class="flex items-center justify-between border-t border-[var(--border-faint)] bg-[var(--surface-muted)]/50 px-4 py-2.5">
        <span class="text-[12px] text-[var(--text-tertiary)]">{{ filtered.length }} facture{{ filtered.length > 1 ? 's' : '' }}</span>
        <span class="text-[13px] font-bold text-[var(--text-primary)]">
          Total : {{ formatMoney(filtered.reduce((s, v) => s + Number(v.total ?? 0), 0)) }}
        </span>
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
