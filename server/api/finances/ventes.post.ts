import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { transactions, clients, stocks } from '~~/server/database/schema';

const ligneSchema = z.object({
  description: z.string().trim().min(1, 'Description requise'),
  quantite: z.coerce.number().min(0.01),
  prixUnitaire: z.coerce.number().min(0),
  total: z.coerce.number(),
  stockId: z.string().uuid().optional(),
});

const createVenteSchema = z.object({
  clientId: z.string().uuid().optional(),
  dateTransaction: z.coerce.date(),
  dateEcheance: z.coerce.date().optional(),
  lignes: z.array(ligneSchema).min(1, 'Au moins une ligne requise'),
  tauxTva: z.coerce.number().min(0).max(100).default(5.5),
  notes: z.string().trim().max(2000).optional(),
  categorie: z.string().trim().max(100).optional(),
  statut: z.enum(['brouillon', 'envoyee', 'payee']).default('brouillon'),
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

  // Compute totals
  const sousTotal = body.lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
  const tva = Math.round(sousTotal * body.tauxTva) / 100;
  const total = Math.round((sousTotal + tva) * 100) / 100;

  // Generate numero: FA-YYYY-NNN (sequence continue et chronologique, art. 242 nonies A CGI)
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
    // Different year prefix — check max across all years for this user
    const seqMatch = lastNumero.numero.match(/(\d+)$/);
    if (seqMatch?.[1]) nextSeq = parseInt(seqMatch[1], 10) + 1;
  }
  const numero = `${yearPrefix}${String(nextSeq).padStart(4, '0')}`;

  const lignesWithTotals = body.lignes.map((l) => ({
    ...l,
    total: Math.round(l.quantite * l.prixUnitaire * 100) / 100,
  }));

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
    })
    .returning();

  // Deduct stock for lines linked to a stock item
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
