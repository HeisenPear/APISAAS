// Lecture d'un relevé bancaire au format PDF — fonctions PURES, zéro I/O.
//
// Un PDF n'a pas de colonnes : il n'a que des mots posés à des coordonnées. Tout
// l'enjeu est de RECONSTRUIRE le tableau, parce que c'est la POSITION qui dit si
// « 89,50 » est un débit ou un crédit. Un extracteur de texte brut aplatit tout
// et perd cette information — on importerait alors des montants au mauvais signe
// dans la comptabilité de l'apiculteur. C'est le pire résultat possible : mieux
// vaut ignorer une ligne et le dire que l'inscrire à l'envers.
//
// D'où la règle de conduite de ce fichier : DANS LE DOUTE, ON N'IMPORTE PAS. Les
// lignes écartées sont comptées et rendues à l'appelant, qui les annonce.
//
// L'extraction elle-même (PDF binaire → mots positionnés) vit dans la route
// d'import ; ici on ne manipule que des mots déjà situés, donc testables.

import { parseDateIso, parseMontant, type LigneReleve } from './releveBancaire';
import { normaliserLibelle } from './rapprochement';

/**
 * Un fragment de texte du PDF avec sa position. `y` croît vers le HAUT.
 *
 * « Fragment » et non « mot » : pdf.js RECOLLE les suites de texte adjacentes.
 * Vérifié sur un vrai PDF, la date et le libellé ressortent soudés en un seul
 * fragment — « 03/03/2026PRLV SEPA EDF ». Rien ici ne peut donc supposer qu'un
 * fragment vaut un mot, ni que le premier fragment d'une ligne EST la date.
 */
export interface MotPdf {
  texte: string;
  x: number;
  y: number;
  page: number;
  /** Largeur du fragment. Sert à situer son bord DROIT. 0 si inconnue. */
  largeur?: number;
}

export interface ResultatPdf {
  lignes: LigneReleve[];
  /** Lignes écartées faute de date, de montant, ou de signe déterminable. */
  ignorees: number;
  /** Ce que la lecture a compris de la mise en page — sert à s'expliquer. */
  colonnes: 'signee' | 'debit_credit' | 'indeterminee';
}

/** Deux mots appartiennent à la même ligne si leurs `y` sont à ce point près. */
const TOLERANCE_LIGNE = 3;
/** Deux montants appartiennent à la même colonne si leurs `x` sont à ce point près. */
const TOLERANCE_COLONNE = 26;

/**
 * Un montant en FIN de fragment : « 1 234,56 », « -89,50 », « (89,50) », « 12,30 € ».
 * Ancré à la fin et non sur le fragment entier, puisqu'un montant peut se
 * retrouver soudé au libellé qui le précède.
 */
const MOTIF_MONTANT = /(?:^|\s)([-+(]?\d[\d\s.,]*\d\)?)(?:\s*€)?$/;
/** Une date, fragment entier : 01/03/2026, 01/03/26, ou 01/03 (année déduite). */
const MOTIF_DATE = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/;
/** La même, mais au DÉBUT d'une ligne dont la suite peut être soudée. */
const MOTIF_DATE_DEBUT = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/;

/** Les crédits portent parfois leur signe en toutes lettres, à droite du montant. */
const MOTS_CREDIT = /^(cr|c|credit|\+)$/i;
const MOTS_DEBIT = /^(db|dr|d|debit|-)$/i;

interface LignePdf {
  page: number;
  y: number;
  mots: MotPdf[];
}

/** Regroupe les mots en lignes visuelles, de haut en bas, gauche à droite. */
export function grouperEnLignes(mots: MotPdf[]): LignePdf[] {
  const lignes: LignePdf[] = [];
  for (const mot of mots) {
    if (!mot.texte.trim()) continue;
    const existante = lignes.find(
      (l) => l.page === mot.page && Math.abs(l.y - mot.y) <= TOLERANCE_LIGNE,
    );
    if (existante) existante.mots.push(mot);
    else lignes.push({ page: mot.page, y: mot.y, mots: [mot] });
  }
  for (const l of lignes) l.mots.sort((a, b) => a.x - b.x);
  // `y` décroît vers le bas dans le repère PDF : une page se lit du plus grand
  // `y` au plus petit.
  return lignes.sort((a, b) => a.page - b.page || b.y - a.y);
}

