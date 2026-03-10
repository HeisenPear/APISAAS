<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Hausses">
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
            placeholder="Rechercher..."
            class="h-8 w-40 rounded-lg border-0 bg-stone-100/80 pl-8 pr-3 text-xs text-stone-700 placeholder-stone-400 outline-none transition-all duration-200 focus:w-56 focus:bg-white focus:ring-1 focus:ring-amber-400/50"
          />
        </div>

        <!-- Export QR -->
        <button
          v-if="selectedIds.length > 0"
          type="button"
          class="flex h-8 items-center gap-1.5 rounded-lg bg-stone-100 px-3 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-200"
          :disabled="exporting"
          @click="handleExportQr"
        >
          <UIcon name="i-lucide-qr-code" class="h-3.5 w-3.5" />
          Exporter QR ({{ selectedIds.length }})
        </button>

        <!-- CTA -->
        <UButton
          label="Generer des hausses"
          icon="i-lucide-plus"
          color="primary"
          @click="showGenererModal = true"
        />
      </template>
    </UiPageHeader>

    <!-- KPI Row -->
    <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <UiKpiCard icon="i-lucide-layers-2" :value="kpis.total" label="Total hausses" />
      <UiKpiCard icon="i-lucide-check-circle" :value="kpis.disponibles" label="Disponibles" />
      <UiKpiCard icon="i-lucide-box" :value="kpis.enService" label="En service" />
      <UiKpiCard icon="i-lucide-x-circle" :value="kpis.horsService" label="Hors service" />
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <!-- Segmented control -->
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
          @click="handleSegmentChange(seg.value)"
        >
          {{ seg.label }}
        </button>
      </div>

      <!-- Type + Rucher filters -->
      <div class="flex items-center gap-2">
        <select
          v-model="filterType"
          class="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-600 outline-none focus:ring-1 focus:ring-amber-400/50"
        >
          <option value="">Tous types</option>
          <option v-for="t in typeOptions" :key="t.value" :value="t.value">
            {{ t.label }}
          </option>
        </select>

        <select
          v-model="filterRucheId"
          class="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs text-stone-600 outline-none focus:ring-1 focus:ring-amber-400/50"
        >
          <option value="">Toutes ruches</option>
          <option v-for="r in ruchesList" :key="r.id" :value="r.id">
            {{ r.numero }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="mt-6">
      <UiLoadingSkeleton variant="card" :count="6" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="hausses.length === 0 && !hasFilters"
      icon="i-lucide-layers-2"
      title="Aucune hausse"
      description="Generez vos premieres hausses pour les suivre avec des QR codes"
      action-label="Generer des hausses"
      @action="showGenererModal = true"
    />

    <!-- No results -->
    <div
      v-else-if="hausses.length === 0 && hasFilters"
      class="mt-8 text-center text-sm text-stone-400"
    >
      Aucune hausse ne correspond aux filtres
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="hausse in hausses"
        :key="hausse.id"
        class="group relative overflow-hidden rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all duration-[var(--duration-base)] ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:shadow-md"
      >
        <!-- Selection checkbox -->
        <input
          type="checkbox"
          :checked="selectedIds.includes(hausse.id)"
          class="absolute left-3 top-3 h-4 w-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400/50"
          @change="toggleSelect(hausse.id)"
        />

        <!-- Top row -->
        <div class="ml-6 flex items-start justify-between">
          <div>
            <p class="text-base font-bold text-stone-900">{{ hausse.numero }}</p>
            <div class="mt-1 flex items-center gap-2">
              <span
                class="inline-flex rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500"
              >
                {{ typeLabel(hausse.type) }}
              </span>
              <span class="text-xs text-stone-400"> {{ hausse.nombreCadres }} cadres </span>
            </div>
          </div>
          <span
            class="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            :class="statutBadgeClass(hausse.statut)"
          >
            {{ statutLabel(hausse.statut) }}
          </span>
        </div>

        <!-- Ruche assignment -->
        <div
          v-if="hausse.rucheNumero"
          class="ml-6 mt-3 flex items-center gap-1.5 text-xs text-stone-500"
        >
          <UIcon name="i-lucide-box" class="h-3 w-3 text-amber-400" />
          Ruche {{ hausse.rucheNumero }}
        </div>
        <div v-else class="ml-6 mt-3 text-xs text-stone-300">Non affectee</div>

        <!-- Actions -->
        <div class="ml-6 mt-4 flex items-center gap-1 border-t border-stone-100 pt-3">
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            title="Modifier"
            @click="openEditModal(hausse)"
          >
            <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            title="QR Code"
            @click="handleShowQr(hausse)"
          >
            <UIcon name="i-lucide-qr-code" class="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            class="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Supprimer"
            @click="handleDelete(hausse)"
          >
            <UIcon name="i-lucide-trash-2" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="mt-6 flex items-center justify-center gap-2">
      <button
        type="button"
        class="flex h-8 items-center gap-1 rounded-lg border border-stone-200 px-3 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40"
        :disabled="currentPage <= 1"
        @click="currentPage--"
      >
        <UIcon name="i-lucide-chevron-left" class="h-3.5 w-3.5" />
        Precedent
      </button>
      <span class="text-xs tabular-nums text-stone-400">
        Page {{ currentPage }} / {{ pagination.totalPages }}
      </span>
      <button
        type="button"
        class="flex h-8 items-center gap-1 rounded-lg border border-stone-200 px-3 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40"
        :disabled="currentPage >= pagination.totalPages"
        @click="currentPage++"
      >
        Suivant
        <UIcon name="i-lucide-chevron-right" class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- Modal Generer -->
    <UModal v-model:open="showGenererModal">
      <template #content>
        <div class="flex max-h-[85vh] flex-col">
          <div class="shrink-0 border-b border-stone-100 px-6 py-4">
            <h2 class="text-lg font-semibold text-stone-900">Generer des hausses</h2>
            <p class="mt-0.5 text-xs text-stone-400">
              Creez un lot de hausses avec numeros sequentiels et QR codes
            </p>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <form class="space-y-4" @submit.prevent="handleGenerer">
              <!-- Nombre -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600"
                  >Nombre de hausses</label
                >
                <input
                  v-model.number="genForm.nombre"
                  type="number"
                  min="1"
                  max="100"
                  class="h-9 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                />
              </div>

              <!-- Type -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600">Type de ruche</label>
                <select
                  v-model="genForm.type"
                  class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                >
                  <option v-for="t in typeOptions" :key="t.value" :value="t.value">
                    {{ t.label }}
                  </option>
                </select>
              </div>

              <!-- Nombre cadres -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600"
                  >Nombre de cadres</label
                >
                <input
                  v-model.number="genForm.nombreCadres"
                  type="number"
                  min="1"
                  max="20"
                  class="h-9 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                />
              </div>

              <!-- Prefixe -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600">Prefixe numero</label>
                <input
                  v-model="genForm.prefixeNumero"
                  type="text"
                  maxlength="10"
                  placeholder="H-2026-"
                  class="h-9 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-700 placeholder-stone-300 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                />
              </div>

              <!-- Annee acquisition -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600"
                  >Annee d'acquisition</label
                >
                <input
                  v-model.number="genForm.anneeAcquisition"
                  type="number"
                  :placeholder="String(new Date().getFullYear())"
                  class="h-9 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-700 placeholder-stone-300 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                />
              </div>

              <!-- Preview -->
              <div v-if="genPreview.length > 0" class="rounded-lg bg-stone-50 p-3">
                <p class="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  Apercu des numeros
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="num in genPreview"
                    :key="num"
                    class="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-stone-600 shadow-sm"
                  >
                    {{ num }}
                  </span>
                  <span
                    v-if="genForm.nombre > 5"
                    class="rounded-md bg-white px-2 py-0.5 text-xs text-stone-400 shadow-sm"
                  >
                    ... +{{ genForm.nombre - 5 }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  class="h-9 rounded-lg px-4 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100"
                  @click="showGenererModal = false"
                >
                  Annuler
                </button>
                <UButton
                  type="submit"
                  color="primary"
                  :loading="saving"
                  :disabled="saving || genForm.nombre < 1"
                >
                  Generer {{ genForm.nombre }} hausse{{ genForm.nombre > 1 ? 's' : '' }}
                </UButton>
              </div>
            </form>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modal Edit -->
    <UModal v-model:open="showEditModal">
      <template #content>
        <div class="flex max-h-[85vh] flex-col">
          <div class="shrink-0 border-b border-stone-100 px-6 py-4">
            <h2 class="text-lg font-semibold text-stone-900">
              Modifier la hausse {{ editingHausse?.numero }}
            </h2>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <form class="space-y-4" @submit.prevent="handleEdit">
              <!-- Statut -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600">Statut</label>
                <select
                  v-model="editForm.statut"
                  class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                >
                  <option value="disponible">Disponible</option>
                  <option value="en_service">En service</option>
                  <option value="en_stock">En stock</option>
                  <option value="hors_service">Hors service</option>
                </select>
              </div>

              <!-- Affecter a une ruche -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600"
                  >Affecter a une ruche</label
                >
                <select
                  v-model="editForm.rucheId"
                  class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                >
                  <option value="">Aucune</option>
                  <option v-for="r in ruchesList" :key="r.id" :value="r.id">
                    {{ r.numero }}
                  </option>
                </select>
              </div>

              <!-- Notes -->
              <div>
                <label class="mb-1 block text-xs font-medium text-stone-600">Notes</label>
                <textarea
                  v-model="editForm.notes"
                  :rows="3"
                  class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 placeholder-stone-300 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                  placeholder="Notes..."
                />
              </div>

              <!-- Actions -->
              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  class="h-9 rounded-lg px-4 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100"
                  @click="showEditModal = false"
                >
                  Annuler
                </button>
                <UButton type="submit" color="primary" :loading="saving"> Enregistrer </UButton>
              </div>
            </form>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modal QR preview -->
    <UModal v-model:open="showQrModal">
      <template #content>
        <div class="p-6 text-center">
          <h3 class="mb-1 text-base font-semibold text-stone-900">
            {{ qrHausse?.numero }}
          </h3>
          <p class="mb-4 text-xs text-stone-400">QR Code</p>
          <div v-if="qrLoading" class="flex h-48 items-center justify-center">
            <div
              class="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"
            />
          </div>
          <img
            v-else-if="qrDataUrl"
            :src="qrDataUrl"
            :alt="`QR ${qrHausse?.numero}`"
            class="mx-auto h-48 w-48"
          />
          <div class="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              class="h-8 rounded-lg border border-stone-200 px-4 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
              @click="showQrModal = false"
            >
              Fermer
            </button>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Hausse } from '~/composables/useHausses';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { ruches: ruchesRaw } = useRuches();

const search = ref('');
const activeSegment = ref('');
const filterType = ref('');
const filterRucheId = ref('');
const currentPage = ref(1);

const statutFilter = computed(() => activeSegment.value);
const searchFilter = computed(() => search.value);

const {
  hausses,
  pagination,
  pending,
  refresh,
  genererHausses,
  updateHausse,
  deleteHausse,
  getQrCode,
  exportQrCodes,
} = useHausses({
  statut: statutFilter as Ref<string>,
  type: filterType as Ref<string>,
  rucheId: filterRucheId as Ref<string>,
  search: searchFilter as Ref<string>,
  page: currentPage,
});

onMounted(() => {
  refresh();
});

// Ruches list for selectors
const ruchesList = computed(() =>
  (ruchesRaw.value ?? []).map((r) => ({ id: r.id, numero: r.numero })),
);

// KPIs computed from full list stats
const kpis = computed(() => {
  const list = hausses.value;
  return {
    total: pagination.value.total,
    disponibles: list.filter((h) => h.statut === 'disponible').length,
    enService: list.filter((h) => h.statut === 'en_service').length,
    horsService: list.filter((h) => h.statut === 'hors_service').length,
  };
});

const hasFilters = computed(
  () =>
    search.value !== '' ||
    activeSegment.value !== '' ||
    filterType.value !== '' ||
    filterRucheId.value !== '',
);

// Segments
const segments = [
  { value: '', label: 'Toutes' },
  { value: 'disponible', label: 'Disponibles' },
  { value: 'en_service', label: 'En service' },
  { value: 'en_stock', label: 'Stock' },
  { value: 'hors_service', label: 'Hors service' },
];

function handleSegmentChange(value: string) {
  activeSegment.value = value;
  currentPage.value = 1;
}

// Type options
const typeOptions = [
  { value: 'dadant_10', label: 'Dadant 10' },
  { value: 'dadant_12', label: 'Dadant 12' },
  { value: 'langstroth', label: 'Langstroth' },
  { value: 'warre', label: 'Warre' },
  { value: 'voirnot', label: 'Voirnot' },
  { value: 'kenyane', label: 'Kenyane' },
  { value: 'autre', label: 'Autre' },
];

function typeLabel(t: string): string {
  return typeOptions.find((o) => o.value === t)?.label ?? t;
}

function statutLabel(s: string): string {
  const map: Record<string, string> = {
    disponible: 'Disponible',
    en_service: 'En service',
    en_stock: 'En stock',
    hors_service: 'Hors service',
  };
  return map[s] ?? s;
}

function statutBadgeClass(s: string): string {
  const map: Record<string, string> = {
    disponible: 'bg-emerald-50 text-emerald-700',
    en_service: 'bg-amber-50 text-amber-700',
    en_stock: 'bg-blue-50 text-blue-700',
    hors_service: 'bg-stone-100 text-stone-500',
  };
  return map[s] ?? 'bg-stone-100 text-stone-500';
}

// Selection
const selectedIds = ref<string[]>([]);

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id);
  if (idx === -1) {
    selectedIds.value.push(id);
  } else {
    selectedIds.value.splice(idx, 1);
  }
}

