<template>
  <div>
    <UiPageHeader
      title="Finances"
      :description="`Vue d'ensemble de votre comptabilite ${currentYear}`"
    >
      <template #actions>
        <UButton
          label="Nouvelle vente"
          icon="i-lucide-plus"
          color="primary"
          to="/finances/ventes?new=1"
        />
        <UButton
          label="Nouvel achat"
          icon="i-lucide-shopping-bag"
          variant="outline"
          color="neutral"
          to="/finances/achats?new=1"
        />
      </template>
    </UiPageHeader>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div v-for="i in 5" :key="i" class="h-24 animate-pulse rounded-2xl bg-stone-100" />
      </div>
      <div class="h-72 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <template v-else-if="stats">
      <!-- KPIs -->
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Chiffre d'affaires</p>
          <p class="mt-1 text-2xl font-bold text-amber-600">{{ formatMoney(stats.ca) }}</p>
          <p class="mt-0.5 text-xs text-stone-400">{{ stats.nbVentes }} ventes</p>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Charges</p>
          <p class="mt-1 text-2xl font-bold text-stone-600">{{ formatMoney(stats.charges) }}</p>
          <p class="mt-0.5 text-xs text-stone-400">{{ stats.nbAchats }} achats</p>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Resultat</p>
          <p
            class="mt-1 text-2xl font-bold"
            :class="stats.resultat >= 0 ? 'text-emerald-600' : 'text-red-600'"
          >
            {{ formatMoney(stats.resultat) }}
          </p>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Rentabilite / ruche</p>
          <p
            class="mt-1 text-2xl font-bold"
            :class="stats.rentabiliteParRuche >= 0 ? 'text-emerald-600' : 'text-red-600'"
          >
            {{ formatMoney(stats.rentabiliteParRuche) }}
          </p>
        </div>
        <div class="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <p class="text-xs text-stone-500">Cout / kg miel</p>
          <p class="mt-1 text-2xl font-bold text-stone-900">{{ formatMoney(stats.coutParKg) }}</p>
        </div>
      </div>

      <!-- Chart -->
      <div class="mb-6">
        <FinancesRevenueChart
          :labels="stats.graphique.labels"
          :ventes="stats.graphique.ventes"
          :achats="stats.graphique.achats"
        />
      </div>

      <!-- Rentabilite -->
      <div class="mb-6">
        <FinancesRentabiliteTable
          :rentabilite-par-ruche="stats.rentabiliteParRuche"
          :cout-par-kg="stats.coutParKg"
          :production-kg="stats.productionKg"
          :nb-ruches="stats.nbRuches"
        />
      </div>

      <!-- Navigation rapide -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <NuxtLink
          to="/finances/ventes"
          class="group flex items-center gap-3 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm transition-all hover:border-amber-400 hover:shadow-md"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 shadow-sm"
          >
            <UIcon name="i-lucide-file-text" class="h-5 w-5 text-white" />
          </div>
          <div>
            <p class="text-sm font-semibold text-stone-900">Ventes</p>
            <p class="text-xs text-stone-500">{{ stats.nbVentes }} factures</p>
          </div>
        </NuxtLink>
        <NuxtLink
          to="/finances/achats"
          class="group flex items-center gap-3 rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm transition-all hover:border-stone-300 hover:shadow-md"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100">
            <UIcon name="i-lucide-shopping-bag" class="h-5 w-5 text-stone-600" />
          </div>
          <div>
            <p class="text-sm font-semibold text-stone-900">Charges</p>
            <p class="text-xs text-stone-500">{{ stats.nbAchats }} achats</p>
          </div>
        </NuxtLink>
        <NuxtLink
          to="/clients"
          class="group flex items-center gap-3 rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm transition-all hover:border-stone-300 hover:shadow-md"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <UIcon name="i-lucide-users" class="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p class="text-sm font-semibold text-stone-900">Clients</p>
            <p class="text-xs text-stone-500">Carnet d'adresses</p>
          </div>
        </NuxtLink>
        <NuxtLink
          to="/finances/rapports"
          class="group flex items-center gap-3 rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm transition-all hover:border-stone-300 hover:shadow-md"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <UIcon name="i-lucide-download" class="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p class="text-sm font-semibold text-stone-900">Exports</p>
            <p class="text-xs text-stone-500">CSV / FEC</p>
          </div>
        </NuxtLink>
      </div>
    </template>
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
