// ═══════════════════════════════════════════════════════════════════════════
// DIRE OUI, DIRE NON — la réponse à une demande de confirmation, à la voix.
//
// ⚠️ SANS CE MODULE, LA BOUCLE VOCALE S'ARRÊTE NET AU PREMIER GESTE UTILE.
// Maya demande « Je crée le client Jean ? » et attend un clic sur
// « Confirmer » — c'est-à-dire précisément ce que le mode vocal existe pour
// éviter. L'apiculteur a les mains dans une ruche : il s'essuie les mains,
// cherche le téléphone, vise un bouton. Le contact vocal est rompu au moment
// où il servait le plus.
//
// ⚠️ ET « RIEN NE S'ÉCRIT SANS ACCORD » RESTE ENTIER. Un « oui » prononcé EST
// un accord — le même que le clic, donné par la même personne au même moment.
// Ce qui change, c'est le canal ; pas la règle.
//
// ⚠️ LA PRUDENCE EST DANS LA STRICTESSE. Une écriture déclenchée par un « oui »
// mal entendu est une donnée fausse chez un client qui paie. On n'accepte donc
// QUE des réponses courtes et entièrement composées de mots d'accord : « oui »,
// « vas-y », « oui d'accord ». Tout le reste — « oui mais attends », « oui la
// ruche 3 aussi » — est une PHRASE, et une phrase se traite comme une nouvelle
// question, en laissant la confirmation en attente. Le doute ne vaut jamais
// accord.
// ═══════════════════════════════════════════════════════════════════════════

/** Ce que l'apiculteur vient de répondre à une demande de confirmation. */
export type AccordVocal =
  /** Un oui franc : on exécute. */
  | 'oui'
  /** Un non franc : on renonce à la proposition. */
  | 'non'
  /** Une demande explicite de DÉFAIRE ce qui vient d'être écrit. */
  | 'annuler'
  /** Autre chose : ce n'est pas une réponse, c'est une nouvelle phrase. */
  | 'autre';

/** Mots d'accord. Tous doivent tenir seuls — aucun n'est ambigu isolé. */
const OUI = new Set([
  'oui',
  'ouais',
  'ouaip',
  'si',
  'ok',
  'okay',
  'oke',
  'daccord',
  'accord',
  'vas',
  'y',
  'vasy',
  'confirme',
  'confirmer',
  'valide',
  'valider',
  'enregistre',
  'enregistrer',
  'note',
  'exact',
  'parfait',
  'nickel',
  // « c'est bon », « c'est ça » : l'apostrophe est mangée par la
  // normalisation, ces morceaux se présentent donc séparément.
  'est',
  'bon',
  'ca',
  'yes',
  'go',
  'allez',
]);

/** Refus d'une proposition : « non merci », « pas maintenant ». */
const NON = new Set(['non', 'nan', 'nope', 'pas', 'maintenant', 'merci', 'jamais', 'surtout']);

/**
 * Demande de DÉFAIRE. Distincte du refus, et c'est important : après une
 * écriture autonome, Maya propose « Annuler ». Un « non » y serait ambigu — on
 * exige un verbe qui dit vraiment « reviens en arrière ».
 */
const ANNULER = new Set([
  'annule',
  'annuler',
  'annulation',
  'oublie',
  'oublier',
  'retire',
  'efface',
  'supprime',
]);

/** Mots vides : ils accompagnent une réponse sans la changer. */
const VIDES = new Set([
  'euh',
  'heu',
  'bah',
  'ben',
  'alors',
  'donc',
  'et',
  'du',
  'coup',
  'le',
  'te',
  'plait',
  'stp',
  // ⚠️ LES ÉLISIONS, séparées de leur mot par la normalisation qui supprime
  // l'apostrophe : « d'accord » arrive en `d` + `accord`, « c'est bon » en
  // `c` + `est` + `bon`. Sans elles, les deux tournures les plus naturelles
  // du français parlé — celles qu'on emploie justement pour dire oui —
  // repartaient comme des phrases.
  'd',
  'c',
  'j',
  'n',
  'l',
  'm',
  's',
  'qu',
]);

/** Au-delà, ce n'est plus une réponse : c'est une phrase. */
const MOTS_MAX = 5;

function normaliser(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Lit une réponse à une demande de confirmation.
 *
 * Rend `'autre'` dès qu'un seul mot n'appartient pas au vocabulaire de la
 * réponse : c'est ce qui empêche « oui mais la ruche 3 » de valider une
 * écriture que personne n'a validée.
 */
export function lireAccord(phrase: string): AccordVocal {
  const mots = normaliser(phrase).split(' ').filter(Boolean);
  /**
   * ⚠️ SEULE LA LONGUEUR EST GARDÉE ICI, ET C'EST DÉLIBÉRÉ. Un `!mots.length`
   * y figurait ; une mutation a montré qu'il ne gardait RIEN — un énoncé vide
   * ne traverse aucune branche et ressort `'autre'` par construction. Un garde
   * mort est pire qu'un garde absent : il donne l'illusion d'être protégé, et
   * personne ne cherche plus si le silence peut valider une écriture. Ce qui
   * protège vraiment, c'est le `return 'autre'` final, et le banc le mesure
   * par le COMPORTEMENT.
   */
  if (mots.length > MOTS_MAX) return 'autre';

  let oui = false;
  let non = false;
  let annuler = false;

  for (const mot of mots) {
    if (VIDES.has(mot)) continue;
    if (ANNULER.has(mot)) {
      annuler = true;
      continue;
    }
    if (NON.has(mot)) {
      non = true;
      continue;
    }
    if (OUI.has(mot)) {
      oui = true;
      continue;
    }
    // Un mot hors vocabulaire : ce n'est pas une réponse.
    return 'autre';
  }

  /**
   * ⚠️ L'ORDRE DES PRIORITÉS EST UNE DÉCISION DE SÉCURITÉ, PAS UN DÉTAIL.
   *
   * « non annule », « pas ok » : le refus l'emporte toujours sur l'accord.
   * Trancher dans l'autre sens ferait écrire sur une phrase qui contient un
   * « non ». Devant un mélange, on ne fait rien de destructeur — et surtout on
   * n'écrit pas.
   */
  if (annuler) return 'annuler';
  if (non) return 'non';
  if (oui) return 'oui';
  return 'autre';
}
