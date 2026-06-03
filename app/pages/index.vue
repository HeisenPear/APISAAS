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
definePageMeta({ layout: false });

useHead({
  title: 'APIGO — Logiciel de gestion apicole tout-en-un',
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
  ogTitle: 'APIGO — Logiciel de gestion apicole',
  ogDescription:
    'Suivez et pilotez vos ruches depuis le terrain, même sans réseau. Interventions, santé des colonies, conformité et facturation — tout en un.',
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
