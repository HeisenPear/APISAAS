<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="mb-4 flex items-center gap-1.5 text-sm text-stone-400">
      <NuxtLink to="/ruches" class="transition-colors hover:text-stone-700">Ruches</NuxtLink>
      <UIcon name="i-lucide-chevron-right" class="h-3.5 w-3.5" />
      <NuxtLink
        v-if="rucherInfo"
        :to="`/ruchers/${ruche?.rucherId}`"
        class="transition-colors hover:text-stone-700"
      >
        {{ rucherInfo.nom }}
      </NuxtLink>
      <UIcon v-if="rucherInfo" name="i-lucide-chevron-right" class="h-3.5 w-3.5" />
      <span class="font-medium text-stone-700">{{ ruche?.numero ?? '...' }}</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="h-10 w-64 animate-pulse rounded-lg bg-stone-100" />
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    </div>

    <template v-else-if="ruche">
      <!-- Hero header -->
      <div class="mb-6 flex items-start justify-between">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl" :class="statutBgClass">
            <UIcon name="i-lucide-box" class="h-6 w-6" :class="statutIconClass" />
          </div>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold tracking-tight text-stone-900">{{ ruche.numero }}</h1>
              <RuchesRucheHealthBadge :statut="ruche.statut" :qualite-reine="ruche.qualiteReine" />
            </div>
            <p v-if="rucherInfo" class="mt-0.5 text-sm text-stone-500">
              <NuxtLink
                :to="`/ruchers/${ruche.rucherId}`"
                class="hover:text-amber-600 transition-colors"
              >
                {{ rucherInfo.nom }}
              </NuxtLink>
              <span v-if="rucherInfo.commune"> — {{ rucherInfo.commune }}</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            :icon="editing ? 'i-lucide-x' : 'i-lucide-pencil'"
            :variant="editing ? 'ghost' : 'outline'"
            color="neutral"
            @click="toggleEdit"
          >
            <span class="hidden sm:inline">{{ editing ? 'Annuler' : 'Modifier' }}</span>
          </UButton>
          <UButton
            v-if="!editing"
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            @click="handleDelete"
          >
            <span class="hidden sm:inline">Supprimer</span>
          </UButton>
        </div>
      </div>

      <!-- Edit mode -->
      <div
        v-if="editing"
        class="mx-auto max-w-2xl rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm"
      >
        <RuchesRucheForm
          v-model="editData"
          :loading="saving"
          :ruchers="allRuchers"
          submit-label="Enregistrer"
          @submit="handleUpdate"
        />
      </div>

      <!-- Detail mode -->
      <template v-else>
        <!-- KPI cards row -->
        <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
            <p class="text-xs font-medium uppercase tracking-wider text-stone-400">Type</p>
            <p class="mt-1.5 text-lg font-bold text-stone-900">{{ typeLabel }}</p>
          </div>
          <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
            <p class="text-xs font-medium uppercase tracking-wider text-stone-400">Statut</p>
            <p class="mt-1.5 text-lg font-bold" :class="statutTextClass">{{ statutLabel }}</p>
          </div>
          <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
            <p class="text-xs font-medium uppercase tracking-wider text-stone-400">Race</p>
            <p class="mt-1.5 text-lg font-bold text-stone-900">{{ raceLabel }}</p>
          </div>
          <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
            <p class="text-xs font-medium uppercase tracking-wider text-stone-400">Reine</p>
            <div class="mt-1.5 flex items-center gap-2">
              <span
                class="inline-flex h-6 w-6 items-center justify-center rounded-lg"
                :class="reineKpiColor.bg"
              >
                <UIcon name="i-lucide-crown" class="h-3.5 w-3.5" :class="reineKpiColor.icon" />
              </span>
              <span class="text-lg font-bold text-stone-900">{{ reineKpiLabel }}</span>
            </div>
            <p
              v-if="reineInfo.reineCouleur"
              class="mt-0.5 flex items-center gap-1 text-xs text-stone-400"
            >
              <span
                class="h-2 w-2 rounded-full border border-stone-200"
                :style="{ backgroundColor: reineKpiCouleurHex }"
              />
              {{ reineInfo.reineCouleur }}
              <span v-if="reineInfo.reineAnnee"> · {{ reineInfo.reineAnnee }}</span>
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <!-- Left: Details + Timeline -->
          <div class="space-y-6 lg:col-span-2">
            <!-- Details card -->
            <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
              <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
                Informations
              </h2>
              <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div v-if="ruche.dateInstallation">
                  <dt class="text-stone-500">Installee le</dt>
                  <dd class="font-medium text-stone-900">{{ formattedInstallDate }}</dd>
                </div>
                <div v-if="ruche.origineEssaim">
                  <dt class="text-stone-500">Origine</dt>
                  <dd class="font-medium text-stone-900">{{ ruche.origineEssaim }}</dd>
                </div>
                <div v-if="ruche.marquageReine">
                  <dt class="text-stone-500">Marquage reine</dt>
                  <dd class="font-medium text-stone-900">{{ ruche.marquageReine }}</dd>
                </div>
                <div v-if="ruche.nombreCadres">
                  <dt class="text-stone-500">Cadres</dt>
                  <dd class="font-medium text-stone-900">{{ ruche.nombreCadres }}</dd>
                </div>
                <div v-if="ruche.nombreHausses">
                  <dt class="text-stone-500">Hausses</dt>
                  <dd class="font-medium text-stone-900">{{ ruche.nombreHausses }}</dd>
                </div>
                <div v-if="ruche.notes" class="col-span-2">
                  <dt class="text-stone-500">Notes</dt>
                  <dd class="font-medium text-stone-900 whitespace-pre-line">{{ ruche.notes }}</dd>
                </div>
              </dl>
            </div>

            <!-- Timeline -->
            <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
              <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
                Historique
              </h2>
              <RuchesRucheTimeline
                :entries="timelineEntries"
                :loading="timelineLoading"
                :loading-more="timelineLoadingMore"
                :has-more="timelineHasMore"
                @load-more="loadMoreTimeline"
              />
            </div>
          </div>

          <!-- Right sidebar -->
          <div class="space-y-6">
            <!-- Score sante -->
            <UiSanteScoreCard :score-data="santeData" :pending="santePending" />

            <!-- Module Reine -->
            <RuchesRucheReineCard
              :reine-info="reineInfo"
              :evenements="reineEvenements"
              @add-event="showReineModal = true"
            />

            <!-- Quick actions -->
            <div class="flex flex-col gap-2">
              <UButton
                label="Nouvelle intervention"
                icon="i-lucide-activity"
                color="primary"
                block
                size="md"
                @click="
                  navigateTo(`/interventions/nouvelle?rucheId=${ruche.id}&from=/ruches/${ruche.id}`)
                "
              />
              <UButton
                label="Enregistrer une récolte"
                icon="i-lucide-droplets"
                variant="outline"
                color="neutral"
                block
                size="md"
                @click="navigateTo(`/production/recoltes?rucheId=${ruche.id}`)"
              />
            </div>

            <!-- Rucher link -->
            <div
              v-if="rucherInfo"
              class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm"
            >
              <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
                Rucher
              </h3>
              <NuxtLink
                :to="`/ruchers/${ruche.rucherId}`"
                class="flex items-center gap-3 rounded-xl bg-stone-50 p-3 transition-colors hover:bg-stone-100"
              >
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <UIcon name="i-lucide-map-pin" class="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p class="text-sm font-medium text-stone-900">{{ rucherInfo.nom }}</p>
                  <p v-if="rucherInfo.commune" class="text-xs text-stone-400">
                    {{ rucherInfo.commune
                    }}{{ rucherInfo.departement ? `, ${rucherInfo.departement}` : '' }}
                  </p>
                </div>
              </NuxtLink>
            </div>

            <!-- Dates -->
            <div class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
              <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
                Dates
              </h3>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-stone-500">Creee le</dt>
                  <dd class="font-medium text-stone-700">{{ formatDateFr(ruche.createdAt) }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-stone-500">Mise a jour</dt>
                  <dd class="font-medium text-stone-700">{{ formatDateFr(ruche.updatedAt) }}</dd>
                </div>
              </dl>
            </div>

            <!-- QR Code -->
            <div class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm print:hidden">
              <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
                QR Code
              </h3>
              <div class="flex flex-col items-center gap-3">
                <div v-if="generating" class="flex h-[200px] w-[200px] items-center justify-center">
                  <div
                    class="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-amber-500"
                  />
                </div>
                <img
                  v-else-if="qrDataUrl"
                  :src="qrDataUrl"
                  :alt="`QR code ruche ${ruche.numero}`"
                  class="h-[200px] w-[200px] rounded-lg"
                />
                <p class="text-sm font-medium text-stone-700">{{ ruche.numero }}</p>
                <UButton
                  icon="i-lucide-printer"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  block
                  @click="printLabel"
                >
                  Imprimer l'etiquette
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Print label (hidden on screen, visible on print) -->
        <div
          v-if="qrDataUrl"
          class="hidden print:flex print:h-screen print:items-center print:justify-center"
        >
          <div class="flex flex-col items-center gap-4 p-8">
            <img
              :src="qrDataUrl"
              :alt="`QR code ruche ${ruche.numero}`"
              class="h-[250px] w-[250px]"
            />
            <p class="text-2xl font-bold text-stone-900">{{ ruche.numero }}</p>
            <p v-if="rucherInfo" class="text-base text-stone-600">{{ rucherInfo.nom }}</p>
            <p class="text-xs text-stone-400">{{ formatDateFr(new Date()) }}</p>
          </div>
        </div>
      </template>
    </template>

    <!-- Not found -->
    <UiEmptyState
      v-else
      icon="i-lucide-search-x"
      title="Ruche introuvable"
      description="Cette ruche n'existe pas ou a ete supprimee"
      action-label="Retour aux ruches"
      @action="navigateTo('/ruches')"
    />

    <!-- Modal événement reine -->
    <UModal v-model:open="showReineModal">
      <template #content>
        <div class="p-6">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-base font-semibold text-stone-900">Événement reine</h2>
            <button
              class="rounded-lg p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              @click="showReineModal = false"
            >
              <UIcon name="i-lucide-x" class="h-4 w-4" />
            </button>
          </div>
          <InterventionsFormReine v-model="reineFormData" />
          <div class="mt-5 flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="showReineModal = false"
              >Annuler</UButton
            >
            <UButton
              :loading="savingReine"
              :disabled="!reineFormData.typeEvenement"
              color="primary"
              @click="submitReineEvent"
            >
              Enregistrer
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Ruche } from '~/types/models';
import type { ApiListResponse } from '~/types/api';
import type { RucheFormData } from '~/components/ruches/RucheForm.vue';

