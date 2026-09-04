/**
 * COMMENT SE DIT UNE LIMITE DE PLAN, À VOIX HAUTE.
 *
 * Ce fichier ne contient QUE des données — aucune fonction, aucun import de
 * serveur. C'est ce qui lui permet d'être lu des deux côtés de la frontière,
 * et c'est toute sa raison d'être.
 *
 * ⚠️ CETTE TABLE VIVAIT DANS `server/utils/copilote-gating.ts`, ET LE CLIENT
 * NE LA VOYAIT PAS. Maya disait donc, correctement, « tu es au plafond de ton
 * plan Starter : 10 factures ce mois-ci » — pendant que la fenêtre
 * d'abonnement, sur le même compte et pour le même refus, affichait :
 *
 *     « Votre formule Découverte en autorise 10 (facturesParMois) »
 *
 * Un identifiant camelCase lâché dans une phrase commerciale, sur l'écran qui
 * demande à l'apiculteur de payer. La règle du dépôt est pourtant écrite :
 * « le refus est une PHRASE, jamais un code. Et jamais un identifiant
 * technique : “10 factures ce mois-ci”, pas “10 facturesParMois” ». Elle
 * était respectée d'un côté seulement — la duplication ici n'était pas une
 * seconde table, c'était une table et un TROU.
 *
 * ⚠️ ET LE DÉFAUT ÉTAIT NÉ DE SA PROPRE CORRECTION. Tant que le seul plafond
 * appliqué était `clients`, la phrase se lisait très bien : la clé technique
 * et le mot français étaient le même mot, par chance. Brancher
 * `facturesParMois` a réveillé un défaut d'écriture qui dormait derrière la
 * garde manquante.
 *
 * Le type `Record<keyof PlanLimits, string>` fait réclamer chaque clé par le
 * compilateur : une limite nouvelle ne peut pas arriver sans son mot.
 */
import type { PlanLimits } from './plans';

export const LIBELLE_LIMITE: Record<keyof PlanLimits, string> = {
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
 * Le mot d'une limite, ou un repli neutre si la clé est inconnue.
 *
 * ⚠️ LE REPLI EST UN MOT FRANÇAIS, PAS LA CLÉ. Rendre l'identifiant « au cas
 * où » remettrait exactement le défaut qu'on répare : mieux vaut « éléments »,
 * vague mais lisible, qu'un `camelCase` affiché à un client.
 */
export function libelleLimite(cle: string | null | undefined): string {
  if (!cle) return 'éléments';
  return LIBELLE_LIMITE[cle as keyof PlanLimits] ?? 'éléments';
}
