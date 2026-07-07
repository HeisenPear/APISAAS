<template>
  <div>
    <NuxtLink
      to="/finances"
      class="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Finances
    </NuxtLink>

    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1
          class="font-display text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
        >
          Rapports & Exports
        </h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">
          Exportez vos données financières et documents réglementaires
        </p>
      </div>
    </div>

    <!-- Période -->
    <div class="mb-6 rounded-[14px] border border-[var(--border-default)] bg-white p-5">
      <p
        class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]"
      >
        Période
      </p>
      <div class="grid grid-cols-2 gap-4 sm:w-96">
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
            >Du</label
          >
          <UiMobileDatePicker v-model="dateFrom" mode="date" />
        </div>
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-[var(--text-secondary)]"
            >Au</label
          >
          <UiMobileDatePicker v-model="dateTo" mode="date" />
        </div>
      </div>
    </div>

    <!-- Export des données -->
    <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
      Export des données
    </p>
    <div class="mb-8 grid grid-cols-1 gap-3 sm:max-w-md">
      <div class="rounded-[14px] border border-[var(--border-default)] bg-white p-5">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-[10px] bg-emerald-50">
            <UIcon name="i-lucide-file-spreadsheet" class="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p class="text-[14px] font-semibold text-[var(--text-primary)]">Export CSV</p>
            <p class="text-[12px] text-[var(--text-tertiary)]">Compatible Excel, Google Sheets</p>
          </div>
        </div>
        <p class="mb-4 text-[13px] text-[var(--text-secondary)]">
          Toutes vos transactions (ventes et achats) avec les colonnes : numéro, type, date, statut,
          client, catégorie, sous-total HT, TVA, total TTC.
        </p>
        <UButton
          label="Télécharger CSV"
          icon="i-lucide-download"
          color="primary"
          variant="outline"
          @click="exportCSV"
        />
      </div>
    </div>

    <!-- Documents réglementaires -->
    <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
      Documents réglementaires
    </p>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <NuxtLink
        to="/exports/registre"
        class="group rounded-[14px] border border-[var(--border-default)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--honey)]/40 hover:shadow-md"
      >
        <div class="mb-4 flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--honey-soft)]"
          >
            <UIcon name="i-lucide-book-open" class="h-5 w-5 text-[var(--honey-deep)]" />
          </div>
          <div>
            <p class="text-[14px] font-semibold text-[var(--text-primary)]">Registre d'élevage</p>
            <p class="text-[12px] text-[var(--text-tertiary)]">
              Document réglementaire obligatoire
            </p>
          </div>
        </div>
        <p class="text-[13px] text-[var(--text-secondary)]">
          Registre complet avec inventaire des ruchers, ruches et interventions. Imprimable en PDF.
        </p>
      </NuxtLink>

      <NuxtLink
        to="/exports/bilan"
        class="group rounded-[14px] border border-[var(--border-default)] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--honey)]/40 hover:shadow-md"
      >
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue-50">
            <UIcon name="i-lucide-bar-chart-3" class="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p class="text-[14px] font-semibold text-[var(--text-primary)]">Bilan annuel</p>
            <p class="text-[12px] text-[var(--text-tertiary)]">Synthèse de l'activité</p>
          </div>
        </div>
        <p class="text-[13px] text-[var(--text-secondary)]">
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

function exportCSV() {
  const params = new URLSearchParams({ format: 'csv' });
  if (dateFrom.value) params.set('from', dateFrom.value);
  if (dateTo.value) params.set('to', dateTo.value);
  window.open(`/api/finances/export?${params.toString()}`, '_blank');
}
</script>
