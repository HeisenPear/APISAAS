import { eq, and, lte, desc, sql } from 'drizzle-orm';
import { transactions, stocks, mouvementsStock } from '~~/server/database/schema';

interface LigneTransaction {
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  ajouterAuStock?: boolean;
  stockId?: string;
  stockCategorie?: string;
  stockUnite?: string;
  stockSeuilAlerte?: number;
  unitesParColis?: number;
}

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.NUXT_CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, message: 'Non autorisé' });
  }

  const now = new Date();

  // Récupère tous les achats récurrents dont la prochaine date est passée
  const dus = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.type, 'achat'),
        eq(transactions.isRecurring, true),
        lte(transactions.nextRecurringDate, now),
      ),
    );

  let created = 0;

  for (const achat of dus) {
    const userId = achat.userId;
    const lignes = (achat.lignes ?? []) as LigneTransaction[];
    const interval = achat.recurringInterval as 'mensuel' | 'annuel' | null;
    if (!interval) continue;

    // Générer le prochain numéro d'achat
    const yearPrefix = `AC-${now.getFullYear()}-`;
    const [lastNumero] = await db
      .select({ numero: transactions.numero })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, 'achat')))
      .orderBy(desc(transactions.createdAt))
      .limit(1);
    let nextSeq = 1;
    if (lastNumero?.numero?.startsWith(yearPrefix)) {
      const lastSeq = parseInt(lastNumero.numero.slice(yearPrefix.length), 10);
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }
    const numero = `${yearPrefix}${String(nextSeq).padStart(4, '0')}`;

    // Calculer la prochaine date récurrente
    const base = new Date(achat.nextRecurringDate!);
    const nextDate = new Date(base);
    if (interval === 'mensuel') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    // Créer l'achat copie
    const [newAchat] = await db
      .insert(transactions)
      .values({
        userId,
        clientId: null,
        type: 'achat',
        numero,
        dateTransaction: base,
        statut: 'payee',
        sousTotal: achat.sousTotal,
        tva: achat.tva,
        total: achat.total,
        lignes: achat.lignes,
        notes: achat.notes,
        categorie: achat.categorie,
        isRecurring: true,
        recurringInterval: interval,
        nextRecurringDate: nextDate,
      })
      .returning();

    // Mettre à jour la nextRecurringDate sur l'achat d'origine
    await db
      .update(transactions)
      .set({ nextRecurringDate: nextDate })
      .where(eq(transactions.id, achat.id));

    // Appliquer les effets stock si demandé
    if (newAchat) {
      for (const ligne of lignes) {
        if (!ligne.ajouterAuStock) continue;

        if (ligne.stockId) {
          const addQty = ligne.unitesParColis ? ligne.quantite * ligne.unitesParColis : ligne.quantite;
          await db
            .update(stocks)
            .set({
              quantite: sql`${stocks.quantite}::numeric + ${addQty}::numeric`,
              updatedAt: new Date(),
            })
            .where(and(eq(stocks.id, ligne.stockId), eq(stocks.userId, userId)));
          await db.insert(mouvementsStock).values({
            stockId: ligne.stockId,
            userId,
            type: 'entree',
            quantite: addQty.toString(),
            motif: `Achat récurrent ${numero}`,
          });
        }
      }
    }

    created++;
  }

  return { created, checked: dus.length };
});
