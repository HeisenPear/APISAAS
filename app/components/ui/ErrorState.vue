<!--
  ErrorState — état d'erreur réutilisable pour les listes / dashboards.
  Affiche un message lisible (via getApiErrorMessage) + un bouton « Réessayer ».
  Usage :
    <UiErrorState v-if="error" :error="error" :retry="refresh" />
    <template v-else> …contenu… </template>
-->
<template>
  <div
    class="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-[var(--border-default)] bg-white px-6 py-12 text-center"
  >
    <div
      class="flex h-12 w-12 items-center justify-center rounded-full"
      style="background: var(--clay-soft)"
    >
      <UIcon name="i-lucide-cloud-off" class="h-6 w-6" style="color: var(--clay-deep)" />
    </div>
    <div>
      <p class="text-[15px] font-semibold" style="color: var(--text-primary)">{{ titre }}</p>
      <p class="mt-1 max-w-sm text-[13px]" style="color: var(--text-tertiary)">{{ message }}</p>
    </div>
    <UButton
      v-if="retry"
      icon="i-lucide-refresh-cw"
      color="neutral"
      variant="soft"
      size="sm"
      :loading="retrying"
      @click="handleRetry"
    >
      Réessayer
    </UButton>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    error?: unknown;
    titre?: string;
    retry?: () => unknown | Promise<unknown>;
  }>(),
  { titre: 'Chargement impossible', error: undefined, retry: undefined },
);

const message = computed(() =>
  getApiErrorMessage(props.error, 'Impossible de charger ces données pour le moment.'),
);

const retrying = ref(false);
async function handleRetry(): Promise<void> {
  if (!props.retry) return;
  retrying.value = true;
  try {
    await props.retry();
  } finally {
    retrying.value = false;
  }
}
</script>
