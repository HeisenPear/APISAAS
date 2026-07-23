export const PLANS = ['decouverte', 'starter', 'pro', 'expert'] as const;
export type Plan = (typeof PLANS)[number];

/**
 * Sièges d'équipe inclus dans le plan Expert (« forfait juste »). Au-delà,
 * l'agrandissement de l'équipe passe par un contact commercial : on garde un
 * multi-utilisateurs généreux et rentable, sans qu'un unique abonnement Expert
 * soit partagé sans limite entre des dizaines de personnes.
 */
export const SIEGES_EXPERT_INCLUS = 10;

export interface PlanLimits {
  ruchers: number;
  ruches: number;
  clients: number;
  facturesParMois: number;
  templatesIntervention: number;
  alertesActives: number;
  photosStorageMb: number;
  membresEquipe: number;
  /** Balances connectées. Starter en a 2, Pro/Expert sont illimités. */
  balances: number;
  /**
   * Quota RÉSERVÉ au futur mode Claude (IA générative facturée) — NON appliqué
   * aujourd'hui. Le Copilote local (moteur déterministe) est inclus sans limite
   * de questions dès que la feature `copiloteIa` est active.
   *
   * ⚠️ Candidat à la SUPPRESSION : le mode Claude est abandonné et le cap
   * produit est 100 % déterministe (cf. maya-cap-sortie). Laissé tel quel pour
   * ne pas mélanger un nettoyage avec une résolution de fusion.
   */
  iaQuestionsParMois: number;
}

export interface PlanFeatures {
  // Interventions
  interventionsGroupees: boolean;
  templatesIntervention: boolean;
  moduleReine: boolean;

  // Dashboard & Analytics
  scorePredictif: boolean;
  tourneeOptimisee: boolean;
  suggestionsNationales: boolean;
  previsionnelTresorerie: boolean;
  comparaisonAnnuelle: boolean;
  correlationMeteoProd: boolean;
  analyticsRentabilite: boolean;
  // Expert : pilotage dans la durée (3-5 saisons, tendances)
  analyseMultiSaisons: boolean;

  // Production & Commerce
  /**
   * Balances connectées : webhook générique (tout capteur/LoRa), adaptateur
   * BEEP (seule API apicole publique) et import du fichier exporté par les
   * marques à cloud fermé (Optibee, Bee2Beep, Label Abeille, API&CO, Capaz).
   */
  balancesConnectees: boolean;
  production: boolean;
  tracabiliteLots: boolean;
  stocksBasique: boolean;
  stocksTvaAuto: boolean;
  clients: boolean;
  facturationPdf: boolean;
  comptabiliteAchats: boolean;
  // Pro+ : suivi des règlements — import relevé bancaire, rapprochement des factures,
  // passage automatique en « payée », relances d'impayés fiabilisées (PAS de la compta)
  suiviReglements: boolean;

  // Exports & Médias
  photos: boolean;
  exportCsv: boolean;
  exportXlsx: boolean;
  logoExploitation: boolean;
  bilanAnnuelPdf: boolean;
  registreElevagePdf: boolean;

  // UX & Technique
  syncIcal: boolean;
  qrCodesHausses: boolean;
  couleursRuches: boolean;
  modeOffline: boolean;
  rechercheGlobale: boolean;
  multiUsers: boolean;
  // Expert : rôles & accès granulaires pour l'équipe (technicien / comptable / lecture)
  rolesEquipe: boolean;

  // Conformité Administrative & Modules avancés
  conformiteNapi: boolean;
  ordonnancesVeto: boolean;
  transhumance: boolean;
  elevageReines: boolean;
  // Expert : index de sélection chiffré + classement des lignées
  selectionAvancee: boolean;
  bonsLivraison: boolean;

