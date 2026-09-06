// ═══════════════════════════════════════════════════════════════════════════
// LES COMPTEURS PREMIUM DU TABLEAU DE BORD.
//
// Extrait du handler pour être TESTABLE. La règle vivait en ligne dans
// `/api/dashboard`, et le banc qui prétendait la couvrir la redéclarait puis la
// vérifiait contre elle-même — il serait resté vert avec un handler vide.
//
// Ici, il n'y a qu'une définition : celle que la production applique.
// ═══════════════════════════════════════════════════════════════════════════

import { hasFeature, type Plan, type PlanFeatures } from '~~/app/config/plans';

/** Compteur du tableau de bord → feature qui rend sa valeur légitime. */
export const FEATURE_PAR_COMPTEUR = {
  reines: 'elevageReines',
  reinesInseminees: 'elevageReines',
  reinesARemplacer: 'elevageReines',
  lignees: 'elevageReines',
  cellulesAcceptees: 'elevageReines',
  transhumancesPrevues: 'transhumance',
} as const satisfies Record<string, keyof PlanFeatures>;

export type CompteurPremium = keyof typeof FEATURE_PAR_COMPTEUR;

/**
 * Rend la valeur si la formule comprend le compteur, zéro sinon.
 *
 * Zéro et non `null` : le contrat de l'API reste numérique, et aucun widget de
 * ces familles n'est affiché aux plans concernés. Un compte RÉTROGRADÉ cesse
 * ainsi de voir ses anciens chiffres dans la réponse brute — c'est le seul cas
 * où la fuite était réelle, un compte qui n'a jamais eu la fonctionnalité ayant
 * de toute façon des compteurs à zéro.
 */
export function servirCompteur(plan: Plan, compteur: CompteurPremium, valeur: number): number {
  return hasFeature(plan, FEATURE_PAR_COMPTEUR[compteur]) ? valeur : 0;
}
