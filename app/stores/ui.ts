export const useUiStore = defineStore('ui', () => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const sidebarCollapsed = ref(false);
  const commandPaletteOpen = ref(false);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function toggleCommandPalette(): void {
    commandPaletteOpen.value = !commandPaletteOpen.value;
  }

  function openCommandPalette(): void {
    commandPaletteOpen.value = true;
  }

  function closeCommandPalette(): void {
    commandPaletteOpen.value = false;
  }

  return {
    sidebarCollapsed,
    commandPaletteOpen,
    toggleSidebar,
    toggleCommandPalette,
    openCommandPalette,
    closeCommandPalette,
  };
});
