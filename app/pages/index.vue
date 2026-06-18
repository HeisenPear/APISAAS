<template>
  <div>
    <LandingHeader />
    <main>
      <LandingHero />
      <!-- Mobile / terrain d'abord, puis web & finance -->
      <LandingAppPreview />
      <LandingFeatures />
      <LandingComparison />
      <LandingPricing />
      <LandingReviews />
      <LandingCompliance />
      <LandingCta />
    </main>
    <LandingFooter />
    <LandingWhatsAppButton />
  </div>
</template>

<script setup lang="ts">
import { SITE_URL } from '~/utils/seo';

definePageMeta({ layout: false });

useSeoPage({
  title: 'APIGO — Logiciel de gestion apicole tout-en-un',
  description:
    'APIGO, le logiciel de gestion apicole tout-en-un : suivi des ruches, interventions, santé des colonies, production, conformité et facturation. Mobile et web, même hors-ligne. Essai gratuit.',
  path: '/',
});

// Données structurées : entité APIGO, site et application (SEO + GEO).
useJsonLd([
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'APIGO',
    url: SITE_URL,
    logo: `${SITE_URL}/logo_apigo.webp`,
    description:
      'APIGO est un logiciel français de gestion apicole tout-en-un, du rucher à la comptabilité.',
    slogan: 'Le logiciel de gestion apicole tout-en-un',
    email: 'apigo360.apiculture@gmail.com',
    areaServed: 'FR',
    knowsAbout: [
      'apiculture',
      'gestion apicole',
      'gestion de rucher',
      'suivi des ruches',
      'santé des colonies',
      'production de miel',
      'réglementation apicole',
      'registre d’élevage',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'APIGO',
    url: SITE_URL,
    inLanguage: 'fr-FR',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'APIGO',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    inLanguage: 'fr-FR',
    description:
      'Logiciel de gestion apicole tout-en-un : suivi des ruches et interventions, santé des colonies, production de miel, stocks, conformité (registre, déclaration) et facturation. Fonctionne hors-ligne.',
    featureList: [
      'Suivi des ruches et des interventions',
      'Santé des colonies et alertes',
      'Mode hors-ligne sur le terrain',
      'Registre d’élevage et déclaration des ruches',
      'Production de miel, stocks et traçabilité des lots',
      'Ventes, clients et facturation conforme',
    ],
    url: SITE_URL,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Essai gratuit, sans carte bancaire.',
      url: `${SITE_URL}/tarifs`,
    },
  },
]);

// NB : on ne redirige PLUS un utilisateur connecté hors de la landing. La page
// d'accueil reste consultable à tout moment (comme tout site marketing) — c'est
// le header qui s'adapte (« Tableau de bord » au lieu de « Connexion »).
</script>
