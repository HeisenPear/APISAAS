<template>
  <div>
    <LandingHeader />
    <main class="bg-white">
      <section class="pt-32 pb-12 bg-gradient-to-b from-[#FAFAF8] to-white">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p class="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#a86a13]">
            Guide d’achat
          </p>
          <h1 class="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Quel logiciel de gestion apicole choisir ?
          </h1>
          <p class="mt-5 text-lg leading-relaxed text-stone-600">
            Carnet papier, tableur ou logiciel dédié : comment choisir le bon outil pour gérer ses
            ruches, et pourquoi APIGO est une alternative française tout-en-un.
          </p>
        </div>
      </section>

      <section class="pb-8">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 space-y-5">
          <p class="text-[17px] leading-relaxed text-stone-700">
            Gérer ses ruches demande de jongler entre le suivi des colonies, la conformité
            réglementaire, la production et la vente. Les apiculteurs s’appuient encore souvent sur
            des carnets papier ou des tableurs bricolés — pratiques au début, vite limités ensuite.
            Un bon logiciel de gestion apicole change la donne : il centralise tout et vous suit
            jusque sur le terrain.
          </p>

          <h2 class="pt-4 text-2xl font-bold text-stone-900">
            Les critères d’un bon logiciel apicole
          </h2>
          <ul class="list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-stone-700">
            <li>Saisie rapide des visites et registre d’élevage automatique</li>
            <li>Application mobile et fonctionnement hors-ligne, pour le terrain sans réseau</li>
            <li>Suivi de la santé des colonies et alertes au bon moment</li>
            <li>Production, stocks et traçabilité des lots de miel</li>
            <li>Conformité : registre et préparation de la déclaration annuelle</li>
            <li>Gestion des ventes, des clients et facturation conforme</li>
            <li>Tarif clair et essai gratuit pour juger sur pièces</li>
          </ul>

          <h2 class="pt-4 text-2xl font-bold text-stone-900">
            Carnet papier, tableur ou logiciel dédié ?
          </h2>
          <p class="text-[17px] leading-relaxed text-stone-700">
            Le carnet papier est simple mais se perd, ne calcule rien et ne rappelle rien. Le
            tableur va plus loin, mais devient vite ingérable dès qu’on multiplie ruches et ruchers,
            et n’accompagne pas sur le terrain. Un logiciel dédié, lui, conserve l’historique de
            chaque colonie, calcule la santé et la rentabilité, génère le registre et les
            déclarations, et fonctionne depuis le mobile — c’est l’option qui tient la distance
            quand l’exploitation grandit.
          </p>

          <h2 class="pt-4 text-2xl font-bold text-stone-900">
            APIGO : une alternative française tout-en-un
          </h2>
          <p class="text-[17px] leading-relaxed text-stone-700">
            APIGO réunit tous ces critères dans une seule application, du rucher à la comptabilité.
            Conçu avec et pour des apiculteurs, il permet de saisir une visite en quelques secondes,
            fonctionne hors-ligne, tient le registre et prépare la déclaration automatiquement, et
            intègre production, stocks, ventes et facturation conforme. Que vous gériez quelques
            ruches en loisir ou plusieurs centaines de colonies en professionnel, l’outil suit votre
            montée en charge.
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
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3.5 text-[15px] font-bold text-white shadow-lg transition-transform active:scale-[0.97]"
            >
              Essayer APIGO gratuitement
            </NuxtLink>
            <p class="mt-3 text-sm text-stone-500">
              Voir aussi :
              <NuxtLink to="/alternative-beekube" class="font-semibold text-[#a86a13]"
                >alternative à Beekube</NuxtLink
              >
              ·
              <NuxtLink to="/utilisations" class="font-semibold text-[#a86a13]"
                >utilisations</NuxtLink
              >
              ·
              <NuxtLink to="/tarifs" class="font-semibold text-[#a86a13]">tarifs</NuxtLink>
            </p>
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
    q: 'Quel est le meilleur logiciel de gestion apicole ?',
    r: 'Le meilleur logiciel de gestion apicole est celui qui couvre tout le métier sans complexité : suivi des ruches, registre automatique, conformité, production et facturation, le tout utilisable sur le terrain. APIGO se distingue par son approche tout-en-un, son mode hors-ligne et une prise en main immédiate.',
  },
  {
    q: 'Existe-t-il une alternative tout-en-un aux logiciels apicoles ?',
    r: 'Oui : plutôt que de cumuler un carnet, un tableur et un outil de facturation, APIGO regroupe le suivi des ruches, la conformité et la gestion commerciale dans une seule application française. C’est une alternative pensée pour simplifier le quotidien de l’apiculteur.',
  },
  {
    q: 'APIGO est-il une alternative à Beekube ?',
    r: 'APIGO est une alternative française et tout-en-un aux logiciels de gestion apicole. Sa particularité est de réunir, dans une seule application, le suivi des ruches, la santé des colonies, la conformité (registre, déclaration), la production et la facturation, avec un mode hors-ligne pensé pour le terrain. Le mieux reste de comparer les outils selon vos besoins et d’essayer APIGO gratuitement.',
  },
  {
    q: 'Vaut-il mieux un logiciel apicole gratuit ou payant ?',
    r: 'Les outils gratuits dépannent au début mais montrent vite leurs limites (pas de conformité, pas de facturation, pas de support). Un logiciel comme APIGO propose un essai gratuit pour tester sans risque, puis des formules abordables qui restent rentables dès que l’on veut gagner du temps et sécuriser sa conformité.',
  },
  {
    q: 'Quel logiciel pour un apiculteur professionnel ?',
    r: 'Un professionnel a besoin de gérer de nombreux ruchers, la traçabilité des lots, les déclarations, la facturation et le suivi financier par rucher. APIGO est conçu pour cette échelle, du suivi terrain à la comptabilité, tout en restant simple à utiliser.',
  },
];

useSeoPage({
  title: 'Meilleur logiciel de gestion apicole : comment choisir | APIGO',
  description:
    'Quel logiciel de gestion apicole choisir ? Critères, comparaison des approches (carnet, tableur, logiciel) et alternative française tout-en-un : APIGO. Essai gratuit.',
  path: '/meilleur-logiciel-apiculture',
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
