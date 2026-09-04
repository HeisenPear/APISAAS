import { eq, and } from 'drizzle-orm';
import { transactions } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [existing] = await db
    .select({ id: transactions.id, statut: transactions.statut, numero: transactions.numero })
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, ownerId)))
    .limit(1);

  if (!existing) notFound('Transaction introuvable');

  /**
   * ⚠️ UNE FACTURE ÉMISE NE SE SUPPRIME PAS, ET CETTE ROUTE L'AUTORISAIT.
   *
   * Sa jumelle `PUT` refuse déjà de MODIFIER une facture émise — « son contenu
   * ne peut plus être modifié […] créez une facture d'avoir ». Le `DELETE`,
   * lui, effaçait n'importe quelle transaction du propriétaire, sans regarder
   * ni son statut ni son numéro. Deux conséquences, toutes deux graves :
   *
   *   · `genererNumeroFacture` reprend le PLUS GRAND numéro existant.
   *     Supprimer la dernière facture émise fait donc RÉATTRIBUER son numéro :
   *     deux documents différents circulent sous le même, ce que l'article
   *     242 nonies A du CGI interdit. Le client, lui, a déjà reçu le PDF.
   *   · le compteur `facturesParMois` est un `count(*)` de lignes VIVANTES :
   *     émettre, envoyer, supprimer, recommencer libérait le quota à chaque
   *     tour. Le plafond du plan ne bornait plus rien.
   *
   * On refuse dès qu'un numéro a été attribué OU que le statut n'est plus
   * « brouillon » — les deux, parce qu'ils ne coïncident pas toujours et
   * qu'aucun des deux seul ne suffit. Et le refus nomme la sortie : l'avoir
   * est le geste comptable prévu pour ça.
   */
  if (existing.numero || existing.statut !== 'brouillon') {
    badRequest(
      'Cette facture est émise : elle ne peut plus être supprimée. Son numéro appartient à ' +
        'une séquence légale continue. Pour l’annuler, créez une facture d’avoir depuis sa fiche.',
    );
  }

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, ownerId)));

  return { success: true };
});
