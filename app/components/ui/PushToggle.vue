<template>
  <div
    class="mb-5 flex items-start gap-3 rounded-[14px] border p-4"
    style="border-color: var(--border-default); background: var(--honey-soft)"
  >
    <div
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
      style="background: var(--honey); color: white"
    >
      <UIcon name="i-lucide-bell-ring" class="h-4.5 w-4.5" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-[14px] font-semibold" style="color: var(--text-primary)">Notifications push</p>
      <p class="mt-0.5 text-[12.5px]" style="color: var(--text-secondary)">
        Recevez les alertes santé, varroa et stock directement sur cet appareil — gratuit, sans
        email.
      </p>

      <!-- Non supporté -->
      <p v-if="!supported" class="mt-2 text-[12px]" style="color: var(--text-tertiary)">
        Non disponible sur ce navigateur. Sur iPhone, installez d'abord APIGO sur l'écran d'accueil.
      </p>

      <!-- Permission refusée -->
      <p
        v-else-if="permission === 'denied'"
        class="mt-2 text-[12px]"
        style="color: var(--status-bad)"
      >
        Notifications bloquées dans les réglages du navigateur. Réactivez-les pour cet appareil.
      </p>

      <!-- Actions -->
      <div v-else class="mt-3 flex flex-wrap items-center gap-2">
        <button
          v-if="!subscribed"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-2 text-[13px] font-semibold text-white transition-opacity disabled:opacity-60"
          style="background: var(--honey)"
          :disabled="loading"
          @click="onEnable"
        >
          <UIcon v-if="loading" name="i-lucide-loader-2" class="h-3.5 w-3.5 animate-spin" />
          <UIcon v-else name="i-lucide-bell" class="h-3.5 w-3.5" />
          Activer sur cet appareil
        </button>

        <template v-else>
          <span
            class="inline-flex items-center gap-1.5 rounded-[9px] px-3 py-2 text-[13px] font-semibold"
            style="background: #f9efe3; color: #7d5220"
          >
            <UIcon name="i-lucide-check-circle" class="h-3.5 w-3.5" />
            Activées
          </span>
          <button
            type="button"
            class="rounded-[9px] border px-3 py-2 text-[12.5px] font-medium transition-colors"
            style="border-color: var(--border-default); color: var(--text-secondary)"
            @click="onTest"
          >
            Envoyer un test
          </button>
          <button
            type="button"
            class="rounded-[9px] px-2 py-2 text-[12.5px] font-medium transition-colors"
            style="color: var(--text-tertiary)"
            :disabled="loading"
            @click="disable"
          >
            Désactiver
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { supported, permission, subscribed, loading, enable, disable, sendTest } = useWebPush();
const toast = useToast();

async function onEnable() {
  const ok = await enable();
  if (ok) toast.add({ title: 'Notifications activées', color: 'success' });
  else if (permission.value === 'denied')
    toast.add({ title: 'Notifications bloquées par le navigateur', color: 'error' });
  else toast.add({ title: "Impossible d'activer les notifications", color: 'error' });
}

async function onTest() {
  const ok = await sendTest();
  toast.add({
    title: ok ? 'Notification de test envoyée' : "Échec de l'envoi du test",
    color: ok ? 'success' : 'error',
  });
}
</script>
