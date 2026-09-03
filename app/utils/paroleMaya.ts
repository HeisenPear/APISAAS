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
