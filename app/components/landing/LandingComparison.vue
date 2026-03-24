<template>
  <section class="bg-[#FAFAF8] py-20 sm:py-28">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Section header -->
      <div class="mx-auto mb-16 max-w-2xl text-center">
        <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-500">
          Comparaison
        </p>
        <h2 class="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          L'alternative à tout le reste
        </h2>
        <p class="mt-4 text-lg text-stone-500">
          Carnet papier, Excel, ou un outil généraliste incomplet. Il était temps de faire mieux.
        </p>
      </div>

      <!-- Comparison table -->
      <div class="overflow-hidden rounded-2xl border border-stone-200/60 shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-stone-200/60">
                <th class="bg-stone-50 px-6 py-4 text-left font-semibold text-stone-500 w-52" />
                <th class="bg-stone-50 px-4 py-4 text-center font-semibold text-stone-400">
                  Carnet papier
                </th>
                <th class="bg-stone-50 px-4 py-4 text-center font-semibold text-stone-400">
                  Excel
                </th>
                <th class="bg-stone-50 px-4 py-4 text-center font-semibold text-stone-400">
                  Beekube
                </th>
                <th class="bg-amber-50 px-4 py-4 text-center font-bold text-amber-700">
                  <span class="flex items-center justify-center gap-1.5">
                    <UIcon name="i-lucide-hexagon" class="h-4 w-4" />
                    APIGO
                  </span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 bg-white">
              <tr
                v-for="row in rows"
                :key="row.label"
                class="transition-colors hover:bg-stone-50/50"
              >
                <td class="px-6 py-4 font-medium text-stone-700">{{ row.label }}</td>
                <td class="px-4 py-4 text-center">
                  <LandingComparisonCell :value="row.papier" />
                </td>
                <td class="px-4 py-4 text-center">
                  <LandingComparisonCell :value="row.excel" />
                </td>
                <td class="px-4 py-4 text-center">
                  <LandingComparisonCell :value="row.beekube" />
                </td>
                <td class="bg-amber-50/30 px-4 py-4 text-center">
                  <LandingComparisonCell :value="row.app360" highlight />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const rows = [
  {
    label: 'Suivi sanitaire structuré',
    papier: false,
    excel: false,
    beekube: 'Basique',
    app360: '14 catégories',
  },
  { label: 'Facturation conforme', papier: false, excel: false, beekube: false, app360: true },
  {
    label: 'Analytics rentabilité',
    papier: false,
    excel: 'Manuel',
    beekube: false,
    app360: 'Automatique',
  },
  { label: 'Mode hors-ligne', papier: true, excel: false, beekube: false, app360: true },
  {
    label: "Registre d'élevage PDF",
    papier: 'Manuel',
    excel: 'Manuel',
    beekube: false,
    app360: 'Auto-généré',
  },
  { label: 'TVA multi-taux auto', papier: false, excel: false, beekube: false, app360: true },
  { label: 'Export données (XLSX/FEC)', papier: false, excel: false, beekube: false, app360: true },
];
</script>
