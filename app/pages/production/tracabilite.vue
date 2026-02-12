<template>
  <div>
    <!-- Header -->
    <UiPageHeader
      title="Tracabilite des lots"
      description="Suivi et historique de vos lots de miel"
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

    <!-- Search -->
    <div class="mt-5">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Rechercher un numero de lot..."
        class="w-80"
      />
    </div>

    <!-- Stats -->
    <div class="mt-4 flex items-center gap-4 text-sm text-stone-500">
      <span>{{ totalLots }} lot{{ totalLots > 1 ? 's' : '' }}</span>
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
