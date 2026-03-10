<template>
  <div>
    <!-- Loading -->
    <div v-if="orgPending" class="space-y-4">
      <div class="h-10 w-48 animate-pulse rounded-xl bg-stone-100" />
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
    </div>

    <!-- No organisation: CTA -->
    <div v-else-if="!organisation" class="flex items-center justify-center py-20">
      <div
        class="w-full max-w-md rounded-2xl border border-stone-200/60 bg-white p-10 text-center shadow-sm"
      >
        <div
          class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50"
        >
          <UIcon name="i-lucide-users" class="h-8 w-8 text-amber-500" />
        </div>
        <h2 class="text-xl font-bold tracking-tight text-stone-900">Creez votre association</h2>
        <p class="mt-2 text-sm text-stone-500">
          Gerez vos campagnes de commandes groupees, mutualisez vos achats et partagez les
          statistiques avec vos membres.
        </p>
        <UButton
          label="Commencer"
          icon="i-lucide-arrow-right"
          color="primary"
          size="lg"
          class="mt-6 min-h-[44px]"
          to="/association/parametres"
        />
      </div>
    </div>

    <!-- Organisation exists: Dashboard -->
    <template v-else>
      <UiPageHeader title="Association" :description="organisation.nom">
        <template #actions>
          <UButton
            label="Parametres"
            icon="i-lucide-settings"
            variant="outline"
            color="neutral"
            to="/association/parametres"
          />
          <UButton
            label="Nouvelle campagne"
            icon="i-lucide-plus"
            color="primary"
            to="/association/campagnes/nouvelle"
          />
        </template>
      </UiPageHeader>

      <!-- KPI cards -->
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <UiKpiCard icon="i-lucide-megaphone" label="Campagnes totales" :value="campagnes.length" />
        <UiKpiCard
          icon="i-lucide-radio"
          label="Campagnes actives"
          :value="activeCampagnes.length"
        />
        <UiKpiCard icon="i-lucide-shopping-cart" label="Commandes" :value="totalCommandes" />
        <UiKpiCard icon="i-lucide-euro" label="CA Total HT" :value="totalCa" suffix=" EUR" />
      </div>

      <!-- Loading campagnes -->
      <div v-if="campagnesPending" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-36 animate-pulse rounded-2xl bg-stone-100" />
      </div>

      <!-- Empty state -->
      <UiEmptyState
        v-else-if="campagnes.length === 0"
        icon="i-lucide-megaphone"
        title="Aucune campagne"
        description="Lancez votre premiere campagne de commandes groupees pour vos adherents"
        action-label="Creer une campagne"
        @action="navigateTo('/association/campagnes/nouvelle')"
      />

      <!-- Campagnes grid -->
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="c in campagnes"
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
            <span v-if="c.totalHt !== undefined" class="flex items-center gap-1">
              <UIcon name="i-lucide-euro" class="h-3 w-3" />
              {{ c.totalHt.toFixed(2) }} EUR HT
            </span>
          </div>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const { organisation, pending: orgPending } = useOrganisation();
const { campagnes, pending: campagnesPending } = useCampagnes();

const activeCampagnes = computed(() => campagnes.value.filter((c) => c.statut === 'ouverte'));

const totalCommandes = computed(() =>
  campagnes.value.reduce((sum, c) => sum + (c.commandesCount ?? 0), 0),
);

const totalCa = computed(() =>
  Math.round(campagnes.value.reduce((sum, c) => sum + (c.totalHt ?? 0), 0)),
);

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
