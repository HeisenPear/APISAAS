import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { campagnesCommande, produitsCampagne, organisations } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const token = z.string().uuid().parse(getRouterParam(event, 'token'));

  // Find campagne by public token, only if ouverte
  const [campagne] = await db
    .select({
      id: campagnesCommande.id,
      nom: campagnesCommande.nom,
      description: campagnesCommande.description,
      dateOuverture: campagnesCommande.dateOuverture,
      dateFermeture: campagnesCommande.dateFermeture,
      statut: campagnesCommande.statut,
      notes: campagnesCommande.notes,
      organisationNom: organisations.nom,
      organisationLogoUrl: organisations.logoUrl,
    })
    .from(campagnesCommande)
    .innerJoin(organisations, eq(campagnesCommande.organisationId, organisations.id))
    .where(and(eq(campagnesCommande.tokenPublic, token), eq(campagnesCommande.statut, 'ouverte')))
    .limit(1);

  if (!campagne) throw notFound('Campagne introuvable ou fermee');

  // Fetch produits ordered by ordre
  const produits = await db
    .select()
    .from(produitsCampagne)
    .where(eq(produitsCampagne.campagneId, campagne.id))
    .orderBy(produitsCampagne.ordre);

  return {
    data: {
      ...campagne,
      produits,
    },
  };
});
