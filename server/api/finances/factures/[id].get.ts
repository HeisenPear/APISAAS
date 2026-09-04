import { eq, and } from 'drizzle-orm';
import { transactions, clients, profils } from '~~/server/database/schema';
import { COLONNES_EMETTEUR } from '~~/server/utils/emetteur';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
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
      // Trace d'envoi — la fiche doit pouvoir DIRE si la facture est partie, et
      // sinon pourquoi. Sans ces trois colonnes, l'écran ne savait qu'afficher
      // « Facture envoyée à … » juste après le clic, y compris sur un refus.
      emailEnvoyeLe: transactions.emailEnvoyeLe,
      emailMessageId: transactions.emailMessageId,
      emailDernierEchec: transactions.emailDernierEchec,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .leftJoin(clients, eq(transactions.clientId, clients.id))
    .where(and(eq(transactions.id, id), eq(transactions.userId, ownerId)))
    .limit(1);

  if (!row) notFound('Transaction introuvable');

  // Fetch emitter info (user profile)
  const [profil] = await db
    .select({
      // La liste commune à tous les documents — cf. `server/utils/emetteur.ts`.
      ...COLONNES_EMETTEUR,
      // Ce qui n'a de sens que sur une FACTURE : le régime de TVA et les
      // préférences d'émission. Un bon de livraison n'en a que faire.
      optionTvaDebits: profils.optionTvaDebits,
      franchiseTva: profils.franchiseTva,
      preferences: profils.preferences,
    })
    .from(profils)
    .where(eq(profils.id, ownerId))
    .limit(1);

  return {
    data: {
      ...row,
      emetteur: profil ?? null,
    },
  };
});
