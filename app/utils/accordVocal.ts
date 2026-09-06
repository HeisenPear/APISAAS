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
  /**
   * « On s'arrête là » — la fin de la CONVERSATION, pas d'une action.
   *
   * ⚠️ IL MANQUAIT, ET C'EST UNE IMPASSE : le mode vocal ne se quittait qu'en
   * touchant l'écran. Or il existe précisément pour l'apiculteur qui a les
   * mains dans une ruche. Dire « stop » lui répondait « Je n'ai rien en
   * attente », et le micro restait ouvert indéfiniment.
   */
  | 'terminer'
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
  // ── Fin de conversation ──────────────────────────────────────────────────
  [/\bc est tout\b/g, 'terminus'],
  [/\bau revoir\b/g, 'terminus'],
  [/\bmerci c est tout\b/g, 'terminus'],
  [/\bon s arrete la\b/g, 'terminus'],
  // ── Annulation ───────────────────────────────────────────────────────────
  [/\blaisse tomber\b/g, 'annule'],
  [/\breviens en arriere\b/g, 'annule'],
  // ── Accord ───────────────────────────────────────────────────────────────
  [/\bd accord\b/g, 'oui'],
  [/\bdaccord\b/g, 'oui'],
  [/\bc est bon\b/g, 'oui'],
  [/\bc est ca\b/g, 'oui'],
  [/\bc est parti\b/g, 'oui'],
  // ⚠️ AJOUTÉE APRÈS LA SONDE : « ça marche » est l'un des accords les plus
  // courants du français parlé, et il tombait dans « autre » — l'apiculteur
  // disait oui, Maya faisait la sourde oreille et repartait sur une question.
  // Un mode vocal qui n'entend pas le oui le plus naturel n'est pas un mode.
  [/\bca marche\b/g, 'oui'],
  [/\bca me va\b/g, 'oui'],
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
const NON = new Set(['non', 'nan', 'nope', 'jamais']);

/**
 * Fin de la conversation vocale.
 *
 * ⚠️ `stop` A DÉMÉNAGÉ DEPUIS `NON`, et ce n'est pas un détail de rangement.
 * Rangé dans les refus, il ne servait à rien quand rien n'était proposé —
 * Maya répondait « Je n'ai rien en attente » et gardait le micro. Or « stop »
 * est le mot que tout le monde emploie pour arrêter une machine qui écoute.
 * Devant une proposition, il renonce ET termine : les deux à la fois, parce
 * que c'est ce qu'il veut dire.
 */
