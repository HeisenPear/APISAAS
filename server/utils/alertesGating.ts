// ═══════════════════════════════════════════════════════════════════════════
// GATING DES NOTIFICATIONS PAR PLAN — source de vérité unique.
//
// Principe (décision produit) : une notification liée à une FONCTIONNALITÉ ne
// part (push/email) qu'aux plans qui possèdent cette fonctionnalité. Tout ce qui
// touche la SÉCURITÉ / le SANITAIRE du cheptel ou le RÉGLEMENTAIRE reste
// UNIVERSEL (envoyé à tous les plans) — on ne cache pas une alerte varroa ou un
// danger météo à un compte Découverte, c'est la survie des colonies.
//
// IMPORTANT : ce gating s'applique à la DIFFUSION (push/email), PAS à la
// génération. L'alerte est toujours créée et visible dans la cloche in-app
// (source complète + signal d'upsell « passez Pro pour être notifié »). Le point
// d'application unique est `planifierPush` (server/utils/alertesPush.ts).
// ═══════════════════════════════════════════════════════════════════════════

import { hasFeature, minimumPlanFor, type Plan, type PlanFeatures } from '~~/app/config/plans';

/** Portée d'un type d'alerte : soit universelle, soit conditionnée à une feature. */
type PorteeType = keyof PlanFeatures | 'universel';

/**
 * Type d'alerte → fonctionnalité requise pour la DIFFUSION (`'universel'` = tous
 * les plans). Les clés de feature sont validées contre `PlanFeatures` par le
 * compilateur ET par un test de cohérence (alertesGating.test.ts).
 */
export const FEATURE_PAR_TYPE: Record<string, PorteeType> = {
  // ── Universel : sécurité / sanitaire / réglementaire / socle ────────────────
  sante_critique: 'universel',
  maladie_loque: 'universel',
  mortalite_anormale: 'universel',
  meteo_danger: 'universel', // décision produit : push météo pour tous les plans
  napi: 'universel',
  visite_requise: 'universel',
  premiere_visite: 'universel',
  facture_retard: 'universel',
  rdv_rappel: 'universel',
  rappel_saison: 'universel',
  varroa_seuil: 'universel', // sanitaire = survie hivernale, jamais gaté
  maladie_observee: 'universel',
  colonie_orpheline: 'universel',
  pesee_chute: 'universel', // pillage / vol / essaimage → urgent terrain

  // ── Gaté par fonctionnalité ─────────────────────────────────────────────────
  // Balances connectées (Starter+). Elles arrivent avec la refonte du moteur
  // d'alertes et n'avaient aucune portée définie : `porteeDeType` retombait sur
  // « universel », donc un compte Découverte aurait reçu des notifications de
  // capteurs qu'il ne peut pas posséder. Le banc de cohérence l'a attrapé.
  //
  // `balance_vol` est la seule alerte critique du domaine, mais la gater reste
  // juste : sans la fonctionnalité, il n'y a pas de balance, donc pas d'alerte.
  balance_vol: 'balancesConnectees',
  balance_essaimage: 'balancesConnectees',
  balance_miellee: 'balancesConnectees',
  balance_hausse_pleine: 'balancesConnectees',
  balance_batterie: 'balancesConnectees',
  balance_muette: 'balancesConnectees',
  stock_bas: 'stocksBasique', // Starter+
  traitement_fin: 'production', // Starter+
  reine_agee: 'moduleReine', // Starter+
  transhumance_proche: 'transhumance', // Pro+
  meteo_favorable: 'correlationMeteoProd', // Pro+ (confort, in-app seul de toute façon)
  commande_a_cloturer: 'campagnesGroupees', // Expert
};

/**
 * Types URGENTS : poussés ET envoyés par email (canal de secours garanti hors
 * site). Tous universels par construction — un danger vital ne dépend pas du plan.
 */
export const TYPES_URGENTS = new Set<string>([
  'meteo_danger',
  'sante_critique',
  'maladie_loque',
  'mortalite_anormale',
]);

/** Portée d'un type (défaut prudent : universel si le type est inconnu ici). */
export function porteeDeType(type: string): PorteeType {
  return FEATURE_PAR_TYPE[type] ?? 'universel';
}

/**
 * Ce plan peut-il RECEVOIR (push/email) une alerte de ce type ? Universel → oui ;
 * sinon on vérifie la feature associée. Pur.
 */
export function peutRecevoir(plan: Plan, type: string): boolean {
  const portee = porteeDeType(type);
  return portee === 'universel' ? true : hasFeature(plan, portee);
}

/** Ce type est-il URGENT (push + email) ? Pur. */
export function estUrgent(type: string): boolean {
  return TYPES_URGENTS.has(type);
}

/**
 * Plan minimal qui reçoit ce type (pour l'UI : badge « Pro » / « Expert »).
 * Universel → 'decouverte'. Pur.
 */
export function minPlanPourType(type: string): Plan {
  const portee = porteeDeType(type);
  return portee === 'universel' ? 'decouverte' : minimumPlanFor(portee);
}
