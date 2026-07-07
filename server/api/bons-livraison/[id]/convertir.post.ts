import { eq, and, desc } from 'drizzle-orm';
import { bonsLivraison, transactions } from '~~/server/database/schema';
import { round2 } from '~~/server/utils/pricing';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const id = getRouterParam(event, 'id')!;

  const [bl] = await db
    .select()
    .from(bonsLivraison)
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)))
    .limit(1);

  if (!bl) throw createError({ statusCode: 404, message: 'Bon de livraison introuvable' });
  if (bl.statut === 'facture')
    throw createError({ statusCode: 400, message: 'Ce BL a déjà été converti en facture' });
  if (bl.statut === 'annule')
    throw createError({ statusCode: 400, message: 'Impossible de convertir un BL annulé' });
  if (bl.transactionId)
    throw createError({ statusCode: 400, message: 'Ce BL est déjà lié à une facture' });

  // Génération numéro FA-YYYY-NNNN
  const now = new Date();
  const yearPrefix = `FA-${now.getFullYear()}-`;
  const [lastNumero] = await db
    .select({ numero: transactions.numero })
    .from(transactions)
    .where(and(eq(transactions.userId, ownerId), eq(transactions.type, 'vente')))
    .orderBy(desc(transactions.createdAt))
    .limit(1);
  let nextSeq = 1;
  if (lastNumero?.numero?.startsWith(yearPrefix)) {
    const lastSeq = parseInt(lastNumero.numero.slice(yearPrefix.length), 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  } else if (lastNumero?.numero) {
    const seqMatch = lastNumero.numero.match(/(\d+)$/);
    if (seqMatch?.[1]) nextSeq = parseInt(seqMatch[1], 10) + 1;
  }
  const numero = `${yearPrefix}${String(nextSeq).padStart(4, '0')}`;

  const lignes = (bl.lignes ?? []).map((l) => ({
    description: l.description,
    quantite: l.quantite,
    prixUnitaire: l.prixUnitaire ?? 0,
    // total déjà calculé correctement à la création du BL (module pricing)
    total: l.total ?? 0,
    tauxTva: l.tauxTva ?? 5.5,
    modePrix: l.modePrix,
    contenance: l.contenance,
    uniteContenance: l.uniteContenance,
    stockId: l.stockId,
    typeMiel: l.typeMiel,
    presentation: l.presentation,
    numLot: l.numLot,
    origineGeo: l.origineGeo,
    anneeRecolte: l.anneeRecolte,
  }));

  const sousTotal = round2(lignes.reduce((s, l) => s + l.total, 0));
  const tva = round2(lignes.reduce((s, l) => s + (l.total * l.tauxTva) / 100, 0));
  const total = round2(sousTotal + tva);

  const [transaction] = await db
    .insert(transactions)
    .values({
      userId: ownerId,
      clientId: bl.clientId ?? null,
      type: 'vente',
      numero,
      dateTransaction: bl.dateCreation,
      statut: 'brouillon',
      sousTotal: sousTotal.toFixed(2),
      tva: tva.toFixed(2),
      total: total.toFixed(2),
      lignes,
      notes: bl.notes ?? null,
      categorieOperation: 'livraison_biens',
    })
    .returning();

  if (!transaction)
    throw createError({ statusCode: 500, message: 'Erreur lors de la création de la facture' });

  // Lier le BL à la facture
  await db
    .update(bonsLivraison)
    .set({ statut: 'facture', transactionId: transaction.id, updatedAt: new Date() })
    .where(eq(bonsLivraison.id, id));

  setResponseStatus(event, 201);
  return { data: { bl: { ...bl, statut: 'facture', transactionId: transaction.id }, transaction } };
});
