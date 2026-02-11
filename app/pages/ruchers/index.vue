<template>
  <div>
    <!-- Header -->
    <UiPageHeader title="Ruchers" description="Gerez vos emplacements de ruchers">
      <template #actions>
        <div class="flex items-center gap-2">
          <!-- View toggle -->
          <div class="flex rounded-lg border border-stone-200 bg-white p-0.5">
            <button
              type="button"
              class="rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
              :class="
                viewMode === 'grid'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-700'
              "
              @click="viewMode = 'grid'"
            >
              <UIcon name="i-lucide-layout-grid" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
              :class="
                viewMode === 'map'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-700'
              "
              @click="viewMode = 'map'"
            >
              <UIcon name="i-lucide-map" class="h-4 w-4" />
            </button>
          </div>

          <UButton
            label="Nouveau rucher"
            icon="i-lucide-plus"
            color="primary"
            to="/ruchers/nouveau"
          />
        </div>
      </template>
    </UiPageHeader>

    <!-- Loading -->
    <div v-if="pending" class="mt-6">
      <UiLoadingSkeleton variant="card" :count="6" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="ruchers.length === 0"
      icon="i-lucide-map-pin"
      title="Aucun rucher"
      description="Commencez par creer votre premier rucher pour geopositionner vos ruches"
      action-label="Creer un rucher"
      @action="navigateTo('/ruchers/nouveau')"
    />

    <!-- Grid view -->
    <div
      v-else-if="viewMode === 'grid'"
      class="animate-stagger mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      <RuchersRucherCard
        v-for="rucher in ruchers"
        :key="rucher.id"
        :rucher="rucher"
        :ruches-count="(rucher as any).ruchesCount ?? 0"
      />
    </div>

    <!-- Map view -->
    <div
      v-else
      class="relative mt-6 h-[calc(100vh-220px)] overflow-hidden rounded-2xl border border-stone-200/60"
    >
      <RuchersRucherMap
        :ruchers="ruchers"
        :selected-id="selectedRucherId"
        @select="selectedRucherId = $event"
      />
      <RuchersRucherPanel
        :rucher="selectedRucher"
        :open="!!selectedRucherId"
        @close="selectedRucherId = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const { ruchers, pending } = useRuchers();
const viewMode = ref<'grid' | 'map'>('grid');
const selectedRucherId = ref<string | null>(null);

const selectedRucher = computed(
  () => ruchers.value.find((r) => r.id === selectedRucherId.value) ?? null,
);
</script>