/** Le montant en fin de fragment, s'il y en a un. */
function montantEnFin(texte: string): string | null {
  const t = texte.trim();
  // Une date entière n'est jamais un montant — « 03.03.2026 » en serait un
  // sinon, et on importerait des dates comme des sommes d'argent.
  if (MOTIF_DATE.test(t)) return null;
  const m = MOTIF_MONTANT.exec(t);
  if (!m) return null;
  const brut = m[1]!;
  // Un montant porte des décimales ou un séparateur de milliers : sans cette
  // exigence, les numéros de pièce et les années passeraient pour des sommes.
  return /[.,]/.test(brut) ? brut : null;
}

/** Bord DROIT du fragment — les colonnes de montants sont alignées à droite. */
function bordDroit(mot: MotPdf): number {
  return mot.x + (mot.largeur ?? 0);
}

/** Regroupe des abscisses en colonnes, et rend le centre de chacune. */
export function detecterColonnes(xs: number[]): number[] {
  const tries = [...xs].sort((a, b) => a - b);
  const groupes: number[][] = [];
  for (const x of tries) {
    const dernier = groupes[groupes.length - 1];
    if (dernier && x - dernier[dernier.length - 1]! <= TOLERANCE_COLONNE) dernier.push(x);
    else groupes.push([x]);
  }
  return groupes.map((g) => g.reduce((s, v) => s + v, 0) / g.length);
}

/**
 * L'année n'est pas toujours sur la ligne : beaucoup de relevés n'impriment que
 * « 01/03 » et ne datent que l'en-tête. On retient donc la première année
 * complète rencontrée dans le document pour compléter les dates tronquées.
 */
function anneeDuDocument(lignes: LignePdf[]): number | null {
  for (const l of lignes) {
    for (const m of l.mots) {
      const d = MOTIF_DATE.exec(m.texte.trim());
      if (d?.[3]) return d[3].length === 2 ? 2000 + Number(d[3]) : Number(d[3]);
      const annee = /\b(20\d{2})\b/.exec(m.texte);
      if (annee) return Number(annee[1]);
    }
  }
  return null;
}

interface Candidate {
  date: string;
  libelle: string;
  montants: { valeur: number; x: number; signeExplicite: boolean }[];
  /** Mention « CR »/« D » collée au montant, quand la banque en met une. */
  mentionCredit: boolean | null;
}