definePageMeta({ layout: 'default' });

interface RucherEmbedded {
  id: string;
  nom: string;
  commune: string | null;
  departement: string | null;
}

interface TimelineEntry {
  id: string;
  type: 'intervention' | 'recolte';
  date: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
}

const route = useRoute();
const router = useRouter();
const notifications = useNotifications();
const { getRuche, updateRuche, deleteRuche } = useRuches();
const { ruchers: allRuchers } = useRuchers();

const rucheId = computed(() => route.params.id as string);

// QR Code
const rucheUrl = computed(() => {
  if (import.meta.server) return '';
  return `${window.location.origin}/ruches/${rucheId.value}`;
});
const { qrDataUrl, generating } = useQrCode(rucheUrl);

function printLabel() {
  window.print();
}

interface RucheSanteData {
  score: number;
  dernierControle: string | null;
  facteurs: {
    forceColonie: number | null;
    couvain: number | null;
    reserves: number | null;
    reineVue: boolean | null;
    varroa: number | null;
    comportement: string | null;
  } | null;
}

const {
  data: santeRaw,
  pending: santePending,
  refresh: refreshSante,
} = useFetch<{ data: RucheSanteData }>(() => `/api/ruches/${rucheId.value}/sante`, {
  key: `ruche-sante-${rucheId.value}`,
  lazy: true,
});
const santeData = computed(() => santeRaw.value?.data ?? null);

