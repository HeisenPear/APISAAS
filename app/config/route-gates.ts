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

  // Balances connectées
  // NB : /api/balances/ingest/* est volontairement ABSENT — cette route est
  // authentifiée par un token d'appareil, pas par une session, et vérifie
  // elle-même le plan du propriétaire de la balance.
  'POST /api/balances': { feature: 'balancesConnectees', limit: 'balances' },
  'PUT /api/balances/*': { feature: 'balancesConnectees' },
  'DELETE /api/balances/*': { feature: 'balancesConnectees' },
  'POST /api/balances/*/import': { feature: 'balancesConnectees' },
  'POST /api/balances/connexions': { feature: 'balancesConnectees' },
  'POST /api/balances/sync': { feature: 'balancesConnectees' },

  // Stocks
  'POST /api/stocks': { feature: 'stocksBasique' },
  // Un mouvement porte sur un stock EXISTANT, dont la création est déjà gatée.
  // On le gate quand même : un gate absent ne se signale pas, et c'est
  // exactement ce qui a laissé passer le 3 août. Aucun risque de faux blocage —
  // sans la feature, il n'y a aucun stock à mouvementer.
  'POST /api/stocks/mouvements': { feature: 'stocksBasique' },
  // Le catalogue produits est la liste de référence DERRIÈRE les stocks : il
  // n'est lu que par `useCatalogueProduits`, consommé uniquement par la page
  // Stocks et ses composants. Les écritures suivent donc la même porte.
  'POST /api/catalogue': { feature: 'stocksBasique' },
  'PUT /api/catalogue/*': { feature: 'stocksBasique' },
  'DELETE /api/catalogue/*': { feature: 'stocksBasique' },

  // Clients
  'POST /api/clients': { feature: 'clients', limit: 'clients' },

  // Finances
  'POST /api/finances/ventes': { feature: 'facturationPdf', limit: 'facturesParMois' },
  'POST /api/finances/achats': { feature: 'comptabiliteAchats' },
  'POST /api/bons-livraison': { feature: 'bonsLivraison' },
  // 2e porte de création de facture (BL → facture) : même gating que la vente.
  'POST /api/bons-livraison/*/convertir': { feature: 'facturationPdf', limit: 'facturesParMois' },
  // Facture groupée (N bons d'un même client → 1 facture) : même gating.
  'POST /api/bons-livraison/facturer-groupe': {
    feature: 'facturationPdf',
    limit: 'facturesParMois',
  },

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

  // QR codes hausses : génération en lot + export PDF (Starter+). Le QR simple
  // sur une ruche reste gratuit sur tous les plans (généré client-side, aucune
  // route serveur à gater).
  'POST /api/hausses/generer': { feature: 'qrCodesHausses' },
  'POST /api/hausses/export-qr': { feature: 'qrCodesHausses' },

  // Logo d'exploitation sur les documents (Pro+)
  'POST /api/profils/logo': { feature: 'logoExploitation' },

  // Conformité & modules avancés — ces features étaient affichées dans les
  // plans mais jamais appliquées côté serveur (bypass possible en appelant
  // l'API directement)
  'POST /api/ordonnances': { feature: 'ordonnancesVeto' },
  'PUT /api/ordonnances/*': { feature: 'ordonnancesVeto' },
  'POST /api/transhumance/plans': { feature: 'transhumance' },
  'PUT /api/transhumance/plans/*': { feature: 'transhumance' },
  'POST /api/transhumance/emplacements': { feature: 'transhumance' },
  'PUT /api/transhumance/emplacements/*': { feature: 'transhumance' },
  // Poser des ruchers sur un emplacement, c'est de la transhumance.
  'POST /api/ruchers/deplacer': { feature: 'transhumance' },
  // `POST /api/ruches/deplacer` N'EST VOLONTAIREMENT PAS GATÉ, et ce n'est pas
  // un oubli. Déplacer une ruche entre SES PROPRES ruchers est de la gestion de
  // cheptel, pas de la transhumance — laquelle désigne le déplacement vers un
  // EMPLACEMENT mellifère, ce que couvre la ligne au-dessus.
  //
  // Le gater sur `transhumance` créerait un faux blocage net : Starter dispose
  // de 2 ruchers mais n'a PAS la transhumance ; il ne pourrait donc plus bouger
  // une ruche d'un de ses ruchers à l'autre, alors que sa formule lui vend les
  // deux. Découverte, lui, n'a qu'un seul rucher : il n'a rien à déplacer.
  // La borne naturelle du plan suffit, et le verrou de cheptel limite déjà les
  // ruches atteignables.
  'GET /api/production/lots/*': { feature: 'tracabiliteLots' },
  'PUT /api/production/lots/*': { feature: 'tracabiliteLots' },
  'POST /api/declarations/napi': { feature: 'conformiteNapi' },
  'POST /api/elevage/lignees': { feature: 'elevageReines' },
  'POST /api/elevage/reines': { feature: 'elevageReines' },
  'POST /api/elevage/sessions': { feature: 'elevageReines' },
  'POST /api/elevage/tests': { feature: 'elevageReines' },
  'POST /api/elevage/sessions/*/receptrices': { feature: 'elevageReines' },
  'PUT /api/elevage/sessions/*/receptrices/*': { feature: 'elevageReines' },
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
  // Postes planifiés du prévisionnel : même feature que la projection principale.
  // Sans ça, la projection était gatée mais on pouvait créer/lire les postes
  // planifiés (données premium) en appelant l'API directement.
  'GET /api/finances/tresorerie/previsions': { feature: 'previsionnelTresorerie' },
  // Les paramètres du prévisionnel étaient inscriptibles sans la feature qui
  // permet de le LIRE : un Starter pouvait régler une projection qu'il ne
  // verrait jamais. Écriture et lecture passent désormais la même porte.
  'PUT /api/finances/tresorerie/parametres': { feature: 'previsionnelTresorerie' },
  'POST /api/finances/tresorerie/previsions': { feature: 'previsionnelTresorerie' },
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

  // Intelligence artificielle (copilote Maya — moteur local déterministe)
  'POST /api/ia/copilote': { feature: 'copiloteIa' },
  'GET /api/ia/brief': { feature: 'copiloteIa' },
  'GET /api/ia/fenetres': { feature: 'copiloteIa' },
  'POST /api/ia/fenetres-alerte': { feature: 'copiloteIa' },
  'GET /api/transhumance/analyse-mellifere': { feature: 'analyseMellifere' },

  // Campagnes groupées (module réel : commandes & traitements coordonnés)
  'POST /api/campagnes': { feature: 'campagnesGroupees' },
  // Espace association / syndicat (Expert)
  'POST /api/organisations': { feature: 'gestionSyndicat' },
  'PUT /api/organisations/*': { feature: 'gestionSyndicat' },
  // NB : la seule route de /api/communaute est `benchmarks.get.ts`, non gatée.
  // `routeGatesCouverture.test.ts` vérifie désormais qu'aucune entrée de cette
  // table ne pointe vers une route inexistante — un gate orphelin est un gate
  // qui ne s'applique jamais, donc une fonctionnalité devenue gratuite en
  // silence.
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
