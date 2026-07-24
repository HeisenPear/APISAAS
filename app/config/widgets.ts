// ═══════════════════════════════════════════════════════════════════════════
// CATALOGUE DES WIDGETS DU TABLEAU DE BORD — dashboard configurable par plan.
//
// Chaque widget pointe un composant `Dashboard*` et, éventuellement, une FEATURE
// de gating : proposé seulement si le plan la débloque → « chaque plan récupère
// de nouveaux widgets », sans logique en double (source de vérité = plans.ts).
//
// TAILLE (petit / moyen / grand) : comme sur un écran d'accueil Apple, on ne
// place pas n'importe quoi n'importe où. Les widgets ont des tailles FIXES et se
// rangent dans la grille en lecture (haut-gauche → bas-droite) : la position
// visible SUIT l'ordre de la liste, si bien qu'un glisser-déposer atterrit
// exactement là où on le pose. L'ordre par défaut ci-dessous est pensé pour
// carreler proprement (les « moyens » vont par paires, les « grands » seuls).
//
// Disponibilité = autoritaire (ici). Disposition (ordre + activés) = préférence
// locale (localStorage) — cf. useDashboardWidgets. Seule la bannière Maya reste
// hors grille (chrome fixe).
// ═══════════════════════════════════════════════════════════════════════════
import { hasFeature, minimumPlanFor, type Plan, type PlanFeatures } from './plans';

export type TailleWidget = 'petit' | 'moyen' | 'grand';

export interface WidgetDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  /** Composant Dashboard* correspondant. */
  composant: string;
  /** Gating : proposé seulement si le plan a cette feature. Absent = tous les plans. */
  feature?: keyof PlanFeatures;
  /** petit = 1 col · moyen = 2 col · grand = pleine largeur. */
  taille: TailleWidget;
}

export const WIDGET_CATALOG: WidgetDef[] = [
  // ── Indicateurs (KPI) — petits, disponibles pour tous ──────────────────────
  {
    id: 'kpiRuches',
    label: 'Ruches',
    description: 'Nombre de ruches actives sur le total.',
    icon: 'i-lucide-box',
    composant: 'KpiWidget',
    taille: 'petit',
  },
  {
    id: 'kpiProduction',
    label: 'Production',
    description: 'Récolte de la saison en cours.',
    icon: 'i-lucide-droplets',
    composant: 'KpiWidget',
    taille: 'petit',
  },
  {
    id: 'kpiCa',
    label: "Chiffre d'affaires",
    description: 'Ventes cumulées de l’année.',
    icon: 'i-lucide-wallet',
    composant: 'KpiWidget',
    taille: 'petit',
  },
  {
    id: 'kpiAlertes',
    label: 'Alertes',
    description: 'Nombre d’alertes actives.',
    icon: 'i-lucide-bell-ring',
    composant: 'KpiWidget',
    taille: 'petit',
  },

  // ── Cartes de contenu ──────────────────────────────────────────────────────
  {
    id: 'tournee',
    label: 'Ma tournée du jour',
    description: 'Les ruches à visiter en priorité aujourd’hui.',
    icon: 'i-lucide-route',
    composant: 'TourneeCard',
    taille: 'grand',
  },
  {
    id: 'alertes',
    label: 'Alertes à traiter',
    description: 'Essaimage, gel, sanitaire — ce qui demande ton attention.',
    icon: 'i-lucide-bell',
    composant: 'AlertsWidget',
    taille: 'moyen',
  },
  {
    id: 'taches',
    label: 'À venir',
    description: 'Tes prochaines interventions et rappels planifiés.',
    icon: 'i-lucide-calendar-check',
    composant: 'UpcomingTasks',
    taille: 'moyen',
  },
  {
    id: 'sante',
    label: 'Santé du cheptel',
    description: 'Le score de santé de tes colonies d’un coup d’œil.',
    icon: 'i-lucide-heart-pulse',
    composant: 'SanteScore',
    taille: 'moyen',
  },
  // « budget » (moyen) juste après « santé » (moyen) : la paire remplit une rangée
  // sans laisser de trou dès que le plan débloque la trésorerie.
  {
    id: 'budget',
    label: 'Trésorerie',
    description: 'Ton prévisionnel de trésorerie.',
    icon: 'i-lucide-wallet',
    composant: 'BudgetWidget',
    feature: 'previsionnelTresorerie',
    taille: 'moyen',
  },
  {
    id: 'production',
    label: 'Production',
    description: 'Ta récolte mois par mois.',
    icon: 'i-lucide-droplet',
    composant: 'ProductionChart',
    feature: 'production',
    taille: 'grand',
  },
  {
    id: 'balances',
    label: 'Balances connectées',
    description: 'Le poids de tes ruches en direct.',
    icon: 'i-lucide-scale',
    composant: 'BalancesWidget',
    feature: 'balancesConnectees',
    taille: 'grand',
  },

  // ── Nouveaux widgets (couvrent plus de fonctionnalités, gatés par plan) ──────
  {
    id: 'kpiSante',
    label: 'Santé du cheptel',
    description: 'Le score de santé global de tes colonies, en un chiffre.',
    icon: 'i-lucide-heart-pulse',
    composant: 'KpiWidget',
    taille: 'petit',
  },
  {
    id: 'kpiInterventions',
    label: 'Interventions (30 j)',
    description: 'Le nombre de visites réalisées sur les 30 derniers jours.',
    icon: 'i-lucide-clipboard-check',
    composant: 'KpiWidget',
    taille: 'petit',
  },
  {
    id: 'santeRepartition',
    label: 'Répartition des ruches',
    description: 'La répartition de tes ruches par statut (actives, faibles…).',
    icon: 'i-lucide-pie-chart',
    composant: 'SanteChart',
    taille: 'moyen',
  },
  {
    id: 'activite',
    label: 'Activité récente',
    description: 'Le fil de tes dernières actions : visites, récoltes, ventes.',
    icon: 'i-lucide-history',
    composant: 'ActiviteWidget',
    taille: 'moyen',
  },
  {
    id: 'kpiCharges',
    label: 'Charges',
    description: 'Le total de tes achats de l’année.',
    icon: 'i-lucide-trending-down',
    composant: 'KpiWidget',
    feature: 'comptabiliteAchats',
    taille: 'petit',
  },
  {
    id: 'kpiBenefice',
    label: 'Bénéfice',
    description: 'Ton résultat de l’année (ventes − charges).',
    icon: 'i-lucide-piggy-bank',
    composant: 'KpiWidget',
    feature: 'analyticsRentabilite',
    taille: 'petit',
  },
];

/** Le widget est-il disponible pour ce plan ? (feature absente = oui pour tous). */
export function widgetDisponible(w: WidgetDef, plan: Plan): boolean {
  return !w.feature || hasFeature(plan, w.feature);
}

/** Widgets que ce plan PEUT afficher, dans l'ordre du catalogue. */
export function widgetsDisponibles(plan: Plan): WidgetDef[] {
  return WIDGET_CATALOG.filter((w) => widgetDisponible(w, plan));
}

/** Plan minimum qui débloque un widget (pour un CTA « passez à X »). */
export function planMinimumWidget(w: WidgetDef): Plan {
  return w.feature ? minimumPlanFor(w.feature) : 'decouverte';
}

/** Retrouve un widget par id. */
export function widgetParId(id: string): WidgetDef | undefined {
  return WIDGET_CATALOG.find((w) => w.id === id);
}
