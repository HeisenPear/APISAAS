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

import { ACTIONS_IDS, MAYA_ACTIONS, type ActionId } from '~~/app/config/maya-actions';
import {
  getLimit,
  getPlanConfig,
  hasFeature,
  minimumPlanFor,
  minimumPlanForLimit,
  type Plan,
  type PlanLimits,
} from '~~/app/config/plans';
import { compterRessource } from '~~/server/utils/compteursDePlan';
import { ROUTE_GATES } from '~~/app/config/route-gates';
import type { DrizzleTransaction } from '~~/server/types/interventions';

/**
 * Actions d'écriture de Maya → la route dont elles sont l'équivalent dicté.
 *
 * ⚠️ C'ÉTAIT UN TROU DE SÉCURITÉ SILENCIEUX, ET IL SE DÉGUISAIT EN TYPAGE.
 * La table était écrite à la main, et `ActionGatee` se définissait À PARTIR
 * D'ELLE-MÊME (`keyof typeof ROUTE_EQUIVALENTE`). Une action nouvelle oubliée
 * ici ne produisait donc AUCUNE erreur : elle sortait simplement du type, et
 * devenait NON GATÉE. Une écriture échappant au plan d'abonnement, en silence,
 * pendant que la page tarifs restait exacte.
 *
 * Un type qui se dérive de la liste qu'il est censé garder ne garde rien : il
 * s'adapte à l'oubli au lieu de le signaler.
 *
 * Elle DÉRIVE maintenant du catalogue, où le champ `route` est OBLIGATOIRE —
 * `null` compris. On ne peut plus laisser une action sans porte par
 * distraction : il faut écrire `null` et dire pourquoi (l'intervention le fait,
 * son gating vivant dans `dispatchHandler`).
 */
const ROUTE_EQUIVALENTE = Object.fromEntries(
  ACTIONS_IDS.filter((id) => MAYA_ACTIONS[id].route !== null).map((id) => [
    id,
    MAYA_ACTIONS[id].route as string,
  ]),
) as Partial<Record<ActionId, string>>;

/** Toute action peut être présentée à la porte — celles sans route la traversent. */
export type ActionGatee = ActionId;

/**
 * Comment se dit une limite À VOIX HAUTE.
 *
 * ⚠️ CE DÉFAUT EST NÉ DE SA PROPRE CORRECTION, ET C'EST INSTRUCTIF. Tant que le
 * seul plafond appliqué était `clients`, la phrase « Tu es au plafond de ton
 * plan Starter : 20 clients » se lisait très bien : la clé technique et le mot
 * français étaient le même mot, par chance. En branchant `facturesParMois`, la
 * même ligne se met à dire « 10 facturesParMois » — un identifiant camelCase
 * lâché au milieu d'une conversation, dans un module dont l'en-tête revendique
 * précisément l'inverse (« le refus est une PHRASE, pas un 402 »).
 *
 * Réparer une garde peut donc réveiller un défaut d'écriture qui dormait
 * derrière elle. La table est `Record<keyof PlanLimits, string>` : le
 * compilateur réclame chaque clé, une limite nouvelle ne peut pas arriver sans
 * son mot.
 */
const LIBELLE_LIMITE: Record<keyof PlanLimits, string> = {
  ruchers: 'ruchers',
  ruches: 'ruches',
  clients: 'clients',
  facturesParMois: 'factures ce mois-ci',
  templatesIntervention: 'modèles d’intervention',
  alertesActives: 'alertes actives',
  photosStorageMb: 'Mo de photos',
  membresEquipe: 'membres d’équipe',
  balances: 'balances connectées',
  iaQuestionsParMois: 'questions ce mois-ci',
};

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
  const route = ROUTE_EQUIVALENTE[action];
  // Pas de route équivalente = gating porté ailleurs (cf. `intervention`).
  // Le catalogue l'exige explicitement, ce n'est jamais un oubli.
  if (!route) return null;
  const gate = ROUTE_GATES[route];
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

    // ⚠️ LE TROU ÉTAIT ICI, ET IL ÉTAIT SILENCIEUX. Le compteur local ne
    // savait compter QUE les clients ; pour tout le reste il rendait `null`, et
    // `null` passait — la ligne d'origine disait
    // `if (actuel === null || actuel < max) return null;`. Or `ROUTE_EQUIVALENTE`
    // déclare déjà `vente`, dont la route porte `limit: 'facturesParMois'` :
    // le jour où la vente cesse d'être un squelette, le plafond de factures ne
    // s'applique pas, et rien ne sonne.
    //
    // Les compteurs sont maintenant partagés avec le middleware
    // (`server/utils/compteursDePlan.ts`), et `null` — « je ne sais pas
    // mesurer » — REFUSE. Une porte qui ignore ce qu'elle ne comprend pas
    // n'est pas une porte. Le refus garde sa porte de sortie : il dit ce qui
    // s'est passé et que rien n'a été écrit.
    const actuel = await compterRessource(exec, userId, gate.limit);
    if (actuel === null) {
      return (
        `Je n'arrive pas à vérifier le plafond de ton plan pour ça, et je préfère ` +
        `ne rien enregistrer plutôt que de te faire dépasser sans le savoir. ` +
        `Réessaie dans un instant — ou fais-le depuis la page concernée, elle applique la même règle.`
      );
    }
    if (actuel < max) return null;

    const requis = getPlanConfig(minimumPlanForLimit(gate.limit, actuel + 1)).label;
    return (
      `Tu es au plafond de ton plan ${getPlanConfig(plan).label} : ${max} ${LIBELLE_LIMITE[gate.limit]}. ` +
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
  clients: 'POST /api/clients',
  lots: 'GET /api/production/lots/*',
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
  clients: {
    quoi: 'suivre tes clients, ce qu’ils achètent et ce qu’ils te doivent',
    alternative: 'ton chiffre d’affaires et le total de tes impayés',
  },
  lots: {
    quoi: 'suivre la traçabilité de tes lots, de la récolte au pot',
    alternative: 'le détail de tes récoltes par rucher et par miellée',
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
