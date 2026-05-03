export function usePullToRefresh(refreshFn: () => Promise<void>) {
  if (import.meta.server) return;

  const pulling = ref(false);
  const pullDistance = ref(0);
  const threshold = 80;
  let startY = 0;
  let isAtTop = true;

  function onTouchStart(e: TouchEvent) {
    if (window.scrollY <= 0 && e.touches[0]) {
      startY = e.touches[0].clientY;
      isAtTop = true;
    } else {
      isAtTop = false;
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!isAtTop || pulling.value || !e.touches[0]) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      pullDistance.value = Math.min(diff * 0.5, 120);
    }
  }

  async function onTouchEnd() {
    if (pullDistance.value >= threshold && !pulling.value) {
      pulling.value = true;
      await refreshFn();
      pulling.value = false;
    }
    pullDistance.value = 0;
  }

  onMounted(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
  });

  onUnmounted(() => {
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  });

  return { pulling: readonly(pulling), pullDistance: readonly(pullDistance) };
}