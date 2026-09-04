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
        <h1
          class="font-display text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
        >
          Bons de livraison
        </h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          Créez vos BL et convertissez-les en factures
        </p>
      </div>
      <button
        class="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--honey)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--honey-dark)] active:scale-95"
        @click="openCreate"
      >
        <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
        Nouveau BL
      </button>
    </div>

    <!-- KPIs -->
    <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="kpi in kpis"
        :key="kpi.label"
        class="rounded-[14px] border border-[var(--border-default)] bg-white px-4 py-3"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          {{ kpi.label }}
        </p>
        <p class="mt-1 text-[18px] font-bold" :class="kpi.color">{{ kpi.value }}</p>
      </div>
    </div>

    <!-- Search + Tabs -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <UIcon
          name="i-lucide-search"
          class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-quaternary)]"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher par numéro, client…"
          class="w-full rounded-[8px] border border-[var(--border-default)] bg-white py-2.5 pl-9 pr-4 text-[13px] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
        />
      </div>
      <div class="scrollable-x flex gap-1.5 pb-0.5">
        <button
          v-for="tab in TABS"
          :key="tab.value"
          class="shrink-0 rounded-[8px] px-3 py-1.5 text-[12px] font-medium transition-colors"
          :class="
            activeTab === tab.value
              ? 'bg-[var(--text-primary)] text-white'
              : 'border border-[var(--border-default)] bg-white text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          "
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
          <span v-if="tabCount(tab.value) > 0 && tab.value !== 'tous'" class="ml-1 opacity-50">{{
            tabCount(tab.value)
          }}</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-2">
      <div
        v-for="i in 5"
        :key="i"
        class="h-[72px] animate-pulse rounded-[10px] bg-[var(--surface-muted)]"
      />
    </div>

    <!-- Empty state -->
    <UiErrorState v-else-if="error" :error="error" :retry="refresh" />

    <div
      v-else-if="filteredBLs.length === 0"
      class="flex flex-col items-center justify-center py-20"
    >
      <div
        class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-muted)]"
      >
        <UIcon name="i-lucide-truck" class="h-7 w-7 text-[var(--text-tertiary)]" />
      </div>
      <p class="text-[15px] font-semibold text-[var(--text-primary)]">Aucun bon de livraison</p>
      <p class="mt-1 text-[13px] text-[var(--text-tertiary)]">
        {{
          activeTab === 'tous'
            ? 'Créez votre premier bon de livraison : il accompagne vos lots de miel et se transforme en facture en un clic.'
            : `Aucun bon avec le statut « ${activeTab} » pour l'instant.`
        }}
      </p>
      <button
        class="mt-4 inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--honey)] px-4 py-2 text-[13px] font-semibold text-white"
        @click="openCreate"
      >
        <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
        Nouveau BL
      </button>
    </div>

    <!-- Liste -->
    <div v-else class="space-y-2">
      <div
        v-for="bl in filteredBLs"
        :key="bl.id"
        class="group flex items-center gap-4 rounded-[10px] border border-[var(--border-default)] bg-white px-4 py-3.5 transition-all hover:border-[var(--honey)]/40 hover:shadow-sm"
      >
        <!-- Sélection pour facture groupée — bons « livré » uniquement -->
        <UCheckbox
          v-if="bl.statut === 'livre'"
          :model-value="selected.includes(bl.id)"
          class="shrink-0"
          @update:model-value="() => toggleSelect(bl.id)"
          @click.stop
        />

        <!-- Statut dot -->
        <div class="h-2 w-2 shrink-0 rounded-full" :class="statutColor(bl.statut)" />

        <!-- Info principale -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-[14px] font-semibold text-[var(--text-primary)]">{{
              bl.numero
            }}</span>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              :class="statutBadgeClass(bl.statut)"
              >{{ statutLabel(bl.statut) }}</span
            >
          </div>
          <div class="flex items-center gap-3 text-[12px] text-[var(--text-tertiary)]">
            <span>{{ formatDate(bl.dateCreation as unknown as string) }}</span>
            <span v-if="bl.clientNom || bl.clientEntreprise">
              {{ bl.clientEntreprise || `${bl.clientNom} ${bl.clientPrenom ?? ''}`.trim() }}
              <span v-if="bl.clientType === 'revendeur'" class="text-[var(--honey-deep)]"
                >(Revendeur)</span
              >
            </span>
            <span>{{ (bl.lignes ?? []).length }} ligne(s)</span>
          </div>
        </div>

        <!-- Total si prix -->
        <div v-if="blTotal(bl) > 0" class="text-right">
          <p class="text-[14px] font-semibold text-[var(--text-primary)]">
            {{ formatMoney(blTotal(bl)) }}
          </p>
          <p class="text-[11px] text-[var(--text-tertiary)]">HT</p>
        </div>

        <!-- Actions -->
        <div
          class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <NuxtLink
            :to="`/finances/bons-livraison/${bl.id}`"
            class="flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--text-tertiary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)]"
            title="Voir le BL"
          >
            <UIcon name="i-lucide-eye" class="h-3.5 w-3.5" />
          </NuxtLink>
          <button
            v-if="bl.statut === 'livre'"
            class="flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--text-tertiary)] hover:bg-[var(--honey-soft)] hover:text-[var(--honey-deep)]"
            title="Convertir en facture"
            @click.stop="handleConvertir(bl.id)"
          >
            <UIcon name="i-lucide-file-text" class="h-3.5 w-3.5" />
          </button>
          <button
            v-if="bl.statut === 'brouillon'"
            class="flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--text-tertiary)] hover:bg-red-50 hover:text-red-500"
            title="Supprimer"
            @click.stop="handleDelete(bl.id)"
          >
            <UIcon name="i-lucide-trash-2" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Barre d'action : facture groupée (fin de mois) -->
    <div
      v-if="selected.length"
      class="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--honey)]/40 bg-white px-4 py-3 shadow-lg"
    >
      <p class="text-[13px] text-[var(--text-secondary)]">
        <strong>{{ selected.length }}</strong> bon(s) sélectionné(s) — même client requis
      </p>
      <div class="flex items-center gap-2">
        <UButton label="Annuler" variant="ghost" color="neutral" size="sm" @click="selected = []" />
        <UButton
          label="Facturer ensemble"
          icon="i-lucide-layers"
          color="primary"
          size="sm"
          :loading="grouping"
          @click="handleFacturerGroupe"
        />
      </div>
    </div>

    <!-- Slide-over création -->
    <UModal v-model:open="showForm" :title="'Nouveau bon de livraison'">
      <template #content>
        <div class="max-h-[85vh] overflow-y-auto p-6">
          <FinancesBonLivraisonForm
            v-model="formData"
            :clients="clientsList"
            :stocks="stocksList"
            :stocks-charges="stocksStatus !== 'pending'"
            @submit="handleCreate"
          />
          <div
            class="mt-6 flex items-center justify-end gap-3 border-t border-[var(--border-default)] pt-4"
          >
            <UButton label="Annuler" variant="ghost" color="neutral" @click="showForm = false" />
            <UButton
              label="Créer le BL"
              color="primary"
              :loading="saving"
              :disabled="!formData.lignes.some((l) => l.description)"
              @click="handleCreate"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { BLFormData } from '~/components/finances/BonLivraisonForm.vue';
