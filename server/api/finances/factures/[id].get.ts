import { eq, and } from 'drizzle-orm';
import { transactions, clients, profils } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const [row] = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      numero: transactions.numero,
      dateTransaction: transactions.dateTransaction,
      dateEcheance: transactions.dateEcheance,
      statut: transactions.statut,
      sousTotal: transactions.sousTotal,
      tva: transactions.tva,
      remise: transactions.remise,
      total: transactions.total,
      pdfUrl: transactions.pdfUrl,
      notes: transactions.notes,
      lignes: transactions.lignes,
      categorie: transactions.categorie,
      clientId: transactions.clientId,
      clientNom: clients.nom,
      clientPrenom: clients.prenom,
      clientEntreprise: clients.entreprise,
      clientEmail: clients.email,
      clientTelephone: clients.telephone,
      clientAdresse: clients.adresse,
      clientCodePostal: clients.codePostal,
      clientVille: clients.ville,
      clientSiret: clients.siret,
      clientSiren: clients.siren,
      clientAdresseLivraison: clients.adresseLivraison,
      clientCodePostalLivraison: clients.codePostalLivraison,
      clientVilleLivraison: clients.villeLivraison,
      categorieOperation: transactions.categorieOperation,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .leftJoin(clients, eq(transactions.clientId, clients.id))
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
    .limit(1);

  if (!row) notFound('Transaction introuvable');

  // Fetch emitter info (user profile)
  const [profil] = await db
    .select({
      nom: profils.nom,
      prenom: profils.prenom,
      email: profils.email,
      telephone: profils.telephone,
      adresse: profils.adresse,
      codePostal: profils.codePostal,
      ville: profils.ville,
      siret: profils.siret,
      napi: profils.napi,
      optionTvaDebits: profils.optionTvaDebits,
      preferences: profils.preferences,
    })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  return {
    data: {
      ...row,
      emetteur: profil ?? null,
    },
  };
});
