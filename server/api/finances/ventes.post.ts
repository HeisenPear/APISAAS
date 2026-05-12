import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { transactions, clients, stocks } from '~~/server/database/schema';

const ligneSchema = z.object({
  description: z.string().trim().min(1, 'Description requise'),
  quantite: z.coerce.number().min(0.01),
  prixUnitaire: z.coerce.number().min(0),
  total: z.coerce.number(),
  tauxTva: z.coerce.number().min(0).max(100).default(5.5),
  stockId: z.string().uuid().optional(),
  // Traçabilité miel — Décret 2003-587
  typeMiel: z.string().max(100).optional(),
  presentation: z.string().max(50).optional(),
  numLot: z.string().max(100).optional(),
  origineGeo: z.string().max(200).optional(),
  anneeRecolte: z.coerce.number().int().min(2000).max(2100).optional(),
});

const createVenteSchema = z.object({
  clientId: z.string().uuid().optional(),
  dateTransaction: z.coerce.date(),
  dateEcheance: z.coerce.date().optional(),
  lignes: z.array(ligneSchema).min(1, 'Au moins une ligne requise'),
  notes: z.string().trim().max(2000).optional(),
  categorie: z.string().trim().max(100).optional(),
  statut: z.enum(['brouillon', 'envoyee', 'payee']).default('brouillon'),
  categorieOperation: z
    .enum(['livraison_biens', 'prestation_services', 'mixte'])
    .default('livraison_biens'),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, createVenteSchema.parse);

  // Verify client ownership if provided
  if (body.clientId) {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, body.clientId), eq(clients.userId, user.id)))
      .limit(1);
    if (!client) badRequest('Client introuvable');
  }

  // Calcul des totaux — TVA par ligne (conformité droit fiscal français)
  const lignesWithTotals = body.lignes.map((l) => ({
    ...l,
    total: Math.round(l.quantite * l.prixUnitaire * 100) / 100,
  }));

  const sousTotal = lignesWithTotals.reduce((sum, l) => sum + l.total, 0);

  // TVA calculée ligne par ligne — permet taux mixtes sur une même facture
  const tva = lignesWithTotals.reduce((sum, l) => {
    return sum + Math.round(l.total * l.tauxTva) / 100;
  }, 0);

  const total = Math.round((sousTotal + tva) * 100) / 100;

  // Génération numéro : FA-YYYY-NNNN (séquence continue chronologique, Art. 242 nonies A CGI)
  const now = new Date();
  const yearPrefix = `FA-${now.getFullYear()}-`;
  const [lastNumero] = await db
    .select({ numero: transactions.numero })
    .from(transactions)
    .where(and(eq(transactions.userId, user.id), eq(transactions.type, 'vente')))
    .orderBy(desc(transactions.createdAt))
    .limit(1);
  let nextSeq = 1;
  if (lastNumero?.numero?.startsWith(yearPrefix)) {
    const lastSeq = parseInt(lastNumero.numero.slice(yearPrefix.length), 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  } else if (lastNumero?.numero) {
    const seqMatch = lastNumero.numero.match(/(\d+)$/);
    if (seqMatch?.[1]) nextSeq = parseInt(seqMatch[1], 10) + 1;
  }
  const numero = `${yearPrefix}${String(nextSeq).padStart(4, '0')}`;

  const [vente] = await db
    .insert(transactions)
    .values({
      userId: user.id,
      clientId: body.clientId ?? null,
      type: 'vente',
      numero,
      dateTransaction: body.dateTransaction,
      dateEcheance: body.dateEcheance ?? null,
      statut: body.statut,
      sousTotal: sousTotal.toFixed(2),
      tva: tva.toFixed(2),
      total: total.toFixed(2),
      lignes: lignesWithTotals,
      notes: body.notes ?? null,
      categorie: body.categorie ?? null,
      categorieOperation: body.categorieOperation,
    })
    .returning();

  // Déduction stock pour les lignes liées à un article
  const stockLines = body.lignes.filter((l) => l.stockId);
  for (const ligne of stockLines) {
    await db
      .update(stocks)
      .set({
        quantite: sql`${stocks.quantite}::numeric - ${ligne.quantite}::numeric`,
        updatedAt: new Date(),
      })
      .where(and(eq(stocks.id, ligne.stockId!), eq(stocks.userId, user.id)));
  }

  setResponseStatus(event, 201);
  return { data: vente };
});
