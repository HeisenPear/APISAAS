<template>
  <div>
    <NuxtLink
      to="/finances"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux finances
    </NuxtLink>

    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-stone-900">Ventes & Factures</h1>
        <p class="mt-1 text-sm text-stone-500">Gerez vos ventes et facturez vos clients</p>
      </div>
      <UButton
        label="Nouvelle vente"
        icon="i-lucide-plus"
        color="primary"
        @click="showForm = true"
      />
    </div>

    <!-- Search -->
    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher une vente..."
        class="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-16 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <!-- Empty -->
    <UiEmptyState
      v-else-if="ventesList.length === 0"
      icon="i-lucide-receipt"
      title="Aucune vente"
      description="Enregistrez votre premiere vente"
      action-label="Nouvelle vente"
      @action="showForm = true"
    />

    <!-- List -->
    <div v-else class="space-y-2">
      <div
        v-for="vente in ventesList"
        :key="vente.id"
        class="rounded-2xl border border-stone-200/60 bg-white shadow-sm transition-colors hover:bg-stone-50/50"
      >
        <NuxtLink :to="`/finances/facture/${vente.id}`" class="flex items-center gap-4 p-4">
          <!-- Icon -->
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <UIcon name="i-lucide-file-text" class="h-5 w-5 text-amber-600" />
          </div>
          <!-- Info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-stone-900">{{ vente.numero }}</span>
              <span
                class="rounded-md px-1.5 py-0.5 text-xs font-medium"
                :class="statutClass(vente.statut)"
              >
                {{ statutLabel(vente.statut) }}
              </span>
            </div>
            <p class="mt-0.5 text-xs text-stone-400">
              {{ formatDate(vente.dateTransaction) }}
              <template v-if="vente.clientNom || vente.clientEntreprise">
                — {{ vente.clientEntreprise || vente.clientNom }}
              </template>
            </p>
          </div>
          <!-- Total -->
          <span class="shrink-0 text-base font-bold text-stone-900">{{
            formatMoney(Number(vente.total ?? 0))
          }}</span>
          <UIcon name="i-lucide-chevron-right" class="h-4 w-4 shrink-0 text-stone-300" />
        </NuxtLink>
        <!-- Actions bar -->
        <div class="flex items-center justify-end gap-1 border-t border-stone-100 px-3 py-1.5">
          <UButton
            label="Voir facture"
            icon="i-lucide-eye"
            size="xs"
            variant="ghost"
            color="neutral"
            :to="`/finances/facture/${vente.id}`"
          />
          <UButton
            label="PDF"
            icon="i-lucide-download"
            size="xs"
            variant="soft"
            color="primary"
            :to="`/finances/facture/${vente.id}?print=1`"
          />
          <div class="mx-1 h-4 w-px bg-stone-200" />
          <UButton
            v-if="vente.statut === 'brouillon'"
            label="Envoyer"
            icon="i-lucide-send"
            size="xs"
            variant="ghost"
            color="primary"
            @click.prevent="changeStatut(vente.id, 'envoyee')"
          />
          <UButton
            v-if="vente.statut === 'envoyee'"
            label="Payee"
            icon="i-lucide-check-circle"
            size="xs"
            variant="ghost"
            color="success"
            @click.prevent="changeStatut(vente.id, 'payee')"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="error"
            title="Supprimer"
            @click.prevent="handleDelete(vente.id)"
          />
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
const showForm = ref(false);
const saving = ref(false);

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
  lignes: [{ description: '', quantite: 1, prixUnitaire: 0, total: 0 }],
  tauxTva: 5.5,
  notes: undefined as string | undefined,
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

async function handleCreate() {
  saving.value = true;
  try {
    await createVente({
      clientId: venteForm.value.clientId,
      dateTransaction: venteForm.value.dateTransaction,
      dateEcheance: venteForm.value.dateEcheance,
      lignes: venteForm.value.lignes,
      tauxTva: venteForm.value.tauxTva,
      notes: venteForm.value.notes,
    });
    notifications.success('Vente creee');
    showForm.value = false;
    venteForm.value = {
      clientId: undefined,
      dateTransaction: new Date().toISOString().slice(0, 10),
      dateEcheance: undefined,
      lignes: [{ description: '', quantite: 1, prixUnitaire: 0, total: 0 }],
      tauxTva: 5.5,
      notes: undefined,
    };
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la creation'));
  } finally {
    saving.value = false;
  }
}

async function changeStatut(id: string, statut: 'envoyee' | 'payee') {
  try {
    await updateStatut(id, statut);
    notifications.success('Statut mis a jour');
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur'));
  }
}

async function handleDelete(id: string) {
  if (!confirm('Supprimer cette vente ?')) return;
  try {
    await deleteFacture(id);
    notifications.success('Vente supprimee');
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
    envoyee: 'Envoyee',
    payee: 'Payee',
    en_retard: 'En retard',
    annulee: 'Annulee',
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