import type { Client, LigneBL, Stock } from '~/types/models';

definePageMeta({ layout: 'default' });

const router = useRouter();
const notifications = useNotifications();
const {
  bonsLivraison,
  pending,
  error,
  refresh,
  createBL,
  deleteBL,
  convertirEnFacture,
  facturerGroupe,
} = useBonsLivraison();

const TABS = [
  { value: 'tous', label: 'Tous' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'livre', label: 'Livré' },
  { value: 'facture', label: 'Facturé' },
  { value: 'annule', label: 'Annulé' },
];

const activeTab = ref('tous');
const searchQuery = ref('');
const showForm = ref(false);
const saving = ref(false);

const today = dateDuJour();
const formData = ref<BLFormData>({
  dateCreation: today,
  lignes: [{ description: '', quantite: 1, tauxTva: 5.5 }],
});

// Fetch clients + stocks for the form
const { data: clientsData } = useFetch<{ data: Client[] }>('/api/clients', {
  key: 'clients-list',
  query: { limit: 200 },
  lazy: true,
});
const { data: stocksData, status: stocksStatus } = useFetch<{ data: Stock[] }>('/api/stocks', {
  key: 'stocks-for-bl',
  query: { limit: 100 },
  lazy: true,
});
const clientsList = computed(() => clientsData.value?.data ?? []);
const stocksList = computed(() => stocksData.value?.data ?? []);

const filteredBLs = computed(() => {
  let list = bonsLivraison.value;
  if (activeTab.value !== 'tous') list = list.filter((b) => b.statut === activeTab.value);
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (b) =>
        b.numero.toLowerCase().includes(q) ||
        String((b as Record<string, unknown>).clientNom ?? '')
          .toLowerCase()
          .includes(q) ||
        String((b as Record<string, unknown>).clientEntreprise ?? '')
          .toLowerCase()
          .includes(q),
    );
  }
  return list;
});

function tabCount(statut: string) {
  if (statut === 'tous') return 0;
  return bonsLivraison.value.filter((b) => b.statut === statut).length;
}

