<template>
  <div>
    <!-- Header -->
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="font-display text-[26px] font-semibold tracking-tight text-[var(--text-primary)]">Finances</h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">Vue d'ensemble de votre comptabilité {{ currentYear }}</p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/finances/achats?new=1"
          class="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--border-default)] bg-white px-3.5 py-2 text-[13px] font-medium text-[var(--text-secondary)] shadow-sm transition-all hover:bg-[var(--surface-muted)]"
        >
          <UIcon name="i-lucide-shopping-bag" class="h-3.5 w-3.5" />
          Nouvel achat
        </NuxtLink>
        <NuxtLink
          to="/finances/ventes?new=1"
          class="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--honey)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--honey-dark)]"
        >
          <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
          Nouvelle vente
        </NuxtLink>
      </div>
    </div>

    <!-- Nav tabs -->
    <div class="mb-6 flex items-center gap-1 border-b border-[var(--border-faint)] pb-px">
      <NuxtLink
        to="/finances"
        class="rounded-t-[8px] border-b-2 border-[var(--honey)] px-4 py-2 text-[13px] font-semibold text-[var(--honey-deep)]"
      >
        Vue d'ensemble
      </NuxtLink>
      <NuxtLink
        to="/finances/ventes"
        class="rounded-t-[8px] border-b-2 border-transparent px-4 py-2 text-[13px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Ventes
      </NuxtLink>
      <NuxtLink
        to="/finances/achats"
        class="rounded-t-[8px] border-b-2 border-transparent px-4 py-2 text-[13px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Achats
      </NuxtLink>
      <NuxtLink
        to="/finances/rapports"
        class="rounded-t-[8px] border-b-2 border-transparent px-4 py-2 text-[13px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Rapports
      </NuxtLink>
    </div>

    <UiFeatureGate feature="facturationPdf" blur>
      <template #preview>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div v-for="i in 4" :key="i" class="h-24 rounded-[14px] bg-[var(--surface-muted)]" />
          </div>
          <div class="h-48 rounded-[14px] bg-[var(--surface-muted)]" />
        </div>
      </template>

      <!-- Facturation électronique banner -->
      <div class="mb-6 flex items-start gap-3 rounded-[12px] border border-[var(--status-info)]/30 bg-[#f0f4fb] px-4 py-3.5">
        <UIcon name="i-lucide-info" class="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-info)]" />
        <div>
          <p class="text-[13px] font-semibold text-[var(--text-primary)]">Facturation électronique — Vous êtes prêt !</p>
          <p class="mt-0.5 text-[12.5px] text-[var(--text-secondary)]">
            APIGO intègre une <strong>plateforme agréée</strong> pour transmettre vos factures au format Factur-X conforme à la réforme 2026. Pensez à renseigner le <strong>SIREN</strong> de vos clients professionnels.
          </p>
          <NuxtLink to="/parametres" class="mt-1 inline-block text-[12px] font-medium text-[var(--status-info)] hover:underline">Vérifier mes paramètres →</NuxtLink>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-6">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
        </div>
        <div class="h-72 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />
      </div>

      <template v-else-if="stats">
        <!-- 01 — Vue d'ensemble -->
        <div class="mb-8">
          <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">01 — Vue d'ensemble</p>
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p class="text-[11px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">Chiffre d'affaires</p>
              <p class="mt-2 text-[22px] font-bold leading-none tracking-tight text-[var(--honey-deep)]">{{ formatMoney(stats.ca) }}</p>
              <p class="mt-1.5 text-[11px] text-[var(--text-tertiary)]">{{ stats.nbVentes }} ventes</p>
            </div>
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p class="text-[11px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">Charges</p>
              <p class="mt-2 text-[22px] font-bold leading-none tracking-tight text-[var(--text-primary)]">{{ formatMoney(stats.charges) }}</p>
              <p class="mt-1.5 text-[11px] text-[var(--text-tertiary)]">{{ stats.nbAchats }} achats</p>
            </div>
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p class="text-[11px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">Résultat net</p>
              <p
                class="mt-2 text-[22px] font-bold leading-none tracking-tight"
                :class="stats.resultat >= 0 ? 'text-[var(--status-good)]' : 'text-[var(--status-bad)]'"
              >
                {{ formatMoney(stats.resultat) }}
              </p>
            </div>
            <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
              <p class="text-[11px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">Rentabilité / ruche</p>
              <p
                class="mt-2 text-[22px] font-bold leading-none tracking-tight"
                :class="stats.rentabiliteParRuche >= 0 ? 'text-[var(--status-good)]' : 'text-[var(--status-bad)]'"
              >
                {{ formatMoney(stats.rentabiliteParRuche) }}
              </p>
            </div>
          </div>
        </div>

        <!-- 02 — Évolution -->
        <div class="mb-8">
          <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">02 — Évolution</p>
          <div class="bg-white border border-[var(--border-default)] rounded-[14px] p-5">
            <FinancesRevenueChart
              :labels="stats.graphique.labels"
              :ventes="stats.graphique.ventes"
              :achats="stats.graphique.achats"
            />
          </div>
        </div>

        <!-- Rentabilité table -->
        <div class="mb-8">
          <FinancesRentabiliteTable
            :rentabilite-par-ruche="stats.rentabiliteParRuche"
            :cout-par-kg="stats.coutParKg"
            :production-kg="stats.productionKg"
            :nb-ruches="stats.nbRuches"
          />
        </div>

        <!-- Quick nav -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NuxtLink
            to="/finances/ventes"
            class="flex items-center gap-3 rounded-[14px] border border-[var(--honey-soft)] bg-[var(--honey-soft)] p-4 transition-all hover:border-[var(--honey)] hover:shadow-sm"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[var(--honey)]">
              <UIcon name="i-lucide-file-text" class="h-4 w-4 text-white" />
            </div>
            <div>
              <p class="text-[13px] font-semibold text-[var(--text-primary)]">Ventes</p>
              <p class="text-[11px] text-[var(--text-tertiary)]">{{ stats.nbVentes }} factures</p>
            </div>
          </NuxtLink>
          <NuxtLink
            to="/finances/achats"
            class="flex items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-white p-4 transition-all hover:border-[var(--border-default)] hover:shadow-sm"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[var(--surface-muted)]">
              <UIcon name="i-lucide-shopping-bag" class="h-4 w-4 text-[var(--text-secondary)]" />
            </div>
            <div>
              <p class="text-[13px] font-semibold text-[var(--text-primary)]">Charges</p>
              <p class="text-[11px] text-[var(--text-tertiary)]">{{ stats.nbAchats }} achats</p>
            </div>
          </NuxtLink>
          <NuxtLink
            to="/clients"
            class="flex items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-white p-4 transition-all hover:border-[var(--border-default)] hover:shadow-sm"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#eef4fb]">
              <UIcon name="i-lucide-users" class="h-4 w-4 text-[var(--status-info)]" />
            </div>
            <div>
              <p class="text-[13px] font-semibold text-[var(--text-primary)]">Clients</p>
              <p class="text-[11px] text-[var(--text-tertiary)]">Carnet d'adresses</p>
            </div>
          </NuxtLink>
          <NuxtLink
            to="/finances/rapports"
            class="flex items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-white p-4 transition-all hover:border-[var(--border-default)] hover:shadow-sm"
          >
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#f3f0fb]">
              <UIcon name="i-lucide-download" class="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p class="text-[13px] font-semibold text-[var(--text-primary)]">Exports</p>
              <p class="text-[11px] text-[var(--text-tertiary)]">CSV / FEC</p>
            </div>
          </NuxtLink>
        </div>
      </template>

      <!-- Empty state -->
      <UiEmptyState
        v-else
        icon="i-lucide-wallet"
        title="Aucune transaction"
        description="Commencez par enregistrer une vente ou un achat."
        action-label="Créer une vente"
        @action="navigateTo('/finances/ventes?new=1')"
      />
    </UiFeatureGate>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '~/types/api';

definePageMeta({ layout: 'default' });

interface FinanceDashboard {
  ca: number;
  charges: number;
  resultat: number;
  nbVentes: number;
  nbAchats: number;
  rentabiliteParRuche: number;
  coutParKg: number;
  productionKg: number;
  nbRuches: number;
  graphique: {
    labels: string[];
    ventes: number[];
    achats: number[];
  };
}

const currentYear = new Date().getFullYear();

const { data: responseData, status } = useFetch<ApiResponse<FinanceDashboard>>(
  '/api/finances/dashboard',
  {
    key: 'finances-dashboard',
    default: () => ({ data: null as unknown as FinanceDashboard }),
  },
);

const loading = computed(() => status.value === 'pending');
const stats = computed(() => responseData.value?.data);

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}
</script>
