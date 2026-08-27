import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import {
  organisations,
  campagnesCommande,
  produitsCampagne,
  commandesGroupees,
} from '~~/server/database/schema';
import { tariferCommandeCampagne } from '~~/server/utils/commandeCampagne';

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

  // Le tarif passe par la MÊME fonction que le formulaire public. Cette porte
  // avait sa propre arithmétique : pas d'arrondi par ligne (elle stockait
  // `0.5445` là où l'autre stocke `0,54`, et pouvait différer d'un centime sur
  // le total), et surtout aucun regard sur `modePrix` ni `contenance` — dix
  // seaux de 25 kg à 10 €/kg y valaient 100 € au lieu de 2 500 €.
  const {
    lignes: lignesAvecPrix,
    totalHt,
    totalTva,
    totalTtc,
  } = tariferCommandeCampagne(body.lignes, produitsMap);
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
