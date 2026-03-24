<template>
  <div>
    <LandingHeader />
    <main>
      <LandingHero />
      <LandingFeatures />
      <LandingAppPreview />
      <LandingComparison />
      <LandingPricing />
      <LandingCompliance />
      <LandingCta />
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

useHead({
  title: 'Apiculture 360° — Logiciel de gestion apicole tout-en-un',
  meta: [
    {
      name: 'description',
      content:
        'Gérez vos ruches, interventions, production et comptabilité dans un seul outil. Mode hors-ligne, facturation conforme, analytics intelligents. Essai gratuit 14 jours.',
    },
    {
      name: 'keywords',
      content:
        'logiciel apiculture, gestion rucher, suivi ruches, registre élevage apicole, facturation apiculteur, comptabilité apicole, SaaS apiculture',
    },
  ],
});

useSeoMeta({
  ogTitle: 'Apiculture 360° — Logiciel de gestion apicole',
  ogDescription:
    "Du rucher à la comptabilité. 14 types d'interventions, analytics, facturation conforme. Essai gratuit.",
  ogImage: '/og-image.jpg',
  ogType: 'website',
  ogLocale: 'fr_FR',
});

// Si l'utilisateur est déjà connecté, rediriger vers le dashboard
const user = useSupabaseUser();
if (import.meta.client && user.value) {
  navigateTo('/dashboard');
}
</script>
