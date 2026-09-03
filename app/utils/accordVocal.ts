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
// ─── LA PREMIÈRE VERSION ÉTAIT UN SAC DE MOTS, ET ELLE DISAIT OUI À TORT ────
//
// Elle décomposait les expressions en JETONS — « d'accord » devenait `d` +
// `accord`, « pas maintenant » devenait `pas` + `maintenant` — puis acceptait
// n'importe quelle combinaison de ces jetons. Une sonde jetée sur du français
// parlé ordinaire a rendu le verdict :
//
//     « bon alors »   → OUI      « note ça »  → OUI      « si » → OUI
//     « du coup bon » → OUI      « ça »       → OUI      « y »  → OUI
//     « maintenant »  → NON      « est »      → OUI      « merci » → NON
//
// « bon alors » est une HÉSITATION : c'est ce qu'on dit en réfléchissant, juste
// avant de parler. Si le silence tombe là, l'ancienne version validait une
// écriture en base de production. « maintenant » signifie « oui, tout de
// suite » et valait REFUS — une inversion de sens pure.
//
// La cause est structurelle : décomposer une expression en jetons perd
// l'expression. On CANONICALISE donc les expressions entières d'abord, puis on
// n'accepte plus que des mots qui, SEULS, ne veulent dire qu'une chose.
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

/**
 * LES EXPRESSIONS, remplacées AVANT tout découpage en mots.
 *
 * ⚠️ C'EST L'ÉTAPE QUI MANQUAIT. « pas maintenant » est un refus ; ses deux
 * mots pris séparément ne le sont ni l'un ni l'autre — « maintenant » est même
 * le contraire. Une expression se reconnaît entière, ou pas du tout.
 *
 * L'ordre compte : les expressions les plus longues d'abord, sinon
 * « surtout pas » serait mangé par « pas ».
 */
const EXPRESSIONS: [RegExp, string][] = [
  // ── Refus ────────────────────────────────────────────────────────────────
  [/\bpas du tout\b/g, 'non'],
  [/\bpas maintenant\b/g, 'non'],
  [/\bsurtout pas\b/g, 'non'],
  [/\bnon merci\b/g, 'non'],
  // ── Annulation ───────────────────────────────────────────────────────────
  [/\blaisse tomber\b/g, 'annule'],
  [/\breviens en arriere\b/g, 'annule'],
  // ── Accord ───────────────────────────────────────────────────────────────
  [/\bd accord\b/g, 'oui'],
  [/\bdaccord\b/g, 'oui'],
  [/\bc est bon\b/g, 'oui'],
  [/\bc est ca\b/g, 'oui'],
  [/\bc est parti\b/g, 'oui'],
  [/\btres bien\b/g, 'oui'],
  [/\bvas y\b/g, 'oui'],
  [/\bvasy\b/g, 'oui'],
  [/\ballez y\b/g, 'oui'],
  [/\bje confirme\b/g, 'oui'],
];

/**
 * Mots d'accord — CHACUN doit être sans ambiguïté PRONONCÉ SEUL.
 *
 * ⚠️ LE CRITÈRE D'ENTRÉE EST CELUI-LÀ, ET IL EXCLUT DES MOTS QUI SEMBLAIENT
 * ÉVIDENTS. `note` (« note ça » est un ORDRE, pas un accord), `go`, `ca`, `si`
 * (« si la reine est morte… »), `y`, `est`, `allez` (« allez, montre-moi… »)
 * en ont été retirés : tous rendaient OUI sur des phrases qui ne validaient
 * rien.
 */
const OUI = new Set([
  'oui',
  'ouais',
  'ouaip',
  'ok',
  'okay',
  'oke',
  'confirme',
  'confirmer',
  'valide',
  'valider',
  'enregistre',
  'enregistrer',
  'exact',
  'exactement',
  'parfait',
  'nickel',
  'yes',
  // ⚠️ `voila` A ÉTÉ RETIRÉ, et c'est le critère d'entrée qui l'a exclu.
  // « ben voilà » est bien un acquiescement — mais « voilà » est AUSSI un
  // marqueur de discours (« voilà, donc je disais… »). Le mot échoue donc à la
  // règle « sans ambiguïté prononcé seul », et sur le seul chemin du produit
  // où la parole ÉCRIT, l'ambiguïté ne se garde pas.
]);

/** Refus d'une proposition. Même critère : sans ambiguïté prononcé seul. */
const NON = new Set(['non', 'nan', 'nope', 'jamais', 'stop']);

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
  'efface',
  'supprime',
  'retire',
]);

/**
 * Mots vides : ils entourent une réponse sans la changer.
 *
 * ⚠️ SEULS, ILS NE VALENT RIEN — et c'est la correction principale. « bon »,
 * « alors », « du coup » sont ce qu'on dit en RÉFLÉCHISSANT, avant de parler.
 * Les compter comme accord faisait valider une écriture sur une hésitation.
 * Ici, une réponse entièrement composée de mots vides rend `'autre'`.
 */
const VIDES = new Set([
  'euh',
  'heu',
  'hmm',
  'bah',
  'ben',
  'bon',
  'alors',
  'donc',
  'du',
  'coup',
  'merci',
  'stp',
  's',
  'il',
  'te',
  'vous',
  'plait',
  // Les pronoms d'objet : « efface ça », « annule le », « annule tout ». Ils
  // ne portent aucun sens à eux seuls (« ça » prononcé nu ne répond à rien),
  // mais les retirer du vocabulaire ferait rater des annulations parfaitement
  // claires.
  'ca',
  'le',
  'la',
  'les',
  'l',
  'tout',
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
  let texte = normaliser(phrase);
  for (const [motif, canon] of EXPRESSIONS) texte = texte.replace(motif, canon);

  const mots = texte.split(' ').filter(Boolean);
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

  /**
   * ⚠️ C'EST ICI QUE TOMBENT LES HÉSITATIONS, ET C'EST LA LIGNE LA PLUS
   * IMPORTANTE DU FICHIER.
   *
   * Un énoncé fait uniquement de mots vides — « bon alors », « du coup bon »,
   * « euh » — n'a levé aucun drapeau et arrive ici. C'est exactement ce qu'on
   * dit en RÉFLÉCHISSANT, juste avant de parler ; et comme on hésite en se
   * taisant, c'est précisément là que le silence de fin d'énoncé tombe. Une
   * version antérieure y répondait `'oui'` et écrivait en base de production.
   *
   * ⚠️ UN DRAPEAU `porteur` A ÉTÉ ÉCRIT POUR GARDER CE CAS, PUIS RETIRÉ : deux
   * mutations ont montré qu'il ne gardait rien — ce `return` fait déjà le
   * travail, et le dédoubler donnait seulement l'illusion d'une protection.
   * Un énoncé vide arrive ici par le même chemin.
   */
  return 'autre';
}
