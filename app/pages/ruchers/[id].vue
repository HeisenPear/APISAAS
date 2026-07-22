<template>
  <div class="space-y-5">
    <!-- Back button -->
    <NuxtLink
      to="/ruchers"
      class="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Ruchers
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-5">
      <div class="h-10 w-64 animate-pulse rounded-[12px] bg-[var(--surface-muted)]" />
      <div class="grid grid-cols-4 gap-3">
        <div
          v-for="i in 4"
          :key="i"
          class="h-20 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
        />
      </div>
    </div>

    <template v-else-if="rucher">
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
              {{ rucher.nom }}
            </h1>
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              :class="
                rucher.actif
                  ? 'bg-[var(--sage-soft)] text-[var(--sage-deep)]'
                  : 'bg-[var(--surface-muted)] text-[var(--text-tertiary)]'
              "
            >
              <span
                class="w-1.5 h-1.5 rounded-full"
                :class="rucher.actif ? 'bg-[var(--status-good)]' : 'bg-[var(--text-quaternary)]'"
              />
              {{ rucher.actif ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          <p v-if="locationLabel" class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
            {{ locationLabel }}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton
            :icon="editing ? 'i-lucide-x' : 'i-lucide-pencil'"
            :variant="editing ? 'ghost' : 'outline'"
            color="neutral"
            @click="editing = !editing"
          >
            <span class="hidden sm:inline">{{ editing ? 'Annuler' : 'Modifier' }}</span>
          </UButton>
          <UButton
            v-if="!editing"
            icon="i-lucide-activity"
            color="primary"
            @click="
              navigateTo(
                `/interventions/nouvelle?rucherId=${rucher?.id}&from=/ruchers/${rucher?.id}`,
              )
            "
          >
            <span class="hidden sm:inline">Intervention</span>
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

      <!-- KPI strip -->
      <div v-if="stats && !editing" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
          <p
            class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1"
          >
            Total ruches
          </p>
          <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
            {{ stats.totalRuches }}
          </p>
        </div>
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
          <p
            class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1"
          >
            Actives
          </p>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[var(--status-good)]" />
            <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
              {{ stats.ruchesActives }}
            </p>
          </div>
        </div>
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
          <p
            class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1"
          >
            Production saison
          </p>
          <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">
            {{ Math.round(stats.productionSaison * 10) / 10
            }}<span class="text-[13px] text-[var(--text-tertiary)] ml-0.5">kg</span>
          </p>
        </div>
        <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
          <p
            class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1"
          >
            Dernière visite
          </p>
          <p class="text-[18px] font-semibold text-[var(--text-primary)]">
            {{ formattedLastVisit }}
          </p>
        </div>
      </div>

      <!-- Edit mode -->
      <div v-if="editing" class="bg-white border border-[var(--border-default)] rounded-[14px] p-6">
        <RuchersRucherForm
          v-model="editData"
          :loading="saving"
          submit-label="Enregistrer les modifications"
          @submit="handleUpdate"
        />
      </div>

      <!-- Detail mode -->
      <div v-else class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <!-- Left: Info + Ruches -->
        <div class="space-y-5 lg:col-span-2">
          <!-- Section 01 — Ruches -->
          <div
            class="bg-white border border-[var(--border-default)] rounded-[14px] overflow-hidden"
          >
            <div
              class="px-5 py-4 border-b border-[var(--border-faint)] flex items-center justify-between"
            >
              <div
                class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em]"
              >
                01 — Ruches
                <span
                  class="font-normal text-[var(--text-tertiary)] normal-case tracking-normal ml-1"
                  >{{ ruches.length }}</span
                >
              </div>
              <UButton
                label="Ajouter"
                icon="i-lucide-plus"
                size="xs"
                variant="outline"
                color="primary"
                @click="openAddRuche()"
              />
            </div>

            <!-- Skeleton -->
            <div v-if="ruchesPending" class="p-4 space-y-2">
              <div
                v-for="i in 3"
                :key="i"
                class="h-14 animate-pulse rounded-[10px] bg-[var(--surface-muted)]"
              />
            </div>

            <!-- Empty -->
            <div
              v-else-if="ruches.length === 0"
              class="py-10 text-center text-[13px] text-[var(--text-tertiary)]"
            >
              Aucune ruche dans ce rucher
            </div>

            <!-- Table -->
            <div v-else>
              <!-- Table head -->
              <div
                class="grid bg-[var(--surface-muted)] border-b border-[var(--border-faint)]"
                style="grid-template-columns: 2rem 1fr 1fr 1fr 1.5rem"
              >
                <div
                  class="px-3 py-2 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium"
                />
                <div
                  class="px-3 py-2 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium"
                >
                  Numéro
                </div>
                <div
                  class="px-3 py-2 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium"
                >
                  Type
                </div>
                <div
                  class="px-3 py-2 text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium"
                >
                  Statut
                </div>
                <div class="px-3 py-2" />
              </div>

              <NuxtLink
                v-for="ruche in ruches"
                :key="ruche.id"
                :to="`/ruches/${ruche.id}`"
                class="grid border-t border-[var(--border-faint)] hover:bg-[var(--surface-muted)] transition-colors duration-150 group"
                style="grid-template-columns: 2rem 1fr 1fr 1fr 1.5rem"
              >
                <!-- Accent -->
                <div class="flex items-center justify-center px-2 py-3">
                  <span class="w-1.5 h-5 rounded-full" :class="rucheAccentClass(ruche.statut)" />
                </div>
                <!-- Numéro -->
                <div class="px-3 py-3 flex items-center">
                  <span
                    class="text-[13px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--honey-deep)] transition-colors"
                  >
                    {{ ruche.numero }}
                  </span>
                </div>
                <!-- Type -->
                <div class="px-3 py-3 flex items-center">
                  <span class="text-[12.5px] text-[var(--text-secondary)]">{{
                    rucheTypeLabel(ruche.type)
                  }}</span>
                  <span
                    v-if="ruche.raceAbeille && ruche.raceAbeille !== 'inconnue'"
                    class="ml-1 text-[12px] text-[var(--text-tertiary)]"
                    >· {{ ruche.raceAbeille }}</span
                  >
                </div>
                <!-- Statut -->
                <div class="px-3 py-3 flex items-center">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
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
                    {{ ruche.statut }}
                  </span>
                </div>
                <!-- Arrow -->
                <div class="flex items-center justify-center pr-2">
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="h-3.5 w-3.5 text-[var(--text-quaternary)] opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Section 02 — Caractéristiques -->
          <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
            <div
              class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-4"
            >
              02 — Caractéristiques
            </div>
            <dl class="grid grid-cols-2 gap-x-8 gap-y-3">
              <div v-if="rucher.adresse">
                <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Adresse</dt>
                <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                  {{ rucher.adresse }}
                </dd>
              </div>
              <div v-if="rucher.commune">
                <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Commune</dt>
                <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                  {{ rucher.commune }}
                </dd>
              </div>
              <div v-if="rucher.departement">
                <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Département</dt>
                <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                  {{ rucher.departement }}
                </dd>
              </div>
              <div v-if="rucher.codePostal">
                <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Code postal</dt>
                <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                  {{ rucher.codePostal }}
                </dd>
              </div>
              <div v-if="rucher.environnement">
                <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Environnement</dt>
                <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                  {{ rucher.environnement }}
                </dd>
              </div>
              <div v-if="rucher.description" class="col-span-2">
                <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Description</dt>
                <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                  {{ rucher.description }}
                </dd>
              </div>
              <div v-if="rucher.notesAcces" class="col-span-2">
                <dt class="text-[11.5px] text-[var(--text-tertiary)] mb-0.5">Notes d'accès</dt>
                <dd class="text-[13px] font-medium text-[var(--text-primary)]">
                  {{ rucher.notesAcces }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Right sidebar -->
        <div class="space-y-5">
          <!-- Mini map -->
          <div
            v-if="rucher.latitude && rucher.longitude"
            class="h-56 overflow-hidden rounded-[14px] border border-[var(--border-default)]"
          >
            <LazyRuchersRucherMap
              :ruchers="[rucher]"
              :zoom="13"
              :center="[Number(rucher.latitude), Number(rucher.longitude)]"
            />
          </div>
          <div
            v-else
            class="flex h-48 items-center justify-center rounded-[14px] bg-[var(--surface-muted)] border border-[var(--border-default)]"
          >
            <div class="text-center">
              <UIcon
                name="i-lucide-map-pin-off"
                class="mx-auto h-7 w-7 text-[var(--text-quaternary)]"
              />
              <p class="mt-2 text-[12.5px] text-[var(--text-tertiary)]">
                Position GPS non renseignée
              </p>
            </div>
          </div>

          <!-- Score santé -->
          <UiSanteScoreCard :score-data="santeData" :pending="santePending" />

          <!-- Quick actions -->
          <div class="flex flex-col gap-2">
            <UButton
              label="Visite rapide"
              icon="i-lucide-clipboard-check"
              color="primary"
              block
              size="md"
              @click="showQuickVisit = true"
            />
            <UButton
              label="Intervention ruche"
              icon="i-lucide-hexagon"
              variant="outline"
              color="neutral"
              block
              size="md"
              @click="
                navigateTo(
                  `/interventions/nouvelle?rucherId=${rucher?.id}&from=/ruchers/${rucher?.id}`,
                )
              "
            />
            <UButton
              label="Ajouter une ruche"
              icon="i-lucide-plus"
              variant="outline"
              color="neutral"
              block
              size="md"
              @click="openAddRuche()"
            />
          </div>

          <!-- GPS info -->
          <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
            <div
              class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-3"
            >
              GPS
            </div>
            <p
              v-if="rucher.latitude && rucher.longitude"
              class="text-[12.5px] text-[var(--text-secondary)] font-mono"
            >
              {{ rucher.latitude }}, {{ rucher.longitude }}
            </p>
            <p v-else class="text-[12.5px] text-[var(--text-tertiary)]">Non renseigné</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <UiEmptyState
      v-else
      icon="i-lucide-search-x"
      title="Rucher introuvable"
      description="Ce rucher n'existe pas ou a ete supprime"
      action-label="Retour aux ruchers"
      @action="navigateTo('/ruchers')"
    />

    <!-- Quick visit modal -->
    <InterventionsQuickVisitModal
      v-if="rucher"
      v-model:open="showQuickVisit"
      :rucher-id="rucher.id"
      :rucher-nom="rucher.nom"
      :ruches="ruches.map((r) => ({ id: r.id, numero: r.numero }))"
      @saved="fetchAll"
    />

    <!-- Add ruche modal — vrai formulaire (création unique OU en masse) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showAddRuche && rucher"
          class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
          @click.self="showAddRuche = false"
        >
          <div
            class="my-auto w-full max-w-2xl rounded-[16px] border border-[var(--border-default)] bg-white p-6"
            style="box-shadow: var(--shadow-lg)"
          >
            <div class="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 class="text-[16px] font-semibold text-[var(--text-primary)]">
                  Ajouter des ruches
                </h3>
                <p class="mt-0.5 text-[12.5px] text-[var(--text-secondary)]">
                  Dans le rucher « {{ rucher.nom }} » — une seule ou tout un lot d'un coup
                </p>
              </div>
              <UButton
                icon="i-lucide-x"
                size="xs"
                variant="ghost"
                color="neutral"
                @click="showAddRuche = false"
              />
            </div>
            <RuchesRucheForm
              v-model="addRucheData"
              :loading="addingRuche"
              :ruchers="rucher ? [rucher] : []"
              allow-bulk
              :submit-label="
                (addRucheData.quantite ?? 1) > 1
                  ? `Créer ${addRucheData.quantite} ruches`
                  : 'Créer la ruche'
              "
              @submit="handleAddRuche"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Rucher, Ruche } from '~/types/models';
import type { RucherStats } from '~/composables/useRuchers';
import type { ApiListResponse } from '~/types/api';
import type { RucheFormData } from '~/components/ruches/RucheForm.vue';

definePageMeta({ layout: 'default' });

const route = useRoute();
const router = useRouter();
const notifications = useNotifications();
const { getRucher, updateRucher, deleteRucher, getRucherStats } = useRuchers();
const { createRuche, createRuchesBatch } = useRuches();

const rucherId = computed(() => route.params.id as string);

interface RucherSanteData {
  score: number;
  dernierControle: string | null;
  nbRuches: number;
  parRuche: {
    rucheId: string;
    numero: string;
    score: number;
    dernierControle: string | null;
    statut: string;
  }[];
}

const { data: santeRaw, pending: santePending } = useFetch<{ data: RucherSanteData }>(
  () => `/api/ruchers/${rucherId.value}/sante`,
  { key: `rucher-sante-${rucherId.value}`, lazy: true },
);
const santeData = computed(() => santeRaw.value?.data ?? null);

const loading = ref(true);
const saving = ref(false);
const editing = ref(false);
const showAddRuche = ref(false);
const showQuickVisit = ref(false);
const addingRuche = ref(false);

const rucher = ref<(Rucher & { ruchesCount: number }) | null>(null);
const stats = ref<RucherStats | null>(null);
const ruches = ref<Ruche[]>([]);
const ruchesPending = ref(false);

function emptyRucheForm(): RucheFormData {
  return {
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
    quantite: 1,
    numeroDepart: 1,
  };
}

const addRucheData = ref<RucheFormData>(emptyRucheForm());

const editData = ref({
  nom: '',
  description: '',
  adresse: '',
  commune: '',
  departement: '',
  codePostal: '',
  environnement: '',
  notesAcces: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
});

const locationLabel = computed(() => {
  if (!rucher.value) return '';
  const parts = [rucher.value.commune, rucher.value.departement].filter(Boolean);
  return parts.join(', ') || rucher.value.adresse || '';
});

const formattedLastVisit = computed(() => {
  if (!stats.value?.derniereVisite) return '-';
  const date = new Date(stats.value.derniereVisite);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 30) return `Il y a ${diffDays}j`;
  return new Date(stats.value.derniereVisite).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

const typeLabelsMap: Record<string, string> = {
  dadant_10: 'Dadant 10',
  dadant_12: 'Dadant 12',
  langstroth: 'Langstroth',
  warre: 'Warre',
  voirnot: 'Voirnot',
  kenyane: 'Kenyane',
  autre: 'Autre',
};

function rucheTypeLabel(type: string): string {
  return typeLabelsMap[type] ?? type;
}

function rucheAccentClass(statut: string): string {
  const map: Record<string, string> = {
    active: 'bg-amber-400',
    faible: 'bg-amber-400',
    orpheline: 'bg-amber-400',
    essaimee: 'bg-sky-400',
    morte: 'bg-red-400',
    vendue: 'bg-stone-300',
    fusionnee: 'bg-stone-300',
  };
  return map[statut] ?? 'bg-stone-300';
}

async function fetchAll() {
  loading.value = true;
  try {
    const [rucherData, statsData, ruchesData] = await Promise.all([
      getRucher(rucherId.value),
      getRucherStats(rucherId.value).catch(() => null),
      $fetch<ApiListResponse<Ruche>>(`/api/ruchers/${rucherId.value}/ruches`).catch(
        () =>
          ({
            data: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          }) as ApiListResponse<Ruche>,
      ),
    ]);

    rucher.value = rucherData;
    stats.value = statsData;
    ruches.value = ruchesData.data;

    // Pre-fill edit form
    editData.value = {
      nom: rucherData.nom,
      description: rucherData.description ?? '',
      adresse: rucherData.adresse ?? '',
      commune: rucherData.commune ?? '',
      departement: rucherData.departement ?? '',
      codePostal: rucherData.codePostal ?? '',
      environnement: rucherData.environnement ?? '',
      notesAcces: rucherData.notesAcces ?? '',
      latitude: rucherData.latitude ? Number(rucherData.latitude) : undefined,
      longitude: rucherData.longitude ? Number(rucherData.longitude) : undefined,
    };
  } catch {
    rucher.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleUpdate() {
  if (!rucher.value) return;
  saving.value = true;
  try {
    await updateRucher(rucher.value.id, editData.value);
    notifications.success('Rucher mis a jour');
    editing.value = false;
    await fetchAll();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la mise a jour'));
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!rucher.value) return;
  if (!confirm('Voulez-vous vraiment supprimer definitivement ce rucher et toutes ses donnees ?'))
    return;
  try {
    await deleteRucher(rucher.value.id);
    notifications.success('Rucher supprime');
    await router.push('/ruchers');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la suppression'));
  }
}

// Ouvre le modal avec le rucher courant pré-sélectionné (et verrouillé : seul lui dans la liste).
function openAddRuche() {
  if (!rucher.value) return;
  addRucheData.value = { ...emptyRucheForm(), rucherId: rucher.value.id };
  showAddRuche.value = true;
}

async function handleAddRuche() {
  const f = addRucheData.value;
  if (!rucher.value || !f.rucherId) return;
  const bulk = (f.quantite ?? 1) > 1;
  // En masse, le numéro sert de préfixe (peut être vide) ; en simple il est requis.
  if (!bulk && !f.numero.trim()) return;
  addingRuche.value = true;
  try {
    if (bulk) {
      const numeros = genererNumerosRuches(f.numero, f.numeroDepart ?? 1, f.quantite ?? 1);
      await createRuchesBatch(
        numeros.map((numero) => ({
          rucherId: f.rucherId,
          numero,
          type: f.type,
          statut: f.statut || undefined,
          raceAbeille: f.raceAbeille || undefined,
          dateInstallation: f.dateInstallation || undefined,
        })),
      );
      notifications.success(`${numeros.length} ruches créées 🐝`);
    } else {
      await createRuche({
        rucherId: f.rucherId,
        numero: f.numero,
        type: f.type,
        statut: f.statut || undefined,
        raceAbeille: f.raceAbeille || undefined,
        dateInstallation: f.dateInstallation || undefined,
      });
      notifications.success('Ruche ajoutée');
    }
    showAddRuche.value = false;
    addRucheData.value = emptyRucheForm();
    await fetchAll();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'ajout de la ruche"));
  } finally {
    addingRuche.value = false;
  }
}

onMounted(fetchAll);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
