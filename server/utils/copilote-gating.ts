// ═══════════════════════════════════════════════════════════════════════════
// LES ÉCRITURES DE MAYA PASSENT PAR LES MÊMES PORTES QUE LES ROUTES.
//
// `/api/ia/copilote` n'est gatée que sur la feature `copiloteIa`. Une fois
// entré, on pouvait dicter à Maya tout ce que les routes directes refusent :
// créer un client au-delà du plafond du plan (`POST /api/clients` est pourtant
// gatée `{ feature: 'clients', limit: 'clients' }`), enregistrer une récolte
// sans la feature `production`, un mouvement de stock sans `stocksBasique`.
// Le RBAC d'espace était bien reporté sur l'action ; le PLAN, non.
//
// La règle de gating n'est PAS redéclarée ici : elle est LUE dans
// `ROUTE_GATES`, via la route équivalente. Deux tables qui décrivent la même
// règle finissent toujours par diverger — et c'est la divergence, pas la
// règle, qui ouvre les trous. Changer le gate d'une route change donc aussi
// celui de Maya, sans que personne n'ait à y penser.
//
// Le refus est une PHRASE, pas un 402. Maya est une conversation : un code
// d'erreur brut y serait un mur sec. Elle dit ce qui manque, pourquoi, et ce
// qu'il faut faire — il y a toujours une porte de sortie.
// ═══════════════════════════════════════════════════════════════════════════

import { eq, sql } from 'drizzle-orm';
import { clients } from '~~/server/database/schema';
import {
  getLimit,
  getPlanConfig,
  hasFeature,
  minimumPlanFor,
  minimumPlanForLimit,
  type Plan,
  type PlanLimits,
} from '~~/app/config/plans';
import { ROUTE_GATES } from '~~/app/config/route-gates';
import type { DrizzleTransaction } from '~~/server/types/interventions';

/** Actions d'écriture de Maya → la route dont elles sont l'équivalent dicté. */
const ROUTE_EQUIVALENTE = {
  client: 'POST /api/clients',
  recolte: 'POST /api/production/recoltes',
  stock: 'POST /api/stocks',
  vente: 'POST /api/finances/ventes',
  // `intervention` n'est pas ici : elle passe par `dispatchHandler`, qui porte
  // déjà ses propres gates par catégorie (`recolte` → production, `reine` →
  // moduleReine) et le plafond de cheptel sur `division`.
} as const;

export type ActionGatee = keyof typeof ROUTE_EQUIVALENTE;

/** Compteurs de ressource, alignés sur `countUserResource` du middleware 04. */
async function compter(
  exec: DrizzleTransaction,
  userId: string,
  limite: keyof PlanLimits,
): Promise<number | null> {
  // Seul `clients` est atteignable par une écriture Maya aujourd'hui. Les
  // autres limites renverraient un compte faux plutôt qu'une absence de
  // compte : on préfère ne pas appliquer que d'appliquer de travers.
  if (limite !== 'clients') return null;

  const rows = await exec
    .select({ count: sql<number>`count(*)::int` })
    .from(clients)
    .where(eq(clients.userId, userId));
  return rows[0]?.count ?? 0;
}

/**
 * Renvoie une phrase de refus si le plan ne couvre pas cette écriture, sinon
 * `null`. À appeler AVANT toute écriture, avec la transaction en cours pour
 * que N étapes d'un même lot se cumulent (une séquence qui crée 5 clients ne
 * doit pas passer 5 fois le même contrôle sur un compteur figé).
 */
