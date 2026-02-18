<template>
  <div>
    <!-- Header -->
    <UiPageHeader
      title="Tracabilite des lots"
      description="Cahier de miellerie numerique — Suivi reglementaire de vos lots de miel"
    >
      <template #actions>
        <UButton
          label="Nouvelle recolte"
          icon="i-lucide-plus"
          color="primary"
          to="/production/recoltes?action=nouvelle"
        />
      </template>
    </UiPageHeader>

    <!-- Regulatory banner -->
    <div
      class="mt-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3"
    >
      <UIcon name="i-lucide-shield-check" class="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
      <div>
        <p class="text-sm font-medium text-blue-900">Obligation reglementaire</p>
        <p class="text-xs text-blue-700">
          Tout apiculteur cedant sa production doit tenir un cahier de miellerie (Reg. CE 178/2002).
          Chaque lot doit permettre un retrait cible en cas de rappel. Conservation : 5 ans minimum.
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="mt-5 flex flex-wrap items-center gap-3">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Rechercher un lot ou type de miel..."
        class="w-80"
      />
      <div class="ml-auto flex items-center gap-2 text-sm text-stone-500">
        <UIcon name="i-lucide-package" class="h-4 w-4" />
        <span>{{ totalLots }} lot{{ totalLots > 1 ? 's' : '' }} traces</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="mt-6">
      <UiLoadingSkeleton variant="card" :count="4" />
    </div>

    <!-- Lots list -->
    <div v-else class="mt-6">
      <ProductionLotTracker :lots="lots" />
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex justify-center">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          color="neutral"
          size="sm"
          :disabled="currentPage <= 1"
          @click="currentPage--"
        />
        <span class="text-sm text-stone-500"> Page {{ currentPage }} / {{ totalPages }} </span>
        <UButton
          icon="i-lucide-chevron-right"
          variant="ghost"
          color="neutral"
          size="sm"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LotInfo } from '~/composables/useProduction';

definePageMeta({ layout: 'default' });

const { getLots } = useProduction();

const search = ref('');
const currentPage = ref(1);
const lots = ref<LotInfo[]>([]);
const totalLots = ref(0);
const totalPages = ref(1);
const loading = ref(true);

async function loadLots() {
  loading.value = true;
  try {
    const res = await getLots({
      page: currentPage.value,
      search: search.value || undefined,
    });
    lots.value = res.data;
    totalLots.value = res.pagination?.total ?? 0;
    totalPages.value = res.pagination?.totalPages ?? 1;
  } catch {
    lots.value = [];
  } finally {
    loading.value = false;
  }
}

watch([search], () => {
  currentPage.value = 1;
});

watch([search, currentPage], () => loadLots());
onMounted(() => loadLots());
</script>
