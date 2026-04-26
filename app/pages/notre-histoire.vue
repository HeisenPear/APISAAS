<template>
  <div>
    <LandingHeader />
    <main class="bg-white">
      <!-- Hero section -->
      <section class="pt-32 pb-20 bg-gradient-to-b from-[#FAFAF8] to-white">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h1 class="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            APIGO est née d'un terrain de ruches, pas d'un bureau
          </h1>
          <p class="mt-6 text-xl text-stone-600">
            L'histoire de La Jocondienne et de la conviction qu'un outil professionnel pouvait
            changer le quotidien des apiculteurs.
          </p>
        </div>
      </section>

      <!-- Story sections -->
      <section class="py-20 sm:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 space-y-16">
          <!-- Section 1 -->
          <div class="prose prose-stone max-w-none">
            <h2 class="text-2xl font-bold text-stone-900">D'une passion à un problème concret</h2>
            <p class="text-lg leading-relaxed text-stone-700">
              Comme beaucoup d'apiculteurs professionnels, nous avons longtemps jonglé entre des
              carnets papier, des tableurs Excel et des applications pensées pour des hobbyistes.
              Gérer 150 ruches réparties sur une dizaine de ruchers, c'est une logistique
              quotidienne — et aucun outil ne nous correspondait vraiment.
            </p>
          </div>

          <!-- Section 2 -->
          <div class="prose prose-stone max-w-none">
            <h2 class="text-2xl font-bold text-stone-900">L'idée d'APIGO</h2>
            <p class="text-lg leading-relaxed text-stone-700">
              APIGO est né de cette frustration. L'idée : créer un véritable ERP pensé pour
              l'apiculture professionnelle. Pas juste un carnet de ruches numérique — mais un outil
              qui gère les interventions, la facturation, la traçabilité sanitaire, les déclarations
              réglementaires et le suivi financier par rucher.
            </p>
          </div>

          <!-- Section 3 -->
          <div class="prose prose-stone max-w-none">
            <h2 class="text-2xl font-bold text-stone-900">
              La Jocondienne, une entreprise du Centre-Val de Loire
            </h2>
            <p class="text-lg leading-relaxed text-stone-700">
              Ancrée dans la région Centre-Val de Loire, La Jocondienne porte ce projet avec une
              conviction simple : les apiculteurs professionnels méritent un outil à la hauteur de
              leur métier. Nous travaillons en contact direct avec des professionnels de toute la
              France — Bretagne, Occitanie, Auvergne, Normandie — pour que chaque mise à jour
              corresponde à une vraie réalité de terrain.
            </p>
          </div>

          <!-- Section 4 -->
          <div class="prose prose-stone max-w-none">
            <h2 class="text-2xl font-bold text-stone-900">Aujourd'hui et demain</h2>
            <p class="text-lg leading-relaxed text-stone-700">
              APIGO est en phase beta active. Chaque retour utilisateur compte. Notre feuille de
              route est construite avec ceux qui utilisent l'outil au quotidien — et nous en sommes
              fiers.
            </p>
          </div>
        </div>
      </section>

      <!-- Stats section -->
      <section class="py-20 sm:py-28 bg-[#FAFAF8]">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
          <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div class="text-center">
              <p class="text-4xl font-bold text-amber-500">23+</p>
              <p class="mt-2 text-sm font-medium text-stone-600">sessions de développement</p>
            </div>
            <div class="text-center">
              <p class="text-4xl font-bold text-amber-500">30+</p>
              <p class="mt-2 text-sm font-medium text-stone-600">tables de données</p>
            </div>
            <div class="text-center">
              <p class="text-4xl font-bold text-amber-500">100%</p>
              <p class="mt-2 text-sm font-medium text-stone-600">bêta active</p>
            </div>
            <div class="text-center">
              <p class="text-4xl font-bold text-amber-500">🇫🇷</p>
              <p class="mt-2 text-sm font-medium text-stone-600">France entière</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA section -->
      <section class="py-20 sm:py-28 bg-white">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 class="text-3xl font-bold text-stone-900">Prêt à faire partie de l'aventure ?</h2>
          <p class="mt-4 text-lg text-stone-600">
            Rejoignez les apiculteurs qui transforment leur métier avec APIGO.
          </p>
          <div class="mt-8 flex gap-4 justify-center flex-col sm:flex-row">
            <NuxtLink
              to="/register"
              class="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-amber-200 transition-all duration-200 hover:bg-amber-600 hover:shadow-xl hover:shadow-amber-200 hover:-translate-y-0.5"
            >
              <UIcon name="i-lucide-zap" class="h-5 w-5" />
              Rejoindre la bêta
            </NuxtLink>
            <NuxtLink
              to="/"
              class="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-8 py-4 text-base font-semibold text-stone-700 shadow-sm transition-all duration-200 hover:bg-stone-50 hover:shadow-md"
            >
              Retour à l'accueil
              <UIcon name="i-lucide-arrow-right" class="h-5 w-5 text-stone-400" />
            </NuxtLink>
          </div>
        </div>
      </section>
    </main>
    <LandingFooter />
    <LandingWhatsAppButton />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

useHead({
  title: 'Notre histoire — APIGO',
  meta: [
    {
      name: 'description',
      content:
        "Découvrez l'histoire d'APIGO et de La Jocondienne, née du terrain pour servir les apiculteurs professionnels.",
    },
  ],
});
</script>
