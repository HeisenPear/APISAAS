// ═══════════════════════════════════════════════════════════════════════════
// LA PAROLE DE MAYA — préparer un texte d'écran pour qu'il soit DIT.
//
// ⚠️ POURQUOI CE MODULE EXISTE, ET POURQUOI IL EST PUR.
//
// Le mode vocal a un but simple : l'apiculteur a les mains dans une ruche, il
// ne peut ni taper, ni viser un bouton, ni regarder l'écran. Si Maya ne fait
// qu'ÉCRIRE sa réponse, le contact n'est vocal qu'à moitié — il faut quand même
// s'essuyer les mains et lire.
//
// Mais un texte d'écran ne se dit pas tel quel. Les réponses de Maya portent des
// tirets de liste, des astérisques d'emphase, des flèches, des symboles, des
// nombres collés à leur unité. Lus par la synthèse du navigateur, ils
// deviennent « astérisque astérisque douze kilogrammes astérisque astérisque »,
// ou bien un silence là où il fallait une pause.
//
// La synthèse elle-même ne se teste pas hors navigateur. Cette préparation, si —
// et c'est elle qui décide de ce que l'apiculteur entend.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Unités que la synthèse française ne prononce pas d'elle-même, ou mal.
 *
 * ⚠️ ON N'EN MET QUE CE QU'ON A VU DANS LES RÉPONSES DE MAYA. Une table
 * exhaustive d'unités SI serait du décor : ce qui sort du moteur, ce sont des
 * kilos de miel, des degrés, des euros, des pourcentages et des cadres.
 */
const UNITES: [RegExp, string][] = [
  [/(\d)\s*kg\b/gi, '$1 kilos'],
  [/(\d)\s*°C\b/gi, '$1 degrés'],
  [/(\d)\s*%/g, '$1 pour cent'],
  [/(\d)\s*€/g, '$1 euros'],
  [/\b(\d+)\s*j\b/gi, '$1 jours'],
];

/**
 * Les qualificatifs de GRANDEUR — ils se disent, ils ne se retirent pas.
 *
 * ⚠️ CE TABLEAU EXISTE PARCE QUE LE « ~ » PARTAIT AVEC L'EMPHASE. La classe
 * `[*_\`~]` qui nettoie le balisage emportait le tilde des seuils sanitaires :
 * « plus de ~5 varroas/jour » — un REPÈRE — se disait « plus de 5 varroas par
 * jour », c'est-à-dire un SEUIL. En apiculture cette nuance décide d'un
 * traitement, et neuf fiches du savoir étaient touchées, dont « Compter les
 * varroas ». À l'écran l'apiculteur voyait le tilde ; à l'oreille, jamais.
 *
 * Les signes `<`, `>`, `≈` ne partaient pas, mais leur prononciation était
 * laissée à la voix du navigateur, qui les avale ou les épelle selon l'humeur.
 * On ne la lui laisse plus.
 *
 * ⚠️ LE SIGNE NE COMPTE QUE COLLÉ À UN NOMBRE. Ailleurs c'est du balisage —
 * une citation « > », un barré « ~~ » — pas une grandeur.
 */
const APPROXIMATIONS: [RegExp, string][] = [
  // ⚠️ D'ABORD LES REDONDANCES. Le savoir écrit parfois « plus de >20 kg » : le
  // signe y RÉPÈTE les mots. L'expansion naïve donnait « plus de plus de 20 »,
  // qu'on entend comme un bégaiement — et un bégaiement, à l'oreille, fait
  // douter du chiffre.
  [/(\bplus\s+de\s+)>\s*(?=\d)/gi, '$1'],
  [/(\bmoins\s+de\s+)<\s*(?=\d)/gi, '$1'],
  [/[~≈]\s*(?=\d)/g, 'environ '],
  [/±\s*(?=\d)/g, 'plus ou moins '],
  [/≥\s*(?=\d)/g, 'au moins '],
  [/≤\s*(?=\d)/g, 'au plus '],
  [/<\s*(?=\d)/g, 'moins de '],
  [/>\s*(?=\d)/g, 'plus de '],
];

/**
 * Le texte tel qu'il doit être DIT.
 *
 * Enlève ce qui n'a de sens qu'à l'œil (balisage, puces, séparateurs, émojis),
 * développe les unités, et remplace les ruptures visuelles par de la
 * ponctuation — c'est elle qui fait respirer une synthèse vocale.
 */
