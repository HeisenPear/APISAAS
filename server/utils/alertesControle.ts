// ═══════════════════════════════════════════════════════════════════════════
// LES ALERTES QU'UN CONTRÔLE LÈVE — une seule liste, trois lecteurs.
//
// ⚠️ CE MODULE NAÎT D'UNE RÈGLE QUI SE CONTREDISAIT ELLE-MÊME.
//
// `annulationRegle.ts` dit, en toutes lettres : « ne sont réversibles que les
// types dont le handler n'écrit QUE dans le hub ». Et sa liste blanche contient
// `controle` — dont le gestionnaire lève DEUX alertes, dans la table `alertes`,
// hors du hub.
//
// Ce n'était pas théorique. « ruche 3, j'ai vu des cellules royales » est une
// phrase dictable (`copilote-actions.ts` la reconnaît et pose
// `celluleRoyale = true`) ; `controle` étant déclaré annulable, Maya l'écrivait
// EN AUTONOMIE, levait une alerte « Risque d'essaimage imminent » en priorité
// haute, et proposait « Annuler ». Le clic supprimait la visite et laissait
// l'alerte : l'apiculteur gardait une alerte d'essaimage rattachée à une visite
// qui n'existait plus, sans aucun moyen de faire le lien.
//
// ⚠️ POURQUOI ON REFUSE PLUTÔT QUE DE SUPPRIMER L'ALERTE. On saurait la
// retrouver approximativement — même ruche, même type, postérieure à la visite.
// « Approximativement » suffirait à effacer une alerte sanitaire levée
// entre-temps par une AUTRE visite. Devant ce risque-là, la doctrine du dépôt
// est écrite : mieux vaut un refus qui explique qu'un « c'est annulé » qui ment.
//
// ⚠️ ET POURQUOI UN MODULE À PART, SANS BASE. Trois lecteurs en ont besoin : le
// gestionnaire (qui crée les alertes), la règle d'annulation (qui doit savoir
// s'il y en a eu) et la règle d'autonomie (qui doit cesser d'écrire sans
// confirmation ce qu'elle ne saura pas défaire). Le poser dans le gestionnaire
// aurait forcé les deux règles PURES à importer la base — c'est la leçon de
// `copilote-repercussion.ts`, payée le même jour.
// ═══════════════════════════════════════════════════════════════════════════

/** Le strict nécessaire d'un contrôle pour savoir ce qu'il déclenche. */
export interface DonneesControle {
  celluleRoyale?: boolean | null;
  forceColonie?: number | null;
}

/** Une alerte levée par un contrôle. */
export interface AlerteControle {
  type: 'cellule_royale' | 'colonie_faible';
  titre: string;
  message: string;
  /** Message court, pour la bulle de Maya (le long va dans la table). */
  resume: string;
  priorite: 'haute';
}

/** Sous ce seuil, la colonie est en danger et l'alerte se lève. */
export const FORCE_COLONIE_CRITIQUE = 1;

/**
 * Les alertes qu'un contrôle lève, telles quelles.
 *
 * ⚠️ UNE SEULE LISTE, ET C'EST UNE DUPLICATION SUPPRIMÉE. Le gestionnaire
 * écrivait chaque alerte DEUX fois — une pour la base, une pour la bulle — avec
 * ses titres et ses messages recopiés à quelques mots près. Deux copies d'un
 * même texte, c'est le jour où l'une des deux change.
 */
export function alertesDuControle(donnees: DonneesControle): AlerteControle[] {
  const alertes: AlerteControle[] = [];

  if (donnees.celluleRoyale === true) {
    alertes.push({
      type: 'cellule_royale',
      titre: 'Cellules royales détectées',
      message: "Des cellules royales ont été observées. Risque d'essaimage imminent.",
      resume: "Risque d'essaimage imminent",
      priorite: 'haute',
    });
  }

  const force = donnees.forceColonie;
  if (typeof force === 'number' && force <= FORCE_COLONIE_CRITIQUE) {
    alertes.push({
      type: 'colonie_faible',
      titre: 'Colonie très faible',
      message: `Force colonie évaluée à ${force}/4. Intervention urgente recommandée.`,
      resume: `Force ${force}/4`,
      priorite: 'haute',
    });
  }

  return alertes;
}

/**
 * Combien d'alertes une intervention a-t-elle levées, hors du hub ?
 *
 * ⚠️ LA QUESTION EST POSÉE AU TYPE, PAS À UNE LISTE RECOPIÉE. Les règles
 * d'autonomie et d'annulation n'ont pas à savoir QUELS types ont des effets de
 * bord : elles demandent, et ce module répond. Le jour où un deuxième type
 * lèvera des alertes, il s'inscrit ICI et les deux règles suivent sans être
 * touchées.
 */
export function alertesLeveesPar(
  type: string | null | undefined,
  donnees: DonneesControle | null | undefined,
): number {
  if (type !== 'controle') return 0;
  return alertesDuControle(donnees ?? {}).length;
}