function lireCandidate(ligne: LignePdf, annee: number | null): Candidate | null {
  // La ligne est lue COMME UN TOUT : pdf.js recolle les suites adjacentes, si
  // bien que le premier fragment vaut souvent « 03/03/2026PRLV SEPA EDF ». Y
  // chercher une date entière ne trouvait rien et la ligne partait à la poubelle
  // — donc, sur un vrai relevé, zéro opération importée.
  const texteLigne = ligne.mots
    .map((m) => m.texte.trim())
    .filter(Boolean)
    .join(' ');
  const mDate = MOTIF_DATE_DEBUT.exec(texteLigne);
  if (!mDate) return null;
  const date = mDate[3]
    ? parseDateIso(mDate[0])
    : annee != null
      ? parseDateIso(`${mDate[1]}/${mDate[2]}/${annee}`)
      : null;
  if (!date) return null;

  // Les montants se repèrent sur les FRAGMENTS : eux seuls portent la position,
  // et c'est la position qui donne la colonne, donc le sens de l'opération.
  const montants: Candidate['montants'] = [];
  let mentionCredit: boolean | null = null;
  let premierMontant = ligne.mots.length;

  ligne.mots.forEach((mot, i) => {
    const t = mot.texte.trim();
    if (montants.length && MOTS_CREDIT.test(t)) {
      mentionCredit = true;
      return;
    }
    if (montants.length && MOTS_DEBIT.test(t)) {
      mentionCredit = false;
      return;
    }
    const brut = montantEnFin(t);
    if (!brut) return;
    const valeur = parseMontant(brut);
    if (valeur === null) return;
    if (i < premierMontant) premierMontant = i;
    const negatif = /^[-(]/.test(brut) || brut.endsWith(')');
    montants.push({
      valeur: Math.abs(valeur),
      x: bordDroit(mot),
      signeExplicite: negatif || brut.startsWith('+'),
    });
    if (negatif) mentionCredit = false;
    else if (brut.startsWith('+')) mentionCredit = true;
  });

  if (!montants.length) return null;

  // Libellé : tout ce qui précède le premier montant, moins la date de tête et
  // moins l'éventuelle date de valeur qui la suit.
  let libelle = ligne.mots
    .slice(0, premierMontant)
    .map((m) => m.texte.trim())
    .filter(Boolean)
    .join(' ')
    .slice(mDate[0].length)
    .trim();
  libelle = libelle.replace(/^\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?\s*/, '').trim();

  return { date, libelle, montants, mentionCredit };
}

function empreinteDe(date: string, montant: number, libelle: string): string {
  return `${date}|${montant.toFixed(2)}|${normaliserLibelle(libelle)}`;
}

/**
 * Reconstruit les opérations d'un relevé PDF à partir de ses mots positionnés.
 *
 * Trois mises en page couvrent l'essentiel des banques françaises :
 *  - une colonne « Montant » SIGNÉE ;
 *  - deux colonnes « Débit » et « Crédit » (la position fait le signe) ;
 *  - l'une ou l'autre, suivie d'une colonne « Solde » qui court sur presque
 *    toutes les lignes — c'est ce qui la trahit, et on l'écarte.
 */
export function parsePdf(mots: MotPdf[]): ResultatPdf {
  const lignes = grouperEnLignes(mots);
  const annee = anneeDuDocument(lignes);

  const candidates: Candidate[] = [];
  let ignorees = 0;
  for (const l of lignes) {
    const c = lireCandidate(l, annee);
    if (c) candidates.push(c);
  }
  if (!candidates.length) return { lignes: [], ignorees, colonnes: 'indeterminee' };

  // ── Quelles colonnes de montants existe-t-il ? ─────────────────────────────
  const colonnes = detecterColonnes(candidates.flatMap((c) => c.montants.map((m) => m.x)));

  // La colonne de SOLDE se reconnaît à sa présence quasi systématique : un débit
  // ou un crédit n'apparaît que sur les lignes concernées, un solde sur toutes.
  let colonnesUtiles = colonnes;
  if (colonnes.length >= 2) {
    const derniere = colonnes[colonnes.length - 1]!;
    const presence = candidates.filter((c) =>
      c.montants.some((m) => Math.abs(m.x - derniere) <= TOLERANCE_COLONNE),
    ).length;
    if (presence / candidates.length >= 0.8) colonnesUtiles = colonnes.slice(0, -1);
  }

  const mode: ResultatPdf['colonnes'] =
    colonnesUtiles.length >= 2
      ? 'debit_credit'
      : colonnesUtiles.length === 1
        ? 'signee'
        : 'indeterminee';

  const colDebit = colonnesUtiles[0];
  const colCredit = colonnesUtiles[colonnesUtiles.length - 1];

  /**
   * Le document DÉMONTRE-T-IL que sa colonne unique est signée ?
   *
   * Dans une colonne « Montant » signée, l'absence de « − » veut dire crédit —
   * c'est la convention universelle. Mais on ne peut s'y fier qu'à une
   * condition : que le relevé porte au moins un montant explicitement signé
   * quelque part. Sans cette preuve, une colonne de nombres nus reste muette
   * sur le sens de l'argent, et on ne devine pas.
   */
  const colonneSignee =
    mode === 'signee' && candidates.some((c) => c.montants.some((m) => m.signeExplicite));

  const out: LigneReleve[] = [];
  for (const c of candidates) {
    // On ne garde que les montants des colonnes retenues (le solde est écarté).
    const utiles = c.montants.filter((m) =>
      colonnesUtiles.some((col) => Math.abs(m.x - col) <= TOLERANCE_COLONNE),
    );
    const montant = utiles[0];
    if (!montant || montant.valeur === 0) {
      ignorees++;
      continue;
    }

    let credit: boolean | null = c.mentionCredit;
    if (credit === null && mode === 'debit_credit' && colDebit != null && colCredit != null) {
      credit = Math.abs(montant.x - colCredit) < Math.abs(montant.x - colDebit);
    }
    if (credit === null && colonneSignee) credit = true;
    if (credit === null) {
      // Une colonne unique sans signe ni mention, dans un document qui n'en
      // porte nulle part : impossible de trancher, et on ne DEVINE pas le sens
      // d'un mouvement d'argent. La ligne est annoncée comme non lue plutôt
      // qu'inscrite au hasard dans la comptabilité.
      ignorees++;
      continue;
    }

    const valeur = credit ? montant.valeur : -montant.valeur;
    const libelle = c.libelle || 'Opération';
    out.push({
      date: c.date,
      montant: valeur,
      libelle,
      empreinte: empreinteDe(c.date, valeur, libelle),
    });
  }

  return { lignes: out, ignorees, colonnes: mode };
}
