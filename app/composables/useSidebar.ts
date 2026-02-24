const isMobile = useMediaQuery('(max-width: 1023px)');
const collapsed = ref(false);
const mobileOpen = ref(false);

export function useSidebar() {
  const route = useRoute();

  // Auto-close drawer on route change
  watch(
    () => route.fullPath,
    () => {
      mobileOpen.value = false;
    },
  );

  // Auto-close drawer when switching to desktop
  watch(isMobile, (v) => {
    if (!v) mobileOpen.value = false;
  });

  function toggle() {
    if (isMobile.value) {
      mobileOpen.value = !mobileOpen.value;
    } else {
      collapsed.value = !collapsed.value;
    }
  }

  return {
    isMobile,
    collapsed,
    mobileOpen,
    toggle,
  };
}
