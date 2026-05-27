<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1
          class="text-[26px] font-semibold tracking-[-0.02em]"
          style="font-family: 'SF Pro Display', -apple-system, system-ui, sans-serif"
        >
          Alertes
        </h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          {{ pagination?.total ?? 0 }} alerte{{ (pagination?.total ?? 0) > 1 ? 's' : '' }}
          <template v-if="nonLues > 0">
            · <span class="text-[var(--honey-deep)]">{{ nonLues }} non lue{{ nonLues > 1 ? 's' : '' }}</span>
          </template>
        </p>
      </div>
      <UButton
        label="Générer"
        icon="i-lucide-zap"
        color="primary"
        :loading="generating"
        @click="handleGenerate"
      />
    </div>

    <!-- Mobile KPI strip -->
    <div class="lg:hidden mm-bleed mm-strip">
      <div class="mm-strip-cell">
        <span class="mm-strip-label">Non lues</span>
        <span class="mm-strip-value" style="color:var(--honey-deep)">{{ nonLues }}</span>
        <span class="mm-strip-sub">sur {{ pagination?.total ?? 0 }}</span>
      </div>
      <div class="mm-strip-cell">
        <span class="mm-strip-label">Critiques</span>
        <span class="mm-strip-value" :style="critiques > 0 ? 'color:var(--status-bad)' : ''">{{ critiques }}</span>
      </div>
      <div class="mm-strip-cell">
        <span class="mm-strip-label">Importantes</span>
        <span class="mm-strip-value" :style="hautes > 0 ? 'color:var(--status-warn)' : ''">{{ hautes }}</span>
      </div>
    </div>

    <!-- Desktop KPI strip -->
    <div class="hidden lg:grid grid-cols-4 gap-3">
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
        <p class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1">Total</p>
        <p class="text-[22px] font-semibold tabular-nums text-[var(--text-primary)]">{{ pagination?.total ?? 0 }}</p>
      </div>
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
        <p class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1">Non lues</p>
        <p class="text-[22px] font-semibold tabular-nums" style="color: var(--honey-deep)">{{ nonLues }}</p>
      </div>
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
        <p class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1">Critiques</p>
        <div class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-[var(--status-bad)]" />
          <p class="text-[22px] font-semibold tabular-nums text-[var(--status-bad)]">{{ critiques }}</p>
        </div>
      </div>
      <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-4">
        <p class="text-[10.5px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] font-medium mb-1">Importantes</p>
        <div class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-[var(--status-warn)]" />
          <p class="text-[22px] font-semibold tabular-nums text-[var(--status-warn)]">{{ hautes }}</p>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Filtre lu/non-lu -->
      <div class="flex items-center gap-1 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] p-1">
        <button
          v-for="opt in filtresLue"
          :key="opt.value"
          class="rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150"
          :class="
            filterLue === opt.value
              ? 'bg-white text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          "
          @click="setFilterLue(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Séparateur -->
      <div class="h-5 w-px bg-[var(--border-default)]" />

      <!-- Filtre priorité -->
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="p in filtresPriorite"
          :key="p.value"
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium border transition-all duration-150"
          :class="
            filterPriorite === p.value
              ? 'bg-[#1c1c1e] text-white border-[#1c1c1e]'
              : 'bg-white text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]'
          "
          @click="setFilterPriorite(p.value)"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="p.dot" />
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
    <div v-if="pending" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-[72px] animate-pulse lg:rounded-[14px] bg-[var(--surface-muted)]" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="alertes.length === 0"
      icon="i-lucide-bell-off"
      title="Aucune alerte"
      description="Tout va bien ! Générezi des alertes pour vérifier l'état de votre exploitation."
      action-label="Générer les alertes"
      @action="handleGenerate"
    />

    <!-- Liste -->
    <div v-else class="mm-list lg:space-y-2">
      <div
        v-for="alerte in alertes"
        :key="alerte.id"
        class="group bg-white lg:border lg:border-[var(--border-default)] lg:rounded-[14px] p-4 transition-all duration-150"
        :class="alerte.lue ? 'opacity-55' : ''"
      >
        <div class="flex items-start gap-3">
          <!-- Severity indicator: dot + vertical line -->
          <div class="flex flex-col items-center gap-1 pt-0.5 shrink-0">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :class="{
                'bg-[var(--status-bad)]': alerte.priorite === 'critique',
                'bg-[var(--status-warn)]': alerte.priorite === 'haute',
                'bg-[var(--honey)]': alerte.priorite === 'moyenne',
                'bg-[var(--status-info)]': !alerte.priorite || alerte.priorite === 'info',
              }"
            />
            <div
              class="w-px flex-1 min-h-[24px] rounded-full opacity-20"
              :class="{
                'bg-[var(--status-bad)]': alerte.priorite === 'critique',
                'bg-[var(--status-warn)]': alerte.priorite === 'haute',
                'bg-[var(--honey)]': alerte.priorite === 'moyenne',
                'bg-[var(--status-info)]': !alerte.priorite || alerte.priorite === 'info',
              }"
            />
          </div>

          <!-- Content -->
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="text-[14px] font-semibold text-[var(--text-primary)]">{{ alerte.titre }}</p>
                  <span v-if="!alerte.lue" class="w-1.5 h-1.5 rounded-full bg-[var(--honey)]" />
                  <span
                    class="rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide"
                    :class="{
                      'bg-red-50 text-[var(--status-bad)]': alerte.priorite === 'critique',
                      'bg-orange-50 text-[var(--status-warn)]': alerte.priorite === 'haute',
                      'bg-[var(--honey-soft)] text-[var(--honey-deep)]': alerte.priorite === 'moyenne',
                      'bg-blue-50 text-[var(--status-info)]': !alerte.priorite || alerte.priorite === 'info',
                    }"
                  >
                    {{ alerte.priorite ?? 'info' }}
                  </span>
                </div>
                <p v-if="alerte.message" class="mt-0.5 text-[12.5px] text-[var(--text-tertiary)] leading-relaxed">
                  {{ alerte.message }}
                </p>
                <p class="mt-1.5 text-[11.5px] text-[var(--text-tertiary)]">
                  {{ typeLabel(alerte.type) }} · {{ formatDate(alerte.createdAt) }}
                </p>
              </div>

              <!-- Actions (toujours visibles sur mobile, hover sur desktop) -->
              <div class="flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shrink-0">
                <NuxtLink
                  v-if="alerte.actionUrl"
                  :to="alerte.actionUrl"
                  class="rounded-[8px] p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="Voir"
                >
                  <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
                </NuxtLink>
                <button
                  v-if="!alerte.lue"
                  class="rounded-[8px] p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--sage-soft)] hover:text-[var(--sage-deep)] transition-colors"
                  title="Marquer comme lue"
                  @click="handleMarkRead(alerte.id)"
                >
                  <UIcon name="i-lucide-check" class="h-4 w-4" />
                </button>
                <button
                  class="rounded-[8px] p-1.5 text-[var(--text-tertiary)] hover:bg-red-50 hover:text-[var(--status-bad)] transition-colors"
                  title="Supprimer"
                  @click="handleDelete(alerte.id)"
                >
                  <UIcon name="i-lucide-trash-2" class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-2 pt-2">
      <button
        class="px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium border border-[var(--border-default)] bg-white text-[var(--text-secondary)] disabled:opacity-40 hover:text-[var(--text-primary)] transition-colors"
        :disabled="page <= 1"
        @click="page--"
      >
        <UIcon name="i-lucide-chevron-left" class="h-3.5 w-3.5" />
      </button>
      <span class="flex items-center px-3 text-[12.5px] text-[var(--text-secondary)]">
        {{ page }} / {{ totalPages }}
      </span>
      <button
        class="px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium border border-[var(--border-default)] bg-white text-[var(--text-secondary)] disabled:opacity-40 hover:text-[var(--text-primary)] transition-colors"
        :disabled="page >= totalPages"
        @click="page++"
      >
        <UIcon name="i-lucide-chevron-right" class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Alerte } from '~/composables/useAlertes';

definePageMeta({ layout: 'default' });

const notifications = useNotifications();
const { list, markRead, remove, generate, markAllRead } = useAlertes();
const { on } = useDataBus();
on(['alerte:read', 'alerte:deleted', 'intervention:created', 'ruche:created', 'ruche:updated', 'ruche:deleted'], fetchAlertes);

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
    dot: 'bg-[var(--text-tertiary)]',
    activeCls: 'bg-[var(--text-primary)] text-white ring-[var(--text-tertiary)]',
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


watch([page, filterLue, filterPriorite], fetchAlertes);
onMounted(fetchAlertes);
</script>
