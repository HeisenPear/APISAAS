import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import { campagnesCommande, produitsCampagne, commandesGroupees } from '~~/server/database/schema';

const commanderSchema = z.object({
  nomInvite: z.string().min(1).max(200).trim().optional(),
  emailInvite: z.string().email().optional(),
  telephoneInvite: z.string().optional(),
  membreId: z.string().uuid().optional(),
  lignes: z
    .array(
      z.object({
        produitId: z.string().uuid(),
        quantite: z.number().int().positive(),
      }),
    )
    .min(1, 'Au moins une ligne est requise'),
  modePaiement: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const token = z.string().uuid().parse(getRouterParam(event, 'token'));
  const body = await readValidatedBody(event, commanderSchema.parse);

  // Find campagne by public token, only if ouverte
  const [campagne] = await db
    .select()
    .from(campagnesCommande)
    .where(and(eq(campagnesCommande.tokenPublic, token), eq(campagnesCommande.statut, 'ouverte')))
    .limit(1);

  if (!campagne) throw notFound('Campagne introuvable ou fermee');

  // Fetch product prices
  const produitIds = body.lignes.map((l) => l.produitId);
  const produits = await db
    .select()
    .from(produitsCampagne)
    .where(
      and(eq(produitsCampagne.campagneId, campagne.id), inArray(produitsCampagne.id, produitIds)),
    );

  const produitsMap = new Map(produits.map((p) => [p.id, p]));

  // Verify all products exist and check stock
  for (const ligne of body.lignes) {
    const produit = produitsMap.get(ligne.produitId);
    if (!produit) {
      badRequest(`Produit ${ligne.produitId} introuvable dans cette campagne`);
    }
    if (produit.stockDisponible !== null && ligne.quantite > produit.stockDisponible) {
      badRequest(`Stock insuffisant pour ${produit.nom} (disponible: ${produit.stockDisponible})`);
    }
    if (produit.quantiteMin !== null && ligne.quantite < produit.quantiteMin) {
      badRequest(`Quantite minimum pour ${produit.nom}: ${produit.quantiteMin}`);
    }
    if (produit.quantiteMax !== null && ligne.quantite > produit.quantiteMax) {
      badRequest(`Quantite maximum pour ${produit.nom}: ${produit.quantiteMax}`);
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
      campagneId: campagne.id,
      membreId: body.membreId,
      nomInvite: body.nomInvite,
      emailInvite: body.emailInvite,
      telephoneInvite: body.telephoneInvite,
      totalHt: totalHt.toFixed(2),
      totalTva: totalTva.toFixed(2),
      totalTtc: totalTtc.toFixed(2),
      lignes: lignesAvecPrix,
      modePaiement: body.modePaiement,
      tokenQr,
    })
    .returning();

  setResponseStatus(event, 201);
  return { data: commande };
});
