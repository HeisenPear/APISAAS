<template>
  <div>
    <NuxtLink
      to="/finances/rapports"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700 print:hidden"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux exports
    </NuxtLink>

    <div class="mb-4 flex items-center justify-between print:hidden">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-stone-900">Bilan annuel</h1>
        <p class="mt-1 text-sm text-stone-500">Synthese de votre activite apicole</p>
      </div>
      <div class="flex gap-2">
        <div class="flex items-center gap-2">
          <label class="text-sm text-stone-600">Annee :</label>
          <select
            v-model="selectedYear"
            class="rounded-lg border border-stone-200 px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
          >
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <UButton
          label="Imprimer / PDF"
          icon="i-lucide-printer"
          color="primary"
          @click="handlePrint"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <div v-for="i in 4" :key="i" class="h-32 animate-pulse rounded-2xl bg-stone-100" />
    </div>

    <!-- Printable content -->
    <div v-else class="print-document space-y-6">
      <!-- Header -->
      <div
        class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none"
      >
        <div class="text-center">
          <h2 class="text-xl font-bold text-stone-900">BILAN ANNUEL {{ selectedYear }}</h2>
          <p v-if="profilData" class="mt-2 text-sm text-stone-700">
            {{ profilData.prenom }} {{ profilData.nom }}
            <span v-if="profilData.napi"> — NAPI : {{ profilData.napi }}</span>
          </p>
        </div>
      </div>

      <!-- Chiffres cles -->
      <div
        class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none"
      >
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Chiffres cles
        </h3>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p class="text-xs text-stone-500">Ruchers</p>
            <p class="text-2xl font-bold text-stone-900">{{ bilanData.nbRuchers }}</p>
          </div>
          <div>
            <p class="text-xs text-stone-500">Ruches actives</p>
            <p class="text-2xl font-bold text-stone-900">{{ bilanData.nbRuchesActives }}</p>
          </div>
          <div>
            <p class="text-xs text-stone-500">Interventions</p>
            <p class="text-2xl font-bold text-stone-900">{{ bilanData.nbInterventions }}</p>
          </div>
          <div>
            <p class="text-xs text-stone-500">Recoltes</p>
            <p class="text-2xl font-bold text-stone-900">{{ bilanData.nbRecoltes }}</p>
          </div>
        </div>
      </div>

      <!-- Production -->
      <div
        class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none"
      >
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Production
        </h3>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p class="text-xs text-stone-500">Production totale</p>
            <p class="text-2xl font-bold text-amber-600">
              {{ bilanData.productionTotaleKg.toFixed(1) }} kg
            </p>
          </div>
          <div>
            <p class="text-xs text-stone-500">Moyenne par ruche</p>
            <p class="text-2xl font-bold text-stone-900">
              {{ bilanData.productionParRuche.toFixed(1) }} kg
            </p>
          </div>
          <div>
            <p class="text-xs text-stone-500">Types de miel</p>
            <p class="text-lg font-semibold text-stone-900">{{ bilanData.typesMiel.length }}</p>
          </div>
        </div>
        <div v-if="bilanData.typesMiel.length > 0" class="mt-4">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-stone-200 text-left text-xs uppercase text-stone-400">
                <th class="pb-2 pr-4">Type</th>
                <th class="pb-2 pr-4 text-right">Quantite (kg)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in bilanData.typesMiel" :key="t.type" class="border-b border-stone-100">
                <td class="py-2 pr-4 font-medium text-stone-900">{{ t.type }}</td>
                <td class="py-2 pr-4 text-right text-stone-600">{{ t.quantite.toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Finances -->
      <div
        class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm print:rounded-none print:border-none print:p-0 print:shadow-none"
      >
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">Finances</h3>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p class="text-xs text-stone-500">Chiffre d'affaires</p>
            <p class="text-2xl font-bold text-emerald-600">{{ formatMoney(bilanData.ca) }}</p>
          </div>
          <div>
            <p class="text-xs text-stone-500">Charges</p>
            <p class="text-2xl font-bold text-stone-600">{{ formatMoney(bilanData.charges) }}</p>
          </div>
          <div>
            <p class="text-xs text-stone-500">Resultat</p>
            <p
              class="text-2xl font-bold"
              :class="bilanData.resultat >= 0 ? 'text-emerald-600' : 'text-red-600'"
            >
              {{ formatMoney(bilanData.resultat) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center text-xs text-stone-400 print:mt-8">
        <p>Document genere le {{ formatDate(new Date().toISOString()) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '~/types/api';
import type { Profil } from '~/types/models';

definePageMeta({ layout: 'default' });

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear);
const availableYears = computed(() => {
  const years = [];
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);
  return years;
});

interface BilanData {
  nbRuchers: number;
  nbRuchesActives: number;
  nbInterventions: number;
  nbRecoltes: number;
  productionTotaleKg: number;
  productionParRuche: number;
  typesMiel: { type: string; quantite: number }[];
  ca: number;
  charges: number;
  resultat: number;
}

const { data: profilRes } = useFetch<ApiResponse<Profil>>('/api/profils/me', {
  key: 'bilan-profil',
});
const profilData = computed(() => profilRes.value?.data ?? null);

const { data: bilanRes, pending } = useFetch<ApiResponse<BilanData>>(
  () => `/api/export/bilan?year=${selectedYear.value}`,
  { key: `bilan-${selectedYear.value}` },
);

const defaultBilan: BilanData = {
  nbRuchers: 0,
  nbRuchesActives: 0,
  nbInterventions: 0,
  nbRecoltes: 0,
  productionTotaleKg: 0,
  productionParRuche: 0,
  typesMiel: [],
  ca: 0,
  charges: 0,
  resultat: 0,
};

const bilanData = computed(() => bilanRes.value?.data ?? defaultBilan);

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function handlePrint() {
  window.print();
}
</script>

<style>
@media print {
  .print-document {
    font-size: 11pt;
  }
  .print-document table {
    page-break-inside: auto;
  }
  .print-document tr {
    page-break-inside: avoid;
  }
}
</style>
