import { eq, and } from 'drizzle-orm';
import { bonsLivraison, transactions } from '~~/server/database/schema';
import { totauxDepuisLignes } from '~~/server/utils/pricing';

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
   * ⚠️ AUCUN NUMÉRO SUR UN BROUILLON — et cette route en attribuait un.
   *
   * La règle est écrite en toutes lettres dans `finances/ventes.post.ts` :
   * `const numero = body.statut === 'brouillon' ? null : await
   * genererNumeroFacture(ownerId)`. Le numéro s'attribue à L'ÉMISSION, pas à
   * la création — c'est `factures/[id].put.ts` qui le pose quand le brouillon
   * part. Les deux routes de bons de livraison étaient les seules à le poser
   * d'avance, sur une transaction qu'elles créent pourtant en `brouillon`.
   *
   * Deux dégâts, dont un que j'ai moi-même refermé sur l'apiculteur
   * aujourd'hui :
   *
   *   · l'article 242 nonies A du CGI veut une séquence CONTINUE de factures
   *     émises. Un brouillon qui réserve un numéro puis n'est jamais envoyé
   *     creuse un trou dans la séquence ;
   *   · le `DELETE` de facture refuse désormais toute ligne PORTANT UN NUMÉRO
   *     — à juste titre : supprimer la dernière émise ferait réattribuer son
   *     numéro. Mais une conversion faite par erreur produisait ici un
   *     brouillon numéroté, donc INDÉLÉBILE, et pour lequel un avoir n'a aucun
   *     sens puisque rien n'a jamais été envoyé. La sortie de secours que ce
   *     refus promet n'existait pas.
   *
   * Le brouillon naît donc sans numéro, comme tous les autres.
   */
  const numero = null;

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

  // Troisième copie de la même arithmétique jusqu'ici — cf. `totauxDepuisLignes`.
  // Une conversion ne RE-TARIFE pas : elle reprend les montants du bon de
  // livraison, ceux qui ont été convenus à la livraison.
  const { sousTotal, tva, total } = totauxDepuisLignes(lignes);

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
