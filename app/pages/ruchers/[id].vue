<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="mb-4 flex items-center gap-1.5 text-sm text-stone-400">
      <NuxtLink to="/ruchers" class="transition-colors hover:text-stone-700">Ruchers</NuxtLink>
      <UIcon name="i-lucide-chevron-right" class="h-3.5 w-3.5" />
      <span class="font-medium text-stone-700">{{ rucher?.nom ?? '...' }}</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="h-10 w-64 animate-pulse rounded-lg bg-stone-100" />
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    </div>

    <template v-else-if="rucher">
      <!-- Hero header -->
      <div class="mb-6 flex items-start justify-between">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl"
            :class="rucher.actif ? 'bg-emerald-50' : 'bg-stone-100'"
          >
            <UIcon
              name="i-lucide-map-pin"
              class="h-6 w-6"
              :class="rucher.actif ? 'text-emerald-600' : 'text-stone-400'"
            />
          </div>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold tracking-tight text-stone-900">{{ rucher.nom }}</h1>
              <UBadge :color="rucher.actif ? 'success' : 'neutral'" variant="subtle" size="xs">
                {{ rucher.actif ? 'Actif' : 'Inactif' }}
              </UBadge>
            </div>
            <p v-if="locationLabel" class="mt-0.5 text-sm text-stone-500">{{ locationLabel }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
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
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            @click="handleDelete"
          >
            <span class="hidden sm:inline">Supprimer</span>
          </UButton>
        </div>
      </div>

      <!-- KPI bar -->
      <div v-if="stats && !editing" class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <UiKpiCard icon="i-lucide-box" label="Total ruches" :value="stats.totalRuches" />
        <UiKpiCard icon="i-lucide-heart-pulse" label="Actives" :value="stats.ruchesActives" />
        <UiKpiCard
          icon="i-lucide-droplets"
          label="Production saison"
          :value="Math.round(stats.productionSaison * 10) / 10"
          suffix=" kg"
        />
        <div
          class="group relative overflow-hidden rounded-2xl border border-stone-200/60 bg-white p-5 transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="relative">
            <p class="text-xs font-medium uppercase tracking-wider text-stone-400">
              Derniere visite
            </p>
            <p class="mt-1.5 text-xl font-bold tabular-nums tracking-tight text-stone-900">
              {{ formattedLastVisit }}
            </p>
          </div>
        </div>
      </div>

      <!-- Edit mode -->
      <div
        v-if="editing"
        class="mx-auto max-w-2xl rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm"
      >
        <RuchersRucherForm
          v-model="editData"
          :loading="saving"
          submit-label="Enregistrer les modifications"
          @submit="handleUpdate"
        />
      </div>

      <!-- Detail mode -->
      <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left: Info + Ruches -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Info card -->
          <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              Informations
            </h2>
            <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div v-if="rucher.adresse">
                <dt class="text-stone-500">Adresse</dt>
                <dd class="font-medium text-stone-900">{{ rucher.adresse }}</dd>
              </div>
              <div v-if="rucher.commune">
                <dt class="text-stone-500">Commune</dt>
                <dd class="font-medium text-stone-900">{{ rucher.commune }}</dd>
              </div>
              <div v-if="rucher.departement">
                <dt class="text-stone-500">Departement</dt>
                <dd class="font-medium text-stone-900">{{ rucher.departement }}</dd>
              </div>
              <div v-if="rucher.codePostal">
                <dt class="text-stone-500">Code postal</dt>
                <dd class="font-medium text-stone-900">{{ rucher.codePostal }}</dd>
              </div>
              <div v-if="rucher.environnement">
                <dt class="text-stone-500">Environnement</dt>
                <dd class="font-medium text-stone-900">{{ rucher.environnement }}</dd>
              </div>
              <div v-if="rucher.description" class="col-span-2">
                <dt class="text-stone-500">Description</dt>
                <dd class="font-medium text-stone-900">{{ rucher.description }}</dd>
              </div>
              <div v-if="rucher.notesAcces" class="col-span-2">
                <dt class="text-stone-500">Notes d'acces</dt>
                <dd class="font-medium text-stone-900">{{ rucher.notesAcces }}</dd>
              </div>
            </dl>
          </div>

          <!-- Ruches list -->
          <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-sm font-semibold uppercase tracking-wider text-stone-400">
                Ruches ({{ ruches.length }})
              </h2>
              <UButton
                label="Ajouter"
                icon="i-lucide-plus"
                size="xs"
                variant="outline"
                color="primary"
                @click="showAddRuche = true"
              />
            </div>

            <div v-if="ruchesPending" class="space-y-2">
              <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-xl bg-stone-100" />
            </div>

            <div v-else-if="ruches.length === 0" class="py-8 text-center text-sm text-stone-400">
              Aucune ruche dans ce rucher
            </div>

            <div v-else class="space-y-2">
              <NuxtLink
                v-for="ruche in ruches"
                :key="ruche.id"
                :to="`/ruches/${ruche.id}`"
                class="group flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/50 px-4 py-3 transition-all duration-200 hover:border-stone-200 hover:bg-stone-100/80 hover:shadow-sm"
              >
                <!-- Status accent dot -->
                <div
                  class="h-8 w-1 shrink-0 rounded-full"
                  :class="rucheAccentClass(ruche.statut)"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-medium text-stone-900 group-hover:text-amber-700 transition-colors"
                    >
                      {{ ruche.numero }}
                    </span>
                    <span class="text-xs text-stone-400">{{ rucheTypeLabel(ruche.type) }}</span>
                  </div>
                  <div class="mt-0.5 flex items-center gap-2 text-xs text-stone-400">
                    <span v-if="ruche.raceAbeille && ruche.raceAbeille !== 'inconnue'">
                      {{ ruche.raceAbeille }}
                    </span>
                    <span v-if="ruche.nombreCadres">{{ ruche.nombreCadres }} cadres</span>
                    <span v-if="ruche.nombreHausses">{{ ruche.nombreHausses }} hausses</span>
                  </div>
                </div>
                <UBadge :color="statutColor(ruche.statut)" variant="subtle" size="xs">
                  {{ ruche.statut }}
                </UBadge>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Right sidebar -->
        <div class="space-y-6">
          <!-- Mini map -->
          <div
            v-if="rucher.latitude && rucher.longitude"
            class="h-64 overflow-hidden rounded-2xl border border-stone-200/60 shadow-sm"
          >
            <LazyRuchersRucherMap
              :ruchers="[rucher]"
              :zoom="13"
              :center="[Number(rucher.latitude), Number(rucher.longitude)]"
            />
          </div>
          <div v-else class="flex h-48 items-center justify-center rounded-2xl bg-stone-100">
            <div class="text-center">
              <UIcon name="i-lucide-map-pin-off" class="mx-auto h-8 w-8 text-stone-300" />
              <p class="mt-2 text-sm text-stone-400">Position GPS non renseignee</p>
            </div>
          </div>

          <!-- Score sante -->
          <UiSanteScoreCard :score-data="santeData" :pending="santePending" />

          <!-- Quick actions -->
          <div class="flex flex-col gap-2.5">
            <button
              class="group flex w-full items-center gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 text-left shadow-sm transition-all duration-200 hover:border-emerald-300 hover:shadow-md"
              @click="
                navigateTo(
                  `/interventions/nouvelle?rucherId=${rucher?.id}&from=/ruchers/${rucher?.id}`,
                )
              "
            >
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-sm"
              >
                <UIcon name="i-lucide-activity" class="h-5 w-5 text-white" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-stone-900">Nouvelle intervention</p>
                <p class="text-xs text-stone-500">Pour ce rucher</p>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="h-4 w-4 shrink-0 text-emerald-300 transition-transform group-hover:translate-x-0.5"
              />
            </button>

            <button
              class="group flex w-full items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 text-left shadow-sm transition-all duration-200 hover:border-amber-300 hover:shadow-md"
              @click="showAddRuche = true"
            >
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 shadow-sm"
              >
                <UIcon name="i-lucide-plus" class="h-5 w-5 text-white" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-stone-900">Ajouter une ruche</p>
                <p class="text-xs text-stone-500">Dans ce rucher</p>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="h-4 w-4 shrink-0 text-amber-300 transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </div>

          <!-- GPS info -->
          <div class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm">
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">GPS</h3>
            <p v-if="rucher.latitude && rucher.longitude" class="text-sm text-stone-600">
              {{ rucher.latitude }}, {{ rucher.longitude }}
            </p>
            <p v-else class="text-sm text-stone-400">Non renseigne</p>
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

    <!-- Add ruche modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showAddRuche"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          @click.self="showAddRuche = false"
        >
          <div
            class="w-full max-w-md rounded-2xl border border-stone-200/60 bg-white p-6 shadow-xl"
          >
            <h3 class="text-lg font-semibold text-stone-900">Ajouter une ruche</h3>
            <form class="mt-4 space-y-4" @submit.prevent="handleAddRuche">
              <UFormField label="Numero" name="numero">
                <UInput v-model="newRuche.numero" placeholder="Ruche 1" required class="w-full" />
              </UFormField>
              <UFormField label="Type" name="type">
                <select
                  v-model="newRuche.type"
                  class="h-9 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="dadant_10">Dadant 10</option>
                  <option value="dadant_12">Dadant 12</option>
                  <option value="langstroth">Langstroth</option>
                  <option value="warre">Warre</option>
                  <option value="voirnot">Voirnot</option>
                  <option value="kenyane">Kenyane</option>
                  <option value="autre">Autre</option>
                </select>
              </UFormField>
              <div class="flex justify-end gap-2">
                <UButton
                  label="Annuler"
                  variant="ghost"
                  color="neutral"
                  @click="showAddRuche = false"
                />
                <UButton type="submit" label="Ajouter" color="primary" :loading="addingRuche" />
              </div>
            </form>
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

definePageMeta({ layout: 'default' });

const route = useRoute();
const router = useRouter();
const notifications = useNotifications();
const { getRucher, updateRucher, deleteRucher, getRucherStats } = useRuchers();

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
const addingRuche = ref(false);

const rucher = ref<(Rucher & { ruchesCount: number }) | null>(null);
const stats = ref<RucherStats | null>(null);
const ruches = ref<Ruche[]>([]);
const ruchesPending = ref(false);

const newRuche = reactive({ numero: '', type: 'dadant_10' });

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
    active: 'bg-emerald-400',
    faible: 'bg-amber-400',
    orpheline: 'bg-amber-400',
    essaimee: 'bg-sky-400',
    morte: 'bg-red-400',
    vendue: 'bg-stone-300',
    fusionnee: 'bg-stone-300',
  };
  return map[statut] ?? 'bg-stone-300';
}

function statutColor(statut: string) {
  const map: Record<string, string> = {
    active: 'success',
    faible: 'warning',
    orpheline: 'warning',
    essaimee: 'info',
    morte: 'error',
    vendue: 'neutral',
    fusionnee: 'neutral',
  };
  return (map[statut] ?? 'neutral') as 'success' | 'warning' | 'info' | 'error' | 'neutral';
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

async function handleAddRuche() {
  if (!rucher.value || !newRuche.numero.trim()) return;
  addingRuche.value = true;
  try {
    const { createRuche } = useRuches();
    await createRuche({
      rucherId: rucher.value.id,
      numero: newRuche.numero,
      type: newRuche.type,
    });
    notifications.success('Ruche ajoutee');
    showAddRuche.value = false;
    newRuche.numero = '';
    newRuche.type = 'dadant_10';
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
