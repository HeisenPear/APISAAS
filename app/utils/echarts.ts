/**
 * ECharts — import sélectif centralisé.
 * Tous les composants doivent importer depuis ce fichier au lieu de 'echarts'.
 * Réduit le bundle de ~1 MB (full) à ~200 KB (sélectif).
 */
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { warmPrecision } from './echarts-theme';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  CanvasRenderer,
]);

// Thème « Warm Precision » (handoff §6) — les charts l'appliquent via
// echarts.init(el, 'warmPrecision').
echarts.registerTheme('warmPrecision', warmPrecision as Record<string, unknown>);

export { echarts };
export type { ECharts, EChartsCoreOption as EChartsOption } from 'echarts/core';