export function texteAOraliser(texte: string): string {
  let t = (texte ?? '').normalize('NFC');

  // Les liens en balisage : on garde le libellé, jamais l'adresse.
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  /**
   * ⚠️ LES GRANDEURS D'ABORD, L'EMPHASE ENSUITE — l'ordre est tout le
   * correctif. Le nettoyage du balisage emportait le « ~ » avec les
   * astérisques : une approximation devenait un chiffre exact.
   */
  for (const [motif, remplacement] of APPROXIMATIONS) t = t.replace(motif, remplacement);
  // Emphase et code : les marqueurs se prononceraient.
  t = t.replace(/[*_`~]{1,3}/g, '');
  // Titres de section : le dièse ne se dit pas, mais la coupure est réelle.
  t = t.replace(/^#{1,6}\s*/gm, '');
  // Séparateurs horizontaux : une pause, pas « tiret tiret tiret ».
  t = t.replace(/^\s*[-–—_]{3,}\s*$/gm, '.');
  // Puces de liste : une virgule suffit à faire entendre l'énumération.
  t = t.replace(/^\s*[-–—•*]\s+/gm, '');
  // Numérotation « 1. » en tête de ligne : le point ferait une phrase de « 1 ».
  t = t.replace(/^\s*(\d+)[.)]\s+/gm, '$1, ');
  // Flèches et symboles qui ne se disent pas.
  t = t.replace(/[→←↔⇒·•▪▸]/g, ' ');
  // Émojis et pictogrammes : la synthèse les épelle ou se tait au hasard.
  // ⚠️ LE SÉLECTEUR DE VARIANTE (U+FE0F) SE RETIRE À PART. Le glisser dans la
  // même classe que les pictogrammes en fait un caractère COMBINÉ aux yeux de
  // l'analyseur — la classe ne veut alors plus dire ce qu'elle a l'air de dire,
  // et ESLint le refuse à juste titre.
  t = t.replace(/\uFE0F/g, '');
  t = t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/gu, ' ');

  for (const [motif, remplacement] of UNITES) t = t.replace(motif, remplacement);

  // L'élision, sinon la synthèse dit « de environ » — audible, et bête.
  t = t.replace(/\bde\s+environ\b/gi, 'd’environ');

  // Une ligne vide est une respiration : on la rend audible.
  t = t.replace(/\n{2,}/g, '. ');
  t = t.replace(/\n/g, ', ');
  // Ponctuation redondante née des remplacements ci-dessus.
  t = t.replace(/\s+([,.;:!?])/g, '$1');
  t = t.replace(/([,.;:])\1+/g, '$1');
  t = t.replace(/\.\s*,/g, '.');
  t = t.replace(/\s{2,}/g, ' ');

  return t.trim();
}

/**
 * La synthèse a-t-elle de quoi parler ? Un texte vidé par le nettoyage (une
 * réponse qui n'était qu'un tableau, qu'un émoji) ne doit pas déclencher une
 * énonciation muette : le mode vocal attendrait la fin d'une parole qui
 * n'arrive jamais, et la dictée ne reprendrait pas.
 */
export function vautLaPeineDEtreDit(texte: string): boolean {
  return texteAOraliser(texte).replace(/[^\p{L}\p{N}]/gu, '').length >= 2;
}

// ═══════════════════════════════════════════════════════════════════════════
// CE QUE MAYA DOIT DIRE À LA FIN D'UN TOUR — et ce qu'elle ne doit PAS redire.
//
// ⚠️ CETTE RÈGLE VIVAIT DANS UN COMPOSANT, ET ELLE ÉTAIT FAUSSE.
//
// La boucle lisait simplement « la dernière bulle ». Or quand une requête
// échoue, `useCopilote` RETIRE la question et la bulle vide du fil : la
// dernière bulle redevient la réponse PRÉCÉDENTE. Maya la relisait donc mot
// pour mot — consigne « dis oui pour confirmer » comprise — pour une
// proposition qui n'existait plus. L'apiculteur entendait deux fois la même
// chose et pouvait dire « oui » à un vide.
//
// Et l'erreur, elle, n'était jamais dite : elle s'affiche à l'écran, que
// personne ne regarde en mode vocal.
//
// La règle descend donc ici, où un banc peut l'atteindre — aucun banc du dépôt
// n'importe un `.vue`.
// ═══════════════════════════════════════════════════════════════════════════

/** L'état d'un tour, vu par la boucle vocale. */
export interface TourVocal {
  /** Message d'erreur de la requête, s'il y en a un. */
  erreur?: string | null;
  /** La dernière bulle du fil. */
  derniere?: { role: 'user' | 'assistant'; content: string; attendUnAccord?: boolean } | null;
  /** Vrai si cette bulle-là a DÉJÀ été lue à voix haute. */
  dejaDite: boolean;
}

/** Ce qu'il faut prononcer, ou `null` s'il n'y a rien à dire. */
export function paroleDeLaReponse(tour: TourVocal): string | null {
  /**
   * ⚠️ L'ERREUR PASSE EN PREMIER, ET ELLE SE DIT. Elle est la seule chose vraie
   * de ce tour : la bulle qui suit, si elle existe, appartient au tour d'avant.
   */
  if (tour.erreur) return tour.erreur;

  const d = tour.derniere;
  if (!d || d.role !== 'assistant' || !d.content.trim()) return null;
  // Une bulle déjà lue ne se relit pas — c'est la même garde, par l'autre bout.
  if (tour.dejaDite) return null;

  /**
   * ⚠️ LA CONSIGNE EST DITE, PAS ÉCRITE. À l'écran, les boutons
   * « Confirmer / Annuler » disent d'eux-mêmes quoi faire. À l'oreille il n'y a
   * rien : l'apiculteur entend une question et ne sait pas qu'il peut y
   * répondre à la voix.
   */
  return d.attendUnAccord ? `${d.content} Dis « oui » pour confirmer, ou « annule ».` : d.content;
}
