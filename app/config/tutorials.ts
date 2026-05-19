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

export const TOUR_PREMIERS_PAS: Tutorial = {
  id: 'premiers_pas',
  name: 'Premiers pas',
  route: '/dashboard',
  steps: [
    {
      id: 'sidebar',
      target: '[data-tutorial="sidebar"]',
      title: 'Bienvenue sur APIGO 🐝',
      content: 'La barre latérale vous donne accès à tous les modules. Commençons par créer votre premier rucher — cliquez sur "Ruchers" dans la navigation.',
      position: 'right',
    },
    {
      id: 'dashboard-kpis',
      target: '[data-tutorial="dashboard-kpis"]',
      title: 'Votre tableau de bord',
      content: 'Ici vous verrez en temps réel vos ruches actives, les alertes urgentes et votre activité récente. Ce sont vos indicateurs clés — ils se remplissent au fur et à mesure.',
      position: 'bottom',
    },
    {
      id: 'search',
      target: '[data-tutorial="search"]',
      title: 'Recherche instantanée',
      content: 'Pressez ⌘K (ou Ctrl+K) à tout moment pour retrouver une ruche, une intervention ou un client. Plus besoin de naviguer dans les menus.',
      position: 'bottom',
    },
    {
      id: 'btn-nouvelle-intervention',
      target: '[data-tutorial="btn-nouvelle-intervention"]',
      title: 'Enregistrer une intervention',
      content: 'Après avoir créé votre rucher et vos ruches, revenez ici pour enregistrer votre première visite. Cliquez sur ce bouton pour démarrer.',
      position: 'bottom',
    },
  ],
};

export const TOUR_DECOUVERTE: Tutorial = {
  id: 'decouverte',
  name: 'Découverte interface',
  route: '/dashboard',
  steps: [
    {
      id: 'sidebar',
      target: '[data-tutorial="sidebar"]',
      title: 'Navigation principale',
      content: 'La barre latérale organise tous vos modules : Cheptel (ruchers, ruches), Interventions, Production, Affaires (finances, clients) et Conformité. Cliquez sur une section pour l\'ouvrir.',
      position: 'right',
    },
    {
      id: 'search',
      target: '[data-tutorial="search"]',
      title: 'Recherche globale ⌘K',
      content: 'Retrouvez n\'importe quoi en moins de 2 secondes. Ruche n°42, client Dupont, intervention varroa du mois dernier — tout est indexé et accessible instantanément.',
      position: 'bottom',
    },
    {
      id: 'dashboard-kpis',
      target: '[data-tutorial="dashboard-kpis"]',
      title: 'Indicateurs clés',
      content: 'Ce bloc affiche en temps réel : ruches actives, alertes critiques, prochaines interventions planifiées et votre production récente. Votre état du cheptel d\'un coup d\'œil.',
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
      content: 'Cliquez ici pour enregistrer n\'importe quelle action sur vos ruches : visite de contrôle, traitement varroa, nourrissement, division, récolte. Plus de 14 types disponibles.',
      position: 'bottom',
    },
    {
      id: 'liste',
      target: '[data-tutorial="interventions-list"]',
      title: 'Historique complet',
      content: 'Toutes vos interventions apparaissent ici, triées par date. Filtrez par type, rucher ou période. Chaque ligne montre la ruche concernée, le type d\'action et les notes.',
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
      content: 'Vos recettes, dépenses et marge nette de l\'année en un coup d\'œil. Le graphique compare mois par mois — idéal pour anticiper la trésorerie avant la miellée.',
      position: 'bottom',
    },
    {
      id: 'transactions',
      target: '[data-tutorial="finances-transactions"]',
      title: 'Ventes & Achats',
      content: 'Saisissez chaque vente (miel, essaims, reines) et chaque achat (matériel, traitement). APIGO génère automatiquement votre bilan annuel et vos factures Factur-X conformes 2026.',
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
      id: 'liste-ruchers',
      target: '[data-tutorial="ruchers-list"]',
      title: 'Vos ruchers',
      content: 'Chaque rucher regroupe vos ruches par emplacement géographique. Cliquez sur un rucher pour voir ses ruches, son historique d\'interventions et les alertes associées.',
      position: 'bottom',
    },
    {
      id: 'ruchers-map',
      target: '[data-tutorial="ruchers-map"]',
      title: 'Carte de vos emplacements',
      content: 'Visualisez tous vos ruchers sur la carte. Cliquez sur un marqueur pour accéder directement à la fiche du rucher. Utile pour la transhumance et la déclaration NAPI.',
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
      title: 'Planifier un déplacement',
      content: 'Créez un plan de transhumance : définissez les ruches à déplacer, l\'emplacement de destination et les dates. Vous recevrez un rappel avant chaque départ planifié.',
      position: 'bottom',
    },
    {
      id: 'plans-actifs',
      target: '[data-tutorial="transhumance-plans"]',
      title: 'Plans en cours',
      content: 'Suivez l\'état de chaque déplacement : planifié, en transit, arrivé. Chaque plan garde l\'historique des emplacements pour votre déclaration NAPI annuelle.',
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
      title: 'Gérer vos lignées',
      content: 'Créez une lignée pour chaque souche de vos reines. Chaque lignée regroupe ses descendantes et leurs performances : douceur, essaimage, varroa. C\'est la base de la sélection génétique.',
      position: 'bottom',
    },
    {
      id: 'sessions',
      target: '[data-tutorial="elevage-sessions"]',
      title: 'Sessions de greffage',
      content: 'Enregistrez chaque session de greffage : date, nombre de cellules lancées, taux de réussite. APIGO calcule automatiquement vos statistiques de performance par lignée.',
      position: 'top',
    },
  ],
};

export const ALL_TUTORIALS: Tutorial[] = [
  TOUR_PREMIERS_PAS,
  TOUR_DECOUVERTE,
  TOUR_INTERVENTIONS,
  TOUR_FINANCES,
  TOUR_RUCHERS,
  TOUR_TRANSHUMANCE,
  TOUR_ELEVAGE,
];
