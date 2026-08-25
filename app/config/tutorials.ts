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
  name: "Découverte de l'interface",
  route: '/dashboard',
  steps: [
    {
      id: 'sidebar',
      target: '[data-tutorial="sidebar"]',
      title: 'Bienvenue sur APIGO 🐝',
      content:
        'La barre latérale vous donne accès à tous les modules. Commençons par créer votre premier rucher — cliquez sur "Ruchers" dans la navigation.',
      position: 'right',
    },
    {
      id: 'dashboard-kpis',
      target: '[data-tutorial="dashboard-kpis"]',
      title: 'Votre tableau de bord',
      content:
        'Ici vous verrez en temps réel vos ruches actives, les alertes urgentes et votre activité récente. Ce sont vos indicateurs clés — ils se remplissent au fur et à mesure.',
      position: 'bottom',
    },
    {
      id: 'search',
      target: '[data-tutorial="search"]',
      title: 'Recherche instantanée',
      content:
        'Pressez ⌘K (ou Ctrl+K) à tout moment pour retrouver une ruche, une intervention ou un client. Plus besoin de naviguer dans les menus.',
      position: 'bottom',
    },
    {
      id: 'btn-nouvelle-intervention',
      target: '[data-tutorial="btn-nouvelle-intervention"]',
      title: 'Enregistrer une intervention',
      content:
        'Après avoir créé votre rucher et vos ruches, revenez ici pour enregistrer votre première visite. Cliquez sur ce bouton pour démarrer.',
      position: 'bottom',
    },
  ],
};

export const TOUR_PILOTAGE: Tutorial = {
  id: 'pilotage',
  name: 'Pilotage au quotidien',
  route: '/dashboard',
  steps: [
    {
      id: 'nav-pilotage',
      target: '[data-tutorial="nav-pilotage"]',
      title: 'Votre espace Pilotage',
      content:
        "Alertes, Ma tournée (Pro), Calendrier et Météo sont regroupés ici. C'est votre point d'entrée quotidien pour savoir quoi faire et où aller aujourd'hui.",
      position: 'right',
    },
    {
      id: 'dashboard-kpis',
      target: '[data-tutorial="dashboard-kpis"]',
      title: "Vos indicateurs en un coup d'œil",
      content:
        "Ruches actives, alertes critiques et activité récente. Ma tournée (plan Pro) optimise ensuite l'ordre de vos visites du jour selon vos ruchers et vos priorités.",
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
      content:
        "Cliquez ici pour enregistrer n'importe quelle action sur vos ruches : visite de contrôle, traitement varroa, nourrissement, division, récolte. Treize types au total.",
      position: 'bottom',
    },
    {
      id: 'liste',
      target: '[data-tutorial="interventions-list"]',
      title: 'Historique complet',
      content:
        "Toutes vos interventions apparaissent ici, triées par date. Filtrez par type, rucher ou période. Chaque ligne montre la ruche concernée, le type d'action et les notes.",
      position: 'top',
    },
  ],
};

