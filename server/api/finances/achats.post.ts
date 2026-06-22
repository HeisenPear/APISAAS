import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { transactions, stocks, mouvementsStock } from '~~/server/database/schema';
import { ligneTotalHt, round2 } from '~~/server/utils/pricing';

const ligneSchema = z.object({
  description: z.string().trim().min(1, 'Description requise'),
  quantite: z.coerce.number().min(0.01),
  prixUnitaire: z.coerce.number().min(0),
  total: z.coerce.number(),
  ajouterAuStock: z.boolean().optional(),
  stockCategorie: z.string().optional(),
  stockType: z.enum(['materiel', 'produit_vente']).optional(),
  stockUnite: z.string().optional(),
  stockSeuilAlerte: z.coerce.number().min(0).optional(),
  stockId: z.string().uuid().optional(),
  unitesParColis: z.coerce.number().int().min(1).optional(),
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
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['mensuel', 'annuel']).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const body = await readValidatedBody(event, createAchatSchema.parse);

  // Total ligne via le module pricing (mode format : quantité × prix unitaire).
  // Cohérent avec lignesWithTotals plus bas — évite le double arrondi divergent.
  const lignesTotals = body.lignes.map((l) =>
    ligneTotalHt({ quantite: l.quantite, prixUnitaire: l.prixUnitaire, modePrix: 'format' }),
  );
  const sousTotal = round2(lignesTotals.reduce((sum, t) => sum + t, 0));
  const tva = round2((sousTotal * body.tauxTva) / 100);
  const total = round2(sousTotal + tva);

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

  const lignesWithTotals = body.lignes.map((l, i) => ({
    ...l,
    total: lignesTotals[i] ?? round2(l.quantite * l.prixUnitaire),
  }));

  let nextRecurringDate: Date | null = null;
  if (body.isRecurring && body.recurringInterval) {
    const base = new Date(body.dateTransaction);
    if (body.recurringInterval === 'mensuel') {
      base.setMonth(base.getMonth() + 1);
    } else {
      base.setFullYear(base.getFullYear() + 1);
    }
    nextRecurringDate = base;
  }

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
      isRecurring: body.isRecurring ?? false,
      recurringInterval: body.recurringInterval ?? null,
      nextRecurringDate: nextRecurringDate,
    })
    .returning();

  // Auto-add to stock for lines with ajouterAuStock flag
  for (const ligne of body.lignes) {
    if (!ligne.ajouterAuStock) continue;

    if (ligne.stockId) {
      // Existing stock item — add quantity (unitesParColis multiplies for bulk packs)
      const addQty = ligne.unitesParColis ? ligne.quantite * ligne.unitesParColis : ligne.quantite;
      await db
        .update(stocks)
        .set({
          quantite: sql`${stocks.quantite}::numeric + ${addQty}::numeric`,
          prixUnitaire: ligne.prixUnitaire.toFixed(2),
          updatedAt: new Date(),
        })
        .where(and(eq(stocks.id, ligne.stockId), eq(stocks.userId, user.id)));
      // Record mouvement
      await db.insert(mouvementsStock).values({
        stockId: ligne.stockId,
        userId: user.id,
        type: 'entree',
        quantite: addQty.toString(),
        motif: `Achat ${numero}`,
      });
    } else {
      // New stock item — create it
      const categorie =
        (ligne.stockCategorie as (typeof stocks.categorie.enumValues)[number]) || 'autre';
      const stockQty = ligne.unitesParColis
        ? ligne.quantite * ligne.unitesParColis
        : ligne.quantite;
      const [newStock] = await db
        .insert(stocks)
        .values({
          userId: user.id,
          nom: ligne.description,
          // Un achat alimente par défaut le MATÉRIEL (cadres, hausses, outils…).
          // Surchargeable par ligne via stockType (ex: achat de pots à revendre).
          type: ligne.stockType ?? 'materiel',
          categorie,
          quantite: stockQty.toString(),
          unite: ligne.stockUnite || 'unites',
          prixUnitaire: ligne.prixUnitaire.toFixed(2),
          seuilAlerte: ligne.stockSeuilAlerte?.toString() ?? null,
        })
        .returning();
      if (newStock) {
        await db.insert(mouvementsStock).values({
          stockId: newStock.id,
          userId: user.id,
          type: 'entree',
          quantite: ligne.quantite.toString(),
          motif: `Achat initial ${numero}`,
        });
      }
    }
  }

  setResponseStatus(event, 201);
  return { data: achat };
});
