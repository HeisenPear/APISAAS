interface DashboardKpis {
  ruchesActives: number;
  totalRuches: number;
  productionSaison: number;
  caTotal: number;
  alertesActives: number;
}

interface SanteColonie {
  statut: string;
  count: number;
}

interface ProductionMois {
  mois: number;
  total: number;
}

interface ActiviteItem {
  id: string;
  type: string;
  date: string;
  description: string;
  metadata: unknown;
}

interface DashboardData {
  kpis: DashboardKpis;
  santeColonies: SanteColonie[];
  productionMensuelle: ProductionMois[];
  activiteRecente: ActiviteItem[];
}

export function useDashboard() {
  const { data, pending, error, refresh } = useFetch<{ data: DashboardData }>('/api/dashboard', {
    key: 'dashboard-data',
    lazy: true,
    dedupe: 'defer',
  });

  const dashboard = computed(() => data.value?.data ?? null);

  // Force refresh on each mount to ensure fresh data
  onMounted(() => {
    refresh();
  });

  return { dashboard, pending, error, refresh };
}
