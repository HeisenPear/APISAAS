import type { PlanFeatures, PlanLimits } from './plans';

export interface RouteGate {
  feature?: keyof PlanFeatures;
  limit?: keyof PlanLimits;
}

// Seules les routes de CRÉATION/MODIFICATION sont gatées (les GET passent toujours sauf exception)
export const ROUTE_GATES: Record<string, RouteGate> = {
  // Ruchers
  'POST /api/ruchers': { limit: 'ruchers' },

  // Ruches
  'POST /api/ruches': { limit: 'ruches' },

  // Interventions
  'POST /api/interventions/bulk-group': { feature: 'interventionsGroupees' },
  'POST /api/interventions/templates': {
    feature: 'templatesIntervention',
    limit: 'templatesIntervention',
  },

  // Module Reine
  'POST /api/ruches/*/evenements-reine': { feature: 'moduleReine' },
  'PUT /api/ruches/*/reine': { feature: 'moduleReine' },

  // Production
  'POST /api/production/recoltes': { feature: 'production' },

  // Stocks
  'POST /api/stocks': { feature: 'stocksBasique' },

  // Clients
  'POST /api/clients': { feature: 'clients', limit: 'clients' },

  // Finances
  'POST /api/finances/ventes': { feature: 'facturationPdf', limit: 'facturesParMois' },
  'POST /api/finances/achats': { feature: 'comptabiliteAchats' },
  'POST /api/bons-livraison': { feature: 'bonsLivraison' },
  // 2e porte de création de facture (BL → facture) : même gating que la vente.
  'POST /api/bons-livraison/*/convertir': { feature: 'facturationPdf', limit: 'facturesParMois' },

  // Suivi des règlements (import relevé bancaire, rapprochement, relances) — Pro+
  'POST /api/finances/banque/import': { feature: 'suiviReglements' },
  'GET /api/finances/banque/mouvements': { feature: 'suiviReglements' },
  'GET /api/finances/banque/suggestions': { feature: 'suiviReglements' },
  'GET /api/finances/banque/factures-ouvertes': { feature: 'suiviReglements' },
  'POST /api/finances/banque/rapprocher': { feature: 'suiviReglements' },
  'POST /api/finances/banque/action': { feature: 'suiviReglements' },
  // Connexion bancaire automatique (agrégateur DSP2) — même gate (inerte sans secrets serveur)
  'GET /api/finances/banque/connexion/institutions': { feature: 'suiviReglements' },
  'POST /api/finances/banque/connexion/initier': { feature: 'suiviReglements' },
  'POST /api/finances/banque/connexion/synchroniser': { feature: 'suiviReglements' },

  // Photos (le quota de stockage est vérifié dans la route upload)
  'POST /api/photos/upload': { feature: 'photos' },

  // Conformité & modules avancés — ces features étaient affichées dans les
  // plans mais jamais appliquées côté serveur (bypass possible en appelant
  // l'API directement)
  'POST /api/ordonnances': { feature: 'ordonnancesVeto' },
  'POST /api/transhumance/plans': { feature: 'transhumance' },
  'POST /api/transhumance/emplacements': { feature: 'transhumance' },
  'POST /api/elevage/lignees': { feature: 'elevageReines' },
  'POST /api/elevage/reines': { feature: 'elevageReines' },
  'POST /api/elevage/sessions': { feature: 'elevageReines' },
  'POST /api/elevage/tests': { feature: 'elevageReines' },
  'GET /api/elevage/classement': { feature: 'elevageReines' },
  'GET /api/elevage/selection-avancee': { feature: 'selectionAvancee' },

  // Exports
  'GET /api/export/bilan': { feature: 'bilanAnnuelPdf' },
  'GET /api/export/ruches.xlsx': { feature: 'exportXlsx' },
  'GET /api/finances/export': { feature: 'exportCsv' },

  // Analytics
  'GET /api/analytics': { feature: 'analyticsRentabilite' },
  'GET /api/analytics/meteo': { feature: 'correlationMeteoProd' },
  'GET /api/analytics/pluriannuel': { feature: 'analyseMultiSaisons' },
  'GET /api/finances/tresorerie': { feature: 'previsionnelTresorerie' },
  'GET /api/analytics/suggestions': { feature: 'suggestionsNationales' },
  'GET /api/ruches/*/prediction': { feature: 'scorePredictif' },
  'GET /api/tournee': { feature: 'tourneeOptimisee' },
  'GET /api/transhumance/analyser-point': { feature: 'transhumance' },
  'GET /api/transhumance/butinage': { feature: 'transhumance' },
  'GET /api/transhumance/meteo-point': { feature: 'transhumance' },
  'GET /api/transhumance/top-butinage': { feature: 'transhumance' },
  'GET /api/transhumance/spots-autour': { feature: 'transhumance' },
  'GET /api/communaute/benchmarks': { feature: 'communauteBase' },

  // Calendrier sync
  'POST /api/calendrier/tokens': { feature: 'syncIcal' },

  // Multi-users
  'POST /api/membres/inviter': { feature: 'multiUsers', limit: 'membresEquipe' },

  // Campagnes groupées (module réel : commandes & traitements coordonnés)
  'POST /api/campagnes': { feature: 'campagnesGroupees' },
  // Espace association / syndicat (Expert)
  'POST /api/organisations': { feature: 'gestionSyndicat' },
  'PUT /api/organisations/*': { feature: 'gestionSyndicat' },
  // NB : communauté & gestion syndicale ne sont pas encore implémentées — pas de
  // gate orphelin ici (les routes /api/communaute et /api/syndicat n'existent pas).
};

function compileGatePattern(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+');
  return new RegExp(`^${escaped}$`);
}

// Regex précompilées une fois au chargement du module — le middleware
// subscription les évalue sur chaque requête API
const COMPILED_GATES: Array<{ regex: RegExp; gate: RouteGate }> = Object.entries(ROUTE_GATES).map(
  ([pattern, gate]) => ({ regex: compileGatePattern(pattern), gate }),
);

/**
 * Vérifie si un chemin correspond à un pattern avec wildcards (*).
 */
export function matchGatePattern(pattern: string, methodPath: string): boolean {
  return compileGatePattern(pattern).test(methodPath);
}

/**
 * Cherche le gate correspondant à une route donnée.
 */
export function findMatchingGate(method: string, path: string): RouteGate | null {
  const methodPath = `${method} ${path}`;
  for (const { regex, gate } of COMPILED_GATES) {
    if (regex.test(methodPath)) return gate;
  }
  return null;
}
