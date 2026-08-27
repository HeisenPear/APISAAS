<template>
  <div class="space-y-5">
    <!-- Back button -->
    <NuxtLink
      to="/ruches"
      class="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Ruches
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-5">
      <div class="h-10 w-64 animate-pulse rounded-[12px] bg-[var(--surface-muted)]" />
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div
          v-for="i in 3"
          :key="i"
          class="h-20 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
        />
      </div>
      <div class="h-64 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
    </div>

    <template v-else-if="ruche">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 flex-wrap">
            <h1
              class="text-[26px] font-semibold tracking-[-0.02em]"
              style="
                font-family:
                  'SF Pro Display',
                  -apple-system,
                  system-ui,
                  sans-serif;
              "
            >
              {{ ruche.numero }}
            </h1>
            <!-- Health badge -->
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              :class="{
                'bg-[var(--sage-soft)] text-[var(--sage-deep)]': ruche.statut === 'active',
                'bg-[var(--honey-soft)] text-[var(--honey-deep)]':
                  ruche.statut === 'faible' || ruche.statut === 'orpheline',
                'bg-red-50 text-red-700': ruche.statut === 'morte',
                'bg-blue-50 text-blue-700': ruche.statut === 'essaimee',
                'bg-[var(--surface-muted)] text-[var(--text-tertiary)]':
                  ruche.statut === 'vendue' || ruche.statut === 'fusionnee',
              }"
            >
              <span
                class="w-1.5 h-1.5 rounded-full"
                :class="{
                  'bg-[var(--status-good)]': ruche.statut === 'active',
                  'bg-[var(--status-warn)]':
                    ruche.statut === 'faible' || ruche.statut === 'orpheline',
                  'bg-[var(--status-bad)]': ruche.statut === 'morte',
                  'bg-[var(--status-info)]': ruche.statut === 'essaimee',
                  'bg-[var(--tint-idle)]':
                    ruche.statut === 'vendue' || ruche.statut === 'fusionnee',
                }"
              />
              {{ statutLabel }}
            </span>
          </div>
          <p v-if="rucherInfo" class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
            <NuxtLink
              :to="`/ruchers/${ruche.rucherId}`"
              class="text-[var(--honey-deep)] hover:underline"
            >
              {{ rucherInfo.nom }}
            </NuxtLink>
            <span v-if="rucherInfo.commune" class="text-[var(--text-tertiary)]">
              — {{ rucherInfo.commune }}</span
            >
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
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
            icon="i-lucide-sparkles"
            variant="soft"
            color="primary"
            aria-label="Demander à Maya"
            @click="mayaOpen = true"
          >
            <span class="hidden sm:inline">Maya</span>
          </UButton>
          <UButton
            v-if="!editing"
            icon="i-lucide-activity"
            color="primary"
            @click="
              navigateTo(`/interventions/nouvelle?rucheId=${ruche.id}&from=/ruches/${ruche.id}`)
            "
          >
            <span class="hidden sm:inline">Intervention</span>
          </UButton>
          <UButton
            v-if="!editing"
            icon="i-lucide-file-text"
            variant="outline"
            color="neutral"
            @click="navigateTo(`/ruches/${ruche.id}/rapport`)"
          >
            <span class="hidden sm:inline">Rapport PDF</span>
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

      <!-- Maya contextuelle (slide-over) -->
      <IaMayaPanel
        :open="mayaOpen"
        :numero="ruche.numero"
        :rucher-nom="rucherInfo?.nom"
        @close="mayaOpen = false"
      />

      <!-- Edit mode -->
      <div v-if="editing" class="bg-white border border-[var(--border-default)] rounded-[14px] p-6">
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
        <!-- KPI strip -->
        <!-- Deux colonnes sur téléphone, trois à partir de 640 px : à trois, une
             carte ne fait que 101 px sur un écran de 360, et son contenu (« Non
             marquée » à côté de sa pastille) débordait de la carte, que le shell
             rognait ensuite. -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
            <p
              class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1"
            >
              Type
            </p>
            <p class="text-[18px] font-semibold text-[var(--text-primary)]">{{ typeLabel }}</p>
            <p class="text-[12px] text-[var(--text-tertiary)] mt-0.5">{{ raceLabel }}</p>
          </div>
          <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
            <p
              class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1"
            >
              Cadres
            </p>
            <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
              {{ ruche.nombreCadres ?? '—' }}
            </p>
          </div>
          <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
            <p
              class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1"
            >
              Reine
            </p>
            <div class="flex min-w-0 items-center gap-1.5 mt-1">
              <span
                class="inline-flex h-5 w-5 items-center justify-center rounded-[6px]"
                :class="reineKpiColor.bg"
              >
                <UIcon name="i-lucide-crown" class="h-3 w-3" :class="reineKpiColor.icon" />
              </span>
              <span class="truncate text-[14px] font-semibold text-[var(--text-primary)]">{{
                reineKpiLabel
              }}</span>
            </div>
            <p
              v-if="reineInfo.reineCouleur"
              class="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]"
            >
              <span
                class="h-2 w-2 rounded-full border border-[var(--border-default)]"
                :style="{ backgroundColor: reineKpiCouleurHex }"
              />
              {{ reineInfo.reineCouleur }}
              <span v-if="reineInfo.reineAnnee">· {{ reineInfo.reineAnnee }}</span>
            </p>
          </div>
        </div>

        <!-- Main grid -->
        <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <!-- Left: Fiche + Timeline + Notes -->
          <div class="space-y-5 lg:col-span-2">
            <!-- Section 01 — Fiche technique -->
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <div
                class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-4"
              >
                01 — Fiche technique
              </div>
              <dl class="grid grid-cols-2 gap-x-8 gap-y-3">
                <div v-if="ruche.dateInstallation">
                  <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Installation</dt>
                  <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                    {{ formattedInstallDate }}
                  </dd>
                </div>
                <div v-if="ruche.origineEssaim">
                  <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Origine essaim</dt>
                  <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                    {{ ruche.origineEssaim }}
                  </dd>
                </div>
                <div v-if="ruche.marquageReine">
                  <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Marquage reine</dt>
                  <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                    {{ ruche.marquageReine }}
                  </dd>
                </div>
                <div>
                  <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Qualité reine</dt>
                  <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                    {{ ruche.qualiteReine ?? 'Inconnue' }}
                  </dd>
                </div>
                <div v-if="ruche.nombreHausses">
                  <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Hausses</dt>
                  <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                    {{ ruche.nombreHausses }}
                  </dd>
                </div>
                <div>
                  <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Mise à jour</dt>
                  <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                    {{ formatDateFr(ruche.updatedAt) }}
                  </dd>
                </div>
              </dl>
            </div>

            <!-- Section 02 — Timeline -->
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <div
                class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-4"
              >
                02 — Timeline
              </div>
              <RuchesRucheTimeline
                :entries="timelineEntries"
                :loading="timelineLoading"
                :loading-more="timelineLoadingMore"
                :has-more="timelineHasMore"
                @load-more="loadMoreTimeline"
              />
            </div>

            <!-- Section 03 — Notes -->
            <div
              v-if="ruche.notes"
              class="bg-white border border-[var(--border-default)] rounded-[14px] p-5"
            >
              <div
                class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-3"
              >
                03 — Notes
              </div>
              <p
                class="text-[13px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed"
              >
                {{ ruche.notes }}
              </p>
            </div>

            <!-- Section 04 — Photos -->
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <div
                class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-4"
              >
                04 — Photos
              </div>
              <UiPhotoUploader
                v-model="ruchePhotos"
                bucket="ruches-photos"
                :entity-id="rucheId"
                :max-photos="8"
                @update:model-value="saveRuchePhotos"
              />
            </div>
          </div>

          <!-- Right sidebar -->
          <div class="space-y-5">
            <!-- Score santé -->
            <UiSanteScoreCard :score-data="santeData" :pending="santePending" />

            <!-- Score prédictif de santé (Pro) -->
            <UiFeatureGate feature="scorePredictif" blur>
              <RuchesPredictionSante :ruche-id="ruche.id" />
              <template #preview>
                <RuchesPredictionSante preview />
              </template>
            </UiFeatureGate>

            <!-- Poids en direct — seulement si une balance est posée sous cette ruche -->
            <BalancesBalancePoidsCard v-if="balanceLiee" :balance="balanceLiee" dense />

            <!-- Module Reine -->
            <RuchesRucheReineCard
              :reine-info="reineInfo"
              :evenements="reineEvenements"
              @add-event="showReineModal = true"
            />

            <!-- Module Cire -->
            <RuchesRucheCireCard
              :historique="cireHistorique"
              @add-renouvellement="showCireModal = true"
            />

            <!-- Quick actions -->
            <div
              ref="quickActionsRef"
              class="flex flex-col gap-2 rounded-[14px] transition-shadow duration-300"
              :class="{ 'ring-2 ring-[var(--honey)] ring-offset-2': scanHighlight }"
            >
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
              class="bg-white border border-[var(--border-default)] rounded-[14px] p-5"
            >
              <div
                class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-3"
              >
                Rucher
              </div>
              <NuxtLink
                :to="`/ruchers/${ruche.rucherId}`"
                class="flex items-center gap-3 rounded-[10px] bg-[var(--surface-muted)] p-3 transition-colors hover:bg-[var(--surface-sunk)]"
              >
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--honey-soft)]"
                >
                  <UIcon name="i-lucide-map-pin" class="h-4 w-4 text-[var(--honey-deep)]" />
                </div>
                <div class="min-w-0">
                  <p class="text-[13px] font-medium text-[var(--text-primary)]">
                    {{ rucherInfo.nom }}
                  </p>
                  <p v-if="rucherInfo.commune" class="text-[11.5px] text-[var(--text-tertiary)]">
                    {{ rucherInfo.commune
                    }}{{ rucherInfo.departement ? `, ${rucherInfo.departement}` : '' }}
                  </p>
                </div>
                <UIcon
                  name="i-lucide-chevron-right"
                  class="h-4 w-4 text-[var(--text-quaternary)] ml-auto shrink-0"
                />
              </NuxtLink>
            </div>

            <!-- QR Code -->
            <div
              class="bg-white border border-[var(--border-default)] rounded-[14px] p-5 print:hidden"
            >
              <div
                class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-3"
              >
                QR Code
              </div>
              <div class="flex flex-col items-center gap-3">
                <div v-if="generating" class="flex h-[180px] w-[180px] items-center justify-center">
                  <div
                    class="h-7 w-7 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--honey)]"
                  />
                </div>
                <img
                  v-else-if="qrDataUrl"
                  :src="qrDataUrl"
                  :alt="`QR code ruche ${ruche.numero}`"
                  class="h-[180px] w-[180px] rounded-[8px]"
                />
                <p class="text-[12.5px] font-medium text-[var(--text-secondary)]">
                  {{ ruche.numero }}
                </p>
                <UButton
                  icon="i-lucide-printer"
                  variant="outline"
                  color="neutral"
                  size="sm"
                  block
                  @click="printLabel"
                >
                  Imprimer l'étiquette
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Print label -->
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
            <p class="text-2xl font-bold">{{ ruche.numero }}</p>
            <p v-if="rucherInfo" class="text-base">{{ rucherInfo.nom }}</p>
            <p class="text-xs">{{ formatDateFr(new Date()) }}</p>
          </div>
        </div>
      </template>
    </template>

    <!-- Not found -->
    <UiErrorState v-else-if="santeError" :error="santeError" :retry="refreshSante" />

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
            <h2 class="text-[15px] font-semibold text-[var(--text-primary)]">Événement reine</h2>
            <button
              aria-label="Fermer"
              class="rounded-[8px] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)]"
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

    <!-- Modal renouvellement cire -->
    <UModal v-model:open="showCireModal">
      <template #content>
        <div class="p-6">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-[15px] font-semibold text-[var(--text-primary)]">
              Renouvellement de cire
            </h2>
            <button
              aria-label="Fermer"
              class="rounded-[8px] p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-secondary)]"
              @click="showCireModal = false"
            >
              <UIcon name="i-lucide-x" class="h-4 w-4" />
            </button>
          </div>
          <div class="space-y-4">
            <UFormField label="Date du renouvellement">
              <UInput v-model="cireFormData.dateRenouvellement" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Nombre de cadres renouvelés (optionnel)">
              <UInput
                v-model.number="cireFormData.nombreCadresRenouveles"
                type="number"
                :min="1"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Notes (optionnel)">
              <UTextarea v-model="cireFormData.notes" :rows="2" class="w-full" />
            </UFormField>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="showCireModal = false"
              >Annuler</UButton
            >
            <UButton
              :loading="savingCire"
              :disabled="!cireFormData.dateRenouvellement"
              color="primary"
              @click="submitCireEvent"
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
import type { Ruche, PhotoEntry } from '~/types/models';
import type { ApiListResponse } from '~/types/api';
import type { RucheFormData } from '~/components/ruches/RucheForm.vue';
import type { Balance as BalanceRuche } from '~/composables/useBalances';
import { urlQrRuche } from '~/utils/urlQr';

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

