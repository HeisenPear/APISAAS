<template>
  <section class="bg-white py-12 sm:py-20 md:py-28">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Section header -->
      <div class="mx-auto mb-12 md:mb-16 max-w-2xl text-center">
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-500">
          Avis clients
        </p>
        <h2 class="text-xl font-bold tracking-tight text-stone-900 sm:text-3xl md:text-4xl">
          Ils utilisent APIGO
        </h2>
        <p class="mt-4 text-sm sm:text-lg text-stone-500">
          Des apiculteurs de toute la France qui ont choisi APIGO pour gérer leur exploitation.
        </p>
      </div>

      <!-- Reviews grid -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="flex flex-col rounded-2xl border border-stone-200/60 bg-stone-50/50 p-6 hover:shadow-md transition-shadow"
        >
          <!-- Stars -->
          <div class="mb-3 flex gap-1">
            <UIcon
              v-for="i in 5"
              :key="i"
              name="i-lucide-star"
              class="h-4 w-4 fill-amber-400 text-amber-400"
            />
          </div>

          <!-- Review text -->
          <p class="flex-1 text-sm leading-relaxed text-stone-700">{{ review.text }}</p>

          <!-- Author -->
          <div class="mt-4 pt-4 border-t border-stone-200/60">
            <p class="font-medium text-stone-900">— {{ review.name }}</p>
            <p class="text-xs text-stone-500">{{ review.region }} · {{ review.hives }} ruches</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const reviews = [
  {
    id: 1,
    text: "Enfin un outil fait par des apiculteurs pour des apiculteurs. La gestion des ruchers et le suivi sanitaire m'ont fait gagner un temps précieux.",
    name: 'Jean-Pierre M.',
    region: 'Occitanie',
    hives: '120',
  },
  {
    id: 2,
    text: 'Le QR code sur chaque ruche change tout sur le terrain. Plus besoin de chercher la fiche, tout est là en 2 secondes.',
    name: 'Sophie L.',
    region: 'Bretagne',
    hives: '85',
  },
  {
    id: 3,
    text: "La facturation automatique m'a évité des heures de saisie. Je recommande sans hésiter.",
    name: 'Marc D.',
    region: 'Auvergne-Rhône-Alpes',
    hives: '210',
  },
  {
    id: 4,
    text: "Interface claire, support réactif. On sent que l'équipe connaît le métier.",
    name: 'Claire B.',
    region: 'Nouvelle-Aquitaine',
    hives: '60',
  },
  {
    id: 5,
    text: "J'ai migré depuis un tablier Excel. La différence est énorme, surtout pour la déclaration de ruchers.",
    name: 'Thierry V.',
    region: 'Normandie',
    hives: '150',
  },
  {
    id: 6,
    text: "Support réactif et à l'écoute des besoins des apiculteurs. APIGO évolue vraiment avec nous.",
    name: 'Nathalie P.',
    region: 'Provence',
    hives: '95',
  },
];
</script>
