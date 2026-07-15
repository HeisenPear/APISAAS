<script setup lang="ts">
import type { PlanFeatures } from '~/config/plans';

/**
 * Sous-navigation partagée de l'espace Finances. Source unique des onglets pour
 * que toutes les pages (Vue d'ensemble, Ventes, Achats, Prévisionnel, Paiements
 * & relances, Rapports) partagent la MÊME barre — navigation cohérente et
 * lisible, plutôt que des liens « retour » disparates. Défilable sur mobile.
 */
interface FinanceTab {
  label: string;
  to: string;
  /** Feature de gating : un cadenas s'affiche si le plan courant ne l'inclut pas. */
  feature?: keyof PlanFeatures;
}

const TABS: FinanceTab[] = [
  { label: "Vue d'ensemble", to: '/finances' },
  { label: 'Ventes', to: '/finances/ventes' },
  { label: 'Achats', to: '/finances/achats' },
  { label: 'Prévisionnel', to: '/finances/tresorerie', feature: 'previsionnelTresorerie' },
  { label: 'Paiements & relances', to: '/finances/reglements', feature: 'suiviReglements' },
  { label: 'Rapports', to: '/finances/rapports' },
];

const route = useRoute();
const { can } = useGating();

function isActive(to: string): boolean {
  if (to === '/finances') return route.path === '/finances';
  return route.path === to || route.path.startsWith(`${to}/`);
}
</script>

<template>
  <div class="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
    <div
      class="flex w-max items-center gap-1 border-b border-[var(--border-faint)] pb-px sm:w-full"
    >
      <NuxtLink
        v-for="tab in TABS"
        :key="tab.to"
        :to="tab.to"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-[8px] border-b-2 px-4 py-2 text-[13px] transition-colors"
        :class="
          isActive(tab.to)
            ? 'border-[var(--honey)] font-semibold text-[var(--honey-deep)]'
            : 'border-transparent font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        "
      >
        {{ tab.label }}
        <UIcon
          v-if="tab.feature && !can(tab.feature)"
          name="i-lucide-lock"
          class="h-3 w-3 text-[var(--text-quaternary)]"
        />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
