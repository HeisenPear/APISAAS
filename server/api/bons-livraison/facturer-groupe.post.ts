import { z } from 'zod';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { bonsLivraison, transactions } from '~~/server/database/schema';
import { round2 } from '~~/server/utils/pricing';

/**
 * Facture groupée : combine plusieurs bons de livraison d'un MÊME client en une
 * seule facture (cas classique de la facturation mensuelle des revendeurs).
 * Réutilise la logique de conversion unitaire (convertir.post.ts) mais fusionne
 * les lignes de tous les bons. Gaté par le plan via route-gates (facturationPdf
 * + limite facturesParMois : le groupe = 1 seule facture).
 */
const schema = z.object({
  blIds: z
    .array(z.string().uuid())
    .min(1, 'Sélectionnez au moins un bon de livraison')
    .max(100, 'Trop de bons sélectionnés'),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const { blIds } = await readValidatedBody(event, schema.parse);

  const bls = await db
    .select()
    .from(bonsLivraison)
    .where(and(inArray(bonsLivraison.id, blIds), eq(bonsLivraison.userId, ownerId)));

  if (bls.length !== blIds.length) {
    throw createError({
      statusCode: 404,
      message: 'Un ou plusieurs bons de livraison sont introuvables.',
    });
  }
  for (const bl of bls) {
    if (bl.statut === 'facture' || bl.transactionId) {
      throw createError({ statusCode: 400, message: `Le bon ${bl.numero} est déjà facturé.` });
    }
    if (bl.statut === 'annule') {
      throw createError({ statusCode: 400, message: `Le bon ${bl.numero} est annulé.` });
    }
  }
  // Regroupement uniquement au sein d'un même client.
  const clientIds = new Set(bls.map((b) => b.clientId ?? 'sans-client'));
  if (clientIds.size > 1) {
    throw createError({
      statusCode: 400,
      message: 'Les bons doivent appartenir au même client pour être regroupés.',
    });
  }
  const clientId = bls[0]!.clientId ?? null;

  // Numéro FA-YYYY-NNNN (même génération que la conversion unitaire).
  const now = new Date();
  const yearPrefix = `FA-${now.getFullYear()}-`;
  const [lastNumero] = await db
    .select({ numero: transactions.numero })
    .from(transactions)
    .where(and(eq(transactions.userId, ownerId), eq(transactions.type, 'vente')))
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

  // Fusion des lignes de tous les bons (ordre : bons puis leurs lignes).
  const lignes = bls.flatMap((bl) =>
    (bl.lignes ?? []).map((l) => ({
      description: l.description,
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire ?? 0,
      total: l.total ?? 0,
      tauxTva: l.tauxTva ?? 5.5,
      modePrix: l.modePrix,
      contenance: l.contenance,
      uniteContenance: l.uniteContenance,
      stockId: l.stockId,
      typeMiel: l.typeMiel,
      presentation: l.presentation,
      numLot: l.numLot,
      origineGeo: l.origineGeo,
      anneeRecolte: l.anneeRecolte,
    })),
  );

  const sousTotal = round2(lignes.reduce((s, l) => s + l.total, 0));
  const tva = round2(lignes.reduce((s, l) => s + (l.total * l.tauxTva) / 100, 0));
  const total = round2(sousTotal + tva);

  const refBons = bls.map((b) => b.numero).join(', ');
  const [transaction] = await db
    .insert(transactions)
    .values({
      userId: ownerId,
      clientId,
      type: 'vente',
      numero,
      dateTransaction: now,
      statut: 'brouillon',
      sousTotal: sousTotal.toFixed(2),
      tva: tva.toFixed(2),
      total: total.toFixed(2),
      lignes,
      notes: `Facture groupée des bons de livraison : ${refBons}`,
      categorieOperation: 'livraison_biens',
    })
    .returning();

  if (!transaction) {
    throw createError({ statusCode: 500, message: 'Erreur lors de la création de la facture.' });
  }

  // Lie tous les bons à la facture groupée.
  await db
    .update(bonsLivraison)
    .set({ statut: 'facture', transactionId: transaction.id, updatedAt: new Date() })
    .where(inArray(bonsLivraison.id, blIds));

  setResponseStatus(event, 201);
  return { data: { transaction, count: bls.length } };
});
