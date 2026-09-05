/**
 * Le serveur calcule ces 20 compteurs en UNE requête (server/api/dashboard/
 * index.get.ts). L'interface n'en déclarait que 5 : les 15 autres arrivaient
 * bien sur le réseau mais restaient invisibles côté TypeScript — donc
 * inutilisables pour les widgets, sans le moindre coût supplémentaire.
 */
interface DashboardKpis {
  ruchesActives: number;
  totalRuches: number;
  productionSaison: number;
  caTotal: number;
  alertesActives: number;
  charges: number;
  benefice: number;
  interventions30j: number;
  santeGlobal: number | null;
  reines: number;
  reinesInseminees: number;
  reinesARemplacer: number;
  lignees: number;
  cellulesAcceptees: number;
  stockArticles: number;
  transhumancesPrevues: number;
  ruchers: number;
  recoltes: number;
  clients: number;
  ventes: number;
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

// Horodatage du dernier déclenchement de génération d'alertes, partagé entre
// toutes les instances du composable. Le dashboard monte plusieurs widgets qui
// appellent chacun useDashboard() — sans ce garde, /api/alertes/generate était
// appelé 3-4× en parallèle à chaque chargement (contention DB inutile).
let lastAlertGen = 0;
const ALERT_GEN_THROTTLE_MS = 60_000;

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
      // ⚠️ L'ANNULATION AUSSI. Le tableau de bord suivait la création d'une
      // intervention et pas sa suppression : défaire une dictée laissait le
      // compte du jour inchangé, donc faux, jusqu'au prochain montage.
      'intervention:deleted',
      'recolte:created',
      'recolte:updated',
      'recolte:deleted',
      'vente:created',
      'vente:updated',
      'vente:deleted',
      'achat:created',
      'stock:created',
      'stock:deleted',
      // ⚠️ `alerte:created` MANQUAIT, et c'est l'événement le plus fréquent de
      // la saison. La pastille de la barre latérale lit ce tableau de bord :
      // sans lui, une alerte levée par une écriture de Maya (un comptage varroa
      // au-dessus du seuil) n'apparaissait nulle part avant un rechargement.
      'alerte:created',
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
    // Fire-and-forget: génération d'alertes en arrière-plan, au plus une fois
    // par minute quel que soit le nombre de widgets montés.
    const now = Date.now();
    if (now - lastAlertGen > ALERT_GEN_THROTTLE_MS) {
      lastAlertGen = now;
      appelApi('/api/alertes/generate', { method: 'POST' }).catch(() => {});
    }
  });

  const dashboard = computed(() => data.value?.data ?? null);

  return { dashboard, pending, error, refresh };
}