const kpis = computed(() => [
  { label: 'Brouillons', value: tabCount('brouillon'), color: 'text-[var(--text-primary)]' },
  { label: 'Livrés', value: tabCount('livre'), color: 'text-[var(--honey-deep)]' },
  { label: 'Facturés', value: tabCount('facture'), color: 'text-[var(--status-good)]' },
  { label: 'Total', value: bonsLivraison.value.length, color: 'text-[var(--text-primary)]' },
]);

// Facture groupée : sélection de bons « livré » d'un même client → 1 seule facture.
const selected = ref<string[]>([]);
const grouping = ref(false);
function toggleSelect(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((x) => x !== id)
    : [...selected.value, id];
}
async function handleFacturerGroupe() {
  if (!selected.value.length || grouping.value) return;
  const clientIds = new Set(
    filteredBLs.value
      .filter((b) => selected.value.includes(b.id))
      .map((b) => String((b as Record<string, unknown>).clientId ?? 'none')),
  );
  if (clientIds.size > 1) {
    notifications.error('Sélectionnez des bons du même client pour les regrouper.');
    return;
  }
  grouping.value = true;
  try {
    const res = await facturerGroupe([...selected.value]);
    notifications.success(`Facture créée à partir de ${res.count} bon(s) de livraison`);
    selected.value = [];
    await refresh();
    const factId = (res.transaction as { id?: string })?.id;
    if (factId) await router.push(`/finances/facture/${factId}`);
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la facturation groupée'));
  } finally {
    grouping.value = false;
  }
}

/**
 * Le montant annoncé dans la liste doit être celui du bon lui-même, et celui
 * que la facture reprendra. Le calcul précédent — « quantité × prixUnitaire »,
 * sans regarder le total stocké ni le tarif au poids — affichait 100 € pour
 * 2 500 € de marchandise sur les articles vendus au kilo.
 */
function blTotal(bl: Record<string, unknown>) {
  return sommeMontantsHt((bl.lignes as LigneBL[]) ?? []);
}

function statutColor(statut: string) {
  const map: Record<string, string> = {
    brouillon: 'bg-[var(--tint-idle)]',
    livre: 'bg-[var(--honey)]',
    facture: 'bg-[var(--status-good)]',
    annule: 'bg-[var(--status-bad)]',
  };
  return map[statut] ?? 'bg-[var(--tint-idle)]';
}

function statutLabel(statut: string) {
  const map: Record<string, string> = {
    brouillon: 'Brouillon',
    livre: 'Livré',
    facture: 'Facturé',
    annule: 'Annulé',
  };
  return map[statut] ?? statut;
}

function statutBadgeClass(statut: string) {
  const map: Record<string, string> = {
    brouillon: 'bg-[var(--surface-muted)] text-[var(--text-tertiary)]',
    livre: 'bg-[var(--honey-soft)] text-[var(--honey-deep)]',
    facture: 'bg-amber-50 text-amber-700',
    annule: 'bg-red-50 text-red-600',
  };
  return map[statut] ?? 'bg-[var(--surface-muted)] text-[var(--text-tertiary)]';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function openCreate() {
  formData.value = {
    dateCreation: today,
    lignes: [{ description: '', quantite: 1, tauxTva: 5.5 }],
  };
  showForm.value = true;
}

async function handleCreate() {
  if (saving.value || !formData.value.lignes.some((l) => l.description)) return;
  saving.value = true;
  try {
    const bl = await createBL({
      ...formData.value,
      lignes: formData.value.lignes.filter((l) => l.description),
    });
    showForm.value = false;
    notifications.success(`BL ${bl.numero} créé`);
    await router.push(`/finances/bons-livraison/${bl.id}`);
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la création'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  if (!confirm('Supprimer ce bon de livraison ? Le stock sera restitué.')) return;
  try {
    await deleteBL(id);
    notifications.success('BL supprimé');
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la suppression'));
  }
}

async function handleConvertir(id: string) {
  if (!confirm('Convertir ce BL en facture ?')) return;
  try {
    const result = await convertirEnFacture(id);
    const transaction = result.transaction as Record<string, unknown>;
    notifications.success(`Facture ${transaction.numero} créée`);
    await router.push(`/finances/facture/${transaction.id}`);
  } catch (e) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la conversion'));
  }
}

/**
 * ⚠️ CETTE PAGE N'ÉCOUTAIT RIEN. Un bon de livraison naît d'un client et de
 * lignes de stock — deux domaines que Maya écrit. Le client créé à la voix
 * n'apparaissait pas dans la liste de choix, et l'apiculteur le recréait.
 */
const { on: surEvenementDonnees } = useDataBus();
surEvenementDonnees(
  ['bl:created', 'bl:updated', 'bl:deleted', 'bl:converti', 'client:created', 'stock:updated'],
  () => refresh(),
);

onMounted(() => refresh());
</script>
