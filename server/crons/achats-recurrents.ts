import { eq, and, lte, desc, sql } from 'drizzle-orm';
import { transactions, stocks, mouvementsStock } from '~~/server/database/schema';
import { assertCronAuth, processInBatches } from '~~/server/utils/cron-helpers';
import { prochaineEcheance } from '~~/server/utils/recurrence';

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

const ACHAT_BATCH_SIZE = 10; // Achats traites en parallele par tour

type StockUpdate = { stockId: string; userId: string; addQty: number; numero: string };

async function processAchat(
  achat: typeof transactions.$inferSelect,
  now: Date,
): Promise<{ created: boolean; stockUpdates: StockUpdate[] }> {
  const userId = achat.userId;
  const lignes = (achat.lignes ?? []) as LigneTransaction[];
  const interval = achat.recurringInterval as 'mensuel' | 'annuel' | null;
  if (!interval) return { created: false, stockUpdates: [] };

  // Generer le prochain numero d'achat
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

  // Prochaine date recurrente
  /**
   * ⚠️ LA MÊME FORMULE FAUTIVE VIVAIT ICI, et c'est ce qui rendait la dérive
   * DÉFINITIVE : le cron réappliquait `setMonth(+1)` à chaque passage, si bien
   * qu'une échéance une fois décalée ne revenait jamais à son jour.
   *
   * L'ancre est `achat.dateTransaction` — la date de l'achat d'ORIGINE. Sans
   * elle, borner au dernier jour du mois corrigerait le saut mais perdrait le
   * 31 pour toujours (31 janv → 28 fév → 28 mars → 28 avr…). Avec elle, on
   * retrouve ce qu'attend quiconque a déjà vu un prélèvement mensuel :
   * 28 février, puis 31 mars, puis 30 avril.
   */
  // L'échéance qui échoit aujourd'hui : c'est la date de l'achat qu'on crée.
  const base = new Date(achat.nextRecurringDate!);
  const nextDate = prochaineEcheance(base, interval, new Date(achat.dateTransaction));

  // Creer l'achat copie + maj du nextRecurringDate sur l'origine — en parallele
  const [newAchat] = await Promise.all([
    db
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
      .returning(),
    db
      .update(transactions)
      .set({ nextRecurringDate: nextDate })
      .where(eq(transactions.id, achat.id)),
  ]);

  if (!newAchat || newAchat.length === 0) {
    return { created: false, stockUpdates: [] };
  }

  // Collecter les stock updates a appliquer en batch a la fin
  const stockUpdates: StockUpdate[] = [];
  for (const ligne of lignes) {
    if (!ligne.ajouterAuStock || !ligne.stockId) continue;
    const addQty = ligne.unitesParColis ? ligne.quantite * ligne.unitesParColis : ligne.quantite;
    stockUpdates.push({ stockId: ligne.stockId, userId, addQty, numero });
  }

  return { created: true, stockUpdates };
}

export default defineEventHandler(async (event) => {
  assertCronAuth(event);

  const now = new Date();

  // Recupere tous les achats recurrents dus
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

  if (dus.length === 0) {
    return { created: 0, checked: 0 };
  }

  // Process en batches paralleles
  const { results, errors } = await processInBatches(dus, ACHAT_BATCH_SIZE, async (achat) =>
    processAchat(achat, now),
  );

  const created = results.filter((r) => r.created).length;
  const allStockUpdates = results.flatMap((r) => r.stockUpdates);

  // Appliquer les stock updates en batch (1 UPDATE par stock + 1 INSERT
  // mouvement par stock — chunkes pour limiter la charge)
  if (allStockUpdates.length > 0) {
    // Group updates par stockId pour combiner les quantites (1 stock peut
    // recevoir plusieurs lignes du meme achat)
    const grouped = new Map<string, { userId: string; total: number; motifs: string[] }>();
    for (const u of allStockUpdates) {
      const existing = grouped.get(u.stockId);
      if (existing) {
        existing.total += u.addQty;
        existing.motifs.push(u.numero);
      } else {
        grouped.set(u.stockId, { userId: u.userId, total: u.addQty, motifs: [u.numero] });
      }
    }

    // Appliquer chaque stockUpdate (parallele, batch de 25)
    await processInBatches(
      Array.from(grouped.entries()),
      25,
      async ([stockId, { userId, total }]) => {
        await db
          .update(stocks)
          .set({
            quantite: sql`${stocks.quantite}::numeric + ${total}::numeric`,
            updatedAt: new Date(),
          })
          .where(and(eq(stocks.id, stockId), eq(stocks.userId, userId)));
      },
    );

    // INSERT mouvements en batch (1 mouvement par stockUpdate brut, pas groupe
    // — on garde le detail des achats sources)
    const mouvementsValues = allStockUpdates.map((u) => ({
      stockId: u.stockId,
      userId: u.userId,
      type: 'entree' as const,
      quantite: u.addQty.toString(),
      motif: `Achat recurrent ${u.numero}`,
    }));

    const CHUNK = 500;
    for (let i = 0; i < mouvementsValues.length; i += CHUNK) {
      await db.insert(mouvementsStock).values(mouvementsValues.slice(i, i + CHUNK));
    }
  }

  if (errors.length > 0) {
    console.error('[cron/achats-recurrents] achats failed', {
      count: errors.length,
      sample: errors.slice(0, 3).map((e) => ({ achatId: e.item.id, error: String(e.error) })),
    });
  }

  return { created, checked: dus.length, failed: errors.length };
});
