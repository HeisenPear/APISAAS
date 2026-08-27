import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { bonsLivraison, clients, stocks } from '~~/server/database/schema';
import {
  ligneBonLivraisonSchema,
  lignesBonLivraisonAvecTotaux,
} from '~~/server/utils/bonLivraison';
import { anneeParis } from '~~/server/utils/horloge';
import {
  FAMILLES_NUMERO,
  ordreNumeroDecroissant,
  prefixeMillesime,
  prochainNumero,
} from '~~/server/utils/numerotation';

const createBLSchema = z.object({
  clientId: z.string().uuid().optional(),
  dateCreation: z.coerce.date(),
  dateLivraison: z.coerce.date().optional(),
  lignes: z.array(ligneBonLivraisonSchema).min(1),
  notes: z.string().trim().max(2000).optional(),
  adresseLivraison: z.string().trim().max(500).optional(),
  codePostalLivraison: z.string().trim().max(20).optional(),
  villeLivraison: z.string().trim().max(200).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const body = await readValidatedBody(event, createBLSchema.parse);

  if (body.clientId) {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, body.clientId), eq(clients.userId, ownerId)))
      .limit(1);
    if (!client) badRequest('Client introuvable');
  }

  /**
   * Le numéro de bon de livraison passe par `numerotation.ts` — troisième
   * copie des mêmes quinze lignes, et elle aussi restée à la version d'avant
   * le correctif de la facture : millésime lu sur le serveur (UTC) et tri par
   * `createdAt`, c'est-à-dire par ordre d'insertion et non par numéro.
   */
  const prefixe = prefixeMillesime('bonLivraison', anneeParis(new Date()));
  const [dernier] = await db
    .select({ numero: bonsLivraison.numero })
    .from(bonsLivraison)
    .where(eq(bonsLivraison.userId, ownerId))
    .orderBy(...ordreNumeroDecroissant(bonsLivraison.numero))
    .limit(1);
  const numero = prochainNumero(dernier?.numero ?? null, prefixe, {
    politique: FAMILLES_NUMERO.bonLivraison.politique,
    largeur: FAMILLES_NUMERO.bonLivraison.largeur,
  });

  const lignesWithTotals = lignesBonLivraisonAvecTotaux(body.lignes);

  const [bl] = await db
    .insert(bonsLivraison)
    .values({
      userId: ownerId,
      clientId: body.clientId ?? null,
      numero,
      dateCreation: body.dateCreation,
      dateLivraison: body.dateLivraison ?? null,
      statut: 'brouillon',
      lignes: lignesWithTotals,
      notes: body.notes ?? null,
      adresseLivraison: body.adresseLivraison ?? null,
      codePostalLivraison: body.codePostalLivraison ?? null,
      villeLivraison: body.villeLivraison ?? null,
    })
    .returning();

  // Déduction stock immédiate pour les lignes liées à un article
  const stockLines = body.lignes.filter((l) => l.stockId);
  for (const ligne of stockLines) {
    await db
      .update(stocks)
      .set({
        quantite: sql`${stocks.quantite}::numeric - ${ligne.quantite}::numeric`,
        updatedAt: new Date(),
      })
      .where(and(eq(stocks.id, ligne.stockId!), eq(stocks.userId, ownerId)));
  }

  setResponseStatus(event, 201);
  return { data: bl };
});
