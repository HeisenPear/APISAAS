import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { transactions, clients, stocks, profils } from '~~/server/database/schema';
import { computeFactureTotals } from '~~/server/utils/pricing';
import { genererNumeroFacture } from '~~/server/utils/factureNumero';
import { useServerPostHog } from '~~/server/utils/posthog';

const ligneSchema = z.object({
  description: z.string().trim().min(1, 'Description requise'),
  quantite: z.coerce.number().min(0.01),
  prixUnitaire: z.coerce.number().min(0),
  total: z.coerce.number().optional(),
  tauxTva: z.coerce.number().min(0).max(100).default(5.5),
  // Tarification format/poids — le serveur recalcule le total (jamais le client)
  modePrix: z.enum(['format', 'poids']).optional(),
  contenance: z.coerce.number().min(0).optional(),
  uniteContenance: z.string().max(20).optional(),
  stockId: z.string().uuid().optional(),
  // Traçabilité miel — Décret 2003-587
  typeMiel: z.string().max(100).optional(),
  presentation: z.string().max(50).optional(),
  numLot: z.string().max(100).optional(),
  origineGeo: z.string().max(200).optional(),
  anneeRecolte: z.coerce.number().int().min(2000).max(2100).optional(),
});

const createVenteSchema = z.object({
  clientId: z.string().uuid().optional(),
  dateTransaction: z.coerce.date(),
  dateEcheance: z.coerce.date().optional(),
  lignes: z.array(ligneSchema).min(1, 'Au moins une ligne requise'),
  notes: z.string().trim().max(2000).optional(),
  categorie: z.string().trim().max(100).optional(),
  statut: z.enum(['brouillon', 'envoyee', 'payee']).default('brouillon'),
  categorieOperation: z
    .enum(['livraison_biens', 'prestation_services', 'mixte'])
    .default('livraison_biens'),
  remise: z.coerce.number().min(0).max(100).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const body = await readValidatedBody(event, createVenteSchema.parse);

  // Franchise en base de TVA (art. 293 B CGI) : on force tous les taux à 0 → aucune TVA
  // facturée, mention légale gérée à l'affichage et dans le Factur-X.
  const [profil] = await db
    .select({ franchiseTva: profils.franchiseTva })
    .from(profils)
    .where(eq(profils.id, ownerId))
    .limit(1);
  if (profil?.franchiseTva) body.lignes.forEach((l) => (l.tauxTva = 0));

  // Verify client ownership if provided
  if (body.clientId) {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, body.clientId), eq(clients.userId, ownerId)))
      .limit(1);
    if (!client) badRequest('Client introuvable');
  }

  // Totaux recalculés serveur via le module pricing partagé (jamais le total
  // client) : gère format vs poids/contenance (10 seaux × 25 kg × 10 €/kg =
  // 2500 €), remise sur le HT, TVA par ligne (taux mixtes). Même fonction que
  // l'édition de facture → montants identiques à la création et à la réédition.
  const {
    lignes: lignesWithTotals,
    sousTotal,
    tva,
    total,
  } = computeFactureTotals(body.lignes, body.remise);

  // Numéro attribué UNIQUEMENT à l'émission (jamais sur un brouillon) — séquence
  // continue sans trou, Art. 242 nonies A CGI. Un brouillon reste sans numéro.
  const numero = body.statut === 'brouillon' ? null : await genererNumeroFacture(ownerId);

  const [vente] = await db
    .insert(transactions)
    .values({
      userId: ownerId,
      clientId: body.clientId ?? null,
      type: 'vente',
      numero,
      dateTransaction: body.dateTransaction,
      dateEcheance: body.dateEcheance ?? null,
      statut: body.statut,
      sousTotal: sousTotal.toFixed(2),
      tva: tva.toFixed(2),
      remise: body.remise != null ? body.remise.toFixed(2) : null,
      total: total.toFixed(2),
      lignes: lignesWithTotals,
      notes: body.notes ?? null,
      categorie: body.categorie ?? null,
      categorieOperation: body.categorieOperation,
    })
    .returning();

  // Déduction stock pour les lignes liées à un article
  const stockLines = body.lignes.filter((l) => l.stockId);
  for (const ligne of stockLines) {
    await db
      .update(stocks)
      .set({
        quantite: sql`${stocks.quantite}::numeric - ${ligne.quantite}::numeric`,
        updatedAt: new Date(),
      })
      .where(and(eq(stocks.id, ligne.stockId!), eq(stocks.userId, ownerId)));
  }

  const sessionId = getHeader(event, 'x-posthog-session-id');
  const distinctId = getHeader(event, 'x-posthog-distinct-id');
  useServerPostHog().capture({
    distinctId: distinctId ?? user.id,
    event: 'sale_created',
    properties: {
      $session_id: sessionId,
      total: total,
      nb_lignes: body.lignes.length,
      statut: body.statut,
    },
  });

  setResponseStatus(event, 201);
  return { data: vente };
});
