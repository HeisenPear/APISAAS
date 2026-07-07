import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { commandesGroupees, campagnesCommande, organisations } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const tokenQr = z.string().uuid().parse(getRouterParam(event, 'tokenQr'));

  // Find commande by QR token with campaign + organisation context
  const rows = await db
    .select({
      commande: commandesGroupees,
      campagneNom: campagnesCommande.nom,
      campagneDescription: campagnesCommande.description,
      organisationNom: organisations.nom,
      organisationLogoUrl: organisations.logoUrl,
      organisationEmail: organisations.email,
      organisationTelephone: organisations.telephone,
    })
    .from(commandesGroupees)
    .leftJoin(campagnesCommande, eq(commandesGroupees.campagneId, campagnesCommande.id))
    .leftJoin(organisations, eq(campagnesCommande.organisationId, organisations.id))
    .where(eq(commandesGroupees.tokenQr, tokenQr))
    .limit(1);

  const row = rows[0];
  if (!row) throw notFound('Commande introuvable');

  // Whitelist explicite : cette route est PUBLIQUE (accès par token QR). On ne
  // renvoie JAMAIS les champs internes (modePaiement, paiementRef, saisieAdmin,
  // notes admin, membreId) — seulement ce dont l'acheteur a besoin.
  const c = row.commande;
  return {
    data: {
      id: c.id,
      campagneId: c.campagneId,
      statut: c.statut,
      nomInvite: c.nomInvite,
      emailInvite: c.emailInvite,
      telephoneInvite: c.telephoneInvite,
      totalHt: c.totalHt,
      totalTva: c.totalTva,
      totalTtc: c.totalTtc,
      lignes: c.lignes,
      tokenQr: c.tokenQr,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      campagne: {
        nom: row.campagneNom,
        description: row.campagneDescription,
      },
      organisation: {
        nom: row.organisationNom,
        logoUrl: row.organisationLogoUrl,
        email: row.organisationEmail,
        telephone: row.organisationTelephone,
      },
    },
  };
});
