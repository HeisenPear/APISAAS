<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-200 ease-in"
    enter-from-class="translate-y-full opacity-0"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="showPrompt"
      class="fixed left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-amber-200 bg-white p-4 shadow-xl sm:left-auto sm:right-6 sm:w-96"
      style="bottom: max(1rem, calc(var(--bottom-nav-height, 0px) + 0.75rem))"
    >
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <UIcon name="i-lucide-download" class="h-5 w-5 text-amber-600" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-stone-900">Installer APIGO</p>
          <p class="mt-0.5 text-xs text-stone-500">
            Accès rapide depuis l'écran d'accueil, même hors connexion
          </p>
          <div class="mt-3 flex items-center gap-2">
            <UButton label="Installer" size="sm" color="primary" @click="handleInstall" />
            <UButton label="Plus tard" size="sm" variant="ghost" color="neutral" @click="dismiss" />
          </div>
        </div>
        <button class="shrink-0 text-stone-400 hover:text-stone-600" @click="dismiss">
          <UIcon name="i-lucide-x" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const showPrompt = ref(false);
const DISMISS_KEY = 'apigo_pwa_dismiss';

let showTimeout: ReturnType<typeof setTimeout> | null = null;

function onBeforeInstallPrompt(e: Event) {
  e.preventDefault();
  deferredPrompt.value = e as BeforeInstallPromptEvent;
  // Delay showing prompt by 30s so user isn't interrupted immediately
  if (showTimeout) clearTimeout(showTimeout);
  showTimeout = setTimeout(() => {
    showPrompt.value = true;
  }, 30000);
}

onMounted(() => {
  // Don't show if already dismissed recently (7 days)
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
});

onUnmounted(() => {
  if (showTimeout) clearTimeout(showTimeout);
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
});

async function handleInstall() {
  if (!deferredPrompt.value) return;
  await deferredPrompt.value.prompt();
  const choice = await deferredPrompt.value.userChoice;
  if (choice.outcome === 'accepted') {
    showPrompt.value = false;
  }
  deferredPrompt.value = null;
}

function dismiss() {
  showPrompt.value = false;
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
}
</script>
