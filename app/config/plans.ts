export const PLANS = ['decouverte', 'starter', 'pro', 'expert'] as const;
export type Plan = (typeof PLANS)[number];

export interface PlanLimits {
  ruchers: number;
  ruches: number;
  clients: number;
  facturesParMois: number;
  templatesIntervention: number;
  alertesActives: number;
  photosStorageMb: number;
  membresEquipe: number;
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

  // Production & Commerce
  production: boolean;
  tracabiliteLots: boolean;
  stocksBasique: boolean;
  stocksTvaAuto: boolean;
  clients: boolean;
  facturationPdf: boolean;
  comptabiliteAchats: boolean;
  exportFec: boolean;

  // Exports & Médias
  photos: boolean;
  exportCsv: boolean;
  exportXlsx: boolean;
  logoExploitation: boolean;
  bilanAnnuelPdf: boolean;
  registreElevagePdf: boolean;

  // UX & Technique
  syncIcal: boolean;
  qrCodesRuches: boolean;
  couleursRuches: boolean;
  modeOffline: boolean;
  rechercheGlobale: boolean;
  multiUsers: boolean;

  // Conformité Administrative & Modules avancés
  conformiteNapi: boolean;
  ordonnancesVeto: boolean;
  transhumance: boolean;
  elevageReines: boolean;
  bonsLivraison: boolean;

