import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { bonsLivraison, clients } from '~~/server/database/schema';
import { appliquerStockBonLivraison, empreinteDuBon } from '~~/server/utils/bonLivraisonStock';
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

  /**
   * ⚠️ LA DÉDUCTION LAISSE DÉSORMAIS UNE TRACE. Elle n'en laissait AUCUNE :
   * `mouvements_stock` ne portait que l'entrée « Annulation BL » écrite par la
   * route d'annulation — un mouvement qui annulait quelque chose qui n'avait
   * jamais été écrit. L'historique ne pouvait pas se rapprocher du stock, alors
   * que c'est ce que la table promet.
   *
   * Les quatre portes qui bougent le stock d'un bon passent maintenant par la
   * même mécanique (`server/utils/bonLivraisonStock.ts`).
   */
  await appliquerStockBonLivraison({
    ownerId,
    bonId: bl!.id,
    numero: bl!.numero,
    apres: empreinteDuBon(bl!.statut, lignesWithTotals),
    motif: 'Bon de livraison',
  });

  setResponseStatus(event, 201);
  return { data: bl };
});
