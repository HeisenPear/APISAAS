/**
 * ECharts — import sélectif centralisé + thème maison « warmPrecision ».
 * Tous les composants doivent importer depuis ce fichier au lieu de 'echarts'
 * et initialiser avec le thème : echarts.init(el, 'warmPrecision').
 * Réduit le bundle de ~1 MB (full) à ~250 KB (sélectif).
 */
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

/**
 * Thème unifié « Warm Precision » — repris du style épuré du graphe Production :
 * axes sans traits, grille pointillée discrète, tooltip blanc adouci, palette
 * miel/sauge/argile, courbes lissées. Appliqué à TOUS les graphiques.
 */
echarts.registerTheme('warmPrecision', {
  color: ['#f5a623', '#c9873d', '#b87959', '#5e7ba8', '#9a8536', '#c87f2a', '#8e7cc3'],
  backgroundColor: 'transparent',
  textStyle: { color: '#57534e' },
  title: { textStyle: { color: '#1c1c1e', fontWeight: 600 }, subtextStyle: { color: '#a8a29e' } },
  line: {
    smooth: true,
    symbol: 'circle',
    symbolSize: 5,
    showSymbol: false,
    lineStyle: { width: 3 },
    itemStyle: { borderWidth: 0 },
    emphasis: { itemStyle: { borderWidth: 2, borderColor: '#fff' }, scale: true },
  },
  bar: { itemStyle: { borderRadius: [4, 4, 0, 0] }, barMaxWidth: 24 },
  categoryAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#a8a29e', fontSize: 11 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#a8a29e', fontSize: 11 },
    splitLine: { show: true, lineStyle: { color: '#f0ede8', type: 'dashed' } },
  },
  radar: {
    axisName: { color: '#78716c', fontSize: 11 },
    splitLine: { lineStyle: { color: '#e7e5e4' } },
    splitArea: { areaStyle: { color: ['#fafaf8', '#ffffff'] } },
    axisLine: { lineStyle: { color: '#e7e5e4' } },
  },
  legend: { textStyle: { color: '#78716c', fontSize: 12 }, icon: 'roundRect' },
  tooltip: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#f0ede8',
    borderWidth: 1,
    textStyle: { color: '#1c1c1e', fontSize: 12 },
    axisPointer: { lineStyle: { color: '#e7e5e4' }, crossStyle: { color: '#e7e5e4' } },
  },
  grid: { left: 12, right: 14, top: 16, bottom: 10, containLabel: true },
});

/**
 * Dégradés verticaux réutilisables — identité « barres premium ».
 * Haut plus clair → bas saturé, pour un rendu avec de la profondeur.
 * Ce sont des fabriques (un nouvel objet par appel) pour éviter tout
 * partage d'instance de gradient entre plusieurs séries/canvas.
 */
function vGradient(from: string, to: string) {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: from },
    { offset: 1, color: to },
  ]);
}

/** Barre miel (série principale / positive). */
export const barHoney = () => vGradient('#f8bd54', '#ec9914');
/** Barre argile (série secondaire : charges, sorties…). */
export const barClay = () => vGradient('#cf9a7e', '#b87959');
/** Barre sauge (série « bonne » alternative). */
export const barSage = () => vGradient('#dcb27a', '#c9873d');

export { echarts };
export type { ECharts, EChartsCoreOption as EChartsOption } from 'echarts/core';
