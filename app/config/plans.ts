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
      supportPrioritaire: true,
      accesAnticipe: true,
    },
  },
};

// ─── COPIE MARKETING (source unique pour les grilles tarifaires) ──────────────
// Échelle de valeur pensée pour la conversion ET la montée en gamme : chaque
// plan reprend « Tout {plan inférieur}, + » puis ses nouveautés, et une phrase
// d'incitation pousse vers le plan du dessus. Chaque argument est VRAI (adossé à
// PLAN_CONFIGS ci-dessus). Vérifié 0 argument faux.

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
    hook: 'Vos ruches, carnet en règle',
    cible: 'Pour démarrer proprement — gratuit pour toujours',
    populaire: false,
    bullets: [
      { text: '1 ruche · 1 rucher', fort: true },
      { text: "Registre d'élevage PDF + déclaration NAPI officiels" },
      { text: 'Graphiques de suivi & recherche globale' },
      { text: 'Photos (50 Mo) · couleurs de ruches' },
      { text: 'Mode hors-ligne intégré' },
      { text: '3 alertes de suivi actives' },
    ],
    incitation:
      'Une 2ᵉ ruche ou un 1ᵉʳ pot vendu ? Passez à Starter (4,99 €/mois) pour facturer et tracer vos lots.',
  },
  starter: {
    hook: 'Vendez votre miel, en règle',
    cible: 'Amateur sérieux qui commercialise (jusqu’à 10 ruches)',
    populaire: false,
    bullets: [
      { text: 'Tout Découverte, +', fort: true },
      { text: '10 ruches · 2 ruchers' },
      { text: 'Facturation PDF pro (10/mois) · 20 clients' },
      { text: 'Traçabilité des lots de miel (CE 178/2002)' },
      { text: 'Interventions groupées + 5 modèles · module Reine' },
      { text: 'Production, stocks, QR ruche, sync iCal, export CSV' },
      { text: 'Alertes illimitées · 250 Mo de photos' },
    ],
    incitation:
      'Vous dépassez 10 ruches — ou vous voulez savoir ce que vos ruches rapportent ? +10 €/mois : Pro lève tous les plafonds et ajoute le pilotage de votre rentabilité.',
  },
  pro: {
    hook: 'L’illimité pour piloter votre exploitation',
    cible: 'Exploitation pro qui pilote sa rentabilité',
    populaire: true,
    bullets: [
      { text: 'Tout Starter, +', fort: true },
      { text: 'Ruches, ruchers, clients & factures illimités', fort: true },
      {
        text: 'Rentabilité par ruche, comparaison annuelle, prévisionnel de trésorerie',
        fort: true,
      },
      { text: 'TVA auto, compta achats, export FEC/XLSX, bilan PDF, logo' },
      { text: 'Équipe (3 membres), transhumance, ordonnances véto, bons de livraison' },
      { text: 'Réseau communautaire · 5 Go de photos' },
      { text: 'IA apicole en cours de développement' },
    ],
    incitation:
      'Vous élevez des reines à vendre ou animez un syndicat ? +15 €/mois : Expert ajoute la génétique vendable et l’équipe illimitée.',
  },
  expert: {
    hook: 'Génétique vendable & gestion collective',
    cible: 'Grand exploitant, éleveur de reines ou syndicat',
    populaire: false,
    bullets: [
      { text: 'Tout Pro, +', fort: true },
      { text: 'Élevage de reines complet (lignées, greffage, tests, index)', fort: true },
      { text: 'Campagnes groupées (commandes & traitements coordonnés)' },
      { text: 'Gestion syndicale & associative des adhérents' },
      { text: 'Équipe illimitée (vs 3 chez Pro) · 20 Go de photos' },
      { text: 'Support prioritaire + accès anticipé aux nouveautés' },
    ],
    incitation:
      'Le plan le plus complet : tout l’illimité de Pro + la génétique et le pilotage de groupe.',
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
