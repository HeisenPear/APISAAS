import type { PlanFeatures } from '~/config/plans';

export interface NavItem {
  icon: string;
  label: string;
  to: string;
  /** Feature de gating — l'item est verrouillé (cadenas) si le plan ne l'inclut pas. */
  feature?: keyof PlanFeatures;
  /** Badge numérique/texte — peut être injecté au runtime (ex. compteur de ruches). */
  badge?: number | string;
  /** Affiche la pastille d'alertes (compteur dynamique). */
  alertDot?: boolean;
}

export interface NavSection {
  key: string;
  label: string;
  /** Repliable (groupe secondaire) : replié par défaut, ouvert auto si la route est dedans. */
  collapsible?: boolean;
  items: NavItem[];
}

/**
 * SOURCE UNIQUE de la navigation applicative — consommée par la sidebar desktop
 * (`UiAppSidebar`) ET le menu mobile (`UiMobileMenu`). Ajouter une entrée ICI la fait
 * apparaître PARTOUT, avec le gating par plan. Ne JAMAIS dupliquer la liste ailleurs
 * (c'était la cause du décalage desktop/mobile — ex. « Règlements » manquant sur mobile).
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'pilotage',
    label: 'Pilotage',
    items: [
      { icon: 'i-lucide-layout-dashboard', label: 'Tableau de bord', to: '/dashboard' },
      { icon: 'i-lucide-bell', label: 'Alertes', to: '/alertes', alertDot: true },
      { icon: 'i-lucide-route', label: 'Ma tournée', to: '/tournee', feature: 'tourneeOptimisee' },
      { icon: 'i-lucide-calendar', label: 'Calendrier', to: '/calendrier' },
      { icon: 'i-lucide-cloud-sun', label: 'Météo', to: '/meteo' },
    ],
  },
  {
    key: 'rucher',
    label: 'Rucher',
    items: [
      { icon: 'i-lucide-map-pin', label: 'Ruchers', to: '/ruchers' },
      { icon: 'i-lucide-map-pin-plus', label: 'Emplacements', to: '/transhumance/emplacements' },
      { icon: 'i-lucide-box', label: 'Ruches', to: '/ruches' },
      { icon: 'i-lucide-activity', label: 'Interventions', to: '/interventions' },
      { icon: 'i-lucide-layers-2', label: 'Hausses', to: '/hausses' },
      { icon: 'i-lucide-droplets', label: 'Production', to: '/production', feature: 'production' },
      {
        icon: 'i-lucide-scale',
        label: 'Balances',
        to: '/balances',
        feature: 'balancesConnectees',
      },
      { icon: 'i-lucide-bug', label: 'Surveillance frelon', to: '/frelon' },
      { icon: 'i-lucide-flower-2', label: 'Carte des floraisons', to: '/floraisons' },
    ],
  },
  {
    key: 'elevage',
    label: 'Élevage de reines',
    collapsible: true,
    items: [
      { icon: 'i-lucide-crown', label: 'Élevage', to: '/elevage' },
      { icon: 'i-lucide-circle-dot', label: 'Reines', to: '/elevage/reines' },
      { icon: 'i-lucide-dna', label: 'Lignées', to: '/elevage/lignees' },
      { icon: 'i-lucide-scissors', label: 'Greffage', to: '/elevage/greffage' },
    ],
  },
  {
    key: 'transhumance',
    label: 'Transhumance',
    collapsible: true,
    items: [
      { icon: 'i-lucide-truck', label: 'Transhumance', to: '/transhumance' },
      { icon: 'i-lucide-map', label: 'Carte mellifère', to: '/transhumance/carte' },
    ],
  },
  {
    key: 'affaires',
    label: 'Affaires',
    items: [
      { icon: 'i-lucide-wallet', label: 'Finances', to: '/finances', feature: 'facturationPdf' },
      {
        icon: 'i-lucide-truck',
        label: 'Bons de livraison',
        to: '/finances/bons-livraison',
        feature: 'facturationPdf',
      },
      { icon: 'i-lucide-users', label: 'Clients', to: '/clients', feature: 'clients' },
      { icon: 'i-lucide-warehouse', label: 'Stocks', to: '/stocks', feature: 'stocksBasique' },
      {
        icon: 'i-lucide-bar-chart-2',
        label: 'Analytics',
        to: '/analytics',
        feature: 'analyticsRentabilite',
      },
      {
        icon: 'i-lucide-trending-up',
        label: 'Prévisionnel',
        to: '/finances/tresorerie',
        feature: 'previsionnelTresorerie',
      },
      {
        icon: 'i-lucide-banknote',
        label: 'Paiements & relances',
        to: '/finances/reglements',
        feature: 'suiviReglements',
      },
      {
        icon: 'i-lucide-users-round',
        label: 'Communauté',
        to: '/communaute',
        feature: 'communauteBase',
      },
      {
        icon: 'i-lucide-building-2',
        label: 'Association',
        to: '/association',
        feature: 'gestionSyndicat',
      },
    ],
  },
  {
    key: 'conformite',
    label: 'Conformité',
    collapsible: true,
    items: [
      { icon: 'i-lucide-file-text', label: 'Déclaration NAPI', to: '/declarations/napi' },
      { icon: 'i-lucide-book-open', label: "Registre d'élevage", to: '/exports' },
      { icon: 'i-lucide-pill', label: 'Ordonnances véto', to: '/conformite/ordonnances' },
      {
        icon: 'i-lucide-stethoscope',
        label: 'Visites sanitaires',
        to: '/conformite/visites-sanitaires',
      },
      { icon: 'i-lucide-skull', label: 'Mortalités', to: '/conformite/mortalites' },
      { icon: 'i-lucide-syringe', label: 'Vétérinaires', to: '/conformite/veterinaires' },
    ],
  },
];
