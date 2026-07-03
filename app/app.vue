<template>
  <UApp>
    <NuxtLoadingIndicator :height="2" color="var(--honey)" :throttle="150" :duration="3000" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <AnalyticsConsent />
      <!-- Vercel Web Analytics (sans cookie) : monté UNIQUEMENT après consentement,
           comme PostHog — aucun traceur avant le choix de l'utilisateur (RGPD/CNIL). -->
      <Analytics v-if="analyticsGranted" />
    </ClientOnly>
  </UApp>
</template>

<script setup lang="ts">
import { Analytics } from '@vercel/analytics/vue';

const { isGranted: analyticsGranted } = useAnalyticsConsent();
</script>
