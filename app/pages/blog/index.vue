<template>
  <div>
    <LandingHeader />
    <main class="bg-white">
      <section class="pt-32 pb-12 bg-gradient-to-b from-[#FAFAF8] to-white">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <p class="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#925b0f]">
            Ressources & guides
          </p>
          <h1 class="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Le blog APIGO : gestion apicole & conduite du rucher
          </h1>
          <p class="mt-5 text-lg leading-relaxed text-stone-600">
            Conseils pratiques pour gérer ses ruches, débuter en apiculture, traiter le varroa,
            déclarer ses colonies et choisir son logiciel apicole.
          </p>
        </div>
      </section>

      <section class="pb-24">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 grid gap-6 sm:grid-cols-2">
          <NuxtLink
            v-for="a in articles"
            :key="a.slug"
            :to="`/blog/${a.slug}`"
            class="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <p class="text-xs font-semibold uppercase tracking-wide text-[#925b0f]">
              {{ a.lectureMin }} min de lecture
            </p>
            <h2
              class="mt-2 text-xl font-bold leading-snug text-stone-900 group-hover:text-[#925b0f]"
            >
              {{ a.titre }}
            </h2>
            <p class="mt-3 flex-1 leading-relaxed text-stone-600">{{ a.extrait }}</p>
            <span class="mt-4 text-sm font-semibold text-[#925b0f]">Lire l’article →</span>
          </NuxtLink>
        </div>
      </section>
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import { ARTICLES } from '~/utils/articles';
import { SITE_URL } from '~/utils/seo';

definePageMeta({ layout: false });

const articles = [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));

useSeoPage({
  title: 'Blog APIGO — Gestion apicole, conduite du rucher & conseils',
  description:
    'Guides et ressources pour apiculteurs : gérer ses ruches, débuter en apiculture, traiter le varroa, déclarer ses ruches, choisir un logiciel de gestion apicole.',
  path: '/blog',
});

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Blog APIGO',
  description:
    'Ressources et conseils de gestion apicole pour apiculteurs amateurs et professionnels.',
  url: `${SITE_URL}/blog`,
  blogPost: articles.map((a) => ({
    '@type': 'BlogPosting',
    headline: a.titre,
    description: a.description,
    datePublished: a.date,
    url: `${SITE_URL}/blog/${a.slug}`,
  })),
});
</script>