// Generer modal
const showGenererModal = ref(false);
const saving = ref(false);
const genForm = reactive({
  nombre: 10,
  type: 'dadant_10',
  nombreCadres: 10,
  prefixeNumero: 'H-2026-',
  anneeAcquisition: new Date().getFullYear(),
});

const genPreview = computed(() => {
  const prefix = genForm.prefixeNumero || 'H-';
  const count = Math.min(genForm.nombre, 5);
  return Array.from({ length: count }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return `${prefix}${num}`;
  });
});

async function handleGenerer() {
  saving.value = true;
  try {
    await genererHausses({
      nombre: genForm.nombre,
      type: genForm.type,
      nombreCadres: genForm.nombreCadres,
      prefixeNumero: genForm.prefixeNumero || undefined,
      anneeAcquisition: genForm.anneeAcquisition || undefined,
    });
    notifications.success(
      `${genForm.nombre} hausse${genForm.nombre > 1 ? 's' : ''} generee${genForm.nombre > 1 ? 's' : ''}`,
    );
    showGenererModal.value = false;
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la generation'));
  } finally {
    saving.value = false;
  }
}

// Edit modal
const showEditModal = ref(false);
const editingHausse = ref<Hausse | null>(null);
const editForm = reactive({
  statut: 'disponible',
  rucheId: '',
  notes: '',
});

