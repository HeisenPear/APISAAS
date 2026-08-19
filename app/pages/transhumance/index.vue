<script setup lang="ts">
definePageMeta({ layout: 'default' });

const {
  data: plans,
  pending: plansPending,
  error: plansError,
  refresh: refreshPlans,
} = useFetch('/api/transhumance/plans', {
  key: 'transhumance-plans',
  query: { limit: 10, page: 1 },
  lazy: true,
});

const statutColors: Record<string, string> = {
  planifie: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-amber-100 text-amber-700',
  realise: 'bg-amber-100 text-amber-700',
  annule: 'bg-stone-100 text-stone-500',
};

const statutLabels: Record<string, string> = {
  planifie: 'Planifié',
  en_cours: 'En cours',
  realise: 'Réalisé',
  annule: 'Annulé',
};

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const activePlans = computed(() =>
  (plans.value?.data ?? []).filter(
    (p: Record<string, unknown>) => p.statut === 'planifie' || p.statut === 'en_cours',
  ),
);

const pastPlans = computed(() =>
  (plans.value?.data ?? [])
    .filter((p: Record<string, unknown>) => p.statut === 'realise' || p.statut === 'annule')
    .slice(0, 5),
);
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
          style="
            font-family:
              'SF Pro Display',
              -apple-system,
              BlinkMacSystemFont,
              sans-serif;
          "
        >
          Transhumance
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Planifiez vos déplacements de ruchers vers les miellées
        </p>
      </div>
      <UButton
        data-tutorial="btn-nouveau-plan"
        to="/transhumance/plans/nouveau"
        color="primary"
        icon="i-lucide-plus"
      >
        Nouveau plan
      </UButton>
    </div>

    <!-- Pill nav -->
    <div
      class="flex items-center gap-1 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] w-fit p-0.5"
    >
      <span
        class="rounded-[8px] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-sm"
      >
        Plans
      </span>
      <NuxtLink
        to="/transhumance/emplacements"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Emplacements
      </NuxtLink>
    </div>

    <!-- 01 — Plans en cours -->
    <section data-tutorial="transhumance-plans" class="space-y-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
        01 — Plans en cours
      </p>

      <!-- Loading -->
      <div v-if="plansPending" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="h-24 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
        />
      </div>

      <!-- Empty -->
      <UiErrorState v-else-if="plansError" :error="plansError" :retry="refreshPlans" />

      <div
        v-else-if="!activePlans.length"
        class="flex flex-col items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-white py-16 text-center"
      >
        <UIcon name="i-lucide-truck" class="h-10 w-10 text-[var(--text-tertiary)]" />
        <p class="text-sm text-[var(--text-secondary)]">
          Vos abeilles vont voyager 🚚 Créez un plan de transhumance pour préparer votre prochaine
          miellée.
        </p>
        <UButton to="/transhumance/plans/nouveau" size="sm" color="primary" variant="soft">
          Créer un plan
        </UButton>
      </div>

      <!-- Cards -->
      <div v-else class="space-y-3">
        <div
          v-for="plan in activePlans"
          :key="plan.id"
          class="flex items-start gap-0 bg-white border border-[var(--border-default)] rounded-[14px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <!-- Left accent bar -->
          <div
            class="w-1 self-stretch shrink-0 rounded-l-[14px]"
            :class="{
              'bg-[var(--honey)]': plan.statut === 'planifie',
              'bg-[var(--sage)]': plan.statut === 'en_cours',
              'bg-[var(--surface-sunk)]': plan.statut === 'realise' || plan.statut === 'annule',
            }"
          />
          <div class="flex flex-1 items-start justify-between gap-4 p-5">
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-[var(--text-primary)] truncate">
                {{ plan.miellee || `Plan ${plan.annee}` }}
              </p>
              <div
                class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]"
              >
                <span>{{ formatDate(plan.datePrevue) }}</span>
                <span>·</span>
                <span
                  >{{ plan.nombreRuchesPrevues }} ruche{{
                    plan.nombreRuchesPrevues !== 1 ? 's' : ''
                  }}</span
                >
              </div>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span
                class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                :class="statutColors[plan.statut]"
              >
                {{ statutLabels[plan.statut] }}
              </span>
              <NuxtLink
                :to="`/transhumance/plans/${plan.id}`"
                class="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                title="Modifier"
              >
                <UIcon name="i-lucide-pencil" class="h-3.5 w-3.5" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 02 — Historique -->
    <section v-if="pastPlans.length" class="space-y-3">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
        02 — Historique
      </p>
      <div class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden">
        <table class="w-full">
          <thead class="bg-[var(--surface-muted)]">
            <tr>
              <th
                class="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
              >
                Plan
              </th>
              <th
                class="hidden px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] sm:table-cell"
              >
                Date
              </th>
              <th
                class="hidden px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] sm:table-cell"
              >
                Ruches
              </th>
              <th
                class="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
              >
                Statut
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-faint)]">
            <tr
              v-for="plan in pastPlans"
              :key="plan.id"
              class="cursor-pointer transition-colors hover:bg-[var(--surface-primary)]"
              @click="$router.push(`/transhumance/plans/${plan.id}`)"
            >
              <td class="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">
                {{ plan.miellee || `Plan ${plan.annee}` }}
              </td>
              <td class="hidden px-5 py-3 text-sm text-[var(--text-secondary)] sm:table-cell">
                {{ formatDate(plan.datePrevue) }}
              </td>
              <td class="hidden px-5 py-3 text-sm text-[var(--text-secondary)] sm:table-cell">
                {{ plan.nombreRuchesPrevues }}
              </td>
              <td class="px-5 py-3">
                <span
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="statutColors[plan.statut]"
                >
                  {{ statutLabels[plan.statut] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="text-right">
        <NuxtLink
          to="/transhumance/emplacements"
          class="text-xs font-medium text-[var(--honey-deep)] hover:underline"
        >
          Voir les emplacements →
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
