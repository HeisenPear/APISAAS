<template>
  <div>
    <LandingHeader />
    <main class="bg-white">
      <section class="pt-32 pb-12 bg-gradient-to-b from-[#FAFAF8] to-white">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p class="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#9f6412]">
            Utilisations
          </p>
          <h1 class="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            À quoi sert APIGO ? Tous les usages du logiciel apicole
          </h1>
          <p class="mt-5 text-lg leading-relaxed text-stone-600">
            Suivi des ruches, registre d’élevage, déclaration, facturation, traçabilité du miel,
            transhumance… Découvrez comment les apiculteurs utilisent APIGO au quotidien.
          </p>
        </div>
      </section>

      <section class="pb-24">
        <div class="mx-auto max-w-5xl px-4 sm:px-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="u in usages"
            :key="u.slug"
            :to="`/utilisations/${u.slug}`"
            class="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span class="text-2xl">{{ u.icone }}</span>
            <h2
              class="mt-3 text-lg font-bold leading-snug text-stone-900 group-hover:text-[#9f6412]"
            >
              {{ u.titre }}
            </h2>
            <p class="mt-2 flex-1 text-sm leading-relaxed text-stone-600">{{ u.accroche }}</p>
            <span class="mt-4 text-sm font-semibold text-[#9f6412]">En savoir plus →</span>
          </NuxtLink>
        </div>
      </section>
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import { USAGES } from '~/utils/usages';
import { SITE_URL } from '~/utils/seo';

definePageMeta({ layout: false });

const usages = USAGES;

useSeoPage({
  title: 'Utilisations d’APIGO — à quoi sert le logiciel de gestion apicole',
  description:
    'Découvrez tous les usages d’APIGO : suivi des ruches, registre d’élevage, déclaration, facturation, comptabilité, stocks, traçabilité du miel, transhumance, élevage de reines.',
  path: '/utilisations',
});

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Utilisations d’APIGO',
  itemListElement: usages.map((u, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: u.titre,
    url: `${SITE_URL}/utilisations/${u.slug}`,
  })),
});
</script>
