<template>
  <Transition name="consent-slide">
    <div
      v-if="!hasAnswered"
      class="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-xl rounded-[16px] border bg-white p-5 shadow-xl md:left-auto md:right-6 md:w-[420px]"
      style="border-color: var(--border-default)"
    >
      <div class="flex items-start gap-3">
        <div
          class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
          style="background: var(--honey-soft)"
        >
          <UIcon name="i-lucide-bar-chart-2" class="h-4 w-4" style="color: var(--honey)" />
        </div>
        <div class="flex-1">
          <p class="text-[14px] font-semibold" style="color: var(--text-primary)">
            Améliorer APIGO avec vos usages
          </p>
          <p class="mt-1 text-[12.5px] leading-relaxed" style="color: var(--text-secondary)">
            On utilise PostHog (hébergé en UE) pour mesurer l'usage et corriger les bugs. Aucun
            tracking publicitaire. Données anonymisées, jamais vendues.
          </p>
          <div class="mt-3 flex items-center gap-2">
            <UButton size="sm" color="primary" @click="handleGrant">Accepter</UButton>
            <!-- « Refuser » aussi visible qu'« Accepter » (exigence CNIL : refuser
                 doit être aussi simple qu'accepter). Même taille, bouton à part entière. -->
            <UButton size="sm" color="neutral" variant="outline" @click="handleDeny">
              Refuser
            </UButton>
            <NuxtLink
              to="/politique-confidentialite"
              class="ml-auto text-[11px] underline"
              style="color: var(--text-tertiary)"
            >
              En savoir plus
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { hasAnswered, grant, deny } = useAnalyticsConsent();
const posthog = usePostHog();

function handleGrant() {
  grant();
  posthog?.opt_in_capturing();
  // Pas de startSessionRecording() : le replay est désactivé dans la config
  // (disable_session_recording) — le forcer chargeait posthog-recorder.js,
  // systématiquement bloqué par les ad-blockers → erreur console à chaque page.
}

function handleDeny() {
  deny();
  posthog?.opt_out_capturing();
}
</script>

<style scoped>
.consent-slide-enter-active,
.consent-slide-leave-active {
  transition:
    opacity 250ms ease-out,
    transform 250ms ease-out;
}
.consent-slide-enter-from,
.consent-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
