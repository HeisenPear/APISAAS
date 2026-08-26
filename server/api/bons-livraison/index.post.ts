import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { bonsLivraison, clients, stocks } from '~~/server/database/schema';
import { ligneTotalHt } from '~~/server/utils/pricing';
import { anneeParis } from '~~/server/utils/horloge';
import {
  FAMILLES_NUMERO,
  ordreNumeroDecroissant,
  prefixeMillesime,
  prochainNumero,
} from '~~/server/utils/numerotation';

const ligneSchema = z.object({
  description: z.string().trim().min(1),
  quantite: z.coerce.number().min(0.01),
  prixUnitaire: z.coerce.number().min(0).optional(),
  tauxTva: z.coerce.number().min(0).max(100).default(5.5),
  total: z.coerce.number().optional(),
  modePrix: z.enum(['format', 'poids']).optional(),
  contenance: z.coerce.number().min(0).optional(),
  uniteContenance: z.string().max(20).optional(),
  stockId: z.string().uuid().optional(),
  typeMiel: z.string().max(100).optional(),
  presentation: z.string().max(50).optional(),
  numLot: z.string().max(100).optional(),
  origineGeo: z.string().max(200).optional(),
  anneeRecolte: z.coerce.number().int().min(2000).max(2100).optional(),
});

const createBLSchema = z.object({
  clientId: z.string().uuid().optional(),
  dateCreation: z.coerce.date(),
  dateLivraison: z.coerce.date().optional(),
  lignes: z.array(ligneSchema).min(1),
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

  const lignesWithTotals = body.lignes.map((l) => ({
    ...l,
    total:
      l.prixUnitaire != null
        ? ligneTotalHt({
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            modePrix: l.modePrix,
            contenance: l.contenance,
          })
        : undefined,
  }));

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
