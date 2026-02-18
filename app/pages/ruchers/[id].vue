<template>
  <div>
    <!-- Back link -->
    <NuxtLink
      to="/ruchers"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux ruchers
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="h-10 w-64 animate-pulse rounded-lg bg-stone-100" />
      <div class="grid grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    </div>

    <template v-else-if="rucher">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-stone-900">{{ rucher.nom }}</h1>
          <p v-if="locationLabel" class="mt-1 text-sm text-stone-500">{{ locationLabel }}</p>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            :label="editing ? 'Annuler' : 'Modifier'"
            :icon="editing ? 'i-lucide-x' : 'i-lucide-pencil'"
            :variant="editing ? 'ghost' : 'outline'"
            color="neutral"
            @click="editing = !editing"
          />
          <UButton
            v-if="!editing"
            label="Supprimer"
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            @click="handleDelete"
          />
        </div>
      </div>

      <!-- Stats bar -->
      <div v-if="stats" class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Total ruches</p>
          <p class="mt-1 text-2xl font-bold text-stone-900">{{ stats.totalRuches }}</p>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Actives</p>
          <p class="mt-1 text-2xl font-bold text-emerald-600">{{ stats.ruchesActives }}</p>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Production saison</p>
          <p class="mt-1 text-2xl font-bold text-amber-600">
            {{ Math.round(stats.productionSaison * 10) / 10 }} kg
          </p>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Derniere visite</p>
          <p class="mt-1 text-lg font-semibold text-stone-900">{{ formattedLastVisit }}</p>
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
              <div v-for="i in 3" :key="i" class="h-12 animate-pulse rounded-lg bg-stone-100" />
            </div>

            <div v-else-if="ruches.length === 0" class="py-8 text-center text-sm text-stone-400">
              Aucune ruche dans ce rucher
            </div>

            <div v-else class="space-y-2">
              <NuxtLink
                v-for="ruche in ruches"
                :key="ruche.id"
                :to="`/ruches/${ruche.id}`"
                class="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3 transition-colors hover:bg-stone-100"
              >
                <div>
                  <span class="font-medium text-stone-900">{{ ruche.numero }}</span>
                  <span class="ml-2 text-xs text-stone-400">{{ ruche.type }}</span>
                </div>
                <UBadge :color="statutColor(ruche.statut)" variant="subtle" size="xs">
                  {{ ruche.statut }}
                </UBadge>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Right: Mini map -->
        <div class="space-y-6">
          <div
            v-if="rucher.latitude && rucher.longitude"
            class="h-64 overflow-hidden rounded-2xl border border-stone-200/60 shadow-sm"
          >
            <RuchersRucherMap
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

          <!-- Quick info -->
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
  return new Date(stats.value.derniereVisite).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

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
    await $fetch('/api/ruches', {
      method: 'POST',
      body: {
        rucherId: rucher.value.id,
        numero: newRuche.numero,
        type: newRuche.type,
      },
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