export async function refusDePlan(
  exec: DrizzleTransaction,
  userId: string,
  action: ActionGatee,
  plan: Plan,
): Promise<string | null> {
  const gate = ROUTE_GATES[ROUTE_EQUIVALENTE[action]];
  if (!gate) return null;

  if (gate.feature && !hasFeature(plan, gate.feature)) {
    const requis = getPlanConfig(minimumPlanFor(gate.feature)).label;
    return (
      `Je ne peux pas enregistrer ça : ton plan ${getPlanConfig(plan).label} ne comprend pas ` +
      `cette fonctionnalité. Elle arrive avec le plan ${requis} — tu peux changer de formule ` +
      `depuis Réglages › Abonnement, et je m'en occupe juste après.`
    );
  }

  if (gate.limit) {
    const max = getLimit(plan, gate.limit);
    if (max === Infinity) return null;

    const actuel = await compter(exec, userId, gate.limit);
    if (actuel === null || actuel < max) return null;

    const requis = getPlanConfig(minimumPlanForLimit(gate.limit, actuel + 1)).label;
    return (
      `Tu es au plafond de ton plan ${getPlanConfig(plan).label} : ${max} ${gate.limit}. ` +
      `Le plan ${requis} lève cette limite — depuis Réglages › Abonnement. ` +
      `Tes données restent intactes, rien n'est perdu.`
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ET LES LECTURES, AUSSI.
//
// Le module ne gardait que les ÉCRITURES. C'était un angle mort : une capacité
// peut être vendue par plan sans rien écrire. La projection de santé en est
// l'exemple exact — `GET /api/ruches/*/prediction` est gatée `scorePredictif`,
// et une intention Maya servant la même donnée l'aurait offerte à tous les
// plans. Le catalogue serait resté intact sur la page tarifs, et contourné en
// une phrase dans la conversation.
//
// Même principe que pour les écritures : la règle n'est pas redéclarée ici, on
// LIT `ROUTE_GATES` via la route équivalente. Changer le gate de la route
// change celui de Maya, sans que personne n'ait à y penser.
// ═══════════════════════════════════════════════════════════════════════════

/** Intentions de LECTURE de Maya → la route dont elles servent la donnée. */
const ROUTE_LECTURE = {
  prediction: 'GET /api/ruches/*/prediction',
  reines: 'PUT /api/ruches/*/reine',
  elevage: 'GET /api/elevage/classement',
  balances: 'PUT /api/balances/*',
  transhumance: 'POST /api/transhumance/plans',
} as const;

export type LectureGatee = keyof typeof ROUTE_LECTURE;

/**
 * Phrase de refus si le plan ne couvre pas cette lecture, sinon `null`.
 *
 * Le refus NOMME le plan qui débloque et dit où changer de formule : bloquer
 * sans porte de sortie transforme une limite commerciale en cul-de-sac.
 */
/**
 * Ce que Maya sait faire à la place, quand elle refuse.
 *
 * Un refus qui s'arrête au « non » laisse l'apiculteur devant un mur. Chaque
 * capacité gatée nomme donc ce qui reste accessible dans son plan actuel —
 * c'est souvent une réponse voisine qui suffit à sa question du jour.
 */
const REPLI: Record<LectureGatee, { quoi: string; alternative: string }> = {
  prediction: {
    quoi: 'projeter l’état de tes colonies à 30 jours',
    alternative: 'un point santé sur l’état actuel',
  },
  reines: {
    quoi: 'suivre l’âge et le marquage de tes reines',
    alternative: 'un point santé, qui signale déjà les colonies sans ponte',
  },
  elevage: {
    quoi: 'suivre tes sessions de greffage et ton taux d’acceptation',
    alternative: 'le détail de tes interventions, greffages compris',
  },
  balances: {
    quoi: 'suivre le poids de tes ruches en direct',
    alternative: 'ta production récoltée, saisie à la main',
  },
  transhumance: {
    quoi: 'suivre tes déplacements, tes emplacements et leur rendement',
    alternative: 'la liste de tes ruchers et leur état',
  },
};

export function refusDeLecture(plan: Plan, lecture: LectureGatee): string | null {
  const gate = ROUTE_GATES[ROUTE_LECTURE[lecture]];
  if (!gate?.feature) return null;
  if (hasFeature(plan, gate.feature)) return null;

  const requis = getPlanConfig(minimumPlanFor(gate.feature)).label;
  const { quoi, alternative } = REPLI[lecture];
  return (
    `Je sais ${quoi}, mais ton plan ${getPlanConfig(plan).label} ne comprend pas ` +
    `encore cette fonctionnalité. Elle arrive avec le plan ${requis} — depuis ` +
    `Réglages › Abonnement. En attendant, je peux te donner ${alternative} : demande-le-moi.`
  );
}