// QR Code — URL CANONIQUE, jamais celle de l'onglet : le QR finit collé sur
// une ruche, il doit survivre au déploiement depuis lequel on l'a imprimé.
// Cf. `app/utils/urlQr.ts`.
const rucheUrl = computed(() => {
  if (import.meta.server) return '';
  return urlQrRuche(rucheId.value);
});
const { qrDataUrl, generating } = useQrCode(rucheUrl);

// Atterrissage post-scan : mise en avant des actions rapides
const quickActionsRef = ref<HTMLElement | null>(null);
const scanHighlight = ref(false);

function highlightQuickActionsFromScan() {
  if (route.query.scan !== '1') return;
  scanHighlight.value = true;
  nextTick(() => {
    quickActionsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  setTimeout(() => {
    scanHighlight.value = false;
  }, 4000);
}

function printLabel() {
  window.print();
}

interface RucheSanteData {
  score: number;
  niveau?: string;
  couleur?: string;
  confiance?: 'haute' | 'moyenne' | 'faible';
  raisons?: string[];
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
  error: santeError,
  refresh: refreshSante,
} = useFetch<{ data: RucheSanteData }>(() => `/api/ruches/${rucheId.value}/sante`, {
  key: `ruche-sante-${rucheId.value}`,
  lazy: true,
});
const santeData = computed(() => santeRaw.value?.data ?? null);

// Balance posée sous cette ruche, s'il y en a une. `lazy` : la fiche ne doit
// jamais attendre cette requête pour s'afficher.
const { data: balanceRaw } = useFetch<{ data: BalanceRuche[] }>('/api/balances', {
  key: `ruche-balance-${rucheId.value}`,
  query: computed(() => ({ rucheId: rucheId.value })),
  lazy: true,
  default: () => ({ data: [] }),
});
const balanceLiee = computed(() => balanceRaw.value?.data?.[0] ?? null);

const loading = ref(true);
const saving = ref(false);
const editing = ref(false);

const ruche = ref<(Ruche & { rucher?: RucherEmbedded }) | null>(null);
const mayaOpen = ref(false);
const ruchePhotos = ref<PhotoEntry[]>([]);
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
  if (reineInfo.value.reinePresente === true) return { bg: 'bg-amber-50', icon: 'text-honey-deep' };
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
    ruchePhotos.value = (data as Ruche & { photos?: PhotoEntry[] }).photos ?? [];
  } catch {
    ruche.value = null;
  } finally {
    loading.value = false;
  }
}

