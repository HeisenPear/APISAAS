export interface TutorialStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface Tutorial {
  id: string;
  name: string;
  route?: string;
  steps: TutorialStep[];
}

export const TOUR_DECOUVERTE: Tutorial = {
  id: 'decouverte',
  name: 'Découverte de l\'interface',
  route: '/dashboard',
  steps: [
    {
      id: 'sidebar',
      target: '[data-tutorial="sidebar"]',
      title: 'Navigation principale',
      content: 'La barre latérale vous donne accès à tous les modules : Cheptel, Affaires, Conformité. Cliquez sur un élément pour naviguer.',
      position: 'right',
    },
    {
      id: 'search',
      target: '[data-tutorial="search"]',
      title: 'Recherche globale',
      content: 'Utilisez la recherche (⌘K) pour retrouver une ruche, une intervention ou un client en quelques secondes.',
      position: 'bottom',
    },
    {
      id: 'dashboard',
      target: '[data-tutorial="dashboard-kpis"]',
      title: 'Tableau de bord',
      content: 'Vos indicateurs clés sont ici : ruches actives, alertes, prochaines interventions et production récente.',
      position: 'bottom',
    },
  ],
};

export const TOUR_INTERVENTIONS: Tutorial = {
  id: 'interventions',
  name: 'Interventions',
  route: '/interventions',
  steps: [
    {
      id: 'btn-nouvelle',
      target: '[data-tutorial="btn-nouvelle-intervention"]',
      title: 'Créer une intervention',
      content: 'Cliquez ici pour enregistrer une nouvelle visite, un traitement, ou toute autre action sur vos ruches.',
      position: 'bottom',
    },
    {
      id: 'liste',
      target: '[data-tutorial="interventions-list"]',
      title: 'Historique des interventions',
      content: 'Toutes vos interventions sont listées ici, triées par date. Filtrez par type, rucher ou statut.',
      position: 'top',
    },
  ],
};

export const TOUR_FINANCES: Tutorial = {
  id: 'finances',
  name: 'Finances & Facturation',
  route: '/finances',
  steps: [
    {
      id: 'stats',
      target: '[data-tutorial="finances-stats"]',
      title: 'Synthèse financière',
      content: 'Vos revenus, dépenses et bénéfice net d\'un seul coup d\'œil. Les graphiques s\'adaptent à la période sélectionnée.',
      position: 'bottom',
    },
    {
      id: 'transactions',
      target: '[data-tutorial="finances-transactions"]',
      title: 'Transactions',
      content: 'Saisissez chaque vente ou achat ici. APIGO génère automatiquement votre bilan annuel.',
      position: 'top',
    },
  ],
};

export const TOUR_RUCHERS: Tutorial = {
  id: 'ruchers',
  name: 'Ruchers & Ruches',
  route: '/ruchers',
  steps: [
    {
      id: 'carte',
      target: '[data-tutorial="ruchers-map"]',
      title: 'Carte de vos ruchers',
      content: 'Visualisez l\'emplacement de tous vos ruchers sur la carte. Cliquez sur un marqueur pour voir les détails.',
      position: 'bottom',
    },
    {
      id: 'liste-ruchers',
      target: '[data-tutorial="ruchers-list"]',
      title: 'Liste des ruchers',
      content: 'Gérez chaque rucher : modifiez les infos, ajoutez des ruches, consultez l\'historique des interventions.',
      position: 'top',
    },
  ],
};

export const TOUR_TRANSHUMANCE: Tutorial = {
  id: 'transhumance',
  name: 'Transhumance',
  route: '/transhumance',
  steps: [
    {
      id: 'btn-plan',
      target: '[data-tutorial="btn-nouveau-plan"]',
      title: 'Créer un plan de transhumance',
      content: 'Planifiez un déplacement de ruchers vers une miellée. Définissez la date, le rucher source et l\'emplacement cible.',
      position: 'bottom',
    },
    {
      id: 'plans-actifs',
      target: '[data-tutorial="transhumance-plans"]',
      title: 'Plans en cours',
      content: 'Suivez l\'avancement de vos déplacements. Chaque plan indique le statut, les dates et les ruches concernées.',
      position: 'top',
    },
  ],
};

export const TOUR_ELEVAGE: Tutorial = {
  id: 'elevage',
  name: 'Élevage de reines',
  route: '/elevage',
  steps: [
    {
      id: 'lignees',
      target: '[data-tutorial="elevage-lignees"]',
      title: 'Lignées génétiques',
      content: 'Créez et suivez vos lignées. Chaque lignée regroupe les reines de même origine et permet la sélection génétique.',
      position: 'bottom',
    },
    {
      id: 'sessions',
      target: '[data-tutorial="elevage-sessions"]',
      title: 'Sessions de greffage',
      content: 'Planifiez et enregistrez vos sessions de greffage. Notez le taux de réussite et les performances.',
      position: 'top',
    },
  ],
};

export const ALL_TUTORIALS: Tutorial[] = [
  TOUR_DECOUVERTE,
  TOUR_INTERVENTIONS,
  TOUR_FINANCES,
  TOUR_RUCHERS,
  TOUR_TRANSHUMANCE,
  TOUR_ELEVAGE,
] as const;
