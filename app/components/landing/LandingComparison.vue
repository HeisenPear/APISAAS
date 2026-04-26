<template>
  <section class="bg-[#FAFAF8] py-20 sm:py-28">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Section header -->
      <div class="mx-auto mb-16 max-w-2xl text-center">
        <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-500">
          Fonctionnalités clés
        </p>
        <h2 class="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Tout ce dont un apiculteur professionnel a besoin
        </h2>
        <p class="mt-4 text-lg text-stone-500">
          Un outil construit par des apiculteurs, pour les apiculteurs. Chaque fonctionnalité répond
          à un vrai besoin du terrain.
        </p>
      </div>

      <!-- Features grid -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.id"
          class="flex flex-col rounded-2xl border border-stone-200/60 bg-white p-6 hover:shadow-md transition-shadow"
        >
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
            <UIcon :name="feature.icon" class="h-6 w-6 text-amber-600" />
          </div>
          <h3 class="mb-2 text-lg font-bold text-stone-900">{{ feature.title }}</h3>
          <p class="text-sm text-stone-500">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    id: 1,
    icon: 'i-lucide-clipboard-list',
    title: 'Suivi sanitaire structuré',
    description: "14 types d'interventions catégorisées, conformes aux standards apicoles.",
  },
  {
    id: 2,
    icon: 'i-lucide-file-text',
    title: 'Facturation électronique 2026',
    description: 'Format Factur-X, conforme aux déclarations réglementaires actuelles et futures.',
  },
  {
    id: 3,
    icon: 'i-lucide-pie-chart',
    title: 'Analytics rentabilité',
    description: 'Suivi automatique du coût par rucher, analyse de la rentabilité et tendances.',
  },
  {
    id: 4,
    icon: 'i-lucide-wifi-off',
    title: 'Mode hors-ligne',
    description: 'Travaillez au rucher sans connexion internet, synchronisation automatique.',
  },
  {
    id: 5,
    icon: 'i-lucide-book',
    title: "Registre d'élevage PDF",
    description: 'Auto-généré et conforme aux normes sanitaires officielles.',
  },
  {
    id: 6,
    icon: 'i-lucide-download',
    title: 'Export données',
    description: 'XLSX, FEC, CSV — migrez ou analysez vos données comme bon vous semble.',
  },
];
</script>
