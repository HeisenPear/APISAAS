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
        </div>
      </section>

      <!-- Story sections -->
      <section class="py-20 sm:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 space-y-16">
          <!-- Section 1 -->
          <div class="prose prose-stone max-w-none">
            <h2 class="text-2xl font-bold text-stone-900">D'une passion à un problème concret</h2>
            <p class="text-lg leading-relaxed text-stone-700">
              En travaillant aux côtés d'apiculteurs professionnels, nous avons rapidement compris
              leur quotidien : des carnets papier, des tableurs bricolés, des applications pensées
              pour les hobbyistes. Gérer 150 ruches réparties sur une dizaine de ruchers, c'est une
              logistique sérieuse — et les outils disponibles n'étaient pas à la hauteur du métier.
            </p>
          </div>

          <!-- Section 2 -->
          <div class="prose prose-stone max-w-none">
            <h2 class="text-2xl font-bold text-stone-900">L'idée d'APIGO</h2>
            <p class="text-lg leading-relaxed text-stone-700">
              APIGO est né de ces échanges. Pas d'un bureau, pas d'une idée abstraite — mais de
              conversations concrètes avec des professionnels qui nous ont décrit, heure par heure,
              ce que leur coûtait l'absence d'un vrai outil. L'ambition : construire un véritable
              ERP pensé pour l'apiculture professionnelle. Pas juste un carnet de ruches numérique —
              un outil qui gère les interventions, la facturation, la traçabilité sanitaire, les
              déclarations réglementaires et le suivi financier par rucher.
            </p>
          </div>

          <!-- Section 3 -->
          <div class="prose prose-stone max-w-none">
            <h2 class="text-2xl font-bold text-stone-900">Aujourd'hui et demain</h2>
            <p class="text-lg leading-relaxed text-stone-700">
              APIGO est co-construite avec les apiculteurs qui l'utilisent au quotidien. Chaque
              retour terrain façonne la feuille de route. C'est ce lien direct — entre ceux qui
              développent et ceux qui travaillent en rucher — qui fait la différence.
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
              <p class="mt-2 text-sm font-medium text-stone-600">données hébergées en France</p>
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
              Commencer gratuitement
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
    <LandingFacebookButton />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

useSeoPage({
  title: 'Notre histoire — APIGO, le logiciel apicole né du terrain',
  description:
    "Découvrez l'histoire d'APIGO : un logiciel de gestion apicole né du terrain, aux côtés des apiculteurs professionnels, pour remplacer carnets papier et tableurs.",
  path: '/notre-histoire',
});
</script>
