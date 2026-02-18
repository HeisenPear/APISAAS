import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { transactions, clients } from '~~/server/database/schema';

const ligneSchema = z.object({
  description: z.string().trim().min(1),
  quantite: z.coerce.number().min(0.01),
  prixUnitaire: z.coerce.number().min(0),
  total: z.coerce.number(),
});

const updateFactureSchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  dateTransaction: z.coerce.date().optional(),
  dateEcheance: z.coerce.date().optional().nullable(),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard', 'annulee']).optional(),
  lignes: z.array(ligneSchema).optional(),
  tauxTva: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  categorie: z.string().trim().max(100).optional().nullable(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateFactureSchema.parse);

  const [existing] = await db
    .select({ id: transactions.id, sousTotal: transactions.sousTotal, tva: transactions.tva })
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
    .limit(1);

  if (!existing) notFound('Transaction introuvable');

  // Verify client if changed
  if (body.clientId) {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, body.clientId), eq(clients.userId, user.id)))
      .limit(1);
    if (!client) badRequest('Client introuvable');
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.dateTransaction) updates.dateTransaction = body.dateTransaction;
  if (body.dateEcheance !== undefined) updates.dateEcheance = body.dateEcheance;
  if (body.statut) updates.statut = body.statut;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.categorie !== undefined) updates.categorie = body.categorie;
  if (body.clientId !== undefined) updates.clientId = body.clientId;

  // Recalculate totals if lignes changed
  if (body.lignes) {
    const lignesWithTotals = body.lignes.map((l) => ({
      ...l,
      total: Math.round(l.quantite * l.prixUnitaire * 100) / 100,
    }));
    const sousTotal = lignesWithTotals.reduce((sum, l) => sum + l.total, 0);
    const tauxTva = body.tauxTva ?? 5.5;
    const tva = Math.round(sousTotal * tauxTva) / 100;
    const total = Math.round((sousTotal + tva) * 100) / 100;

    updates.lignes = lignesWithTotals;
    updates.sousTotal = sousTotal.toFixed(2);
    updates.tva = tva.toFixed(2);
    updates.total = total.toFixed(2);
  }

  const [updated] = await db
    .update(transactions)
    .set(updates)
    .where(eq(transactions.id, id))
    .returning();

  return { data: updated };
});
