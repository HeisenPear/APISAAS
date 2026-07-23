// ═══════════════════════════════════════════════════════════════════════════
// CATALOGUE DES WIDGETS DU TABLEAU DE BORD — dashboard configurable par plan.
//
// Chaque widget pointe un composant `Dashboard*` existant et, éventuellement, une
// FEATURE de gating : le widget n'est proposé que si le plan la débloque. Ainsi
// « chaque plan récupère de nouveaux widgets », sans logique en double — on
// réutilise la source de vérité du gating (plans.ts).
//
// La DISPONIBILITÉ (quels widgets un plan PEUT afficher) est ici, autoritaire.
// La DISPOSITION (ordre + widgets activés) est une préférence utilisateur, gérée
// à part (localStorage) — cf. useDashboardWidgets.
// ═══════════════════════════════════════════════════════════════════════════
import { hasFeature, minimumPlanFor, type Plan, type PlanFeatures } from './plans';

export interface WidgetDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  /** Composant auto-importé Nuxt : `Dashboard${composant}`. */
  composant: string;
  /** Gating : proposé seulement si le plan a cette feature. Absent = tous les plans. */
  feature?: keyof PlanFeatures;
  /** Occupe 2 colonnes (graphes larges) plutôt qu'une. */
  large?: boolean;
}

export const WIDGET_CATALOG: WidgetDef[] = [
  {
    id: 'tournee',
    label: 'Ma tournée du jour',
    description: 'Les ruches à visiter en priorité aujourd’hui.',
    icon: 'i-lucide-route',
    composant: 'TourneeCard',
    large: true,
  },
  {
    id: 'alertes',
    label: 'Alertes',
    description: 'Essaimage, gel, sanitaire — ce qui demande ton attention.',
    icon: 'i-lucide-bell',
    composant: 'AlertsWidget',
  },
  {
    id: 'taches',
    label: 'À venir',
    description: 'Tes prochaines interventions et rappels planifiés.',
    icon: 'i-lucide-calendar-check',
    composant: 'UpcomingTasks',
  },
  {
    id: 'sante',
    label: 'Santé du cheptel',
    description: 'Le score de santé de tes colonies d’un coup d’œil.',
    icon: 'i-lucide-heart-pulse',
    composant: 'SanteScore',
  },
  {
    id: 'production',
    label: 'Production',
    description: 'Ta récolte mois par mois.',
    icon: 'i-lucide-droplet',
    composant: 'ProductionChart',
    feature: 'production',
    large: true,
  },
  {
    id: 'balances',
    label: 'Balances connectées',
    description: 'Le poids de tes ruches en direct.',
    icon: 'i-lucide-scale',
    composant: 'BalancesWidget',
    feature: 'balancesConnectees',
    large: true,
  },
  {
    id: 'budget',
    label: 'Trésorerie',
    description: 'Ton prévisionnel de trésorerie.',
    icon: 'i-lucide-wallet',
    composant: 'BudgetWidget',
    feature: 'previsionnelTresorerie',
  },
  {
    id: 'maya',
    label: 'Maya',
    description: 'La proposition du jour de ton copilote.',
    icon: 'i-lucide-message-circle-heart',
    composant: 'MayaCard',
    feature: 'copiloteIa',
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
