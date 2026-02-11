<template>
  <div class="flex min-h-dvh bg-[var(--surface-primary)]">
    <UiAppSidebar
      :collapsed="sidebarCollapsed"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
    />

    <div
      class="flex flex-1 flex-col transition-[margin] duration-[var(--duration-base)]"
      :class="
        sidebarCollapsed ? 'ml-[var(--sidebar-collapsed-width)]' : 'ml-[var(--sidebar-width)]'
      "
    >
      <UiAppHeader :title="pageTitle" />

      <main class="flex-1 px-6 py-6 lg:px-8 lg:py-8">
        <div class="mx-auto max-w-[var(--content-max-width)]">
          <slot />
        </div>
      </main>
    </div>

    <UiAppCommandPalette :open="commandPaletteOpen" @close="commandPaletteOpen = false" />
  </div>
</template>

<script setup lang="ts">
const sidebarCollapsed = ref(false);
const commandPaletteOpen = ref(false);
const route = useRoute();

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Tableau de bord',
    '/ruchers': 'Ruchers',
    '/ruches': 'Ruches',
    '/inspections': 'Inspections',
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
