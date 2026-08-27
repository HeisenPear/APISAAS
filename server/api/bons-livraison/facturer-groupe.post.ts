import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import { bonsLivraison, transactions } from '~~/server/database/schema';
import { genererNumeroFacture } from '~~/server/utils/factureNumero';
import { totauxDepuisLignes } from '~~/server/utils/pricing';

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
  /**
   * ⚠️ CES SEIZE LIGNES ÉTAIENT RECOPIÉES ICI, DANS LEUR VERSION D'AVANT LE
   * CORRECTIF. `server/utils/factureNumero.ts` existe précisément pour ça, et
   * son commentaire nomme le défaut : trier par `createdAt` sans filtrer les
   * numéros nuls « produisait des doublons […] violation directe de l'unicité
   * légale ». La correction n'a jamais été back-portée sur les deux routes de
   * bons de livraison, qui restaient les seules à fabriquer un FA- à la main.
   *
   * Le scénario, en clair : une vente laissée en BROUILLON porte `numero =
   * null` et devient la ligne la plus récente. Le tri par `createdAt` la
   * remonte, `lastNumero.numero` vaut null, aucune des deux branches ne
   * s'applique, `nextSeq` reste à 1 — et la facture émise reprend
   * FA-YYYY-0001, déjà utilisée. `transactions.numero` n'ayant aucune
   * contrainte d'unicité, l'insertion passe sans un mot.
   */
  const numero = await genererNumeroFacture(ownerId);
  const now = new Date();

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

  // Troisième copie de la même arithmétique jusqu'ici — cf. `totauxDepuisLignes`.
  // Une conversion ne RE-TARIFE pas : elle reprend les montants du bon de
  // livraison, ceux qui ont été convenus à la livraison.
  const { sousTotal, tva, total } = totauxDepuisLignes(lignes);

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
