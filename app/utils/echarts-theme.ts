/**
 * Thème ECharts « Warm Precision » (handoff Maya §6).
 * Enregistré globalement dans app/utils/echarts.ts sous le nom 'warmPrecision'.
 * Les charts l'appliquent via echarts.init(el, 'warmPrecision').
 *
 * Palette : honey (primaire), sage (vivant), clay (matériel), bleu, ambre foncé.
 * Le vert reste sémantique — il n'est PAS l'identité Maya (cf. règle d'or §0).
 */
export const warmPrecision = {
  color: ['#f5a623', '#7a9676', '#b87959', '#5e7ba8', '#c87f2a'],
  textStyle: {
    fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
    color: '#57534e',
  },
  grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(214,211,209,0.6)' } },
    axisTick: { show: false },
    axisLabel: { color: '#a8a29e', fontSize: 11 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#a8a29e', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(214,211,209,0.3)' } },
  },
  tooltip: {
    backgroundColor: '#1c1c1e',
    borderWidth: 0,
    textStyle: { color: '#fff', fontSize: 12 },
    padding: [8, 12],
  },
} as const;