const loading = ref(true);
const saving = ref(false);
const editing = ref(false);

const ruche = ref<(Ruche & { rucher?: RucherEmbedded }) | null>(null);
const rucherInfo = computed(
  () => (ruche.value as Ruche & { rucher?: RucherEmbedded })?.rucher ?? null,
);

// Timeline state
const timelineEntries = ref<TimelineEntry[]>([]);
const timelineLoading = ref(false);
const timelineLoadingMore = ref(false);
const timelinePage = ref(1);
const timelineTotalPages = ref(1);
const timelineHasMore = computed(() => timelinePage.value < timelineTotalPages.value);

// Edit form data
const editData = ref<RucheFormData>({
  rucherId: '',
  numero: '',
  type: 'dadant_10',
  statut: 'active',
  raceAbeille: 'inconnue',
  qualiteReine: 'inconnue',
  dateInstallation: '',
  origineEssaim: '',
  marquageReine: '',
  nombreCadres: undefined,
  nombreHausses: undefined,
  notes: '',
});

// Labels
const typeLabels: Record<string, string> = {
  dadant_10: 'Dadant 10',
  dadant_12: 'Dadant 12',
  langstroth: 'Langstroth',
  warre: 'Warre',
  voirnot: 'Voirnot',
  kenyane: 'Kenyane',
  autre: 'Autre',
};

const statutLabels: Record<string, string> = {
  active: 'Active',
  faible: 'Faible',
  orpheline: 'Orpheline',
  essaimee: 'Essaimee',
  morte: 'Morte',
  vendue: 'Vendue',
  fusionnee: 'Fusionnee',
};

