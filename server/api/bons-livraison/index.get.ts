import { eq, and, ilike, desc, or } from 'drizzle-orm';
import { bonsLivraison, clients } from '~~/server/database/schema';
import { paginationSchema } from '~~/server/utils/validators';
import { z } from 'zod';

const querySchema = paginationSchema.extend({
  statut: z.enum(['brouillon', 'livre', 'facture', 'annule']).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const conditions = [eq(bonsLivraison.userId, ownerId)];
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
        /**
         * ⚠️ IL MANQUAIT, ET LA GARDE DE L'ÉCRAN LISAIT `undefined`.
         * `bons-livraison/index.vue` refuse de regrouper des bons de clients
         * DIFFÉRENTS — mais son ensemble d'identifiants était rempli de
         * `'none'`, donc toujours de taille 1 : la garde ne se déclenchait
         * jamais. Le serveur, lui, refuse correctement (facturer-groupe), si
         * bien que l'apiculteur recevait une erreur brute après l'appel au lieu
         * d'une phrase avant. Un garde mort détourne de celui qui manque.
         */
        clientId: bonsLivraison.clientId,
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
