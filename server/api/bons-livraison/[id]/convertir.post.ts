import { eq, and } from 'drizzle-orm';
import { bonsLivraison, transactions } from '~~/server/database/schema';
import { genererNumeroFacture } from '~~/server/utils/factureNumero';
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
  /**
   * ⚠️ CES SEIZE LIGNES ÉTAIENT RECOPIÉES ICI, DANS LEUR VERSION D'AVANT LE
   * CORRECTIF. `server/utils/factureNumero.ts` existe précisément pour ça, et
   * son commentaire nomme le défaut : trier par `createdAt` sans filtrer les
   * numéros nuls « produisait des doublons […] violation directe de l'unicité
   * légale ». La correction n'a jamais été back-portée sur les deux routes de
   * bons de livraison, qui restaient les seules à fabriquer un FA- à la main.
   *
   * Le scénario, en clair : une vente laissée en BROUILLON porte `numero =
   * null` et devient la ligne la plus récente. Le tri par `createdAt` la
   * remonte, `lastNumero.numero` vaut null, aucune des deux branches ne
   * s'applique, `nextSeq` reste à 1 — et la facture émise reprend
   * FA-YYYY-0001, déjà utilisée. `transactions.numero` n'ayant aucune
   * contrainte d'unicité, l'insertion passe sans un mot.
   */
  const numero = await genererNumeroFacture(ownerId);

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
