import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { anneeParis } from '~~/server/utils/horloge';
import { transactions } from '~~/server/database/schema';

/**
 * Numérotation des factures — FA-YYYY-NNNN, séquence continue et sans trou
 * (Art. 242 nonies A du CGI). Le numéro n'est attribué qu'à l'ÉMISSION de la
 * facture (jamais sur un brouillon), pour garantir une séquence sans saut en
 * cas de suppression d'un brouillon.
 */

/** Calcule le prochain numéro à partir du dernier émis. Pur (testable). */
export function prochainNumero(dernierNumero: string | null | undefined, annee: number): string {
  const prefixe = `FA-${annee}-`;
  let seq = 1;
  if (dernierNumero?.startsWith(prefixe)) {
    const last = parseInt(dernierNumero.slice(prefixe.length), 10);
    if (!Number.isNaN(last)) seq = last + 1;
  } else if (dernierNumero) {
    const m = dernierNumero.match(/(\d+)$/);
    if (m?.[1]) seq = parseInt(m[1], 10) + 1;
  }
  return `${prefixe}${String(seq).padStart(4, '0')}`;
}

/** Génère le prochain numéro de facture pour un utilisateur (dernier émis + 1). */
export async function genererNumeroFacture(userId: string): Promise<string> {
  // On trie par le NUMÉRO lui-même (pas createdAt) : le format zero-paddé
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
    .orderBy(desc(transactions.numero))
    .limit(1);
  /**
   * ⚠️ L'ANNÉE SE LIT À PARIS, PAS SUR LE SERVEUR. `getFullYear()` sur une
   * lambda Vercel lit l'heure UTC : une facture émise le 1er janvier à 00 h 30
   * à Paris (31 décembre 23 h 30 UTC) portait encore le préfixe de l'année
   * ÉCOULÉE. Une séquence qui repart sur l'ancien millésime au premier jour de
   * l'exercice est un doublon garanti — et sur le seul champ dont l'unicité est
   * une obligation légale.
   */
  return prochainNumero(dernier?.numero ?? null, anneeParis(new Date()));
}
