<template>
  <div class="space-y-4">
    <div v-if="pending" class="h-56 animate-pulse rounded-[14px] bg-[var(--surface-muted)]" />

    <template v-else-if="synthese && saisons.length">
      <!-- Synthèse : tendances + meilleure/pire saison -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-[12px] bg-[var(--surface-muted)] px-4 py-3">
          <p class="text-[11px] text-[var(--text-tertiary)]">Tendance production</p>
          <p
            class="mt-0.5 flex items-center gap-1 text-sm font-semibold"
            :class="tendCls(synthese.tendanceProduction)"
          >
            <UIcon :name="tendIcon(synthese.tendanceProduction)" class="h-4 w-4" />
            {{ tendLabel(synthese.tendanceProduction) }}
          </p>
        </div>
        <div class="rounded-[12px] bg-[var(--surface-muted)] px-4 py-3">
          <p class="text-[11px] text-[var(--text-tertiary)]">Tendance CA</p>
          <p
            class="mt-0.5 flex items-center gap-1 text-sm font-semibold"
            :class="tendCls(synthese.tendanceCa)"
          >
            <UIcon :name="tendIcon(synthese.tendanceCa)" class="h-4 w-4" />
            {{ tendLabel(synthese.tendanceCa) }}
          </p>
        </div>
        <div class="rounded-[12px] bg-[var(--surface-muted)] px-4 py-3">
          <p class="text-[11px] text-[var(--text-tertiary)]">Meilleure saison</p>
          <p class="mt-0.5 text-sm font-semibold text-[var(--sage-deep)]">
            {{ synthese.meilleure?.annee ?? '—' }}
            <span class="font-normal text-[var(--text-tertiary)]"
              >· {{ synthese.meilleure?.productionKg ?? 0 }} kg</span
            >
          </p>
        </div>
        <div class="rounded-[12px] bg-[var(--surface-muted)] px-4 py-3">
          <p class="text-[11px] text-[var(--text-tertiary)]">Production moyenne</p>
          <p class="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
            {{ synthese.productionMoyenne }}
            <span class="font-normal text-[var(--text-tertiary)]">kg/an</span>
          </p>
        </div>
      </div>

      <div ref="chartRef" class="h-60" />
    </template>

    <UiEmptyState
      v-else
      icon="i-lucide-calendar-range"
      title="Pas encore d'historique"
      description="Vos saisons s'accumuleront ici année après année pour révéler vos tendances."
    />
  </div>
</template>

<script setup lang="ts">
import { echarts, barHoney } from '~/utils/echarts';

interface SaisonAgg {
  annee: number;
  productionKg: number;
  ca: number;
  margeEur: number;
}
interface Synthese {
  tendanceProduction: string;
  tendanceCa: string;
  meilleure: SaisonAgg | null;
  pire: SaisonAgg | null;
  productionMoyenne: number;
  caMoyen: number;
}

interface ReponsePluriannuel {
  data: { saisons: SaisonAgg[]; synthese: Synthese };
}

/**
 * ⚠️ `useAsyncData` + `appelApi`, ET PAS `useFetch` — mesuré, pas préféré.
 *
 * Ce site était le DERNIER du dépôt à dépasser la limite de profondeur
 * d'instanciation de TypeScript : à lui seul, il faisait échouer
 * `npm run typecheck` dès qu'une route d'API — n'importe laquelle, fût-elle
 * d'une ligne — était ajoutée au projet. L'en-tête de `app/utils/appelApi.ts`
 * raconte la mesure complète.
 *
 * Et ici la résolution de l'union des routes était du travail PUREMENT PERDU :
 * la ligne suivante castait déjà le résultat, donc le typage déduit du chemin
 * n'était jamais utilisé. Le type est maintenant nommé et donné en amont — le
 * cast disparaît, et la vérification devient plus stricte qu'avant, pas moins.
 */
const { data: raw, pending } = useAsyncData<ReponsePluriannuel>(
  'analytics-pluriannuel',
  () => appelApi<ReponsePluriannuel>('/api/analytics/pluriannuel?annees=5'),
  { lazy: true },
);
const payload = computed(() => raw.value?.data ?? null);
const saisons = computed(() => payload.value?.saisons ?? []);
const synthese = computed(() => payload.value?.synthese ?? null);

function tendLabel(t: string) {
  return t === 'hausse' ? 'En hausse' : t === 'baisse' ? 'En baisse' : 'Stable';
}
function tendIcon(t: string) {
  return t === 'hausse'
    ? 'i-lucide-trending-up'
    : t === 'baisse'
      ? 'i-lucide-trending-down'
      : 'i-lucide-minus';
}
function tendCls(t: string) {
  return t === 'hausse'
    ? 'text-[var(--sage-deep)]'
    : t === 'baisse'
      ? 'text-[var(--status-bad)]'
      : 'text-[var(--text-secondary)]';
}

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;

function renderChart() {
  const s = saisons.value;
  if (!chartRef.value || !s.length) return;
  if (!chart) {
    if (chartRef.value.clientWidth === 0) return;
    chart = echarts.init(chartRef.value, 'warmPrecision');
  }
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: Array<{ dataIndex: number }>) => {
        const i = params[0]?.dataIndex ?? 0;
        const d = s[i];
        if (!d) return '';
        return `<strong>${d.annee}</strong><br/>Production : <strong>${d.productionKg} kg</strong><br/>CA : ${d.ca.toLocaleString('fr-FR')} €<br/>Marge : ${d.margeEur.toLocaleString('fr-FR')} €`;
      },
    },
    legend: { bottom: 0, textStyle: { color: '#78716c', fontSize: 11 } },
    grid: { left: 6, right: 6, top: 14, bottom: 32, containLabel: true },
    xAxis: { type: 'category', data: s.map((x) => String(x.annee)) },
    yAxis: [
      { type: 'value', name: 'kg', nameTextStyle: { color: '#706963', fontSize: 10 } },
      {
        type: 'value',
        name: '€',
        nameTextStyle: { color: '#706963', fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Production (kg)',
        type: 'bar',
        data: s.map((x) => x.productionKg),
        barMaxWidth: 32,
        itemStyle: { color: barHoney(), borderRadius: [5, 5, 0, 0] },
      },
      {
        name: 'Chiffre d’affaires',
        type: 'line',
        yAxisIndex: 1,
        data: s.map((x) => x.ca),
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: { color: '#c9873d', width: 2.5 },
        itemStyle: { color: '#c9873d' },
      },
    ],
  });
}

const observer = ref<ResizeObserver | null>(null);

onMounted(() => {
  observer.value = new ResizeObserver(() => {
    nextTick(() => {
      if (chart) chart.resize();
      else renderChart();
    });
  });
  if (chartRef.value) observer.value.observe(chartRef.value);
  nextTick(renderChart);
});

watch(saisons, () => nextTick(renderChart), { deep: true });

onBeforeUnmount(() => {
  observer.value?.disconnect();
  chart?.dispose();
});
</script>
