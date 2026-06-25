<template>
  <div>
    <UiPageHeader
      title="Campagnes"
      description="Gérez vos campagnes de commandes groupées"
      :breadcrumbs="[{ label: 'Association', to: '/association' }, { label: 'Campagnes' }]"
    >
      <template #actions>
        <UButton
          label="Nouvelle campagne"
          icon="i-lucide-plus"
          color="primary"
          to="/association/campagnes/nouvelle"
        />
      </template>
    </UiPageHeader>

    <!-- Segmented filter -->
    <div class="mb-6 inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
      <button
        v-for="seg in segments"
        :key="seg.value"
        type="button"
        class="rounded-md px-3.5 py-1.5 text-xs font-medium transition-all duration-150"
        :class="
          activeSegment === seg.value
            ? 'bg-white text-stone-900 shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        "
        @click="activeSegment = seg.value"
      >
        {{ seg.label }}
        <span v-if="seg.count > 0" class="ml-1 text-stone-300">{{ seg.count }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 6" :key="i" class="h-36 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <!-- Empty state -->
    <UiEmptyState
      v-else-if="campagnes.length === 0"
      icon="i-lucide-megaphone"
      title="Aucune campagne"
      description="Créez votre première campagne de commandes groupées"
      action-label="Créer une campagne"
      @action="navigateTo('/association/campagnes/nouvelle')"
    />

    <!-- No results -->
    <div v-else-if="filteredCampagnes.length === 0" class="mt-8 text-center text-sm text-stone-400">
      Aucune campagne ne correspond au filtre selectionne
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="c in filteredCampagnes"
        :key="c.id"
        :to="`/association/campagnes/${c.id}`"
        class="group rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex items-start justify-between">
          <h3 class="text-sm font-semibold text-stone-900 group-hover:text-amber-700">
            {{ c.nom }}
          </h3>
          <span
            class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="statutBadgeClass(c.statut)"
          >
            {{ c.statut }}
          </span>
        </div>
        <p v-if="c.dateOuverture && c.dateFermeture" class="mt-2 text-xs text-stone-500">
          {{ formatDate(c.dateOuverture) }} — {{ formatDate(c.dateFermeture) }}
        </p>
        <div class="mt-3 flex items-center gap-3 text-xs text-stone-400">
          <span v-if="c.commandesCount !== undefined" class="flex items-center gap-1">
            <UIcon name="i-lucide-shopping-cart" class="h-3 w-3" />
            {{ c.commandesCount }} commande{{ (c.commandesCount ?? 0) > 1 ? 's' : '' }}
          </span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const { campagnes, pending } = useCampagnes();
const activeSegment = ref('toutes');

const segments = computed(() => [
  { value: 'toutes', label: 'Toutes', count: campagnes.value.length },
  {
    value: 'brouillon',
    label: 'Brouillon',
    count: campagnes.value.filter((c) => c.statut === 'brouillon').length,
  },
  {
    value: 'ouverte',
    label: 'Ouvertes',
    count: campagnes.value.filter((c) => c.statut === 'ouverte').length,
  },
  {
    value: 'fermee',
    label: 'Fermees',
    count: campagnes.value.filter((c) => c.statut === 'fermee').length,
  },
  {
    value: 'terminee',
    label: 'Terminees',
    count: campagnes.value.filter((c) => c.statut === 'terminee').length,
  },
]);

const filteredCampagnes = computed(() => {
  if (activeSegment.value === 'toutes') return campagnes.value;
  return campagnes.value.filter((c) => c.statut === activeSegment.value);
});

function statutBadgeClass(statut: string): string {
  switch (statut) {
    case 'brouillon':
      return 'bg-stone-100 text-stone-600';
    case 'ouverte':
      return 'bg-emerald-50 text-emerald-700';
    case 'fermee':
      return 'bg-amber-50 text-amber-700';
    case 'terminee':
      return 'bg-blue-50 text-blue-700';
    default:
      return 'bg-stone-100 text-stone-600';
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
</script>
