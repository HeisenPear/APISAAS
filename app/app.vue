<template>
  <UApp>
    <NuxtLoadingIndicator :height="2" color="var(--honey)" :throttle="150" :duration="3000" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AnalyticsConsent />
  </UApp>
</template>
