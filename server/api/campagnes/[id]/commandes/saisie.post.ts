import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import {
  organisations,
  campagnesCommande,
  produitsCampagne,
  commandesGroupees,
} from '~~/server/database/schema';

const saisieSchema = z.object({
  nomInvite: z.string().min(1, 'Le nom est requis').max(200).trim(),
  emailInvite: z.string().email('Email invalide').optional(),
  telephoneInvite: z.string().max(20).optional(),
  lignes: z
    .array(
      z.object({
        produitId: z.string().uuid(),
        quantite: z.number().int().positive(),
      }),
    )
    .min(1, 'Au moins une ligne est requise'),
  modePaiement: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const campagneId = z.string().uuid().parse(getRouterParam(event, 'id'));
  const body = await readValidatedBody(event, saisieSchema.parse);

  // Verify campaign ownership
  const [campagne] = await db
    .select()
    .from(campagnesCommande)
    .innerJoin(organisations, eq(campagnesCommande.organisationId, organisations.id))
    .where(and(eq(campagnesCommande.id, campagneId), eq(organisations.ownerId, ownerId)));

  if (!campagne) throw notFound('Campagne introuvable');

  // Fetch product prices
  const produitIds = body.lignes.map((l) => l.produitId);
  const produits = await db
    .select()
    .from(produitsCampagne)
    .where(
      and(eq(produitsCampagne.campagneId, campagneId), inArray(produitsCampagne.id, produitIds)),
    );

  const produitsMap = new Map(produits.map((p) => [p.id, p]));

  // Verify all products exist in this campaign
  for (const ligne of body.lignes) {
    if (!produitsMap.has(ligne.produitId)) {
      badRequest(`Produit ${ligne.produitId} introuvable dans cette campagne`);
    }
  }

  // Calculate totals
  let totalHt = 0;
  let totalTva = 0;

  const lignesAvecPrix = body.lignes.map((ligne) => {
    const produit = produitsMap.get(ligne.produitId)!;
    const prixHt = Number(produit.prixUnitaireHt) * ligne.quantite;
    const tva = prixHt * (Number(produit.tauxTva) / 100);
    totalHt += prixHt;
    totalTva += tva;

    return {
      produitId: ligne.produitId,
      nom: produit.nom,
      quantite: ligne.quantite,
      prixUnitaireHt: Number(produit.prixUnitaireHt),
      tauxTva: Number(produit.tauxTva),
      totalLigneHt: prixHt,
      totalLigneTva: tva,
      totalLigneTtc: prixHt + tva,
    };
  });

  const totalTtc = totalHt + totalTva;
  const tokenQr = crypto.randomUUID();

  const [commande] = await db
    .insert(commandesGroupees)
    .values({
      campagneId,
      nomInvite: body.nomInvite,
      emailInvite: body.emailInvite,
      telephoneInvite: body.telephoneInvite,
      totalHt: totalHt.toFixed(2),
      totalTva: totalTva.toFixed(2),
      totalTtc: totalTtc.toFixed(2),
      lignes: lignesAvecPrix,
      modePaiement: body.modePaiement,
      notes: body.notes,
      saisieAdmin: true,
      tokenQr,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: commande };
});
