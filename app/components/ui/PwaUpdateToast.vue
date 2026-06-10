<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-200 ease-in"
    enter-from-class="translate-y-full opacity-0"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="$pwa?.needRefresh"
      class="fixed left-4 right-4 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xl sm:left-auto sm:right-6 sm:w-[380px]"
      style="bottom: max(1rem, calc(var(--bottom-nav-height, 0px) + 0.75rem))"
      role="status"
    >
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
        <UIcon name="i-lucide-sparkles" class="h-4.5 w-4.5 text-amber-600" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-[13px] font-semibold text-stone-900">Nouvelle version disponible</p>
        <p class="text-[12px] text-stone-500">Mettez à jour quand vous voulez — rien ne se perd.</p>
      </div>
      <UButton size="xs" color="primary" :loading="updating" @click="applyUpdate">
        Mettre à jour
      </UButton>
      <button
        class="shrink-0 text-stone-400 transition-colors hover:text-stone-600"
        aria-label="Plus tard"
        @click="$pwa?.cancelPrompt()"
      >
        <UIcon name="i-lucide-x" class="h-4 w-4" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
// Mode SW 'prompt' : le nouveau service worker attend en coulisses et ce
// toast laisse l'utilisateur choisir le moment du rechargement (un seul,
// volontaire) — fini les reloads forcés de tous les onglets après un déploiement.
const { $pwa } = useNuxtApp();
const updating = ref(false);

async function applyUpdate() {
  updating.value = true;
  try {
    // skipWaiting + prise de contrôle → reload propre déclenché par vite-pwa
    await $pwa?.updateServiceWorker(true);
  } finally {
    // Si le reload n'a pas eu lieu (SW déjà actif), on referme le toast
    setTimeout(() => {
      updating.value = false;
      $pwa?.cancelPrompt();
    }, 4000);
  }
}
</script>
