import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import { bonsLivraison, transactions } from '~~/server/database/schema';
import { totauxDepuisLignes } from '~~/server/utils/pricing';
import { appliquerFranchise, estEnFranchiseTva } from '~~/server/utils/regimeTva';
import { quantiteEffective } from '~~/app/utils/bonLivraisonLigne';

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
   * ⚠️ AUCUN NUMÉRO SUR UN BROUILLON — et cette route en attribuait un.
   *
   * La règle est écrite en toutes lettres dans `finances/ventes.post.ts` :
   * `const numero = body.statut === 'brouillon' ? null : await
   * genererNumeroFacture(ownerId)`. Le numéro s'attribue à L'ÉMISSION, pas à
   * la création — c'est `factures/[id].put.ts` qui le pose quand le brouillon
   * part. Les deux routes de bons de livraison étaient les seules à le poser
   * d'avance, sur une transaction qu'elles créent pourtant en `brouillon`.
   *
   * Deux dégâts, dont un que j'ai moi-même refermé sur l'apiculteur
   * aujourd'hui :
   *
   *   · l'article 242 nonies A du CGI veut une séquence CONTINUE de factures
   *     émises. Un brouillon qui réserve un numéro puis n'est jamais envoyé
   *     creuse un trou dans la séquence ;
   *   · le `DELETE` de facture refuse désormais toute ligne PORTANT UN NUMÉRO
   *     — à juste titre : supprimer la dernière émise ferait réattribuer son
   *     numéro. Mais une conversion faite par erreur produisait ici un
   *     brouillon numéroté, donc INDÉLÉBILE, et pour lequel un avoir n'a aucun
   *     sens puisque rien n'a jamais été envoyé. La sortie de secours que ce
   *     refus promet n'existait pas.
   *
   * Le brouillon naît donc sans numéro, comme tous les autres.
   */
  const numero = null;
  const now = new Date();

  // Fusion des lignes de tous les bons (ordre : bons puis leurs lignes).
  const lignes = bls.flatMap((bl) =>
    (bl.lignes ?? []).map((l) => ({
      description: l.description,
      /**
       * ⚠️ LA FACTURE RÉCLAME CE QUI A ÉTÉ REMIS, PAS CE QUI A ÉTÉ COMMANDÉ.
       *
       * C'est la règle comptable, et c'est aussi la seule qui rende le bon
       * signé et la facture cohérents : un bordereau disant « livré 8 sur
       * 10 » suivi d'une facture de 10 recréerait mot pour mot la
       * contradiction papier/facture que ce document existe pour fermer.
       *
       * Le `total` juste en dessous, lui, n'est pas retouché : il a été
       * recalculé côté serveur au moment où la livraison a été constatée
       * (`lignesBonLivraisonAvecTotaux`). Une conversion ne RE-TARIFE pas.
       */
      quantite: quantiteEffective(l),
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
  /**
   * ⚠️ LA FRANCHISE EN BASE ÉTAIT IGNORÉE ICI, ET CETTE ROUTE ÉMET DE VRAIES
   * FACTURES. Un apiculteur dispensé de TVA (art. 293 B du CGI) obtenait une
   * facture NUMÉROTÉE portant 5,5 % — une taxe qu'il n'a pas le droit de
   * collecter, sur une pièce qu'il remet à son client. La création et
   * l'édition d'une facture appliquaient la règle depuis toujours ; les deux
   * routes de bons de livraison, non. Le commentaire de numérotation
   * ci-dessus raconte déjà exactement le même oubli, sur une autre règle.
   *
   * Ce n'est pas une re-tarification : le HT convenu à la livraison ne bouge
   * pas, seule la taxe disparaît.
   */
  appliquerFranchise(lignes, await estEnFranchiseTva(ownerId));

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
    /**
     * ⚠️ LE CONTRÔLE ET L'ÉCRITURE DOIVENT ÊTRE LE MÊME ORDRE SQL — cf. la note
     * jumelle dans `convertir.post.ts`. Le `select` du début filtre sur le
     * propriétaire, cette écriture ne filtrait que sur les identifiants.
     */
    .where(and(inArray(bonsLivraison.id, blIds), eq(bonsLivraison.userId, ownerId)));

  setResponseStatus(event, 201);
  return { data: { transaction, count: bls.length } };
});
