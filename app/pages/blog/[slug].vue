<template>
  <div>
    <LandingHeader />
    <main class="bg-white">
      <article class="pt-32 pb-24">
        <div class="mx-auto max-w-3xl px-4 sm:px-6">
          <!-- Fil d'Ariane -->
          <nav class="mb-6 text-sm text-stone-500" aria-label="Fil d'Ariane">
            <NuxtLink to="/" class="hover:text-[#a86a13]">Accueil</NuxtLink>
            <span class="mx-2">/</span>
            <NuxtLink to="/blog" class="hover:text-[#a86a13]">Blog</NuxtLink>
            <span class="mx-2">/</span>
            <span class="text-stone-700">{{ article.titre }}</span>
          </nav>

          <p class="text-xs font-semibold uppercase tracking-wide text-[#a86a13]">
            {{ dateFr }} · {{ article.lectureMin }} min
          </p>
          <h1
            class="mt-2 text-3xl font-bold leading-tight tracking-tight text-stone-900 sm:text-4xl"
          >
            {{ article.titre }}
          </h1>
          <p class="mt-5 text-lg leading-relaxed text-stone-600">{{ article.extrait }}</p>

          <div class="mt-10 space-y-5">
            <template v-for="(bloc, i) in article.contenu" :key="i">
              <h2 v-if="bloc.type === 'h2'" class="text-2xl font-bold text-stone-900 pt-4">
                {{ bloc.texte }}
              </h2>
              <p v-else-if="bloc.type === 'p'" class="text-[17px] leading-relaxed text-stone-700">
                {{ bloc.texte }}
              </p>
              <ul
                v-else-if="bloc.type === 'ul'"
                class="list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-stone-700"
              >
                <li v-for="(it, j) in bloc.items" :key="j">{{ it }}</li>
              </ul>
            </template>
          </div>

          <!-- CTA -->
          <div class="mt-12 rounded-2xl border border-stone-200 bg-[#FAFAF8] p-7 text-center">
            <p class="text-lg font-bold text-stone-900">Gérez vos ruches simplement avec APIGO</p>
            <p class="mt-2 text-stone-600">
              Le logiciel de gestion apicole tout-en-un, du rucher à la comptabilité. Essai gratuit.
            </p>
            <NuxtLink
              to="/register"
              class="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3.5 text-[15px] font-bold text-white shadow-lg transition-transform active:scale-[0.97]"
            >
              Commencer gratuitement
            </NuxtLink>
          </div>

          <!-- Autres articles -->
          <aside v-if="autres.length" class="mt-14">
            <h2 class="text-xl font-bold text-stone-900">À lire aussi</h2>
            <ul class="mt-4 space-y-2">
              <li v-for="a in autres" :key="a.slug">
                <NuxtLink
                  :to="`/blog/${a.slug}`"
                  class="font-semibold text-[#a86a13] hover:underline"
                >
                  {{ a.titre }}
                </NuxtLink>
              </li>
            </ul>
          </aside>
        </div>
      </article>
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import { ARTICLES, getArticle } from '~/utils/articles';
import { SITE_URL } from '~/utils/seo';

definePageMeta({ layout: false });

const route = useRoute();
const slug = String(route.params.slug);
const article = getArticle(slug);

if (!article) {
  throw createError({ statusCode: 404, statusMessage: 'Article introuvable', fatal: true });
}

const dateFr = new Date(article.date).toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const autres = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);

useSeoPage({
  title: `${article.titre} | Blog APIGO`,
  description: article.description,
  path: `/blog/${article.slug}`,
  type: 'article',
});

const blocsJsonLd: Record<string, unknown>[] = [
  {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.titre,
    description: article.description,
    datePublished: article.date,
    dateModified: article.miseAJour ?? article.date,
    inLanguage: 'fr-FR',
    keywords: article.motsCles.join(', '),
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${article.slug}` },
    author: { '@type': 'Organization', name: 'APIGO', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'APIGO',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo_apigo.webp` },
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.titre,
        item: `${SITE_URL}/blog/${article.slug}`,
      },
    ],
  },
];

// Guides procéduraux : schema HowTo (étapes) — très repris par les IA.
if (article.etapes?.length) {
  blocsJsonLd.push({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: article.titre,
    description: article.description,
    inLanguage: 'fr-FR',
    step: article.etapes.map((e, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: e.nom,
      text: e.texte,
    })),
  });
}

useJsonLd(blocsJsonLd);
</script>