const raceLabels: Record<string, string> = {
  noire: 'Noire',
  buckfast: 'Buckfast',
  carnica: 'Carnica',
  italienne: 'Italienne',
  caucasienne: 'Caucasienne',
  hybride: 'Hybride',
  inconnue: 'Inconnue',
};

const typeLabel = computed(() => typeLabels[ruche.value?.type ?? ''] ?? ruche.value?.type);
const statutLabel = computed(() => statutLabels[ruche.value?.statut ?? ''] ?? ruche.value?.statut);
const raceLabel = computed(
  () => raceLabels[ruche.value?.raceAbeille ?? ''] ?? ruche.value?.raceAbeille ?? 'Inconnue',
);

const COULEUR_HEX_MAP: Record<string, string> = {
  blanc: '#FFFFFF',
  jaune: '#F5C842',
  rouge: '#EF4444',
  vert: '#22C55E',
  bleu: '#3B82F6',
};
const reineKpiLabel = computed(() => {
  if (reineInfo.value.reinePresente === true) return 'Présente';
  if (reineInfo.value.reinePresente === false) return 'Absente';
  return 'Inconnue';
});
const reineKpiColor = computed(() => {
  if (reineInfo.value.reinePresente === true) return { bg: 'bg-amber-50', icon: 'text-amber-600' };
  if (reineInfo.value.reinePresente === false) return { bg: 'bg-red-50', icon: 'text-red-500' };
  return { bg: 'bg-stone-100', icon: 'text-stone-400' };
});
const reineKpiCouleurHex = computed(
  () => COULEUR_HEX_MAP[reineInfo.value.reineCouleur ?? ''] ?? '#D6D3D1',
);

