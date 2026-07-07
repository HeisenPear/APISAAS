import { eq, and } from 'drizzle-orm';
import { bonsLivraison, clients, transactions } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const id = getRouterParam(event, 'id')!;

  const [bl] = await db
    .select({
      id: bonsLivraison.id,
      numero: bonsLivraison.numero,
      dateCreation: bonsLivraison.dateCreation,
      dateLivraison: bonsLivraison.dateLivraison,
      statut: bonsLivraison.statut,
      lignes: bonsLivraison.lignes,
      transactionId: bonsLivraison.transactionId,
      notes: bonsLivraison.notes,
      adresseLivraison: bonsLivraison.adresseLivraison,
      codePostalLivraison: bonsLivraison.codePostalLivraison,
      villeLivraison: bonsLivraison.villeLivraison,
      createdAt: bonsLivraison.createdAt,
      updatedAt: bonsLivraison.updatedAt,
      clientId: bonsLivraison.clientId,
      clientNom: clients.nom,
      clientPrenom: clients.prenom,
      clientEntreprise: clients.entreprise,
      clientType: clients.type,
      clientAdresse: clients.adresse,
      clientCodePostal: clients.codePostal,
      clientVille: clients.ville,
      clientTelephone: clients.telephone,
      clientEmail: clients.email,
      clientAdresseLivraison: clients.adresseLivraison,
      clientCodePostalLivraison: clients.codePostalLivraison,
      clientVilleLivraison: clients.villeLivraison,
      transactionNumero: transactions.numero,
    })
    .from(bonsLivraison)
    .leftJoin(clients, eq(bonsLivraison.clientId, clients.id))
    .leftJoin(transactions, eq(bonsLivraison.transactionId, transactions.id))
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)))
    .limit(1);

  if (!bl) throw createError({ statusCode: 404, message: 'Bon de livraison introuvable' });

  return { data: bl };
});
