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
            <NuxtLink to="/utilisations" class="hover:text-[#a86a13]">Utilisations</NuxtLink>
            <span class="mx-2">/</span>
            <span class="text-stone-700">{{ usage.titre }}</span>
          </nav>

          <span class="text-3xl">{{ usage.icone }}</span>
          <h1
            class="mt-3 text-3xl font-bold leading-tight tracking-tight text-stone-900 sm:text-4xl"
          >
            {{ usage.titre }}
          </h1>

          <p class="mt-6 text-[17px] leading-relaxed text-stone-700">{{ usage.intro }}</p>

          <h2 class="mt-10 text-2xl font-bold text-stone-900">Comment APIGO vous aide</h2>
          <p class="mt-3 text-[17px] leading-relaxed text-stone-700">{{ usage.commentApigo }}</p>

          <ul class="mt-5 space-y-2.5">
            <li
              v-for="(p, i) in usage.points"
              :key="i"
              class="flex items-start gap-3 text-[17px] leading-relaxed text-stone-700"
            >
              <UIcon name="i-lucide-check" class="mt-1 h-4 w-4 shrink-0 text-[#7a9676]" />
              <span>{{ p }}</span>
            </li>
          </ul>

          <p class="mt-6 text-[17px] leading-relaxed text-stone-700">{{ usage.benefice }}</p>

          <!-- FAQ -->
          <div v-if="usage.faq?.length" class="mt-10">
            <h2 class="text-2xl font-bold text-stone-900">Questions fréquentes</h2>
            <div class="mt-4 space-y-4">
              <div
                v-for="(item, i) in usage.faq"
                :key="i"
                class="rounded-2xl border border-stone-200 bg-white p-5"
              >
                <h3 class="font-bold text-stone-900">{{ item.q }}</h3>
                <p class="mt-2 leading-relaxed text-stone-700">{{ item.r }}</p>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div class="mt-12 rounded-2xl border border-stone-200 bg-[#FAFAF8] p-7 text-center">
            <p class="text-lg font-bold text-stone-900">Essayez APIGO sur votre exploitation</p>
            <p class="mt-2 text-stone-600">
              Le logiciel de gestion apicole tout-en-un, du rucher à la comptabilité. Essai gratuit,
              sans carte bancaire.
            </p>
            <NuxtLink
              to="/register"
              class="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3.5 text-[15px] font-bold text-white shadow-lg transition-transform active:scale-[0.97]"
            >
              Commencer gratuitement
            </NuxtLink>
          </div>

          <!-- Articles liés -->
          <aside v-if="articles.length" class="mt-14">
            <h2 class="text-xl font-bold text-stone-900">Pour aller plus loin</h2>
            <ul class="mt-4 space-y-2">
              <li v-for="a in articles" :key="a.slug">
                <NuxtLink
                  :to="`/blog/${a.slug}`"
                  class="font-semibold text-[#a86a13] hover:underline"
                >
                  {{ a.titre }}
                </NuxtLink>
              </li>
            </ul>
          </aside>

          <!-- Autres usages -->
          <aside class="mt-12">
            <h2 class="text-xl font-bold text-stone-900">Autres utilisations d’APIGO</h2>
            <div class="mt-4 flex flex-wrap gap-2">
              <NuxtLink
                v-for="u in autresUsages"
                :key="u.slug"
                :to="`/utilisations/${u.slug}`"
                class="rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-sm text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900"
              >
                {{ u.icone }} {{ u.titre }}
              </NuxtLink>
            </div>
          </aside>
        </div>
      </article>
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import { USAGES, getUsage } from '~/utils/usages';
import { getArticle } from '~/utils/articles';
import { SITE_URL } from '~/utils/seo';

definePageMeta({ layout: false });

const route = useRoute();
const slug = String(route.params.slug);
const usage = getUsage(slug);

if (!usage) {
  throw createError({ statusCode: 404, statusMessage: 'Page introuvable', fatal: true });
}

const articles = (usage.articlesLies ?? [])
  .map((s) => getArticle(s))
  .filter((a): a is NonNullable<typeof a> => Boolean(a));

const autresUsages = USAGES.filter((u) => u.slug !== usage.slug).slice(0, 6);

useSeoPage({
  title: `${usage.titre} | APIGO`,
  description: usage.description,
  path: `/utilisations/${usage.slug}`,
});

const blocs: Record<string, unknown>[] = [
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Utilisations', item: `${SITE_URL}/utilisations` },
      {
        '@type': 'ListItem',
        position: 3,
        name: usage.titre,
        item: `${SITE_URL}/utilisations/${usage.slug}`,
      },
    ],
  },
];

if (usage.faq?.length) {
  blocs.push({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: usage.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.r },
    })),
  });
}

useJsonLd(blocs);
</script>