const formattedInstallDate = computed(() => {
  if (!ruche.value?.dateInstallation) return '';
  return new Date(ruche.value.dateInstallation).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

const statutBgClass = computed(() => {
  const map: Record<string, string> = {
    active: 'bg-emerald-50',
    faible: 'bg-amber-50',
    orpheline: 'bg-amber-50',
    essaimee: 'bg-sky-50',
    morte: 'bg-red-50',
    vendue: 'bg-stone-100',
    fusionnee: 'bg-stone-100',
  };
  return map[ruche.value?.statut ?? ''] ?? 'bg-stone-100';
});

const statutIconClass = computed(() => {
  const map: Record<string, string> = {
    active: 'text-emerald-600',
    faible: 'text-amber-600',
    orpheline: 'text-amber-600',
    essaimee: 'text-sky-600',
    morte: 'text-red-600',
    vendue: 'text-stone-400',
    fusionnee: 'text-stone-400',
  };
  return map[ruche.value?.statut ?? ''] ?? 'text-stone-400';
});

const statutTextClass = computed(() => {
  const map: Record<string, string> = {
    active: 'text-emerald-600',
    faible: 'text-amber-600',
    orpheline: 'text-amber-600',
    essaimee: 'text-sky-600',
    morte: 'text-red-600',
    vendue: 'text-stone-500',
    fusionnee: 'text-stone-500',
  };
  return map[ruche.value?.statut ?? ''] ?? 'text-stone-900';
});

function formatDateFr(date: Date | string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateInput(date: Date | string | null) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

function toggleEdit() {
  if (!editing.value && ruche.value) {
    editData.value = {
      rucherId: ruche.value.rucherId,
      numero: ruche.value.numero,
      type: ruche.value.type,
      statut: ruche.value.statut,
      raceAbeille: ruche.value.raceAbeille ?? 'inconnue',
      qualiteReine: ruche.value.qualiteReine ?? 'inconnue',
      dateInstallation: formatDateInput(ruche.value.dateInstallation),
      origineEssaim: ruche.value.origineEssaim ?? '',
      marquageReine: ruche.value.marquageReine ?? '',
      nombreCadres: ruche.value.nombreCadres ?? undefined,
      nombreHausses: ruche.value.nombreHausses ?? undefined,
      notes: ruche.value.notes ?? '',
    };
  }
  editing.value = !editing.value;
}

async function fetchRuche() {
  loading.value = true;
  try {
    const data = await getRuche(rucheId.value);
    ruche.value = data;
  } catch {
    ruche.value = null;
  } finally {
    loading.value = false;
  }
}

async function fetchTimeline(page = 1) {
  const isFirstLoad = page === 1;
  if (isFirstLoad) {
    timelineLoading.value = true;
  } else {
    timelineLoadingMore.value = true;
  }

  try {
    const res = await $fetch<ApiListResponse<TimelineEntry>>(
      `/api/ruches/${rucheId.value}/timeline`,
      { query: { page, limit: 10 } },
    );

    if (isFirstLoad) {
      timelineEntries.value = res.data;
    } else {
      timelineEntries.value = [...timelineEntries.value, ...res.data];
    }
    timelinePage.value = res.pagination.page;
    timelineTotalPages.value = res.pagination.totalPages;
  } catch {
    // Timeline is non-critical — fail silently
  } finally {
    timelineLoading.value = false;
    timelineLoadingMore.value = false;
  }
}

function loadMoreTimeline() {
  fetchTimeline(timelinePage.value + 1);
}

async function handleUpdate() {
  if (!ruche.value) return;
  saving.value = true;
  try {
    const payload: Record<string, unknown> = {};
    const d = editData.value;
    if (d.rucherId !== ruche.value.rucherId) payload.rucherId = d.rucherId;
    if (d.numero !== ruche.value.numero) payload.numero = d.numero;
    if (d.type !== ruche.value.type) payload.type = d.type;
    if (d.statut !== ruche.value.statut) payload.statut = d.statut;
    if (d.raceAbeille !== (ruche.value.raceAbeille ?? 'inconnue'))
      payload.raceAbeille = d.raceAbeille;
    if (d.qualiteReine !== (ruche.value.qualiteReine ?? 'inconnue'))
      payload.qualiteReine = d.qualiteReine;
    if (d.dateInstallation) payload.dateInstallation = d.dateInstallation;
    if (d.origineEssaim !== (ruche.value.origineEssaim ?? ''))
      payload.origineEssaim = d.origineEssaim;
    if (d.marquageReine !== (ruche.value.marquageReine ?? ''))
      payload.marquageReine = d.marquageReine;
    if (d.nombreCadres !== (ruche.value.nombreCadres ?? undefined))
      payload.nombreCadres = d.nombreCadres;
    if (d.nombreHausses !== (ruche.value.nombreHausses ?? undefined))
      payload.nombreHausses = d.nombreHausses;
    if (d.notes !== (ruche.value.notes ?? '')) payload.notes = d.notes;

    if (Object.keys(payload).length === 0) {
      editing.value = false;
      return;
    }

    await updateRuche(ruche.value.id, payload as Parameters<typeof updateRuche>[1]);
    notifications.success('Ruche mise a jour');
    editing.value = false;
    await fetchRuche();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la mise a jour'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!ruche.value) return;
  if (!confirm('Voulez-vous vraiment supprimer cette ruche ? Cette action est irreversible.'))
    return;
  try {
    await deleteRuche(ruche.value.id);
    notifications.success('Ruche supprimee');
    await router.push('/ruches');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la suppression'));
  }
}

// ─── Module Reine ────────────────────────────────────────────

interface ReineApiData {
  reinePresente?: boolean | null;
  reineCouleur?: string | null;
  reineAnnee?: number | null;
  reineRace?: string | null;
  reineOrigine?: string | null;
  reineDateIntroduction?: string | null;
  reineQualitePonte?: number | null;
  reineDouceur?: number | null;
  reineProlificite?: number | null;
}

interface EvenementReine {
  id: string;
  typeEvenement: string;
  dateEvenement: string;
  couleur?: string | null;
}

const showReineModal = ref(false);
const reineInfo = ref<ReineApiData>({});
const reineEvenements = ref<EvenementReine[]>([]);
const savingReine = ref(false);

const reineFormData = ref({
  typeEvenement: 'introduction',
  dateEvenement: new Date().toISOString().slice(0, 10) + 'T00:00:00Z',
  couleur: undefined as string | undefined,
  origine: undefined as string | undefined,
  actionOrpheline: undefined as string | undefined,
  qualitePonte: undefined as number | undefined,
  notes: '',
});

async function fetchReineData() {
  try {
    const res = await $fetch<{ data: { ruche: ReineApiData; evenements: EvenementReine[] } }>(
      `/api/ruches/${rucheId.value}/reine`,
    );
    reineInfo.value = res.data.ruche;
    reineEvenements.value = res.data.evenements;
  } catch {
    // Module reine non critique
  }
}

async function submitReineEvent() {
  savingReine.value = true;
  try {
    await $fetch(`/api/ruches/${rucheId.value}/evenements-reine`, {
      method: 'POST',
      body: reineFormData.value,
    });
    notifications.success('Événement reine enregistré');
    showReineModal.value = false;
    await fetchReineData();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement"));
  } finally {
    savingReine.value = false;
  }
}

onMounted(async () => {
  await fetchRuche();
  if (ruche.value) {
    fetchTimeline();
    fetchReineData();
    refreshSante();
  }
});
</script>
