import { eq, and, ilike, desc, or } from 'drizzle-orm';
import { bonsLivraison, clients } from '~~/server/database/schema';
import { paginationSchema } from '~~/server/utils/validators';
import { z } from 'zod';

const querySchema = paginationSchema.extend({
  statut: z.enum(['brouillon', 'livre', 'facture', 'annule']).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const conditions = [eq(bonsLivraison.userId, user.id)];
  if (query.statut) conditions.push(eq(bonsLivraison.statut, query.statut));
  if (query.search) {
    conditions.push(
      or(
        ilike(bonsLivraison.numero, `%${query.search}%`),
        ilike(bonsLivraison.notes, `%${query.search}%`),
      )!,
    );
  }

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: bonsLivraison.id,
        numero: bonsLivraison.numero,
        dateCreation: bonsLivraison.dateCreation,
        dateLivraison: bonsLivraison.dateLivraison,
        statut: bonsLivraison.statut,
        lignes: bonsLivraison.lignes,
        transactionId: bonsLivraison.transactionId,
        notes: bonsLivraison.notes,
        createdAt: bonsLivraison.createdAt,
        clientNom: clients.nom,
        clientPrenom: clients.prenom,
        clientEntreprise: clients.entreprise,
        clientType: clients.type,
      })
      .from(bonsLivraison)
      .leftJoin(clients, eq(bonsLivraison.clientId, clients.id))
      .where(and(...conditions))
      .orderBy(desc(bonsLivraison.createdAt))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit),
    db.$count(bonsLivraison, and(...conditions)),
  ]);

  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: countResult,
      totalPages: Math.ceil(countResult / query.limit),
    },
  };
});
