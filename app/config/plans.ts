export const PLANS = ['decouverte', 'starter', 'pro', 'expert'] as const;
export type Plan = (typeof PLANS)[number];

export interface PlanLimits {
  ruchers: number;
  ruches: number;
  clients: number;
  facturesParMois: number;
  templatesIntervention: number;
  interventionGroupeeMaxRuches: number;
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
  chartsEcharts: boolean;
  scorePredictif: boolean;
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
  // Organisation multi-sites (étape 1 : regroupement géographique des ruchers)
  gestionMultiSites: boolean;

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
      interventionGroupeeMaxRuches: 0,
      alertesActives: 3,
      photosStorageMb: 50,
      membresEquipe: 0,
    },
    features: {
      interventionsGroupees: false,
      templatesIntervention: false,
      moduleReine: false,
      chartsEcharts: true,
      scorePredictif: false,
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
      gestionMultiSites: false,
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
      interventionGroupeeMaxRuches: 10,
      alertesActives: Infinity,
      photosStorageMb: 250,
      membresEquipe: 0,
    },
    features: {
      interventionsGroupees: true,
      templatesIntervention: true,
      moduleReine: true,
      chartsEcharts: true,
      scorePredictif: false,
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
      gestionMultiSites: false,
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
      interventionGroupeeMaxRuches: Infinity,
      alertesActives: Infinity,
      photosStorageMb: 5120,
      membresEquipe: 3,
    },
    features: {
      interventionsGroupees: true,
      templatesIntervention: true,
      moduleReine: true,
      chartsEcharts: true,
      scorePredictif: true,
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
      gestionMultiSites: false,
      supportPrioritaire: false,
      accesAnticipe: false,
    },
  },

  expert: {
    id: 'expert',
    label: 'Expert',
    prix: { mois: 29.99, an: 299.88 },
    description: 'Pour la grande exploitation',
    badge: { label: 'Illimité', color: 'info' },
    limites: {
      ruchers: Infinity,
      ruches: Infinity,
      clients: Infinity,
      facturesParMois: Infinity,
      templatesIntervention: Infinity,
      interventionGroupeeMaxRuches: Infinity,
      alertesActives: Infinity,
      photosStorageMb: 20480,
      membresEquipe: Infinity,
    },
    features: {
      interventionsGroupees: true,
      templatesIntervention: true,
      moduleReine: true,
      chartsEcharts: true,
      scorePredictif: true,
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
      gestionMultiSites: true,
      supportPrioritaire: true,
      accesAnticipe: true,
    },
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
