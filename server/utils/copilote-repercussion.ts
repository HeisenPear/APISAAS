// ═══════════════════════════════════════════════════════════════════════════
// LA RÉPERCUSSION D'UNE ÉCRITURE DE MAYA — trois fonctions, aucune base.
//
// ⚠️ CE FICHIER EXISTE POUR QU'UN BANC PUISSE LE MESURER.
//
// Ces trois fonctions vivaient dans `copilote-actions.ts`. C'était le bon
// voisinage sur le papier, et un piège en pratique : le seul banc qui joue la
// route de Maya de bout en bout (`tests/unit/server/api/mayaRoute.test.ts`)
// REMPLACE `copilote-actions` par un double — il doit le faire, ce module ouvre
// la base. Les fonctions de répercussion étaient donc, elles aussi, remplacées
// par un double… c'est-à-dire par une RECOPIE de la règle qu'elles portent. Le
// banc aurait vérifié sa propre copie, indéfiniment verte, pendant que la vraie
// dérivation pouvait rendre n'importe quoi.
//
// Ici, rien n'est importé du serveur : ni `db`, ni un service. Le banc garde son
// double de `copilote-actions` ET mesure la vraie règle.
// ═══════════════════════════════════════════════════════════════════════════

import { MAYA_ACTIONS, type ActionId } from '~~/app/config/maya-actions';
import {
  evenementsDeLaTable,
  evenementsInverses,
  type DataEvent,
} from '~~/app/config/evenements-donnees';

/**
 * Le strict nécessaire d'un résultat d'écriture pour en déduire l'invalidation.
 *
 * Décrit STRUCTURELLEMENT plutôt qu'importé de `copilote-actions` : ce module
 * doit rester libre de toute arête vers un module qui ouvre la base — c'est
 * toute sa raison d'être. `ResultatExecution` le satisfait sans le déclarer.
 */
export interface EcritureMesuree {
  ok: boolean;
  evenements?: readonly DataEvent[];
}

/**
 * CE QUE LE GESTIONNAIRE VIENT D'ÉCRIRE, TRADUIT EN ÉVÉNEMENTS D'ÉCRAN.
 *
 * ⚠️ ON LIT SON RETOUR, ON NE DEVINE PAS. `dispatchHandler` rend un
 * `HandlerResult` qui NOMME les tables touchées (`created`, `updated`) et les
 * alertes levées. `insererInterventionTx` le jetait — d'où l'impossibilité de
 * savoir qu'une division venait de créer une ruche, et donc une ruche née d'une
 * dictée invisible partout, y compris de la jauge de plan qu'elle consomme.
 *
 * ⚠️ UNE TABLE INCONNUE N'EST PAS UN SILENCE. `evenementsDeLaTable` rend `null`
 * dans ce cas, et on le remonte dans `inconnues` : l'appelant décide, et le banc
 * refuse qu'il en existe. « Inconnu ne vaut jamais laisse-passer » — ici la
 * conséquence serait un écran figé sur une donnée périmée, sans un mot.
 */
export function evenementsDuHandler(res: {
  created?: Array<{ table: string }>;
  updated?: Array<{ table: string }>;
  alerts?: unknown[];
}): { evenements: DataEvent[]; inconnues: string[] } {
  const evenements = new Set<DataEvent>();
  const inconnues: string[] = [];
  for (const ligne of [...(res.created ?? []), ...(res.updated ?? [])]) {
    const evts = evenementsDeLaTable(ligne.table);
    if (!evts) {
      inconnues.push(ligne.table);
      continue;
    }
    evts.forEach((e) => evenements.add(e));
  }
  // Une alerte levée change la pastille de la barre latérale et le tableau de
  // bord. C'est le geste automatique le plus fréquent de la saison : sans lui,
  // le compteur d'alertes reste faux quoi qu'on invalide d'autre.
  if (res.alerts?.length) evenements.add('alerte:created');
  return { evenements: [...evenements], inconnues };
}

/**
 * LES ÉVÉNEMENTS D'UNE ÉCRITURE — mesurés s'ils l'ont été, DÉCLARÉS sinon.
 *
 * ⚠️ UN SEUL POINT DE DÉRIVATION, ET C'EST VOULU. Éditer les neuf `return` des
 * primitives aurait marché aujourd'hui et laissé la DIXIÈME muette demain :
 * c'est très exactement le défaut que `ROUTE_EQUIVALENTE` a produit ici — une
 * action oubliée d'une table ne provoque aucune erreur, elle disparaît juste du
 * comportement. En passant par le catalogue, dont le champ `invalide` est
 * OBLIGATOIRE, une action nouvelle ne compile pas tant que personne n'a dit ce
 * qu'elle fait bouger.
 *
 * L'intervention garde la priorité sur sa propre mesure : elle seule sait
 * qu'une division vient de créer une ruche.
 */
export function evenementsDeLEcriture(
  actionId: ActionId,
  res: EcritureMesuree,
): readonly DataEvent[] {
  if (!res.ok) return [];
  if (res.evenements?.length) return res.evenements;
  return MAYA_ACTIONS[actionId].invalide;
}

/**
 * LES ÉVÉNEMENTS D'UNE ANNULATION — les mêmes, retournés.
 *
 * ⚠️ LE CÔTÉ QU'ON OUBLIE, ET LE PLUS TRAÎTRE. Une écriture non répercutée
 * laisse un écran en retard ; une ANNULATION non répercutée laisse à l'écran
 * une ligne qui n'existe plus. L'apiculteur vient de cliquer « Annuler », Maya
 * lui répond « c'est annulé », et la ruche est toujours sur la carte : il ne
 * sait plus laquelle des deux dire vraie, et c'est un état pire que l'inaction.
 *
 * Aucun gestionnaire ne tourne sur ce chemin — les primitives d'annulation
 * suppriment ou restaurent directement — donc rien n'est mesuré : c'est
 * exactement pourquoi le PLANCHER du catalogue doit être non vide.
 */
export function evenementsDeLAnnulation(
  actionId: ActionId,
  res: EcritureMesuree,
): readonly DataEvent[] {
  if (!res.ok) return [];
  return evenementsInverses(MAYA_ACTIONS[actionId].invalide);
}
