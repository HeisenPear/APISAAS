import { eq, and } from 'drizzle-orm';
import { bonsLivraison, transactions } from '~~/server/database/schema';
import { refusDeSuppression } from '~~/server/utils/suppressionTransaction';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [existing] = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      statut: transactions.statut,
      numero: transactions.numero,
    })
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, ownerId)))
    .limit(1);

  if (!existing) notFound('Transaction introuvable');

  /**
   * LA RÈGLE VIT DANS `server/utils/suppressionTransaction.ts`, pas ici.
   *
   * Elle a divergé deux fois : ce `DELETE` n'avait pas le garde de son `PUT`,
   * puis le garde ajouté s'est révélé PLUS LARGE que son motif — posé sur
   * toute la table `transactions`, il rendait aussi les ACHATS indélébiles,
   * alors qu'un achat naît avec un numéro et le statut « payee ». Une règle
   * écrite dans la route est une règle qui se recopiera.
   */
  const refus = refusDeSuppression({
    type: existing.type,
    statut: existing.statut,
    numero: existing.numero,
  });
  if (refus) badRequest(refus);

  /**
   * ⚠️ LES BONS DE LIVRAISON RATTACHÉS REDEVIENNENT FACTURABLES — sans quoi ils
   * deviennent un CUL-DE-SAC.
   *
   * La chaîne fait quatre maillons, tous corrects pris un à un : `convertir`
   * pose `statut: 'facture'` ; la facture créée est un BROUILLON sans numéro ;
   * `refusDeSuppression` autorise donc sa suppression (« une vente qui n'a
   * jamais été émise n'a rien troué ») ; et `bons_livraison.transaction_id` est
   * en `ON DELETE SET NULL`.
   *
   * Le bon se retrouvait donc « facturé » sans transaction — et l'écran ne
   * propose « Convertir » que sur un bon `livre`, ne permet de supprimer qu'un
   * `brouillon`, et masque « Annuler » sur un `facture`. Plus facturable, plus
   * annulable, plus supprimable : le seul recours était un appel direct à
   * l'API. La marchandise, elle, était bien partie.
   *
   * On les remet à « livré », l'état exact d'où ils venaient. LE STOCK NE BOUGE
   * PAS : `livre` et `facture` tiennent tous deux la marchandise
   * (`STATUTS_QUI_TIENNENT_LE_STOCK`) — la livraison a bien eu lieu, seule la
   * facture a été retirée.
   *
   * ⚠️ L'ÉCRITURE PRÉCÈDE LA SUPPRESSION : après le `DELETE`, la clé étrangère
   * est remise à `null` et plus rien ne permet de retrouver les bons.
   */
  await db
    .update(bonsLivraison)
    .set({ statut: 'livre', transactionId: null, updatedAt: new Date() })
    .where(and(eq(bonsLivraison.transactionId, id), eq(bonsLivraison.userId, ownerId)));

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, ownerId)));

  return { success: true };
});
