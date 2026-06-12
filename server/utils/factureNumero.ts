import { and, desc, eq, isNotNull } from 'drizzle-orm';
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
    .orderBy(desc(transactions.createdAt))
    .limit(1);
  return prochainNumero(dernier?.numero ?? null, new Date().getFullYear());
}