export const TOUR_PRODUCTION: Tutorial = {
  id: 'production',
  name: 'Production & traçabilité',
  route: '/production',
  steps: [
    {
      id: 'nouvelle-recolte',
      target: '[data-tutorial="production-nouvelle-recolte"]',
      title: 'Enregistrer une récolte',
      content:
        'Saisissez chaque récolte : quantité, type de miel, ruches concernées. APIGO calcule automatiquement vos statistiques par rucher et votre évolution saison après saison.',
      position: 'bottom',
    },
    {
      id: 'recoltes-liste',
      target: '[data-tutorial="production-recoltes-liste"]',
      title: 'Suivi par rucher & traçabilité',
      content:
        'Retrouvez vos récoltes récentes par rucher, et accédez à la traçabilité des lots (cahier de miellerie numérique conforme CE 178/2002) juste en dessous.',
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
      content:
        "Vos recettes, dépenses et marge nette de l'année en un coup d'œil. Le graphique compare mois par mois — idéal pour anticiper la trésorerie avant la miellée.",
      position: 'bottom',
    },
    {
      id: 'transactions',
      target: '[data-tutorial="finances-transactions"]',
      title: 'Ventes & Achats',
      content:
        'Saisissez chaque vente (miel, essaims, reines) et chaque achat (matériel, traitement). APIGO génère automatiquement votre bilan annuel et vos factures Factur-X conformes 2026.',
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
      content:
        "Chaque rucher regroupe vos ruches par emplacement géographique. Cliquez sur un rucher pour voir ses ruches, son historique d'interventions et les alertes associées.",
      position: 'bottom',
    },
    {
      id: 'ruchers-map',
      target: '[data-tutorial="ruchers-map"]',
      title: 'Basculer en vue carte',
      content:
        'Cliquez ici pour visualiser tous vos ruchers sur la carte. Cliquez ensuite sur un marqueur pour accéder directement à la fiche du rucher. Utile pour la transhumance et la déclaration NAPI.',
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
      content:
        "Créez un plan de transhumance : définissez les ruches à déplacer, l'emplacement de destination et les dates. Vous recevrez un rappel avant chaque départ planifié.",
      position: 'bottom',
    },
    {
      id: 'plans-actifs',
      target: '[data-tutorial="transhumance-plans"]',
      title: 'Plans en cours',
      content:
        "Suivez l'état de chaque déplacement : planifié, en transit, arrivé. Chaque plan garde l'historique des emplacements pour votre déclaration NAPI annuelle. Consultez aussi la carte mellifère pour repérer les meilleures floraisons.",
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
      content:
        "Créez une lignée pour chaque souche de vos reines. Chaque lignée regroupe ses descendantes et leurs performances : douceur, essaimage, varroa. C'est la base de la sélection génétique.",
      position: 'bottom',
    },
    {
      id: 'sessions',
      target: '[data-tutorial="elevage-sessions"]',
      title: 'Sessions de greffage',
      content:
        'Enregistrez chaque session de greffage en lot : date, ruches receveuses, nombre de cellules lancées, taux de réussite. APIGO calcule automatiquement vos statistiques de performance par lignée.',
      position: 'top',
    },
    {
      id: 'selection-avancee',
      target: '[data-tutorial="elevage-selection-avancee"]',
      title: 'Sélection génétique avancée · Expert',
      content:
        'Un index composite sur 9 critères (douceur, productivité, résistance varroa…) classe vos reines, avec un benchmark anonymisé face aux autres apiculteurs de la communauté. La généalogie visuelle (ascendants/descendants) est accessible depuis chaque fiche reine.',
      position: 'top',
    },
  ],
};

export const TOUR_CONFORMITE: Tutorial = {
  id: 'conformite',
  name: 'Conformité',
  route: '/conformite/mortalites',
  steps: [
    {
      id: 'mortalites-nouvelle',
      target: '[data-tutorial="mortalites-nouvelle"]',
      title: 'Registre des mortalités',
      content:
        "Déclarez chaque perte de colonies : date, cause suspectée, rucher concerné. C'est une pièce obligatoire de votre registre d'élevage, et un signal précieux pour repérer un problème récurrent.",
      position: 'bottom',
    },
    {
      id: 'mortalites-stats',
      target: '[data-tutorial="mortalites-stats"]',
      title: 'Taux de perte & tendances',
      content:
        'APIGO calcule automatiquement votre taux de perte annuel, les causes principales et la tendance saisonnière. Pensez aussi à tenir vos ordonnances vétérinaires et vos vétérinaires référents à jour dans ce même module.',
      position: 'top',
    },
  ],
};

export const TOUR_EQUIPE: Tutorial = {
  id: 'equipe',
  name: 'Équipe',
  route: '/parametres/equipe',
  steps: [
    {
      id: 'equipe-invite',
      target: '[data-tutorial="equipe-invite"]',
      title: 'Inviter un collaborateur',
      content:
        'Invitez un salarié, un associé ou un comptable par email. Il rejoint votre exploitation et opère sous votre plan, sans abonnement séparé.',
      position: 'bottom',
    },
    {
      id: 'equipe-membres',
      target: '[data-tutorial="equipe-membres"]',
      title: 'Rôles & accès (plan Expert)',
      content:
        'Au-delà du rôle Apiculteur standard, le plan Expert permet des rôles à accès limité : Technicien (terrain uniquement), Comptable (finances uniquement) et Lecture seule — pour donner accès sans donner tous les droits.',
      position: 'top',
    },
  ],
};

export const ALL_TUTORIALS: Tutorial[] = [
  TOUR_PREMIERS_PAS,
  TOUR_PILOTAGE,
  TOUR_RUCHERS,
  TOUR_INTERVENTIONS,
  TOUR_PRODUCTION,
  TOUR_FINANCES,
  TOUR_TRANSHUMANCE,
  TOUR_ELEVAGE,
  TOUR_CONFORMITE,
  TOUR_EQUIPE,
];