  // Communauté & intra-associatif
  // communauteBase = rejoindre un réseau, partager des stats, recevoir des campagnes
  // campagnesGroupees = créer et gérer des campagnes groupées (commandes, traitements)
  // gestionSyndicat = administration complète du syndicat / de l'association
  communauteBase: boolean;
  campagnesGroupees: boolean;
  gestionSyndicat: boolean;

  // Intelligence artificielle
  /** Copilote IA — assistant conversationnel branché sur les données de l'exploitation */
  copiloteIa: boolean;
  /** Analyse mellifère d'un emplacement (parcelles RPG + score + calendrier de floraisons) */
  analyseMellifere: boolean;

  // Services (affichage tarifs — pas de gate technique)
  supportPrioritaire: boolean;
  accesAnticipe: boolean;
}

export interface PlanConfig {
  id: Plan;
  label: string;
  prix: { mois: number; an: number } | null;
  description: string;
  limites: PlanLimits;
  features: PlanFeatures;
  stripePriceId?: { mois: string; an: string };
  badge?: { label: string; color: string };
}

export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  decouverte: {
    id: 'decouverte',
    label: 'Découverte',
    prix: null,
    description: 'Pour démarrer sans engagement',
    badge: { label: 'Gratuit', color: 'neutral' },
    limites: {
      ruchers: 1,
      ruches: 1,
      clients: 0,
      facturesParMois: 0,
      templatesIntervention: 0,
      alertesActives: 3,
      photosStorageMb: 50,
      balances: 0,
      membresEquipe: 0,
      iaQuestionsParMois: 0,
    },
    features: {
      interventionsGroupees: false,
      templatesIntervention: false,
      moduleReine: false,
      scorePredictif: false,
      tourneeOptimisee: false,
      suggestionsNationales: false,
      previsionnelTresorerie: false,
      comparaisonAnnuelle: false,
      correlationMeteoProd: false,
      analyticsRentabilite: false,
      balancesConnectees: false,
      production: false,
      tracabiliteLots: false,
      stocksBasique: false,
      stocksTvaAuto: false,
      clients: false,
      facturationPdf: false,
      comptabiliteAchats: false,
      suiviReglements: false,
      photos: true,
      exportCsv: false,
      exportXlsx: false,
      logoExploitation: false,
      bilanAnnuelPdf: false,
      registreElevagePdf: true,
      syncIcal: false,
      qrCodesHausses: false,
      couleursRuches: true,
      modeOffline: true,
      rechercheGlobale: true,
      multiUsers: false,
      conformiteNapi: true,
      ordonnancesVeto: false,
      transhumance: false,
      elevageReines: false,
      bonsLivraison: false,
      communauteBase: false,
      campagnesGroupees: false,
      gestionSyndicat: false,
      copiloteIa: false,
      analyseMellifere: false,
      supportPrioritaire: false,
      accesAnticipe: false,
      // Capacités avancées réservées à Expert
      analyseMultiSaisons: false,
      selectionAvancee: false,
      rolesEquipe: false,
    },
  },

  starter: {
    id: 'starter',
    label: 'Starter',
    prix: { mois: 4.99, an: 47.9 },
    description: "Pour l'apiculteur passionné",
    badge: { label: 'Débutant', color: 'neutral' },
    limites: {
      ruchers: 2,
      ruches: 10,
      clients: 20,
      facturesParMois: 10,
      templatesIntervention: 5,
      alertesActives: Infinity,
      photosStorageMb: 250,
      balances: 2,
      membresEquipe: 0,
      iaQuestionsParMois: 5,
    },
    features: {
      interventionsGroupees: true,
      templatesIntervention: true,
      moduleReine: true,
      scorePredictif: false,
      tourneeOptimisee: false,
      suggestionsNationales: false,
      previsionnelTresorerie: false,
      comparaisonAnnuelle: false,
      correlationMeteoProd: false,
      analyticsRentabilite: false,
      balancesConnectees: true,
      production: true,
      // Qui vend du miel doit pouvoir tracer ses lots (CE 178/2002) —
      // la traçabilité accompagne la facturation dès Starter
      tracabiliteLots: true,
      stocksBasique: true,
      stocksTvaAuto: false,
      clients: true,
      facturationPdf: true,
      comptabiliteAchats: false,
      suiviReglements: false,
      photos: true,
      exportCsv: true,
      exportXlsx: false,
      logoExploitation: false,
      bilanAnnuelPdf: false,
      registreElevagePdf: true,
      syncIcal: true,
      qrCodesHausses: true,
      couleursRuches: true,
      modeOffline: true,
      rechercheGlobale: true,
      multiUsers: false,
      conformiteNapi: true,
      ordonnancesVeto: false,
      transhumance: false,
      elevageReines: false,
      bonsLivraison: false,
      communauteBase: false,
      campagnesGroupees: false,
      gestionSyndicat: false,
      // Copilote IA inclus dès Starter (moteur local déterministe, sans limite
      // de questions). Le quota iaQuestionsParMois ne servira qu'au futur mode Claude.
      copiloteIa: true,
      analyseMellifere: false,
      supportPrioritaire: false,
      accesAnticipe: false,
      // Capacités avancées réservées à Expert
      analyseMultiSaisons: false,
      selectionAvancee: false,
      rolesEquipe: false,
    },
  },

  pro: {
    id: 'pro',
    label: 'Pro',
    prix: { mois: 14.99, an: 143.9 },
    description: "Pour l'exploitation professionnelle",
    badge: { label: 'Recommandé', color: 'primary' },
    limites: {
      ruchers: Infinity,
      ruches: Infinity,
      clients: Infinity,
      facturesParMois: Infinity,
      templatesIntervention: Infinity,
      alertesActives: Infinity,
      photosStorageMb: 5120,
      balances: Infinity,
      membresEquipe: 3,
      iaQuestionsParMois: 200,
    },
    features: {
      interventionsGroupees: true,
      templatesIntervention: true,
      moduleReine: true,
      scorePredictif: true,
      tourneeOptimisee: true,
      suggestionsNationales: true,
      previsionnelTresorerie: true,
      // Un pro compare ses saisons et croise météo/production — ces deux
      // analytics descendent d'Expert vers Pro
      comparaisonAnnuelle: true,
      correlationMeteoProd: true,
      analyticsRentabilite: true,
      balancesConnectees: true,
      production: true,
      tracabiliteLots: true,
      stocksBasique: true,
      stocksTvaAuto: true,
      clients: true,
      facturationPdf: true,
      comptabiliteAchats: true,
      suiviReglements: true,
      photos: true,
      exportCsv: true,
      exportXlsx: true,
      logoExploitation: true,
      bilanAnnuelPdf: true,
      registreElevagePdf: true,
      syncIcal: true,
      qrCodesHausses: true,
      couleursRuches: true,
      modeOffline: true,
      rechercheGlobale: true,
      multiUsers: true,
      conformiteNapi: true,
      ordonnancesVeto: true,
      transhumance: true,
      elevageReines: false,
      bonsLivraison: true,
      communauteBase: true,
      campagnesGroupees: false,
      gestionSyndicat: false,
      copiloteIa: true,
      analyseMellifere: true,
      supportPrioritaire: false,
      accesAnticipe: false,
      // Capacités avancées réservées à Expert
      analyseMultiSaisons: false,
      selectionAvancee: false,
      rolesEquipe: false,
    },
  },

  expert: {
    id: 'expert',
    label: 'Expert',
    prix: { mois: 29.99, an: 287.9 },
    description: 'Pour la grande exploitation',
    badge: { label: 'Illimité', color: 'info' },
    limites: {
      ruchers: Infinity,
      ruches: Infinity,
      clients: Infinity,
      facturesParMois: Infinity,
      templatesIntervention: Infinity,
      alertesActives: Infinity,
      photosStorageMb: 20480,
      balances: Infinity,
      membresEquipe: SIEGES_EXPERT_INCLUS,
      iaQuestionsParMois: Infinity,
    },
    features: {
      interventionsGroupees: true,
      templatesIntervention: true,
      moduleReine: true,
      scorePredictif: true,
      tourneeOptimisee: true,
      suggestionsNationales: true,
      previsionnelTresorerie: true,
      comparaisonAnnuelle: true,
      correlationMeteoProd: true,
      analyticsRentabilite: true,
      balancesConnectees: true,
      production: true,
      tracabiliteLots: true,
      stocksBasique: true,
      stocksTvaAuto: true,
      clients: true,
      facturationPdf: true,
      comptabiliteAchats: true,
      suiviReglements: true,
      photos: true,
      exportCsv: true,
      exportXlsx: true,
      logoExploitation: true,
      bilanAnnuelPdf: true,
      registreElevagePdf: true,
      syncIcal: true,
      qrCodesHausses: true,
      couleursRuches: true,
      modeOffline: true,
      rechercheGlobale: true,
      multiUsers: true,
      conformiteNapi: true,
      ordonnancesVeto: true,
      transhumance: true,
      elevageReines: true,
      bonsLivraison: true,
      communauteBase: true,
      campagnesGroupees: true,
      gestionSyndicat: true,
      copiloteIa: true,
      analyseMellifere: true,
      supportPrioritaire: true,
      accesAnticipe: true,
      // Capacités avancées réservées à Expert
      analyseMultiSaisons: true,
      selectionAvancee: true,
      rolesEquipe: true,
    },
  },
};

