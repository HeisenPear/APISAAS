import { z } from 'zod';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { transactions, stocks, mouvementsStock } from '~~/server/database/schema';
import { prochaineEcheance } from '~~/server/utils/recurrence';
import { anneeParis } from '~~/server/utils/horloge';
import {
  FAMILLES_NUMERO,
  ordreNumeroDecroissant,
  prefixeMillesime,
  prochainNumero,
} from '~~/server/utils/numerotation';
import { ligneTotalHt, ligneTva, round2 } from '~~/server/utils/pricing';

const ligneSchema = z.object({
  description: z.string().trim().min(1, 'Description requise'),
  quantite: z.coerce.number().min(0.01),
  prixUnitaire: z.coerce.number().min(0),
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
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const body = await readValidatedBody(event, createAchatSchema.parse);

  // Total ligne via le module pricing (mode format : quantité × prix unitaire).
  // Cohérent avec lignesWithTotals plus bas — évite le double arrondi divergent.
  const lignesTotals = body.lignes.map((l) =>
    ligneTotalHt({ quantite: l.quantite, prixUnitaire: l.prixUnitaire, modePrix: 'format' }),
  );
  const sousTotal = round2(lignesTotals.reduce((sum, t) => sum + t, 0));
  const tva = ligneTva(sousTotal, body.tauxTva);
  const total = round2(sousTotal + tva);

  /**
   * Le numéro d'achat passe par `numerotation.ts`, comme la facture et le bon
   * de livraison. Cette route en portait sa propre copie, restée à la version
   * d'AVANT le correctif de la facture : année lue sur le serveur (donc en UTC)
   * et tri par `createdAt` (donc par ordre d'insertion, pas par numéro).
   */
  const now = new Date();
  const prefixe = prefixeMillesime('achat', anneeParis(now));
  const [dernier] = await db
    .select({ numero: transactions.numero })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, ownerId),
        eq(transactions.type, 'achat'),
        isNotNull(transactions.numero),
      ),
    )
    .orderBy(...ordreNumeroDecroissant(transactions.numero))
    .limit(1);
  const numero = prochainNumero(dernier?.numero ?? null, prefixe, {
    politique: FAMILLES_NUMERO.achat.politique,
    largeur: FAMILLES_NUMERO.achat.largeur,
  });

  const lignesWithTotals = body.lignes.map((l, i) => ({
    ...l,
    // `lignesTotals` est construit par `map` sur le même tableau : l'index
    // existe toujours. Le repli recopiait la formule de `ligneTotalHt` — donc
    // sans le mode poids — pour un cas qui ne peut pas se produire.
    total: lignesTotals[i]!,
  }));

  let nextRecurringDate: Date | null = null;
  if (body.isRecurring && body.recurringInterval) {
    /**
     * ⚠️ C'ÉTAIT `base.setMonth(base.getMonth() + 1)`, ET ÇA SAUTAIT UN MOIS.
     * `setMonth` ne borne pas le jour : le 31 janvier + 1 mois donne « le 31
     * février », que JavaScript reporte au 3 MARS. Février n'avait alors AUCUNE
     * occurrence — mesuré aussi sur 31/03 → 1er mai, 31/05 → 1er juillet,
     * 31/08 → 1er octobre. La règle vit maintenant dans `recurrence.ts`, avec
     * son ancre : le jour d'origine est repris chaque mois, borné au dernier
     * jour quand le mois est plus court.
     */
    const origine = new Date(body.dateTransaction);
    nextRecurringDate = prochaineEcheance(origine, body.recurringInterval, origine);
  }

  const [achat] = await db
    .insert(transactions)
    .values({
      userId: ownerId,
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
        .where(and(eq(stocks.id, ligne.stockId), eq(stocks.userId, ownerId)));
      // Record mouvement
      await db.insert(mouvementsStock).values({
        stockId: ligne.stockId,
        userId: ownerId,
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
          userId: ownerId,
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
          userId: ownerId,
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
