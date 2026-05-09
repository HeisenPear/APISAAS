<template>
  <div>
    <NuxtLink
      to="/finances"
      class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-stone-700"
    >
      <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
      Retour aux finances
    </NuxtLink>

    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight text-stone-900">Rapports & Exports</h1>
      <p class="mt-1 text-sm text-stone-500">Exportez vos donnees comptables</p>
    </div>

    <!-- Date range -->
    <div class="mb-6 rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">Periode</h3>
      <div class="grid grid-cols-2 gap-4 sm:w-96">
        <div>
          <label class="mb-1 block text-sm text-stone-600">Du</label>
          <input
            v-model="dateFrom"
            type="date"
            class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
        </div>
        <div>
          <label class="mb-1 block text-sm text-stone-600">Au</label>
          <input
            v-model="dateTo"
            type="date"
            class="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
        </div>
      </div>
    </div>

    <!-- Export options -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <UIcon name="i-lucide-file-spreadsheet" class="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-stone-900">Export CSV</h3>
            <p class="text-xs text-stone-500">Compatible Excel, Google Sheets</p>
          </div>
        </div>
        <p class="mb-4 text-sm text-stone-600">
          Exportez toutes vos transactions (ventes et achats) au format CSV avec les colonnes:
          numero, type, date, statut, client, categorie, sous-total, TVA, total.
        </p>
        <UButton
          label="Telecharger CSV"
          icon="i-lucide-download"
          color="primary"
          variant="outline"
          @click="exportCSV"
        />
      </div>

      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <UIcon name="i-lucide-file-text" class="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-stone-900">Export FEC</h3>
            <p class="text-xs text-stone-500">Fichier des Ecritures Comptables</p>
          </div>
        </div>
        <p class="mb-4 text-sm text-stone-600">
          Format reglementaire francais pour votre comptable ou en cas de controle fiscal. Conforme
          aux normes de l'administration fiscale.
        </p>
        <UButton
          label="Telecharger FEC"
          icon="i-lucide-download"
          color="primary"
          variant="outline"
          @click="exportFEC"
        />
      </div>
    </div>

    <!-- Documents PDF -->
    <h2 class="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-stone-400">
      Documents reglementaires
    </h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NuxtLink
        to="/exports/registre"
        class="group rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
      >
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <UIcon name="i-lucide-book-open" class="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-stone-900">Registre d'elevage</h3>
            <p class="text-xs text-stone-500">Document reglementaire obligatoire</p>
          </div>
        </div>
        <p class="text-sm text-stone-600">
          Registre complet avec inventaire des ruchers, ruches et interventions. Imprimable en PDF.
        </p>
      </NuxtLink>

      <NuxtLink
        to="/exports/bilan"
        class="group rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
      >
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <UIcon name="i-lucide-bar-chart-3" class="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-stone-900">Bilan annuel</h3>
            <p class="text-xs text-stone-500">Synthese de l'activite</p>
          </div>
        </div>
        <p class="text-sm text-stone-600">
          Vue d'ensemble annuelle : cheptel, production, finances. Imprimable en PDF.
        </p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const now = new Date();
const dateFrom = ref(`${now.getFullYear()}-01-01`);
const dateTo = ref(now.toISOString().slice(0, 10));

function buildExportUrl(format: 'csv' | 'fec') {
  const params = new URLSearchParams({ format });
  if (dateFrom.value) params.set('from', dateFrom.value);
  if (dateTo.value) params.set('to', dateTo.value);
  return `/api/finances/export?${params.toString()}`;
}

function exportCSV() {
  window.open(buildExportUrl('csv'), '_blank');
}

function exportFEC() {
  window.open(buildExportUrl('fec'), '_blank');
}
</script>
