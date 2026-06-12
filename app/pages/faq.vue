<template>
  <div>
    <LandingHeader />
    <main class="bg-white">
      <section class="pt-32 pb-12 bg-gradient-to-b from-[#FAFAF8] to-white">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p class="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#a86a13]">
            Questions fréquentes
          </p>
          <h1 class="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Tout savoir sur le logiciel de gestion apicole APIGO
          </h1>
          <p class="mt-5 text-lg leading-relaxed text-stone-600">
            Les réponses aux questions que se posent les apiculteurs sur la gestion des ruches, la
            conformité, la facturation et APIGO.
          </p>
        </div>
      </section>

      <section class="pb-24">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 space-y-4">
          <article
            v-for="(item, i) in faq"
            :key="i"
            class="rounded-2xl border border-stone-200 bg-white p-6 sm:p-7"
          >
            <h2 class="text-lg font-bold text-stone-900 sm:text-xl">{{ item.q }}</h2>
            <p class="mt-3 leading-relaxed text-stone-700">{{ item.r }}</p>
          </article>
        </div>

        <div class="mx-auto mt-12 max-w-3xl px-4 sm:px-6 text-center">
          <NuxtLink
            to="/register"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3.5 text-[15px] font-bold text-white shadow-lg transition-transform active:scale-[0.97]"
          >
            Essayer APIGO gratuitement
          </NuxtLink>
          <p class="mt-3 text-sm text-stone-500">
            Une autre question ?
            <a href="mailto:apigo360.apiculture@gmail.com" class="font-semibold text-[#a86a13]"
              >Écrivez-nous</a
            >.
          </p>
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
    r: 'Le meilleur logiciel de gestion apicole est celui qui couvre tout le métier sans complexité : suivi des ruches, registre automatique, conformité et facturation, le tout utilisable sur le terrain. APIGO se distingue par son approche tout-en-un, son mode hors-ligne et une saisie de visite en quelques secondes — du rucher à la comptabilité.',
  },
  {
    q: 'Comment gérer ses ruches efficacement ?',
    r: "Gérer ses ruches efficacement, c'est observer régulièrement, noter chaque visite (reine, couvain, réserves, traitements) et savoir quelles colonies visiter en priorité. Un logiciel comme APIGO centralise ces saisies, calcule un état de santé par ruche et déclenche des alertes au bon moment, pour ne rien laisser passer.",
  },
  {
    q: 'APIGO fonctionne-t-il sans connexion internet ?',
    r: "Oui. APIGO est conçu pour le terrain : vos saisies de visites et d'interventions fonctionnent hors-ligne et se synchronisent automatiquement dès que la connexion revient. Vous n'êtes jamais bloqué au milieu d'un rucher sans réseau.",
  },
  {
    q: 'Combien coûte APIGO ?',
    r: "APIGO propose plusieurs formules selon la taille de votre exploitation, du loisir au professionnel, ainsi qu'un essai gratuit pour tester l'outil sans engagement. Le détail des tarifs est disponible sur la page Tarifs.",
  },
  {
    q: 'APIGO convient-il aux amateurs comme aux professionnels ?',
    r: "Oui. APIGO s'adresse aussi bien à l'apiculteur de loisir avec quelques ruches qu'au professionnel gérant plusieurs centaines de colonies sur de nombreux ruchers. Les fonctions de production, de traçabilité et de facturation accompagnent la montée en charge.",
  },
  {
    q: 'APIGO aide-t-il à déclarer ses ruches et à tenir le registre ?',
    r: "Oui. À partir de vos ruchers et colonies enregistrés, APIGO prépare le récapitulatif nécessaire à la déclaration annuelle obligatoire et tient automatiquement le registre d'élevage (interventions, traitements, événements sanitaires) — un vrai gain de temps et de sérénité.",
  },
  {
    q: 'Peut-on gérer la vente de miel et la facturation avec APIGO ?',
    r: 'Oui. APIGO gère les ventes, les clients, les bons de livraison, la traçabilité des lots de miel et la facturation conforme aux normes en vigueur. Toute la partie commerciale est intégrée, sans tableur séparé.',
  },
  {
    q: 'Quelle différence avec un carnet papier ou un tableur ?',
    r: "Le papier et les tableurs se perdent, ne calculent rien et ne rappellent rien. APIGO conserve l'historique de chaque colonie, calcule la santé et la rentabilité, génère le registre et les déclarations, et vous accompagne sur le terrain depuis votre mobile, même sans réseau.",
  },
  {
    q: 'APIGO est-il disponible sur mobile ?',
    r: "Oui. APIGO s'utilise depuis un navigateur sur ordinateur et s'installe comme une application sur smartphone (iPhone et Android) pour un usage rapide sur le terrain, avec le mode hors-ligne.",
  },
  {
    q: 'Comment essayer APIGO gratuitement ?',
    r: "Il suffit de créer un compte sur apigo.fr pour démarrer l'essai gratuit, sans carte bancaire. Vous pouvez créer vos premiers ruchers et ruches et tester la saisie d'interventions immédiatement.",
  },
];

useSeoPage({
  title: 'FAQ — Logiciel de gestion apicole APIGO | Questions fréquentes',
  description:
    'Toutes les réponses sur la gestion des ruches, le suivi de rucher, la conformité, la facturation et le logiciel apicole APIGO. Quel est le meilleur logiciel apiculture ?',
  path: '/faq',
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
