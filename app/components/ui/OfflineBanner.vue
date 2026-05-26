<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-200 ease-in"
    enter-from-class="-translate-y-full opacity-0"
    leave-to-class="-translate-y-full opacity-0"
  >
    <div
      v-if="showBanner"
      class="fixed left-0 right-0 top-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
      :class="bannerClass"
      style="padding-top: max(0.5rem, constant(safe-area-inset-top, 0px)); padding-top: max(0.5rem, env(safe-area-inset-top, 0px))"
    >
      <UIcon :name="bannerIcon" class="h-4 w-4" />
      <span>{{ bannerText }}</span>
      <button
        v-if="pendingCount > 0 && isOnline"
        class="ml-2 rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold transition-colors hover:bg-white/30"
        @click="handleSync"
      >
        Synchroniser
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { isOnline, pendingCount, syncing, syncPending } = useOfflineSync();

const showBanner = computed(() => !isOnline.value || pendingCount.value > 0);

const bannerClass = computed(() => {
  if (!isOnline.value) return 'bg-stone-700 text-white';
  if (syncing.value) return 'bg-amber-500 text-white';
  return 'bg-amber-100 text-amber-800';
});

const bannerIcon = computed(() => {
  if (!isOnline.value) return 'i-lucide-wifi-off';
  if (syncing.value) return 'i-lucide-loader-2';
  return 'i-lucide-cloud-off';
});

const bannerText = computed(() => {
  if (!isOnline.value)
    return 'Hors ligne — Les modifications seront synchronisees au retour du reseau';
  if (syncing.value) return 'Synchronisation en cours...';
  return `${pendingCount.value} modification${pendingCount.value > 1 ? 's' : ''} en attente`;
});

async function handleSync() {
  const result = await syncPending();
  if (result.synced > 0) {
    useNotifications().success(
      `${result.synced} modification${result.synced > 1 ? 's' : ''} synchronisee${result.synced > 1 ? 's' : ''}`,
    );
  }
  if (result.failed > 0) {
    useNotifications().error(
      `${result.failed} erreur${result.failed > 1 ? 's' : ''} de synchronisation`,
    );
  }
}
</script>
