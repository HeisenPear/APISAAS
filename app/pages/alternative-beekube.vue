<template>
  <div>
    <LandingHeader />
    <main class="bg-white">
      <section class="pt-32 pb-12 bg-gradient-to-b from-[#FAFAF8] to-white">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p class="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#925b0f]">
            Comparatif
          </p>
          <h1 class="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Alternative à Beekube : APIGO, le logiciel apicole tout-en-un
          </h1>
          <p class="mt-5 text-lg leading-relaxed text-stone-600">
            Vous comparez les logiciels de gestion apicole et cherchez une alternative française,
            simple et complète ? Voici ce qu’apporte APIGO.
          </p>
        </div>
      </section>

      <section class="pb-8">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 space-y-5">
          <p class="text-[17px] leading-relaxed text-stone-700">
            Beekube fait partie des logiciels de gestion apicole disponibles. Comme pour tout outil,
            le bon choix dépend de vos besoins : taille de l’exploitation, usage sur le terrain,
            conformité, gestion commerciale. Si vous recherchez une alternative
            <strong>française et tout-en-un</strong>, APIGO réunit l’ensemble de ces dimensions dans
            une seule application.
          </p>

          <h2 class="pt-4 text-2xl font-bold text-stone-900">Ce que propose APIGO</h2>
          <ul class="list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-stone-700">
            <li>
              <strong>Tout-en-un</strong> : suivi des ruches, santé des colonies, production,
              stocks, conformité et facturation dans un seul outil
            </li>
            <li>
              <strong>Hors-ligne</strong> : saisie des visites au rucher sans réseau, avec
              synchronisation automatique
            </li>
            <li>
              <strong>Conformité</strong> : registre d’élevage tenu automatiquement et déclaration
              des ruches préparée
            </li>
            <li>
              <strong>Gestion commerciale</strong> : clients, bons de livraison, traçabilité des
              lots et facturation conforme
            </li>
            <li>
              <strong>Mobile &amp; web</strong> : utilisable sur smartphone comme sur ordinateur
            </li>
            <li>
              <strong>Solution française</strong>, avec un plan gratuit sans carte et un essai Pro
              de 2 mois
            </li>
          </ul>

          <h2 class="pt-4 text-2xl font-bold text-stone-900">
            Comment choisir entre deux logiciels apicoles
          </h2>
          <p class="text-[17px] leading-relaxed text-stone-700">
            Le plus fiable reste de comparer selon <strong>vos</strong> critères et de tester. Pour
            vous faire un avis objectif sur un logiciel de gestion apicole, vérifiez la rapidité de
            saisie au quotidien, le fonctionnement hors-ligne, la gestion de la conformité
            (registre, déclaration), la partie facturation, le tarif et la qualité du support — puis
            profitez d’un essai gratuit pour juger sur pièces dans vos conditions réelles.
          </p>

          <p class="text-[17px] leading-relaxed text-stone-700">
            Pour aller plus loin, consultez notre guide
            <NuxtLink to="/meilleur-logiciel-apiculture" class="font-semibold text-[#925b0f]"
              >quel logiciel de gestion apicole choisir</NuxtLink
            >
            et la liste des
            <NuxtLink to="/utilisations" class="font-semibold text-[#925b0f]"
              >utilisations d’APIGO</NuxtLink
            >.
          </p>
        </div>
      </section>

      <!-- FAQ -->
      <section class="pb-20">
        <div class="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 class="mb-6 text-2xl font-bold text-stone-900">Questions fréquentes</h2>
          <div class="space-y-4">
            <article
              v-for="(item, i) in faq"
              :key="i"
              class="rounded-2xl border border-stone-200 bg-white p-6"
            >
              <h3 class="text-lg font-bold text-stone-900">{{ item.q }}</h3>
              <p class="mt-3 leading-relaxed text-stone-700">{{ item.r }}</p>
            </article>
          </div>

          <div class="mt-10 text-center">
            <NuxtLink
              to="/register"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3.5 text-[15px] font-bold text-[var(--text-primary)] shadow-lg transition-transform active:scale-[0.97]"
            >
              Essayer APIGO gratuitement
            </NuxtLink>
          </div>
        </div>
      </section>
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

interface QA {
  q: string;
  r: string;
}

const faq: QA[] = [
  {
    q: 'Quelle est la meilleure alternative à Beekube ?',
    r: 'Cela dépend de vos besoins. Si vous cherchez une solution française et tout-en-un, APIGO réunit le suivi des ruches, la santé des colonies, la conformité (registre, déclaration), la production et la facturation dans une seule application, avec un mode hors-ligne pensé pour le terrain. Le mieux reste de comparer selon vos critères et d’essayer APIGO gratuitement.',
  },
  {
    q: 'Beekube ou APIGO : comment choisir ?',
    r: 'Comparez sur des critères concrets : rapidité de saisie au quotidien, fonctionnement hors-ligne, gestion de la conformité, facturation, tarif et support. APIGO mise sur une approche tout-en-un et un usage simple sur le terrain. Un essai gratuit permet de juger dans vos conditions réelles, sans engagement.',
  },
  {
    q: 'APIGO propose-t-il un essai gratuit ?',
    r: "Oui. Créez un compte sur apigo.fr et utilisez gratuitement le plan Découverte, sans carte bancaire, en créant vos premiers ruchers et ruches. L'essai Pro de 2 mois nécessite d'enregistrer une carte (0 € débité avant la fin de l'essai).",
  },
  {
    q: 'Comment se faire un avis objectif sur un logiciel apicole ?',
    r: 'Le plus fiable est de tester l’outil vous-même via un essai gratuit, dans vos conditions réelles, et de consulter des avis sur des plateformes indépendantes. Vérifiez surtout les points qui comptent pour vous : terrain, conformité, facturation et support.',
  },
];

useSeoPage({
  title: 'Alternative à Beekube — APIGO, logiciel de gestion apicole | Comparatif',
  description:
    'Vous cherchez une alternative à Beekube pour gérer vos ruches ? Découvrez APIGO, le logiciel de gestion apicole français tout-en-un : suivi, conformité, facturation. Essai gratuit.',
  path: '/alternative-beekube',
});

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.r },
  })),
});
</script>