  // Communauté & intra-associatif
  // communauteBase = rejoindre un réseau, partager des stats, recevoir des campagnes
  // campagnesGroupees = créer et gérer des campagnes groupées (commandes, traitements)
  // gestionSyndicat = administration complète du syndicat / de l'association
  communauteBase: boolean;
  campagnesGroupees: boolean;
  gestionSyndicat: boolean;

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
      membresEquipe: 0,
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
      production: false,
      tracabiliteLots: false,
      stocksBasique: false,
      stocksTvaAuto: false,
      clients: false,
      facturationPdf: false,
      comptabiliteAchats: false,
      exportFec: false,
      photos: true,
      exportCsv: false,
      exportXlsx: false,
      logoExploitation: false,
      bilanAnnuelPdf: false,
      registreElevagePdf: true,
      syncIcal: false,
      qrCodesRuches: false,
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
      supportPrioritaire: false,
      accesAnticipe: false,
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
      membresEquipe: 0,
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
      production: true,
      // Qui vend du miel doit pouvoir tracer ses lots (CE 178/2002) —
      // la traçabilité accompagne la facturation dès Starter
      tracabiliteLots: true,
      stocksBasique: true,
      stocksTvaAuto: false,
      clients: true,
      facturationPdf: true,
      comptabiliteAchats: false,
      exportFec: false,
      photos: true,
      exportCsv: true,
      exportXlsx: false,
      logoExploitation: false,
      bilanAnnuelPdf: false,
      registreElevagePdf: true,
      syncIcal: true,
      qrCodesRuches: true,
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
      supportPrioritaire: false,
      accesAnticipe: false,
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
      membresEquipe: 3,
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
      production: true,
      tracabiliteLots: true,
      stocksBasique: true,
      stocksTvaAuto: true,
      clients: true,
      facturationPdf: true,
      comptabiliteAchats: true,
      exportFec: true,
      photos: true,
      exportCsv: true,
      exportXlsx: true,
      logoExploitation: true,
      bilanAnnuelPdf: true,
      registreElevagePdf: true,
      syncIcal: true,
      qrCodesRuches: true,
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
      supportPrioritaire: false,
      accesAnticipe: false,
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
      membresEquipe: Infinity,
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
      production: true,
      tracabiliteLots: true,
      stocksBasique: true,
      stocksTvaAuto: true,
      clients: true,
      facturationPdf: true,
      comptabiliteAchats: true,
      exportFec: true,
      photos: true,
      exportCsv: true,
      exportXlsx: true,
      logoExploitation: true,
      bilanAnnuelPdf: true,
      registreElevagePdf: true,
      syncIcal: true,
      qrCodesRuches: true,
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
      supportPrioritaire: true,
      accesAnticipe: true,
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
    hook: 'Vos ruches, votre carnet en règle',
    cible: 'Le passionné qui démarre proprement — 1 ruche, sans carte bancaire',
    populaire: false,
    bullets: [
      { text: 'Suivez votre colonie : graphiques de suivi + recherche globale', fort: true },
      { text: "Registre d'élevage PDF + déclaration NAPI officiels — conforme dès le 1ᵉʳ jour" },
      { text: '1 ruche · 1 rucher' },
      { text: 'Photos (50 Mo) · couleurs de ruches pour vous repérer' },
      { text: 'Saisie au rucher en 30 s, même hors-ligne' },
      { text: '3 alertes de suivi (pas plus)' },
    ],
    incitation:
      'Une 2ᵉ ruche ou un 1ᵉʳ pot vendu ? Starter (4,99 €/mois) débloque la facturation — mais c’est surtout Pro qui change tout.',
  },
  starter: {
    hook: 'Vendez votre miel — mais avec des limites',
    cible: 'L’amateur qui commercialise un peu, jusqu’à 10 ruches',
    populaire: false,
    bullets: [
      { text: 'Tout Découverte, +', fort: true },
      { text: 'Facturation pro Factur-X 2026 — plafonnée à 10/mois et 20 clients' },
      { text: '10 ruches · 2 ruchers : on y bute vite' },
      { text: 'Traçabilité des lots de miel (CE 178/2002)' },
      { text: 'Interventions groupées + 5 modèles · module Reine · stocks' },
      { text: 'QR ruche · sync iCal · export CSV · alertes illimitées' },
      { text: 'Aucun pilotage de rentabilité ni d’illimité : ça, c’est Pro', fort: true },
    ],
    incitation:
      '+10 €/mois seulement : Pro enlève TOUS les plafonds et vous fait passer de « je saisis » à « je pilote ».',
  },
  pro: {
    hook: 'Tout APIGO, sans aucune limite',
    cible: 'Du passionné au pro : tous ceux qui veulent vraiment piloter leurs ruches',
    populaire: true,
    bullets: [
      {
        text: '☀️ Météo par rucher + meilleur créneau de visite : ouvrez au bon moment, dérangez moins vos abeilles',
        fort: true,
      },
      {
        text: 'Rentabilité par ruche : sachez enfin ce que chaque colonie vous rapporte',
        fort: true,
      },
      {
        text: 'TOUT illimité : ruches, ruchers, clients, factures — plus jamais un plafond',
        fort: true,
      },
      {
        text: 'Corrélation météo ↔ production, comparaison de saisons, prévisionnel de trésorerie',
        fort: true,
      },
      { text: 'Facturation illimitée + TVA auto, export FEC/XLSX, bilan PDF, votre logo' },
      {
        text: 'Équipe (3) en temps réel, transhumance, ordonnances véto, bons de livraison',
      },
      { text: 'Une IA apicole en cours de développement — bientôt à vos côtés' },
    ],
    incitation:
      '60 jours offerts, sans engagement (≈ 0,49 €/jour). Vous élevez des reines ou animez un syndicat ? Expert (29,99 €) va plus loin.',
  },
  expert: {
    hook: 'Génétique vendable & gestion collective',
    cible: 'Grand exploitant, éleveur de reines ou responsable de syndicat',
    populaire: false,
    bullets: [
      {
        text: 'Élevage de reines complet : lignées, greffage, tests, index — la génétique que vous vendez',
        fort: true,
      },
      { text: 'Tout Pro, +' },
      { text: 'Campagnes groupées (commandes & traitements coordonnés)' },
      { text: 'Gestion syndicale & associative des adhérents' },
      { text: 'Équipe illimitée (vs 3 chez Pro) · 20 Go de photos' },
      { text: 'Support prioritaire + accès anticipé aux nouveautés' },
    ],
    incitation:
      'Le plan le plus complet. Si vous n’élevez pas de reines à vendre, Pro (14,99 €) vous suffit largement.',
  },
};

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
