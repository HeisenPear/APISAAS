import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { transactions } from '~~/server/database/schema';

const ligneSchema = z.object({
  description: z.string().trim().min(1, 'Description requise'),
  quantite: z.coerce.number().min(0.01),
  prixUnitaire: z.coerce.number().min(0),
  total: z.coerce.number(),
});

const createAchatSchema = z.object({
  dateTransaction: z.coerce.date(),
  lignes: z.array(ligneSchema).min(1, 'Au moins une ligne requise'),
  tauxTva: z.coerce.number().min(0).max(100).default(20),
  notes: z.string().trim().max(2000).optional(),
  categorie: z
    .enum([
      'materiel',
      'nourrissement',
      'traitement',
      'emballage',
      'transport',
      'assurance',
      'formation',
      'autre',
    ])
    .optional(),
  statut: z.enum(['brouillon', 'payee']).default('payee'),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, createAchatSchema.parse);

  const sousTotal = body.lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
  const tva = Math.round(sousTotal * body.tauxTva) / 100;
  const total = Math.round((sousTotal + tva) * 100) / 100;

  // Generate numero: AC-YYYY-NNN (sequence continue et chronologique)
  const now = new Date();
  const yearPrefix = `AC-${now.getFullYear()}-`;
  const [lastNumero] = await db
    .select({ numero: transactions.numero })
    .from(transactions)
    .where(and(eq(transactions.userId, user.id), eq(transactions.type, 'achat')))
    .orderBy(desc(transactions.createdAt))
    .limit(1);
  let nextSeq = 1;
  if (lastNumero?.numero?.startsWith(yearPrefix)) {
    const lastSeq = parseInt(lastNumero.numero.slice(yearPrefix.length), 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }
  const numero = `${yearPrefix}${String(nextSeq).padStart(4, '0')}`;

  const lignesWithTotals = body.lignes.map((l) => ({
    ...l,
    total: Math.round(l.quantite * l.prixUnitaire * 100) / 100,
  }));

  const [achat] = await db
    .insert(transactions)
    .values({
      userId: user.id,
      clientId: null,
      type: 'achat',
      numero,
      dateTransaction: body.dateTransaction,
      statut: body.statut,
      sousTotal: sousTotal.toFixed(2),
      tva: tva.toFixed(2),
      total: total.toFixed(2),
      lignes: lignesWithTotals,
      notes: body.notes ?? null,
      categorie: body.categorie ?? null,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: achat };
});