function openEditModal(hausse: Hausse) {
  editingHausse.value = hausse;
  editForm.statut = hausse.statut;
  editForm.rucheId = hausse.rucheId ?? '';
  editForm.notes = hausse.notes ?? '';
  showEditModal.value = true;
}

async function handleEdit() {
  if (!editingHausse.value) return;
  saving.value = true;
  try {
    await updateHausse(editingHausse.value.id, {
      statut: editForm.statut,
      rucheId: editForm.rucheId || null,
      notes: editForm.notes || null,
    });
    notifications.success('Hausse modifiee');
    showEditModal.value = false;
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la modification'));
  } finally {
    saving.value = false;
  }
}

// Delete
async function handleDelete(hausse: Hausse) {
  if (!confirm(`Supprimer la hausse "${hausse.numero}" ? Cette action est irreversible.`)) return;
  try {
    await deleteHausse(hausse.id);
    notifications.success('Hausse supprimee');
    await refresh();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la suppression'));
  }
}

// QR preview modal
const showQrModal = ref(false);
const qrHausse = ref<Hausse | null>(null);
const qrDataUrl = ref('');
const qrLoading = ref(false);

async function handleShowQr(hausse: Hausse) {
  qrHausse.value = hausse;
  qrDataUrl.value = '';
  qrLoading.value = true;
  showQrModal.value = true;
  try {
    qrDataUrl.value = await getQrCode(hausse.id);
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur QR'));
    showQrModal.value = false;
  } finally {
    qrLoading.value = false;
  }
}

