<template>
  <div class="flex h-dvh bg-[var(--surface-primary)]">
    <!-- Mobile backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-[var(--duration-base)]"
      leave-active-class="transition-opacity duration-[var(--duration-base)]"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="isMobile && mobileOpen" class="fixed inset-0 z-40 bg-black/40" @click="toggle" />
    </Transition>

    <UiAppSidebar
      :collapsed="collapsed"
      :mobile-open="mobileOpen"
      :is-mobile="isMobile"
      @toggle-collapse="toggle"
    />

    <div
      class="flex h-dvh flex-1 flex-col overflow-y-auto transition-[margin] duration-[var(--duration-base)]"
      :class="[
        isMobile
          ? 'ml-0'
          : collapsed
            ? 'ml-[var(--sidebar-collapsed-width)]'
            : 'ml-[var(--sidebar-width)]',
      ]"
    >
      <UiAppHeader :title="pageTitle" :show-menu-button="isMobile" @toggle-menu="toggle" />

      <!-- Bannière trial (masquée pour admin) -->
      <UiTrialBanner />

      <main class="flex-1 px-4 py-4 lg:px-8 lg:py-8">
        <div class="mx-auto max-w-[var(--content-max-width)]">
          <slot />
        </div>
      </main>
    </div>

    <UiAppCommandPalette :open="commandPaletteOpen" @close="commandPaletteOpen = false" />

    <ClientOnly>
      <UiOfflineBanner />
      <UiPwaInstallPrompt />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const { isMobile, collapsed, mobileOpen, toggle } = useSidebar();
const commandPaletteOpen = ref(false);
const route = useRoute();

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Tableau de bord',
    '/ruchers': 'Ruchers',
    '/ruches': 'Ruches',
    '/production': 'Production',
    '/stocks': 'Stocks',
    '/finances': 'Finances',
    '/clients': 'Clients',
    '/calendrier': 'Calendrier',
    '/meteo': 'Meteo',
    '/parametres': 'Parametres',
  };
  return titles[route.path] ?? '';
});

function handleKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
    event.preventDefault();
    commandPaletteOpen.value = !commandPaletteOpen.value;
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>
