import { desc, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

// ═══════════════════════════════════════════════════════════════════════════
// LES SÉQUENCES NUMÉROTÉES — factures, achats, bons de livraison, hausses.
//
// Quatre familles de documents portent un numéro séquentiel. Elles étaient
// numérotées par QUATRE copies des mêmes quinze lignes, et ces copies avaient
// déjà divergé : le correctif de la facture (année lue à Paris, tri par le
// numéro et non par la date de création) n'avait été appliqué qu'à UNE des
// quatre. Le banc `numeroFactureUnique` comptait cette dette en la nommant ;
// ce module la solde.
//
// ─── LES TROIS DÉFAUTS QUE CE MODULE FERME ────────────────────────────────
//
// 1. L'ANNÉE LUE SUR LE SERVEUR. `new Date().getFullYear()` sur une lambda
//    Vercel répond en UTC. Le 1er janvier à 00 h 30 à Paris, il est encore
//    23 h 30 le 31 décembre pour le serveur : le document du premier jour de
//    l'exercice repartait sur le millésime ÉCOULÉ.
//
// 2. LE TRI PAR `createdAt`. Il désigne la ligne la plus récemment INSÉRÉE,
//    pas celle qui porte le plus grand numéro. Une vente laissée en brouillon
//    (numéro nul) remontait en tête, aucune branche ne s'appliquait, et la
//    séquence repartait à 0001 — déjà utilisée.
//
// 3. LE PASSAGE À CINQ CHIFFRES. Un tri purement lexical met « H-999 » APRÈS
//    « H-1000 » (le caractère « 9 » l'emporte sur « 1 »). Le parc de hausses
//    d'un professionnel franchit ce cap : la génération suivante repartait de
//    1000 et fabriquait des doublons, en silence. D'où `ordreNumeroDecroissant`
//    qui trie D'ABORD par LONGUEUR — sur un format zéro-padé, plus long veut
//    dire plus grand.
//
// ─── CE QUE CE MODULE NE FERME PAS, ET IL FAUT LE SAVOIR ──────────────────
// La COURSE reste ouverte : deux requêtes HTTP simultanées lisent le même
// dernier numéro et insèrent le même suivant. Aucune des tables concernées n'a
// de contrainte d'unicité sur `numero`, donc rien ne le refuse.
//
// Deux fermetures possibles, et ce sont des DÉCISIONS, pas des détails :
//   · un index unique `(user_id, numero)` — c'est une MIGRATION, et elle
//     échouera si des doublons existent déjà en production ;
//   · une transaction unique par écriture, tenant un verrou consultatif
//     Postgres du calcul du numéro jusqu'au commit — c'est une refonte des
//     routes d'écriture, le numéro étant aujourd'hui calculé AVANT la
//     transaction.
//
// Le lot en cours ferme le seul cas DÉTERMINISTE (le cron des achats
// récurrents, dont le lot parallèle donnait le même numéro à toutes les
// charges d'un même apiculteur échues le même jour). Le reste est signalé.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ce qu'on fait quand le dernier numéro connu ne porte PAS le préfixe attendu
 * — typiquement au passage d'une année sur l'autre.
 *
 * · `repartir` : la séquence redémarre à 1 (AC-2026-0001 après AC-2025-0142).
 *   C'est le comportement historique des achats et des bons de livraison, et
 *   il est juste : le millésime fait série.
 * · `poursuivre` : la séquence reprend le compteur précédent (FA-2026-0143
 *   après FA-2025-0142). C'est le comportement historique des FACTURES, et il
 *   ne se change pas à la légère — l'article 242 nonies A du CGI impose une
 *   séquence chronologique continue.
 */
export type PolitiqueMillesime = 'repartir' | 'poursuivre';

/** Les familles à millésime. La largeur fige le zéro-padage historique. */
export const FAMILLES_NUMERO = {
  facture: { prefixe: 'FA', largeur: 4, politique: 'poursuivre' },
  achat: { prefixe: 'AC', largeur: 4, politique: 'repartir' },
  bonLivraison: { prefixe: 'BL', largeur: 4, politique: 'repartir' },
} as const satisfies Record<
  string,
  { prefixe: string; largeur: number; politique: PolitiqueMillesime }
>;

export type FamilleNumero = keyof typeof FAMILLES_NUMERO;

/**
 * Le préfixe millésimé d'une famille — `AC-2026-`.
 *
 * ⚠️ C'EST LE SEUL ENDROIT DU DÉPÔT QUI FABRIQUE UN PRÉFIXE. Le banc
 * `numeroFactureUnique` refuse tout autre fichier de `server/` contenant un
 * gabarit `XX-${…}` : c'est ce qui empêche une cinquième copie de naître, et
 * c'est aussi ce qui garantit que l'année vient d'ici — donc de Paris.
 */
export function prefixeMillesime(famille: FamilleNumero, annee: number): string {
  return `${FAMILLES_NUMERO[famille].prefixe}-${annee}-`;
}

/** La séquence portée par un numéro, ou `null` s'il n'en porte pas. */
function sequenceDe(numero: string, prefixe: string, politique: PolitiqueMillesime): number | null {
  if (numero.startsWith(prefixe)) {
    const n = parseInt(numero.slice(prefixe.length), 10);
    return Number.isNaN(n) ? null : n;
  }
  if (politique === 'poursuivre') {
    const m = /(\d+)$/.exec(numero);
    if (m?.[1]) return parseInt(m[1], 10);
  }
  return null;
}

/**
 * Les `combien` prochains numéros, d'affilée, à partir du dernier connu.
 *
 * ⚠️ POURQUOI UNE SUITE ET PAS UN NUMÉRO. Le cron des achats récurrents traite
 * ses échéances par lots de dix EN PARALLÈLE. Chacune lisait le dernier numéro
 * avant qu'aucune n'ait inséré : trois charges dues le même jour chez le même
 * apiculteur recevaient le MÊME numéro d'achat, tous les mois, et les mouvements
 * de stock qu'elles engendraient citaient tous « Achat recurrent AC-2026-0042 ».
 * Une seule lecture, N numéros attribués localement : le lot ne peut plus se
 * marcher dessus.
 */
export function suiteDeNumeros(
  dernier: string | null | undefined,
  prefixe: string,
  combien: number,
  options: { politique?: PolitiqueMillesime; largeur?: number } = {},
): string[] {
  const politique = options.politique ?? 'repartir';
  const largeur = options.largeur ?? 4;
  const depart = (dernier ? sequenceDe(dernier, prefixe, politique) : null) ?? 0;
  return Array.from(
    { length: Math.max(0, combien) },
    (_, i) => `${prefixe}${String(depart + 1 + i).padStart(largeur, '0')}`,
  );
}

/** Le prochain numéro seul — `suiteDeNumeros(…, 1)`, cas courant. */
export function prochainNumero(
  dernier: string | null | undefined,
  prefixe: string,
  options: { politique?: PolitiqueMillesime; largeur?: number } = {},
): string {
  return suiteDeNumeros(dernier, prefixe, 1, options)[0]!;
}

/**
 * L'ordre qui met le PLUS GRAND numéro en tête — à passer à `.orderBy(...)`.
 *
 * La longueur d'abord : sur un format zéro-padé, un numéro plus long est un
 * numéro plus grand, et c'est la seule façon de ne pas classer « H-999 » après
 * « H-1000 ». Le tri lexical vient ensuite et départage à longueur égale.
 *
 * Trier par `createdAt` — ce que faisaient les quatre copies — désigne la
 * dernière ligne INSÉRÉE. Ce n'est pas la même chose, et l'écart se paie en
 * doublons dès qu'un brouillon, une suppression ou une insertion différée
 * bouscule l'ordre.
 */
export function ordreNumeroDecroissant(colonne: AnyPgColumn): SQL[] {
  return [desc(sql`length(${colonne})`), desc(colonne)];
}
