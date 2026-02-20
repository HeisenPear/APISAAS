<template>
  <div>
    <UiPageHeader title="Alertes" description="Surveillance automatique de votre exploitation">
      <template #actions>
        <UButton
          label="Generer les alertes"
          icon="i-lucide-zap"
          color="primary"
          :loading="generating"
          @click="handleGenerate"
        />
      </template>
    </UiPageHeader>

    <!-- Stats -->
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
        <p class="text-xs text-stone-500">Total</p>
        <p class="mt-1 text-2xl font-bold text-stone-900">{{ pagination?.total ?? 0 }}</p>
      </div>
      <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
        <p class="text-xs text-stone-500">Non lues</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ nonLues }}</p>
      </div>
      <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
        <p class="text-xs text-stone-500">Critiques</p>
        <p class="mt-1 text-2xl font-bold text-red-600">{{ critiques }}</p>
      </div>
      <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
        <p class="text-xs text-stone-500">Hautes</p>
        <p class="mt-1 text-2xl font-bold text-orange-500">{{ hautes }}</p>
      </div>
    </div>

    <!-- Filtres -->
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <!-- Filtre lu/non-lu -->
      <div class="flex rounded-xl border border-stone-200 bg-white">
        <button
          v-for="opt in filtresLue"
          :key="opt.value"
          class="px-4 py-1.5 text-sm font-medium transition-colors first:rounded-l-xl last:rounded-r-xl"
          :class="
            filterLue === opt.value
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900'
          "
          @click="setFilterLue(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Filtre priorité -->
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="p in filtresPriorite"
          :key="p.value"
          class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all"
          :class="
            filterPriorite === p.value
              ? `${p.activeCls} ring-2 ring-offset-1`
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          "
          @click="setFilterPriorite(p.value)"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="p.dot" />
          {{ p.label }}
        </button>
      </div>

      <!-- Tout marquer lu -->
      <UButton
        v-if="alertesNonLues.length > 0"
        label="Tout marquer lu"
        variant="ghost"
        color="neutral"
        size="sm"
        icon="i-lucide-check-check"
        class="ml-auto"
        @click="handleMarkAllRead"
      />
    </div>

    <!-- Chargement -->
    <div v-if="pending" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-20 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="alertes.length === 0"
      icon="i-lucide-bell-off"
      title="Aucune alerte"
      description="Tout va bien ! Generez des alertes pour verifier l'etat de votre exploitation."
      action-label="Generer les alertes"
      @action="handleGenerate"
    />

    <!-- Liste -->
    <div v-else class="space-y-2">
      <div
        v-for="alerte in alertes"
        :key="alerte.id"
        class="group rounded-2xl border bg-white p-4 shadow-sm transition-all"
        :class="alerte.lue ? 'border-stone-200/60 opacity-60' : 'border-stone-200/60'"
      >
        <div class="flex items-start gap-3">
          <!-- Indicateur priorité -->
          <div class="mt-0.5 flex-shrink-0">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-xl"
              :class="bgColor(alerte.priorite)"
            >
              <UIcon
                :name="prioriteIcon(alerte.priorite)"
                class="h-4 w-4"
                :class="textColor(alerte.priorite)"
              />
            </div>
          </div>

          <!-- Contenu -->
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-sm font-semibold text-stone-900">{{ alerte.titre }}</p>
                  <span v-if="!alerte.lue" class="h-1.5 w-1.5 rounded-full bg-amber-500" />
                </div>
                <p v-if="alerte.message" class="mt-0.5 text-xs text-stone-500">
                  {{ alerte.message }}
                </p>
              </div>
              <div
                class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <NuxtLink
                  v-if="alerte.actionUrl"
                  :to="alerte.actionUrl"
                  class="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                >
                  <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
                </NuxtLink>
                <button
                  v-if="!alerte.lue"
                  class="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-emerald-600"
                  title="Marquer comme lue"
                  @click="handleMarkRead(alerte.id)"
                >
                  <UIcon name="i-lucide-check" class="h-4 w-4" />
                </button>
                <button
                  class="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500"
                  title="Supprimer"
                  @click="handleDelete(alerte.id)"
                >
                  <UIcon name="i-lucide-trash-2" class="h-4 w-4" />
                </button>
              </div>
            </div>
            <div class="mt-2 flex items-center gap-3">
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                :class="badgeCls(alerte.priorite)"
              >
                {{ alerte.priorite ?? 'info' }}
              </span>
              <span class="text-xs text-stone-400">{{ typeLabel(alerte.type) }}</span>
              <span class="text-xs text-stone-400">{{ formatDate(alerte.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex justify-center gap-2">
      <UButton
        icon="i-lucide-chevron-left"
        variant="ghost"
        color="neutral"
        size="sm"
        :disabled="page <= 1"
        @click="page--"
      />
      <span class="flex items-center text-sm text-stone-500">{{ page }} / {{ totalPages }}</span>
      <UButton
        icon="i-lucide-chevron-right"
        variant="ghost"
        color="neutral"
        size="sm"
        :disabled="page >= totalPages"
        @click="page++"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Alerte } from '~/composables/useAlertes';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { list, markRead, remove, generate, markAllRead } = useAlertes();

const page = ref(1);
const filterLue = ref<'all' | 'true' | 'false'>('all');
const filterPriorite = ref('all');
const generating = ref(false);
const pending = ref(false);
const alertes = ref<Alerte[]>([]);
const pagination = ref<{ total: number; totalPages: number } | null>(null);

const filtresLue = [
  { value: 'all', label: 'Toutes' },
  { value: 'false', label: 'Non lues' },
  { value: 'true', label: 'Lues' },
] as const;

const filtresPriorite = [
  {
    value: 'all',
    label: 'Toutes',
    dot: 'bg-stone-400',
    activeCls: 'bg-stone-800 text-white ring-stone-400',
  },
  {
    value: 'critique',
    label: 'Critique',
    dot: 'bg-red-500',
    activeCls: 'bg-red-100 text-red-700 ring-red-300',
  },
  {
    value: 'haute',
    label: 'Haute',
    dot: 'bg-orange-500',
    activeCls: 'bg-orange-100 text-orange-700 ring-orange-300',
  },
  {
    value: 'moyenne',
    label: 'Moyenne',
    dot: 'bg-amber-400',
    activeCls: 'bg-amber-100 text-amber-700 ring-amber-300',
  },
];

const nonLues = computed(() => alertes.value.filter((a) => !a.lue).length);
const critiques = computed(() => alertes.value.filter((a) => a.priorite === 'critique').length);
const hautes = computed(() => alertes.value.filter((a) => a.priorite === 'haute').length);
const alertesNonLues = computed(() => alertes.value.filter((a) => !a.lue));
const totalPages = computed(() => pagination.value?.totalPages ?? 1);

async function fetchAlertes() {
  pending.value = true;
  try {
    const res = await list({
      page: page.value,
      limit: 20,
      lue: filterLue.value,
      priorite: filterPriorite.value === 'all' ? undefined : filterPriorite.value,
    });
    alertes.value = res.data;
    pagination.value = { total: res.pagination.total, totalPages: res.pagination.totalPages };
  } finally {
    pending.value = false;
  }
}

function setFilterLue(val: typeof filterLue.value) {
  filterLue.value = val;
  page.value = 1;
}

function setFilterPriorite(val: string) {
  filterPriorite.value = val;
  page.value = 1;
}

async function handleMarkRead(id: string) {
  await markRead(id);
  await fetchAlertes();
}

async function handleDelete(id: string) {
  await remove(id);
  await fetchAlertes();
}

async function handleMarkAllRead() {
  await markAllRead(alertesNonLues.value.map((a) => a.id));
  notifications.success('Toutes les alertes marquées comme lues');
  await fetchAlertes();
}

async function handleGenerate() {
  generating.value = true;
  try {
    const created = await generate();
    notifications.success(
      created > 0 ? `${created} nouvelle(s) alerte(s) générée(s)` : 'Aucune nouvelle alerte',
    );
    await fetchAlertes();
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, 'Erreur lors de la génération'));
  } finally {
    generating.value = false;
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    visite_requise: 'Visite requise',
    sante_critique: 'Santé critique',
    stock_bas: 'Stock bas',
    facture_retard: 'Facture en retard',
  };
  return map[type] ?? type;
}

function prioriteIcon(p?: string | null): string {
  switch (p) {
    case 'critique':
      return 'i-lucide-alert-octagon';
    case 'haute':
      return 'i-lucide-alert-triangle';
    case 'moyenne':
      return 'i-lucide-alert-circle';
    default:
      return 'i-lucide-info';
  }
}
function bgColor(p?: string | null): string {
  switch (p) {
    case 'critique':
      return 'bg-red-50';
    case 'haute':
      return 'bg-orange-50';
    case 'moyenne':
      return 'bg-amber-50';
    default:
      return 'bg-blue-50';
  }
}
function textColor(p?: string | null): string {
  switch (p) {
    case 'critique':
      return 'text-red-600';
    case 'haute':
      return 'text-orange-500';
    case 'moyenne':
      return 'text-amber-500';
    default:
      return 'text-blue-500';
  }
}
function badgeCls(p?: string | null): string {
  switch (p) {
    case 'critique':
      return 'bg-red-100 text-red-700';
    case 'haute':
      return 'bg-orange-100 text-orange-700';
    case 'moyenne':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
}

watch([page, filterLue, filterPriorite], fetchAlertes);
onMounted(fetchAlertes);
</script>
