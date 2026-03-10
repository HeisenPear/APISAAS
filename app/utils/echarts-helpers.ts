import type { ECharts } from 'echarts/core';

// Init safe d'un chart ECharts
// Attend que le conteneur ait des dimensions avant d'initialiser
export async function safeInitChart(
  container: HTMLElement,
  initFn: (el: HTMLElement) => ECharts,
): Promise<ECharts | null> {
  await nextTick();

  // Attendre que le conteneur ait des dimensions (max 10 frames ~160ms)
  let attempts = 0;
  while (container.clientWidth === 0 && attempts < 10) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    attempts++;
  }

  if (container.clientWidth === 0) {
    console.warn('[ECharts] container has zero width after 10 frames — skipping init');
    return null;
  }

  return initFn(container);
}
