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

  return {
    data: {
      ...row.commande,
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