const TERMINER = new Set(['terminus', 'termine', 'terminer', 'stop', 'fini', 'basta']);

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
  let terminer = false;

  for (const mot of mots) {
    if (VIDES.has(mot)) continue;
    if (TERMINER.has(mot)) {
      terminer = true;
      continue;
    }
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
  // ⚠️ `terminer` PASSE EN PREMIER. « stop » est le mot qu'on emploie quand on
  // veut que ça cesse MAINTENANT ; le noyer dans un refus ordinaire laisserait
  // le micro ouvert, ce qui est exactement le contraire de ce qui est demandé.
  if (terminer) return 'terminer';
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

// ═══════════════════════════════════════════════════════════════════════════
// CE QU'ON FAIT DE LA RÉPONSE — la décision, séparée de son exécution.
//
// ⚠️ CETTE FONCTION EXISTE PARCE QUE LA COUVERTURE S'ARRÊTAIT JUSTE AVANT.
//
// `lireAccord` était bien tenue : trente-huit cas, six mutations. Mais la
// fonction qui transforme son verdict en ÉCRITURE vivait dans le corps d'un
// composant Vue — et aucun banc du dépôt n'importe un `.vue`. Autrement dit :
// le lexique était mesuré au mot près, et le geste qu'il déclenche ne l'était
// pas du tout. C'est la cinquième forme de faux vert de CLAUDE.md, appliquée au
// seul chemin du produit où la parole ÉCRIT.
//
// La décision descend donc ici, en données pures. Le composant ne fait plus que
// l'exécuter.
// ═══════════════════════════════════════════════════════════════════════════

/** Ce qu'une bulle de Maya offre à cet instant. */
export interface EtatDeLaDemande {
  /** Une écriture est PROPOSÉE et attend l'accord : rien n'est encore en base. */
  enAttente: 'action' | 'plan' | null;
  /** Une écriture est DÉJÀ faite et sait se défaire. */
  defaisable: 'action' | 'plan' | null;
}

/** Le geste à poser. `null` = ce n'était pas une réponse, on traite en question. */
export type GesteVocal =
  | 'confirmer-action'
  | 'confirmer-plan'
  | 'renoncer-action'
  | 'renoncer-plan'
  | 'defaire-action'
  | 'defaire-plan'
  /** Un « oui » ou un « non » qui ne répond à rien : le dire, ne rien envoyer. */
  | 'rien-en-attente'
  /** Sortir du mode vocal : fermer le micro, se taire, et le dire. */
  | 'quitter'
  | null;

/**
 * Ce que l'application doit faire d'une réponse vocale.
 *
 * ⚠️ DEUX CHAMPS, PAS UN, ET C'EST UNE LEÇON DU DÉPÔT. « stop » devant une
 * proposition veut dire DEUX choses à la fois : n'écris pas ça, et arrête
 * d'écouter. Les fondre en une seule valeur aurait demandé une entrée par
 * combinaison (`renoncer-action-et-quitter`, `renoncer-plan-et-quitter`…), et
 * la règle « on quitte » se serait retrouvée écrite à cinq endroits — c'est
 * exactement comme ça qu'une table diverge.
 */
export interface ReponseVocale {
  geste: GesteVocal;
  /** Faut-il sortir du mode vocal après avoir posé le geste ? */
  quitter: boolean;
}

/**
 * Que faire d'une réponse vocale, selon ce que Maya offre.
 *
 * ⚠️ L'ORDRE DES CAS EST UNE RÈGLE DE SÛRETÉ. Une PROPOSITION en attente passe
 * avant une écriture défaisable : tant que rien n'est écrit, un « annule »
 * signifie « ne le fais pas », jamais « défais ce que tu as fait avant ». Les
 * inverser ferait supprimer une ligne pendant qu'une autre attendait un accord.
 *
 * ⚠️ ET SEUL UN VERBE D'ANNULATION DÉFAIT. Après « c'est noté », un « non » est
 * ambigu — il peut répondre à autre chose, à quelqu'un d'autre, à rien. Défaire
 * une écriture sur une ambiguïté est ce qu'on ne peut pas se permettre.
 */
export function decisionVocale(accord: AccordVocal, etat: EtatDeLaDemande): ReponseVocale {
  if (accord === 'autre') return { geste: null, quitter: false };

  // « stop » : on arrête d'écouter, quoi qu'il arrive. S'il y a une écriture en
  // attente, on renonce AUSSI — rien n'a encore été écrit, et laisser une
  // proposition ouverte derrière un micro qu'on vient de fermer serait un piège.
  if (accord === 'terminer') {
    if (etat.enAttente) {
      return {
        geste: etat.enAttente === 'plan' ? 'renoncer-plan' : 'renoncer-action',
        quitter: true,
      };
    }
    return { geste: 'quitter', quitter: true };
  }

  if (etat.enAttente) {
    if (accord === 'oui') {
      return {
        geste: etat.enAttente === 'plan' ? 'confirmer-plan' : 'confirmer-action',
        quitter: false,
      };
    }
    // « non » comme « annule » renoncent : rien n'a encore été écrit.
    return {
      geste: etat.enAttente === 'plan' ? 'renoncer-plan' : 'renoncer-action',
      quitter: false,
    };
  }

  if (accord === 'annuler' && etat.defaisable) {
    return {
      geste: etat.defaisable === 'plan' ? 'defaire-plan' : 'defaire-action',
      quitter: false,
    };
  }

  if (accord === 'oui' || accord === 'non') return { geste: 'rien-en-attente', quitter: false };

  // Un « annule » sans rien à défaire : ce n'est pas une réponse. On le laisse
  // partir comme une phrase — Maya répondra elle-même, et l'avaler ici
  // laisserait l'apiculteur sans réponse du tout.
  return { geste: null, quitter: false };
}
