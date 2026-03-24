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
  'POST /api/interventions/templates': { feature: 'templatesIntervention' },

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

  // Exports
  'GET /api/export/bilan': { feature: 'bilanAnnuelPdf' },
  'GET /api/export/ruches.xlsx': { feature: 'exportXlsx' },
  'GET /api/finances/export': { feature: 'exportCsv' },

  // Analytics
  'GET /api/analytics': { feature: 'analyticsRentabilite' },
  'GET /api/analytics/suggestions': { feature: 'suggestionsNationales' },
  'GET /api/ruches/*/prediction': { feature: 'scorePredictif' },

  // Calendrier sync
  'POST /api/calendrier/tokens': { feature: 'syncIcal' },

  // Multi-users
  'POST /api/membres/inviter': { feature: 'multiUsers', limit: 'membresEquipe' },
};

/**
 * Vérifie si un chemin correspond à un pattern avec wildcards (*).
 */
export function matchGatePattern(pattern: string, methodPath: string): boolean {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+');
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(methodPath);
}

/**
 * Cherche le gate correspondant à une route donnée.
 */
export function findMatchingGate(method: string, path: string): RouteGate | null {
  const methodPath = `${method} ${path}`;
  for (const [pattern, gate] of Object.entries(ROUTE_GATES)) {
    if (matchGatePattern(pattern, methodPath)) return gate;
  }
  return null;
}