// ─── COPIE MARKETING (source unique pour les grilles tarifaires) ──────────────
// Échelle de valeur pensée pour la conversion ET la montée en gamme : chaque
// plan reprend « Tout {plan inférieur}, + » puis ses nouveautés, et une phrase
// d'incitation pousse vers le plan du dessus. Chaque argument reflète une
// capacité livrée, ou est explicitement marqué « en développement ».

export interface PlanMarketing {
  /** Accroche courte qui donne envie. */
  hook: string;
  /** À qui s'adresse le plan. */
  cible: string;
  /** Plan mis en avant (« Le plus populaire »). */
  populaire: boolean;
  /** Arguments ordonnés du + au − désirable. `fort` = mis en gras. */
  bullets: { text: string; fort?: boolean }[];
  /** Phrase qui pousse vers le plan du dessus. */
  incitation: string;
}

export const PLAN_MARKETING: Record<Plan, PlanMarketing> = {
  decouverte: {
    hook: 'Votre rucher, en règle et au carnet',
    cible: 'Le passionné qui démarre proprement — 1 ruche, sans carte bancaire',
    populaire: false,
    bullets: [
      {
        text: 'Carnet de suivi complet : interventions, santé des colonies, graphiques',
        fort: true,
      },
      { text: "Registre d'élevage PDF + déclaration NAPI officiels — conforme dès le 1ᵉʳ jour" },
      { text: '1 ruche · 1 rucher · 3 alertes de suivi' },
      { text: 'Photos · couleurs de ruches · recherche globale' },
      { text: 'Saisie au rucher en 30 s, même hors-ligne' },
    ],
    incitation:
      'Une 2ᵉ ruche ou un 1ᵉʳ pot vendu ? Starter (4,99 €) ouvre la facturation — et c’est Pro qui change tout.',
  },
  starter: {
    hook: 'Vendez votre miel, en règle',
    cible: 'L’amateur qui commercialise un peu, jusqu’à 10 ruches',
    populaire: false,
    bullets: [
      { text: 'Tout Découverte, +', fort: true },
      { text: 'Facturation pro Factur-X 2026 (10/mois · 20 clients)' },
      { text: 'Traçabilité des lots de miel (CE 178/2002)' },
      { text: 'Module Reine · interventions groupées + 5 modèles · stocks' },
      { text: 'QR ruche · sync iCal · export CSV · alertes illimitées' },
      { text: '10 ruches · 2 ruchers' },
      { text: 'Le pilotage de rentabilité, lui, c’est Pro', fort: true },
    ],
    incitation:
      '+10 €/mois : Pro lève toutes les limites et vous fait passer de « je saisis » à « je pilote ».',
  },
  pro: {
    hook: 'Pilotez : tout APIGO, sans aucune limite',
    cible: 'Du passionné au pro : ceux qui veulent vraiment piloter leur exploitation',
    populaire: true,
    bullets: [
      {
        text: 'Rentabilité par ruche & par rucher : sachez ce que chaque colonie vous rapporte',
        fort: true,
      },
      {
        text: 'Comparaison entre saisons + corrélation météo ↔ production',
        fort: true,
      },
      {
        text: 'TOUT illimité : ruches, ruchers, clients, factures — plus jamais un plafond',
        fort: true,
      },
      {
        text: '☀️ Météo par rucher + meilleur créneau de visite : ouvrez au bon moment',
        fort: true,
      },
      { text: 'Prévisionnel de trésorerie · tournée optimisée · score prédictif de santé' },
      {
        text: 'Paiements & relances : importez votre relevé bancaire, pointez les factures payées en un clic, relances d’impayés fiabilisées',
        fort: true,
      },
      { text: 'TVA auto, export XLSX/CSV, bilan PDF, votre logo · équipe (3)' },
      { text: 'Transhumance & carte mellifère · ordonnances véto · bons de livraison' },
    ],
    incitation:
      '60 jours offerts, sans engagement (≈ 0,49 €/jour). Vous élevez des reines ou animez un syndicat ? Expert (29,99 €) va plus loin.',
  },
  expert: {
    hook: "L'exploitation à l'échelle, pilotée dans la durée",
    cible: 'Grand exploitant, éleveur de reines ou responsable de syndicat',
    populaire: false,
    bullets: [
      {
        text: 'Tout Pro en illimité — puis le passage à l’échelle de l’entreprise',
        fort: true,
      },
      {
        text: 'Analyse pluriannuelle : tendances sur 3-5 saisons, pas seulement N vs N-1',
        fort: true,
      },
      {
        text: 'Rôles & accès équipe : technicien au rucher, comptable sur la compta, lecture seule — jusqu’à 10 collaborateurs',
        fort: true,
      },
      {
        text: 'Sélection génétique avancée : index standardisé + classement des lignées (vendez vos reines avec une valeur prouvée)',
        fort: true,
      },
      { text: 'Élevage de reines complet : lignées, greffage, tests, index' },
      { text: 'Campagnes groupées & gestion syndicale/associative des adhérents' },
      { text: '20 Go de photos · support prioritaire + accès anticipé aux nouveautés' },
    ],
    incitation:
      'Tout ce que Pro fait, plus la profondeur et l’échelle. Pas d’équipe ni d’élevage à gérer ? Pro (14,99 €) suffit.',
  },
};