// Export QR
const exporting = ref(false);

async function handleExportQr() {
  if (selectedIds.value.length === 0) return;
  exporting.value = true;
  try {
    const items = await exportQrCodes(selectedIds.value.slice(0, 32));
    // Open print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notifications.error("Impossible d'ouvrir la fenetre d'impression. Verifiez vos popups.");
      return;
    }
    const sTag = '<' + 'script>';
    const eTag = '</' + 'script>';
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>QR Codes Hausses</title>
  <style>
    @media print { @page { margin: 10mm; } }
    body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', sans-serif; margin: 20px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .card { text-align: center; border: 1px solid #e7e5e4; border-radius: 12px; padding: 12px; }
    .card img { width: 150px; height: 150px; }
    .card .numero { font-weight: 700; font-size: 14px; margin-top: 8px; }
    .card .type { font-size: 11px; color: #78716c; }
  </style>
</head>
<body>
  <h1 style="font-size:18px;margin-bottom:16px;">QR Codes Hausses</h1>
  <div class="grid">
    ${items.map((h) => `<div class="card"><img src="${h.qrCode}" alt="${h.numero}"/><div class="numero">${h.numero}</div><div class="type">${typeLabel(h.type)}</div></div>`).join('')}
  </div>
  ${sTag}window.onload=function(){window.print();}${eTag}
</body>
</html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    selectedIds.value = [];
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur export QR'));
  } finally {
    exporting.value = false;
  }
}
</script>
