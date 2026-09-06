// ═══════════════════════════════════════════════════════════════════════════
// LECTURE D'UN REFUS DE FORMULE (402) — la pièce qui décide s'il y a une sortie.
//
// Extrait de `upgrade-interceptor.client.ts`, pour une raison précise : tant que
// cette logique vivait à l'intérieur du plugin, elle n'était pas exerçable. Le
// banc ne pouvait que CHERCHER des chaînes dans le source — et une campagne de
// mutations l'a réfuté : retirer la prise en charge du verrou de cheptel
// laissait le banc au vert, puisque le nom du code restait présent… dans le
// commentaire qui l'expliquait.
//
// Une règle qu'on ne sait tester qu'en relisant le texte du programme n'est pas
// testée. Ici, elle s'appelle.
// ═══════════════════════════════════════════════════════════════════════════

import type { PlanFeatures, PlanLimits } from '~/config/plans';

export interface RefusDePlan {
  code: 'PLAN_REQUIRED' | 'LIMIT_REACHED';
  feature?: keyof PlanFeatures;
  limit?: keyof PlanLimits;
  current?: number;
  max?: number;
  requiredPlan?: string;
  message?: string;
}

/**
 * Codes de refus émis par le serveur, et ce qu'ils deviennent pour le modal.
 *
 * `RUCHE_VERROUILLEE` (middleware 06, compte rétrogradé qui touche une ruche
 * au-delà de son plafond) est un refus de LIMITE comme un autre. Il n'était
 * reconnu nulle part côté client : pas de modal, et la phrase rédigée par le
 * serveur remplacée par un « Ruche verrouillée » sec. Le serveur préparait
 * pourtant `limit`, `max`, `requiredPlan` et la promesse qui compte — « cette
 * ruche reste enregistrée ». Un blocage sans porte de sortie, ce que le produit
 * s'interdit.
 */
const CORRESPONDANCE: Record<string, RefusDePlan['code']> = {
  PLAN_REQUIRED: 'PLAN_REQUIRED',
  LIMIT_REACHED: 'LIMIT_REACHED',
  RUCHE_VERROUILLEE: 'LIMIT_REACHED',
};

/** Le corps d'un 402, tel que h3 ou un handler direct le renvoie. */
type CorpsRefus =
  | { code?: string; data?: (Partial<RefusDePlan> & { code?: string }) | undefined }
  | undefined;

/**
 * Lit le corps d'une réponse 402 et rend le refus à présenter, ou `null` si ce
 * 402 n'est pas un refus de formule (il en existe : le webhook des balances en
 * lève un pour un capteur dont le compte n'a pas la fonctionnalité — il n'y a
 * aucun humain devant, donc aucun modal à ouvrir).
 */
export function lireRefusDePlan(corps: unknown): RefusDePlan | null {
  // Le corps arrive sous deux formes selon l'émetteur : `createError` de h3
  // imbrique sous `data`, certains handlers renvoient à plat.
  const body = corps as CorpsRefus;
  const charge = body?.data ?? (body as (Partial<RefusDePlan> & { code?: string }) | undefined);
  const brut = charge?.code ?? body?.code;
  const code = brut ? CORRESPONDANCE[brut] : undefined;
  if (!code) return null;

  return {
    code,
    feature: charge?.feature,
    limit: charge?.limit,
    current: charge?.current,
    max: charge?.max,
    requiredPlan: charge?.requiredPlan,
    message: charge?.message,
  };
}

/** Les codes serveur pris en charge — sert au banc de couverture inverse. */
export const CODES_REFUS_CONNUS = Object.keys(CORRESPONDANCE);