// ─── CATALOGUE DE FONCTIONNALITÉS ──────────────────────────────────────────
// Source unique des labels + catégories, consommée par tarifs.vue ET
// fonctionnalites.vue — un seul endroit à mettre à jour quand une feature
// change de nom ou de regroupement.

export const FEATURE_CATEGORIES = [
  'Terrain & interventions',
  'Pilotage & analytics',
  'Production & commerce',
  'Élevage & génétique',
  'Conformité',
  'Équipe & communauté',
  'Services',
] as const;
export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

export interface FeatureCatalogEntry {
  key: keyof PlanFeatures;
  label: string;
  category: FeatureCategory;
  /** Résumé d'une phrase — dos de la carte réversible sur /fonctionnalites. */
  description: string;
}

export const FEATURE_CATALOG: FeatureCatalogEntry[] = [
  {
    key: 'balancesConnectees',
    label: 'Balances connectées',
    category: 'Production & commerce',
    description:
      'Suivez le poids de vos ruches en direct ; la récolte se pré-remplit avec ce que la balance a mesuré.',
  },
  // Terrain & interventions
  {
    key: 'moduleReine',
    label: 'Module Reine',
    category: 'Terrain & interventions',
    description: 'Âge, origine, marquage, état de ponte — et le bon moment pour la remplacer.',
  },
  {
    key: 'interventionsGroupees',
    label: 'Interventions groupées',
    category: 'Terrain & interventions',
    description: 'Notez la même intervention sur plusieurs ruches d’un coup, sans tout ressaisir.',
  },
  {
    key: 'templatesIntervention',
    label: "Modèles d'intervention",
    category: 'Terrain & interventions',
    description: 'Créez vos modèles de visite pour saisir en un tap ce que vous faites souvent.',
  },
  {
    key: 'qrCodesHausses',
    label: 'QR codes hausses (lot + export)',
    category: 'Terrain & interventions',
    description:
      'Un QR par lot de hausses, avec export — la traçabilité de la récolte à l’extraction.',
  },
  {
    key: 'syncIcal',
    label: 'Sync calendrier (iCal)',
    category: 'Terrain & interventions',
    description: 'Vos visites et rappels APIGO dans votre agenda (Google, Apple, Outlook).',
  },
  {
    key: 'photos',
    label: 'Photos (ruches, récoltes, stocks)',
    category: 'Terrain & interventions',
    description:
      'Ajoutez des photos à vos ruches et récoltes — un cadre de couvain vaut mille mots.',
  },
  {
    key: 'modeOffline',
    label: 'Mode hors-ligne',
    category: 'Terrain & interventions',
    description:
      'Travaillez au rucher sans réseau ; tout se synchronise dès que la connexion revient.',
  },
  {
    key: 'couleursRuches',
    label: 'Couleurs de ruches',
    category: 'Terrain & interventions',
    description: 'Une couleur et un nom par ruche pour la repérer d’un coup d’œil.',
  },
  {
    key: 'rechercheGlobale',
    label: 'Recherche globale',
    category: 'Terrain & interventions',
    description: 'Retrouvez une ruche, un client ou une facture en une recherche, depuis partout.',
  },

  // Pilotage & analytics
  {
    key: 'analyticsRentabilite',
    label: 'Rentabilité par ruche & rucher',
    category: 'Pilotage & analytics',
    description: 'Ce que rapporte (ou coûte) chaque ruche et chaque rucher, chiffres à l’appui.',
  },
  {
    key: 'comparaisonAnnuelle',
    label: 'Comparaison entre saisons',
    category: 'Pilotage & analytics',
    description: 'Comparez vos saisons pour repérer tendances et anomalies.',
  },
  {
    key: 'correlationMeteoProd',
    label: 'Corrélation météo ↔ production',
    category: 'Pilotage & analytics',
    description: 'Croisez la météo réelle avec votre production pour comprendre vos miellées.',
  },
  {
    key: 'scorePredictif',
    label: 'Score prédictif de santé (30 j)',
    category: 'Pilotage & analytics',
    description: 'Un score de santé à 30 jours par colonie, pour anticiper plutôt que constater.',
  },
  {
    key: 'tourneeOptimisee',
    label: 'Tournée optimisée du jour',
    category: 'Pilotage & analytics',
    description: 'Les ruches à visiter aujourd’hui, ordonnées pour vous faire gagner du temps.',
  },
  {
    key: 'suggestionsNationales',
    label: 'Suggestions issues des données nationales',
    category: 'Pilotage & analytics',
    description:
      'Des recommandations calées sur les données agrégées et anonymisées de la communauté.',
  },
  {
    key: 'previsionnelTresorerie',
    label: 'Prévisionnel de trésorerie',
    category: 'Pilotage & analytics',
    description: 'Projetez votre trésorerie avec vos dépenses et recettes prévues.',
  },
  {
    key: 'analyseMultiSaisons',
    label: 'Analyse pluriannuelle (3-5 saisons)',
    category: 'Pilotage & analytics',
    description: 'Analysez 3 à 5 saisons d’affilée pour piloter sur le long terme.',
  },

  // Production & commerce
  {
    key: 'production',
    label: 'Module Production',
    category: 'Production & commerce',
    description: 'Gérez miellées, récoltes et lots de miel, du rucher au pot.',
  },
  {
    key: 'tracabiliteLots',
    label: 'Traçabilité des lots (CE 178/2002)',
    category: 'Production & commerce',
    description: 'Traçabilité complète des lots de miel, conforme au règlement CE 178/2002.',
  },
  {
    key: 'stocksBasique',
    label: 'Gestion des stocks',
    category: 'Production & commerce',
    description: 'Suivez pots, cire, candi et matériel, avec seuils d’alerte.',
  },
  {
    key: 'stocksTvaAuto',
    label: 'TVA automatique (stocks)',
    category: 'Production & commerce',
    description: 'La TVA se calcule automatiquement sur vos mouvements de stock.',
  },
  {
    key: 'clients',
    label: 'Gestion clients',
    category: 'Production & commerce',
    description: 'Un fichier clients complet : coordonnées, historique d’achats, ventes.',
  },
  {
    key: 'facturationPdf',
    label: 'Facturation Factur-X 2026',
    category: 'Production & commerce',
    description: 'Factures conformes Factur-X 2026, générées en PDF + XML en un clic.',
  },
  {
    key: 'bonsLivraison',
    label: 'Bons de livraison',
    category: 'Production & commerce',
    description: 'Éditez des bons de livraison liés à vos ventes et à vos lots.',
  },
  {
    key: 'comptabiliteAchats',
    label: 'Suivi des achats & dépenses',
    category: 'Production & commerce',
    description: 'Enregistrez achats et dépenses pour un suivi net de votre activité.',
  },
  {
    key: 'suiviReglements',
    label: 'Paiements & relances (relevé bancaire, pointage, impayés)',
    category: 'Production & commerce',
    description: 'Rapprochez vos relevés bancaires, pointez les paiements, relancez les impayés.',
  },
  {
    key: 'exportCsv',
    label: 'Export CSV',
    category: 'Production & commerce',
    description: 'Exportez vos données en CSV pour vos outils externes.',
  },
  {
    key: 'exportXlsx',
    label: 'Export XLSX',
    category: 'Production & commerce',
    description: 'Exportez en Excel (XLSX), prêt à retravailler.',
  },
  {
    key: 'logoExploitation',
    label: 'Votre logo sur les documents',
    category: 'Production & commerce',
    description: 'Vos factures et documents à vos couleurs, avec votre logo.',
  },
  {
    key: 'bilanAnnuelPdf',
    label: 'Bilan annuel PDF',
    category: 'Production & commerce',
    description: 'Un bilan annuel PDF synthétique de votre exploitation.',
  },

  // Élevage & génétique
  {
    key: 'elevageReines',
    label: 'Généalogie des reines (arbre, lignées)',
    category: 'Élevage & génétique',
    description: 'L’arbre généalogique de vos reines : ascendants, descendants, lignées.',
  },
  {
    key: 'selectionAvancee',
    label: 'Index génétique avancé (9 critères)',
    category: 'Élevage & génétique',
    description:
      'Un index de sélection sur 9 critères, calculé par rapport à votre propre cheptel.',
  },

  // Conformité
  {
    key: 'registreElevagePdf',
    label: "Registre d'élevage PDF",
    category: 'Conformité',
    description: 'Le registre d’élevage réglementaire en PDF (arrêté du 5 juin 2000).',
  },
  {
    key: 'conformiteNapi',
    label: 'Déclaration NAPI officielle',
    category: 'Conformité',
    description: 'Préparez votre déclaration annuelle de ruches (NAPI) officielle.',
  },
  {
    key: 'transhumance',
    label: 'Transhumance & carte mellifère',
    category: 'Conformité',
    description: 'Planifiez vos transhumances et repérez les zones mellifères sur la carte.',
  },
  {
    key: 'ordonnancesVeto',
    label: 'Ordonnances vétérinaires',
    category: 'Conformité',
    description: 'Conservez ordonnances et traitements, prêts pour un contrôle sanitaire.',
  },

  // Équipe & communauté
  {
    key: 'multiUsers',
    label: 'Multi-utilisateurs (équipe)',
    category: 'Équipe & communauté',
    description: 'Travaillez à plusieurs sur la même exploitation.',
  },
  {
    key: 'rolesEquipe',
    label: 'Rôles & accès équipe (technicien, comptable…)',
    category: 'Équipe & communauté',
    description: 'Donnez à chacun ses accès : technicien, comptable, lecteur — chacun son rôle.',
  },
  {
    key: 'communauteBase',
    label: 'Benchmarks régionaux anonymisés',
    category: 'Équipe & communauté',
    description: 'Situez vos performances face à des repères régionaux anonymisés.',
  },
  {
    key: 'campagnesGroupees',
    label: 'Campagnes groupées',
    category: 'Équipe & communauté',
    description: 'Organisez des campagnes de vente ou de commande groupées.',
  },
  {
    key: 'gestionSyndicat',
    label: 'Gestion syndicale & associative',
    category: 'Équipe & communauté',
    description: 'Des outils pour syndicats et associations : suivi collectif, adhérents.',
  },

  // Services
  {
    key: 'supportPrioritaire',
    label: 'Support prioritaire & dédié',
    category: 'Services',
    description: 'Un support prioritaire et dédié quand vous en avez besoin.',
  },
  {
    key: 'accesAnticipe',
    label: 'Accès anticipé aux nouveautés',
    category: 'Services',
    description: 'Accédez en avant-première aux nouvelles fonctionnalités.',
  },
];

