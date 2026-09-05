<template>
  <Transition name="slide-panel">
    <div
      v-if="open && rucher"
      class="absolute right-0 top-0 z-10 flex h-full w-96 flex-col overflow-hidden rounded-r-2xl border-l border-stone-200/60 bg-white shadow-lg"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-stone-100 px-5 py-4">
        <h3 class="font-semibold text-stone-900">{{ rucher.nom }}</h3>
        <button
          aria-label="Fermer"
          type="button"
          class="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
          @click="$emit('close')"
        >
          <UIcon name="i-lucide-x" class="h-4 w-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-5 py-4">
        <!-- Location -->
        <div class="space-y-2">
          <div v-if="locationLabel" class="flex items-start gap-2 text-sm text-stone-600">
            <UIcon name="i-lucide-map-pin" class="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
            <span>{{ locationLabel }}</span>
          </div>
          <div v-if="rucher.environnement" class="flex items-center gap-2 text-sm text-stone-600">
            <UIcon name="i-lucide-trees" class="h-4 w-4 shrink-0 text-stone-400" />
            <span>{{ rucher.environnement }}</span>
          </div>
          <div v-if="rucher.notesAcces" class="flex items-start gap-2 text-sm text-stone-500">
            <UIcon name="i-lucide-info" class="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
            <span>{{ rucher.notesAcces }}</span>
          </div>
        </div>

        <!-- Stats -->
        <div v-if="stats" class="mt-5 grid grid-cols-2 gap-3">
          <div class="rounded-xl bg-stone-50 p-3 text-center">
            <p class="text-lg font-bold text-stone-900">{{ stats.totalRuches }}</p>
            <p class="text-xs text-stone-500">Ruches</p>
          </div>
          <div class="rounded-xl bg-stone-50 p-3 text-center">
            <p class="text-lg font-bold text-stone-900">{{ stats.ruchesActives }}</p>
            <p class="text-xs text-stone-500">Actives</p>
          </div>
          <div class="rounded-xl bg-stone-50 p-3 text-center">
            <p class="text-lg font-bold text-stone-900">{{ formattedProduction }}</p>
            <p class="text-xs text-stone-500">kg saison</p>
          </div>
          <div class="rounded-xl bg-stone-50 p-3 text-center">
            <p class="text-sm font-medium text-stone-900">{{ formattedLastVisit }}</p>
            <p class="text-xs text-stone-500">Derniere visite</p>
          </div>
        </div>

        <!-- Ruches list -->
        <div class="mt-5">
          <h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Ruches ({{ ruches.length }})
          </h4>
          <div v-if="ruchesLoading" class="space-y-2">
            <div v-for="i in 3" :key="i" class="h-10 animate-pulse rounded-lg bg-stone-100" />
          </div>
          <div v-else-if="ruches.length === 0" class="py-4 text-center text-sm text-stone-400">
            Aucune ruche
          </div>
          <div v-else class="space-y-1.5">
            <div
              v-for="ruche in ruches"
              :key="ruche.id"
              class="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2"
            >
              <span class="text-sm font-medium text-stone-700">{{ ruche.numero }}</span>
              <UBadge :color="statutColor(ruche.statut)" variant="subtle" size="xs">
                {{ ruche.statut }}
              </UBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 border-t border-stone-100 px-5 py-4">
        <UButton
          label="Voir detail"
          icon="i-lucide-external-link"
          variant="outline"
          color="neutral"
          block
          :to="`/ruchers/${rucher.id}`"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { Rucher, Ruche } from '~/types/models';
import type { RucherStats } from '~/composables/useRuchers';
import type { ApiListResponse, ApiResponse } from '~/types/api';

const props = defineProps<{
  rucher: Rucher | null;
  open: boolean;
}>();

defineEmits<{
  close: [];
}>();

const stats = ref<RucherStats | null>(null);
const ruches = ref<Ruche[]>([]);
const ruchesLoading = ref(false);

const locationLabel = computed(() => {
  if (!props.rucher) return '';
  const parts = [props.rucher.commune, props.rucher.departement].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : props.rucher.adresse || '';
});

const formattedProduction = computed(() =>
  stats.value ? Math.round(stats.value.productionSaison * 10) / 10 : '-',
);

const formattedLastVisit = computed(() => {
  if (!stats.value?.derniereVisite) return '-';
  return new Date(stats.value.derniereVisite).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
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

watch(
  () => props.rucher?.id,
  async (id) => {
    if (!id) {
      stats.value = null;
      ruches.value = [];
      return;
    }
    ruchesLoading.value = true;
    try {
      const [statsRes, ruchesRes] = await Promise.all([
        appelApi<ApiResponse<RucherStats>>(`/api/ruchers/${id}/stats`),
        appelApi<ApiListResponse<Ruche>>(`/api/ruchers/${id}/ruches`),
      ]);
      stats.value = statsRes.data;
      ruches.value = ruchesRes.data;
    } catch {
      stats.value = null;
      ruches.value = [];
    } finally {
      ruchesLoading.value = false;
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
}
</style>
