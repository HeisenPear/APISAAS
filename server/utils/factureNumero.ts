import { and, eq, isNotNull } from 'drizzle-orm';
import { anneeParis } from '~~/server/utils/horloge';
import {
  FAMILLES_NUMERO,
  ordreNumeroDecroissant,
  prefixeMillesime,
  prochainNumero as prochainNumeroDeSequence,
} from '~~/server/utils/numerotation';
import { transactions } from '~~/server/database/schema';

/**
 * Numérotation des factures — FA-YYYY-NNNN, séquence continue et sans trou
 * (Art. 242 nonies A du CGI). Le numéro n'est attribué qu'à l'ÉMISSION de la
 * facture (jamais sur un brouillon), pour garantir une séquence sans saut en
 * cas de suppression d'un brouillon.
 *
 * La mécanique de séquence elle-même vit dans `numerotation.ts`, partagée avec
 * les achats, les bons de livraison et les hausses : elle avait été recopiée
 * quatre fois, et seule cette copie-ci portait les correctifs.
 */

/**
 * Calcule le prochain numéro à partir du dernier émis. Pur (testable).
 *
 * ⚠️ LE NOM EST EXPLICITE À DESSEIN. Il s'appelait `prochainNumero`, comme le
 * helper générique de `numerotation.ts` — et Nitro auto-importe par NOM : deux
 * exports homonymes, et c'est lui qui choisit lequel gagne, en silence. Les
 * deux signatures diffèrent (une année ici, un préfixe là) : la confusion
 * n'aurait pas fait d'erreur de type, elle aurait fabriqué de faux numéros.
 *
 * La politique « poursuivre » est celle de la facture et d'elle seule : la
 * séquence ne repart pas à 1 au changement de millésime.
 */
export function prochainNumeroFacture(
  dernierNumero: string | null | undefined,
  annee: number,
): string {
  return prochainNumeroDeSequence(dernierNumero, prefixeMillesime('facture', annee), {
    politique: FAMILLES_NUMERO.facture.politique,
    largeur: FAMILLES_NUMERO.facture.largeur,
  });
}

/** Génère le prochain numéro de facture pour un utilisateur (dernier émis + 1). */
export async function genererNumeroFacture(userId: string): Promise<string> {
  // On trie par le NUMÉRO lui-même (pas createdAt) : le format zéro-padé
  // FA-YYYY-NNNN fait coïncider l'ordre lexical et l'ordre numérique. Trier par
  // createdAt produisait des doublons quand des brouillons étaient émis dans un
  // ordre différent de leur création (un brouillon ancien émis après un récent
  // repartait du plus petit numéro) — violation directe de l'unicité légale.
  const [dernier] = await db
    .select({ numero: transactions.numero })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'vente'),
        isNotNull(transactions.numero),
      ),
    )
    .orderBy(...ordreNumeroDecroissant(transactions.numero))
    .limit(1);
  /**
   * ⚠️ L'ANNÉE SE LIT À PARIS, PAS SUR LE SERVEUR. `getFullYear()` sur une
   * lambda Vercel lit l'heure UTC : une facture émise le 1er janvier à 00 h 30
   * à Paris (31 décembre 23 h 30 UTC) portait encore le préfixe de l'année
   * ÉCOULÉE. Une séquence qui repart sur l'ancien millésime au premier jour de
   * l'exercice est un doublon garanti — et sur le seul champ dont l'unicité est
   * une obligation légale.
   */
  return prochainNumeroFacture(dernier?.numero ?? null, anneeParis(new Date()));
}