/** Regroupe FEATURE_CATALOG par catégorie, dans l'ordre de FEATURE_CATEGORIES. */
export function getFeatureCatalogByCategory(): {
  category: FeatureCategory;
  features: FeatureCatalogEntry[];
}[] {
  return FEATURE_CATEGORIES.map((category) => ({
    category,
    features: FEATURE_CATALOG.filter((f) => f.category === category),
  }));
}

export function formatStorageLimit(mb: number): string {
  return mb >= 1024 ? `${mb / 1024} Go` : `${mb} Mo`;
}

export function formatEquipeLimit(membres: number): string {
  if (membres === Infinity) return 'Équipe illimitée';
  if (membres > 0) return `Jusqu'à ${membres} membres`;
  return 'Utilisateur unique';
}

// ─── HELPERS ────────────────────────────────────────────────

export function getPlanConfig(plan: Plan): PlanConfig {
  return PLAN_CONFIGS[plan];
}

export function hasFeature(plan: Plan, feature: keyof PlanFeatures): boolean {
  return PLAN_CONFIGS[plan].features[feature];
}

export function getLimit(plan: Plan, limit: keyof PlanLimits): number {
  return PLAN_CONFIGS[plan].limites[limit];
}

export function minimumPlanFor(feature: keyof PlanFeatures): Plan {
  for (const plan of PLANS) {
    if (PLAN_CONFIGS[plan].features[feature]) return plan;
  }
  return 'expert';
}

export function minimumPlanForLimit(limit: keyof PlanLimits, needed: number): Plan {
  for (const plan of PLANS) {
    if (PLAN_CONFIGS[plan].limites[limit] >= needed) return plan;
  }
  return 'expert';
}

export function planIndex(plan: Plan): number {
  return PLANS.indexOf(plan);
}

export function isPlanAtLeast(current: Plan, required: Plan): boolean {
  return planIndex(current) >= planIndex(required);
}