async function saveRuchePhotos(updated: PhotoEntry[]) {
  ruchePhotos.value = updated;
  try {
    await ($fetch as typeof $fetch<unknown, string>)(`/api/ruches/${rucheId.value}`, {
      method: 'PUT',
      body: { photos: updated },
    });
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur sauvegarde photos'));
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
    notifications.success('C’est à jour, c’est noté ✅');
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
  if (
    !confirm(
      'Supprimer cette ruche et tout son historique (visites, récoltes) ? Cette action est définitive.',
    )
  )
    return;
  try {
    await deleteRuche(ruche.value.id);
    notifications.success('Ruche supprimée, c’est fait.');
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
  race: undefined as string | undefined,
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
    notifications.success('C’est noté pour la reine 👑');
    showReineModal.value = false;
    await fetchReineData();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement"));
  } finally {
    savingReine.value = false;
  }
}

const { on: onBusEvent } = useDataBus();
onBusEvent(['intervention:created', 'intervention:updated', 'intervention:deleted'], () => {
  timelinePage.value = 1;
  fetchTimeline(1);
});

// ─── Module Cire ─────────────────────────────────────────────

interface HistoriqueCireEntry {
  id: string;
  dateRenouvellement: string;
  nombreCadresRenouveles: number | null;
  notes: string | null;
}

const showCireModal = ref(false);
const savingCire = ref(false);
const cireHistorique = ref<HistoriqueCireEntry[]>([]);

const cireFormData = ref({
  dateRenouvellement: new Date().toISOString().slice(0, 10),
  nombreCadresRenouveles: undefined as number | undefined,
  notes: '',
});

async function fetchCireData() {
  try {
    const res = await $fetch<{ data: HistoriqueCireEntry[] }>(`/api/ruches/${rucheId.value}/cire`);
    cireHistorique.value = res.data;
  } catch {
    // Module cire non critique
  }
}

async function submitCireEvent() {
  savingCire.value = true;
  try {
    await $fetch(`/api/ruches/${rucheId.value}/cire`, {
      method: 'POST',
      body: {
        dateRenouvellement: new Date(cireFormData.value.dateRenouvellement).toISOString(),
        nombreCadresRenouveles: cireFormData.value.nombreCadresRenouveles || undefined,
        notes: cireFormData.value.notes || undefined,
      },
    });
    notifications.success('Renouvellement de cire enregistré');
    showCireModal.value = false;
    cireFormData.value = {
      dateRenouvellement: new Date().toISOString().slice(0, 10),
      nombreCadresRenouveles: undefined,
      notes: '',
    };
    await fetchCireData();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement"));
  } finally {
    savingCire.value = false;
  }
}

onMounted(async () => {
  await fetchRuche();
  if (ruche.value) {
    fetchTimeline();
    fetchReineData();
    fetchCireData();
    refreshSante();
    nextTick(() => highlightQuickActionsFromScan());
  }
});
</script>
