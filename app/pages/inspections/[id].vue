<template>
  <div>
    <!-- Back link -->
    <NuxtLink
      to="/inspections"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux inspections
    </NuxtLink>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="h-10 w-48 animate-pulse rounded-lg bg-stone-100" />
      <div class="grid grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    </div>

    <template v-else-if="inspection">
      <!-- Header -->
      <div class="mb-6 flex items-start justify-between">
        <div>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl" :class="typeBgClass">
              <UIcon :name="typeIcon" class="h-5 w-5" :class="typeIconClass" />
            </div>
            <div>
              <h1 class="text-2xl font-bold tracking-tight text-stone-900">{{ typeLabel }}</h1>
              <p class="text-sm text-stone-500">{{ formattedDate }}</p>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            label="Supprimer"
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            @click="handleDelete"
          />
        </div>
      </div>

      <!-- Context bar -->
      <div class="mb-6 flex flex-wrap items-center gap-4 text-sm">
        <NuxtLink
          v-if="inspection.ruche"
          :to="`/ruches/${inspection.rucheId}`"
          class="flex items-center gap-1.5 text-stone-600 hover:text-amber-600 transition-colors"
        >
          <UIcon name="i-lucide-box" class="h-4 w-4" />
          {{ inspection.ruche.numero }}
        </NuxtLink>
        <NuxtLink
          v-if="inspection.rucher"
          :to="`/ruchers/${inspection.rucher.id}`"
          class="flex items-center gap-1.5 text-stone-600 hover:text-amber-600 transition-colors"
        >
          <UIcon name="i-lucide-map-pin" class="h-4 w-4" />
          {{ inspection.rucher.nom }}
        </NuxtLink>
        <span v-if="inspection.dureeMinutes" class="flex items-center gap-1.5 text-stone-500">
          <UIcon name="i-lucide-timer" class="h-4 w-4" />
          {{ inspection.dureeMinutes }} min
        </span>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Left: Details -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Etat colonie -->
          <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              Etat de la colonie
            </h2>

            <!-- Score bars -->
            <div class="space-y-4">
              <div v-if="inspection.forceColonie">
                <div class="mb-1 flex justify-between text-sm">
                  <span class="text-stone-600">Force colonie</span>
                  <span class="font-semibold" :class="scoreTextClass(inspection.forceColonie)">
                    {{ inspection.forceColonie }}/5
                  </span>
                </div>
                <div class="h-2 rounded-full bg-stone-100">
                  <div
                    class="h-2 rounded-full transition-all"
                    :class="scoreBarClass(inspection.forceColonie)"
                    :style="{ width: `${(inspection.forceColonie / 5) * 100}%` }"
                  />
                </div>
              </div>

              <div v-if="inspection.couvain != null">
                <div class="mb-1 flex justify-between text-sm">
                  <span class="text-stone-600">Couvain</span>
                  <span class="font-semibold" :class="scoreTextClass(inspection.couvain)">
                    {{ inspection.couvain }}/5
                  </span>
                </div>
                <div class="h-2 rounded-full bg-stone-100">
                  <div
                    class="h-2 rounded-full transition-all"
                    :class="scoreBarClass(inspection.couvain)"
                    :style="{ width: `${(inspection.couvain / 5) * 100}%` }"
                  />
                </div>
              </div>

              <div v-if="inspection.reserves">
                <div class="mb-1 flex justify-between text-sm">
                  <span class="text-stone-600">Reserves</span>
                  <span class="font-semibold" :class="scoreTextClass(inspection.reserves)">
                    {{ inspection.reserves }}/5
                  </span>
                </div>
                <div class="h-2 rounded-full bg-stone-100">
                  <div
                    class="h-2 rounded-full transition-all"
                    :class="scoreBarClass(inspection.reserves)"
                    :style="{ width: `${(inspection.reserves / 5) * 100}%` }"
                  />
                </div>
              </div>
            </div>

            <!-- Boolean badges -->
            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-if="inspection.reineVue"
                class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
              >
                <UIcon name="i-lucide-crown" class="h-3 w-3" />
                Reine vue
              </span>
              <span
                v-if="inspection.celluleRoyale"
                class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
              >
                <UIcon name="i-lucide-hexagon" class="h-3 w-3" />
                Cellule royale
              </span>
              <span
                v-if="inspection.signeEssaimage"
                class="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
              >
                <UIcon name="i-lucide-alert-triangle" class="h-3 w-3" />
                Signe d'essaimage
              </span>
              <span
                v-if="inspection.comportement"
                class="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600"
              >
                {{ inspection.comportement }}
              </span>
            </div>
          </div>

          <!-- Sanitaire -->
          <div
            v-if="
              inspection.varroa != null ||
              inspection.traitementApplique ||
              inspection.maladieObservee
            "
            class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm"
          >
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              Sanitaire
            </h2>
            <dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div v-if="inspection.varroa != null">
                <dt class="text-stone-500">Comptage varroa</dt>
                <dd
                  class="font-semibold"
                  :class="inspection.varroa > 3 ? 'text-red-600' : 'text-stone-900'"
                >
                  {{ inspection.varroa }} chutes/jour
                </dd>
              </div>
              <div v-if="inspection.traitementApplique">
                <dt class="text-stone-500">Traitement</dt>
                <dd class="font-medium text-violet-700">{{ inspection.traitementApplique }}</dd>
              </div>
              <div v-if="inspection.maladieObservee" class="sm:col-span-2">
                <dt class="text-stone-500">Maladie observee</dt>
                <dd class="font-medium text-red-700">{{ inspection.maladieObservee }}</dd>
              </div>
            </dl>
          </div>

          <!-- Actions realisees -->
          <div
            v-if="
              inspection.actionsRealisees && (inspection.actionsRealisees as string[]).length > 0
            "
            class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm"
          >
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              Actions realisees
            </h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="action in inspection.actionsRealisees as string[]"
                :key="action"
                class="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700"
              >
                <UIcon name="i-lucide-check" class="h-3 w-3" />
                {{ actionLabel(action) }}
              </span>
            </div>

            <!-- Nourrissement details -->
            <div
              v-if="inspection.nourrissementType"
              class="mt-4 rounded-xl bg-amber-50 p-3 text-sm"
            >
              <span class="text-amber-700">
                Nourrissement : {{ inspection.nourrissementType }}
                <span v-if="inspection.nourrissementQuantite">
                  — {{ Number(inspection.nourrissementQuantite) }} kg
                </span>
              </span>
            </div>
          </div>

          <!-- Notes -->
          <div
            v-if="inspection.notes"
            class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm"
          >
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
              Notes
            </h2>
            <p class="whitespace-pre-line text-sm text-stone-700">{{ inspection.notes }}</p>
          </div>
        </div>

        <!-- Right sidebar -->
        <div class="space-y-6">
          <!-- Meteo -->
          <div
            v-if="inspection.meteo"
            class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm"
          >
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Meteo
            </h3>
            <dl class="space-y-2 text-sm">
              <div v-if="meteo.temperature != null" class="flex justify-between">
                <dt class="text-stone-500">Temperature</dt>
                <dd class="font-medium text-stone-700">{{ meteo.temperature }}°C</dd>
              </div>
              <div v-if="meteo.vent" class="flex justify-between">
                <dt class="text-stone-500">Vent</dt>
                <dd class="font-medium text-stone-700">{{ meteo.vent }}</dd>
              </div>
              <div v-if="meteo.ciel" class="flex justify-between">
                <dt class="text-stone-500">Ciel</dt>
                <dd class="font-medium text-stone-700">{{ meteo.ciel }}</dd>
              </div>
            </dl>
          </div>

          <!-- Ruche quick link -->
          <div
            v-if="inspection.ruche"
            class="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm"
          >
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Ruche
            </h3>
            <NuxtLink
              :to="`/ruches/${inspection.rucheId}`"
              class="flex items-center gap-3 rounded-xl bg-stone-50 p-3 transition-colors hover:bg-stone-100"
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <UIcon name="i-lucide-box" class="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p class="text-sm font-medium text-stone-900">{{ inspection.ruche.numero }}</p>
                <p class="text-xs text-stone-400">
                  {{ inspection.ruche.type }} — {{ inspection.ruche.statut }}
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
                <dd class="font-medium text-stone-700">{{ formatDateFr(inspection.createdAt) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-stone-500">Mise a jour</dt>
                <dd class="font-medium text-stone-700">{{ formatDateFr(inspection.updatedAt) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </template>

    <!-- Not found -->
    <UiEmptyState
      v-else
      icon="i-lucide-search-x"
      title="Inspection introuvable"
      description="Cette inspection n'existe pas ou a ete supprimee"
      action-label="Retour aux inspections"
      @action="navigateTo('/inspections')"
    />
  </div>
</template>

<script setup lang="ts">
import type { InspectionWithContext } from '~/composables/useInspections';

definePageMeta({ layout: 'default' });

const route = useRoute();
const router = useRouter();
const notifications = useNotifications();
const { getInspection, deleteInspection } = useInspections();

const inspectionId = computed(() => route.params.id as string);
const loading = ref(true);
const inspection = ref<InspectionWithContext | null>(null);

const meteo = computed(() => {
  const m = inspection.value?.meteo as {
    temperature?: number;
    vent?: string;
    ciel?: string;
  } | null;
  return m ?? {};
});

const typeLabels: Record<string, string> = {
  visite_printemps: 'Visite de printemps',
  controle: 'Controle',
  traitement: 'Traitement',
  recolte: 'Visite recolte',
  hivernage: 'Mise en hivernage',
};

const typeIcons: Record<string, string> = {
  visite_printemps: 'i-lucide-sun',
  controle: 'i-lucide-clipboard-check',
  traitement: 'i-lucide-shield',
  recolte: 'i-lucide-droplets',
  hivernage: 'i-lucide-snowflake',
};

const typeLabel = computed(
  () =>
    (inspection.value?.type ? typeLabels[inspection.value.type] : null) ??
    inspection.value?.type ??
    'Inspection',
);
const typeIcon = computed(
  () =>
    (inspection.value?.type ? typeIcons[inspection.value.type] : null) ??
    'i-lucide-clipboard-check',
);

const typeBgClass = computed(() => {
  const map: Record<string, string> = {
    visite_printemps: 'bg-amber-50',
    controle: 'bg-sky-50',
    traitement: 'bg-violet-50',
    recolte: 'bg-amber-50',
    hivernage: 'bg-blue-50',
  };
  return (inspection.value?.type ? map[inspection.value.type] : null) ?? 'bg-stone-100';
});

const typeIconClass = computed(() => {
  const map: Record<string, string> = {
    visite_printemps: 'text-amber-600',
    controle: 'text-sky-600',
    traitement: 'text-violet-600',
    recolte: 'text-amber-600',
    hivernage: 'text-blue-600',
  };
  return (inspection.value?.type ? map[inspection.value.type] : null) ?? 'text-stone-500';
});

const formattedDate = computed(() => {
  if (!inspection.value?.dateVisite) return '';
  return new Date(inspection.value.dateVisite).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const actionLabels: Record<string, string> = {
  ajout_hausse: 'Ajout hausse',
  retrait_hausse: 'Retrait hausse',
  nourrissement: 'Nourrissement',
  traitement: 'Traitement',
  ajout_cadre: 'Ajout cadre',
  remplacement_reine: 'Remplacement reine',
  division: 'Division',
  reunification: 'Reunification',
  marquage_reine: 'Marquage reine',
  nettoyage_plateau: 'Nettoyage plateau',
};

function actionLabel(action: string) {
  return actionLabels[action] ?? action;
}

function scoreTextClass(value: number) {
  if (value >= 4) return 'text-emerald-600';
  if (value >= 3) return 'text-sky-600';
  if (value >= 2) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBarClass(value: number) {
  if (value >= 4) return 'bg-emerald-500';
  if (value >= 3) return 'bg-sky-500';
  if (value >= 2) return 'bg-amber-500';
  return 'bg-red-500';
}

function formatDateFr(date: Date | string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function fetchInspection() {
  loading.value = true;
  try {
    inspection.value = await getInspection(inspectionId.value);
  } catch {
    inspection.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleDelete() {
  if (!inspection.value) return;
  if (!confirm('Voulez-vous vraiment supprimer cette inspection ?')) return;
  try {
    await deleteInspection(inspection.value.id);
    notifications.success('Inspection supprimee');
    await router.push('/inspections');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la suppression'));
  }
}

onMounted(fetchInspection);
</script>
