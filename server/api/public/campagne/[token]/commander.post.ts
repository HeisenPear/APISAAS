import { z } from 'zod';
import { eq, and, inArray, gte, sql } from 'drizzle-orm';
import { ligneTotalHt, ligneTva, round2 } from '~~/server/utils/pricing';
import {
  campagnesCommande,
  produitsCampagne,
  commandesGroupees,
  membres,
  organisations,
} from '~~/server/database/schema';

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

  // Plafond anti-abus par campagne : la route est publique et le rate-limit
  // IP se contourne en tournant les IPs. 500 commandes/24h couvre largement
  // une grosse commande groupée de syndicat sans permettre le flood.
  const [recent] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(commandesGroupees)
    .where(
      and(
        eq(commandesGroupees.campagneId, campagne.id),
        gte(commandesGroupees.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
      ),
    );
  if ((recent?.count ?? 0) >= 500) {
    throw createError({
      statusCode: 429,
      message: 'Trop de commandes sur cette campagne — réessayez plus tard',
    });
  }

  // Si un membreId est fourni, verifier qu'il appartient bien a la meme
  // organisation que la campagne — sinon IDOR (commande au nom d'un membre
  // d'une autre organisation).
  if (body.membreId) {
    const [membre] = await db
      .select({ id: membres.id })
      .from(membres)
      .innerJoin(organisations, eq(organisations.ownerId, membres.ownerId))
      .where(and(eq(membres.id, body.membreId), eq(organisations.id, campagne.organisationId)))
      .limit(1);

    if (!membre) badRequest('Membre invalide pour cette campagne');
  }

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

  // Calculate totals — via le module pricing (gère format vs poids/contenance).
  // Ex: 10 seaux × 25 kg × 10 €/kg = 2500 € (et non 10 × 10 = 100 €).
  let totalHt = 0;
  let totalTva = 0;

  const lignesAvecPrix = body.lignes.map((ligne) => {
    const produit = produitsMap.get(ligne.produitId)!;
    const prixHt = ligneTotalHt({
      quantite: ligne.quantite,
      prixUnitaire: produit.prixUnitaireHt,
      modePrix: produit.modePrix,
      contenance: produit.contenance,
    });
    const tva = ligneTva(prixHt, produit.tauxTva);
    totalHt = round2(totalHt + prixHt);
    totalTva = round2(totalTva + tva);

    return {
      produitId: ligne.produitId,
      nom: produit.nom,
      quantite: ligne.quantite,
      prixUnitaireHt: Number(produit.prixUnitaireHt),
      modePrix: produit.modePrix,
      contenance: produit.contenance != null ? Number(produit.contenance) : null,
      uniteContenance: produit.uniteContenance,
      tauxTva: Number(produit.tauxTva),
      totalLigneHt: prixHt,
      totalLigneTva: tva,
      totalLigneTtc: round2(prixHt + tva),
    };
  });

  const totalTtc = round2(totalHt + totalTva);
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
