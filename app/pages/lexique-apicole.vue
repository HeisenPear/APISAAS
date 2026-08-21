<template>
  <div>
    <LandingHeader />
    <main class="bg-white">
      <section class="pt-32 pb-12 bg-gradient-to-b from-[#FAFAF8] to-white">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p class="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#925b0f]">
            Lexique
          </p>
          <h1 class="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Lexique apicole : les termes de l’apiculture
          </h1>
          <p class="mt-5 text-lg leading-relaxed text-stone-600">
            Les définitions essentielles pour comprendre l’apiculture : abeille, couvain, essaim,
            hausse, varroa, miellée… expliquées simplement.
          </p>
        </div>
      </section>

      <section class="pb-24">
        <div class="mx-auto max-w-3xl px-4 sm:px-6">
          <dl class="space-y-5">
            <div
              v-for="(t, i) in termes"
              :key="i"
              class="rounded-2xl border border-stone-200 bg-white p-6"
            >
              <dt class="text-lg font-bold text-stone-900">{{ t.terme }}</dt>
              <dd class="mt-2 leading-relaxed text-stone-700">{{ t.definition }}</dd>
            </div>
          </dl>

          <div class="mt-12 text-center">
            <NuxtLink to="/blog" class="font-semibold text-[#925b0f] hover:underline"
              >Lire nos guides pratiques sur l’apiculture →</NuxtLink
            >
          </div>
        </div>
      </section>
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import { SITE_URL } from '~/utils/seo';

definePageMeta({ layout: false });

interface Terme {
  terme: string;
  definition: string;
}

const termes: Terme[] = [
  {
    terme: 'Abeille',
    definition:
      "L'abeille domestique (Apis mellifera) est un insecte social qui vit en colonie et produit du miel et de la cire. Elle joue un rôle écologique majeur par la pollinisation.",
  },
  {
    terme: 'Colonie',
    definition:
      "Ensemble formé par une reine, des dizaines de milliers d'ouvrières et, en saison, des faux-bourdons. La colonie fonctionne comme un superorganisme.",
  },
  {
    terme: 'Reine',
    definition:
      "Unique femelle féconde de la colonie. Son rôle est la ponte (jusqu'à 1 500 à 2 000 œufs par jour) et la cohésion de la colonie par ses phéromones.",
  },
  {
    terme: 'Ouvrière',
    definition:
      'Femelle stérile qui assure toutes les tâches de la ruche : nettoyage, nourrissage du couvain, production de cire, garde, puis butinage en fin de vie.',
  },
  {
    terme: 'Faux-bourdon',
    definition:
      "Abeille mâle, dont l'unique fonction est de féconder une reine vierge en vol. Il ne pique pas et ne butine pas, et est chassé de la ruche à l'automne.",
  },
  {
    terme: 'Couvain',
    definition:
      'Ensemble des œufs, larves et nymphes en développement dans les cellules. Son aspect (compact ou en mosaïque) renseigne sur la qualité de la reine et la santé de la colonie.',
  },
  {
    terme: 'Essaim',
    definition:
      "Groupe d'abeilles accompagnées d'une reine, qui quitte la ruche pour fonder une nouvelle colonie. Un essaim posé est généralement peu agressif.",
  },
  {
    terme: 'Essaimage',
    definition:
      "Mode de reproduction naturel de la colonie : au printemps, une colonie forte élève des cellules royales puis l'ancienne reine part avec une partie des abeilles.",
  },
  {
    terme: 'Ruche',
    definition:
      "Habitat fourni par l'apiculteur à une colonie. Les modèles les plus courants en France sont la Dadant, la Langstroth et la Warré.",
  },
  {
    terme: 'Rucher',
    definition:
      'Ensemble des ruches installées sur un même emplacement. Un apiculteur peut gérer plusieurs ruchers répartis sur un territoire.',
  },
  {
    terme: 'Corps de ruche',
    definition:
      'Étage principal de la ruche (chambre à couvain) où vivent la reine et le couvain, et où la colonie stocke ses réserves pour vivre et hiverner.',
  },
  {
    terme: 'Hausse',
    definition:
      "Étage ajouté au-dessus du corps pendant les miellées pour recevoir le miel de récolte. Une grille à reine empêche la reine d'y pondre.",
  },
  {
    terme: 'Cadre',
    definition:
      'Support amovible en bois sur lequel les abeilles bâtissent les rayons de cire pour le couvain ou les réserves. Il facilite les visites et la récolte.',
  },
  {
    terme: 'Cire',
    definition:
      "Matière produite par les glandes des jeunes ouvrières, utilisée pour bâtir les rayons. L'apiculteur la récupère aux opercules et aux vieux cadres.",
  },
  {
    terme: 'Miellée',
    definition:
      "Période durant laquelle les abeilles récoltent abondamment le nectar d'une floraison (colza, acacia, tilleul, châtaignier, lavande, tournesol…).",
  },
  {
    terme: 'Nectar',
    definition:
      'Liquide sucré sécrété par les fleurs, récolté par les butineuses et transformé en miel par déshydratation et action enzymatique.',
  },
  {
    terme: 'Butineuse',
    definition:
      "Ouvrière âgée chargée de récolter nectar, pollen, eau et propolis à l'extérieur de la ruche.",
  },
  {
    terme: 'Pollen',
    definition:
      'Source de protéines récoltée sur les fleurs sous forme de pelotes, indispensable au nourrissage du couvain.',
  },
  {
    terme: 'Propolis',
    definition:
      'Résine récoltée par les abeilles sur les bourgeons, utilisée pour assainir et calfeutrer la ruche. Elle est valorisée pour ses propriétés.',
  },
  {
    terme: 'Gelée royale',
    definition:
      'Sécrétion des jeunes ouvrières (nourrices) dont est nourrie en exclusivité la future reine, ce qui détermine sa caste.',
  },
  {
    terme: 'Varroa',
    definition:
      "Acarien parasite (Varroa destructor) présent dans toutes les colonies en France. Non maîtrisé, il affaiblit les abeilles et peut provoquer l'effondrement de la ruche.",
  },
  {
    terme: 'Opercule',
    definition:
      'Fine pellicule de cire qui ferme une cellule de couvain operculé ou une alvéole de miel mûr. Le miel operculé est prêt à récolter.',
  },
  {
    terme: 'Nourrissement',
    definition:
      "Apport de nourriture (sirop ou candi) pour stimuler la ponte avant une miellée ou compléter les réserves avant l'hiver.",
  },
  {
    terme: 'Transhumance',
    definition:
      'Déplacement des ruches pour suivre les miellées ou assurer la pollinisation de cultures. Elle se pratique de nuit, ruches fermées et ventilées.',
  },
  {
    terme: 'Hivernage',
    definition:
      "Période hivernale durant laquelle la colonie forme une grappe et consomme ses réserves. Sa préparation (varroa maîtrisé, réserves suffisantes) se joue dès la fin de l'été.",
  },
];

useSeoPage({
  title: 'Lexique apicole — Définitions des termes de l’apiculture | APIGO',
  description:
    "Lexique de l'apiculture : définitions claires d'abeille, couvain, essaim, hausse, varroa, miellée, propolis, transhumance et tous les termes utiles aux apiculteurs.",
  path: '/lexique-apicole',
});

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  name: 'Lexique apicole',
  description: "Définitions des principaux termes de l'apiculture.",
  url: `${SITE_URL}/lexique-apicole`,
  inLanguage: 'fr-FR',
  hasDefinedTerm: termes.map((t) => ({
    '@type': 'DefinedTerm',
    name: t.terme,
    description: t.definition,
  })),
});
</script>
