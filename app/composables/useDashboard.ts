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

interface ScoreRuche {
  rucheId: string;
  numero: string;
  rucherId: string;
  score: number;
  dernierControle: string | null;
  statut: string;
}

interface ScoreRucher {
  rucherId: string;
  nom: string;
  score: number;
  nbRuches: number;
}

interface ScoreSante {
  global: number;
  parRucher: ScoreRucher[];
  parRuche: ScoreRuche[];
}

interface AlerteItem {
  id: string;
  type: string;
  titre: string;
  message: string | null;
  priorite: string | null;
  actionUrl: string | null;
}

interface DashboardData {
  kpis: DashboardKpis;
  santeColonies: SanteColonie[];
  productionMensuelle: ProductionMois[];
  activiteRecente: ActiviteItem[];
  scoreSante: ScoreSante;
  alertesRecentes: AlerteItem[];
}

export function useDashboard() {
  const { on } = useDataBus();

  const { data, pending, error, refresh } = useCachedFetch<{ data: DashboardData }>(
    '/api/dashboard',
    {
      key: 'dashboard-data',
      lazy: true,
      dedupe: 'defer',
    },
  );

  // Auto-refresh sur les événements qui impactent le dashboard
  on(
    [
      'ruche:created',
      'ruche:updated',
      'ruche:deleted',
      'intervention:created',
      'intervention:updated',
      'recolte:created',
      'recolte:updated',
      'recolte:deleted',
      'vente:created',
      'vente:updated',
      'vente:deleted',
      'achat:created',
      'stock:created',
      'stock:deleted',
      'alerte:read',
      'alerte:deleted',
    ],
    () => {
      refresh();
    },
  );

  // Toujours rafraîchir en arrière-plan au montage.
  // lazy:true garantit que les données en cache s'affichent immédiatement
  // pendant que le refresh se fait en background (pas de flash de chargement).
  onMounted(() => {
    refresh();
    // Fire-and-forget: generate alerts in background after data loads
    $fetch('/api/alertes/generate', { method: 'POST' }).catch(() => {});
  });

  const dashboard = computed(() => data.value?.data ?? null);

  return { dashboard, pending, error, refresh };
}
