import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { transactions, clients, stocks } from '~~/server/database/schema';
import { ligneTotalHt, round2 } from '~~/server/utils/pricing';
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
  const body = await readValidatedBody(event, createVenteSchema.parse);

  // Verify client ownership if provided
  if (body.clientId) {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, body.clientId), eq(clients.userId, user.id)))
      .limit(1);
    if (!client) badRequest('Client introuvable');
  }

  // Calcul des totaux — total recalculé serveur via le module pricing
  // (gère format vs poids/contenance, ex: 10 seaux × 25 kg × 10 €/kg = 2500 €)
  const lignesWithTotals = body.lignes.map((l) => ({
    ...l,
    total: ligneTotalHt({
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire,
      modePrix: l.modePrix,
      contenance: l.contenance,
    }),
  }));

  const sousTotal = round2(lignesWithTotals.reduce((sum, l) => sum + l.total, 0));

  // Remise appliquée sur le HT avant TVA
  const remiseMontant = body.remise ? round2((sousTotal * body.remise) / 100) : 0;
  const sousTotalNet = round2(sousTotal - remiseMontant);

  // TVA calculée ligne par ligne — permet taux mixtes sur une même facture
  // Si remise, applique proportionnellement sur chaque ligne
  const remiseRatio = body.remise ? (100 - body.remise) / 100 : 1;
  const tva = round2(
    lignesWithTotals.reduce((sum, l) => sum + (l.total * remiseRatio * l.tauxTva) / 100, 0),
  );

  const total = round2(sousTotalNet + tva);

  // Génération numéro : FA-YYYY-NNNN (séquence continue chronologique, Art. 242 nonies A CGI)
  const now = new Date();
  const yearPrefix = `FA-${now.getFullYear()}-`;
  const [lastNumero] = await db
    .select({ numero: transactions.numero })
    .from(transactions)
    .where(and(eq(transactions.userId, user.id), eq(transactions.type, 'vente')))
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

  const [vente] = await db
    .insert(transactions)
    .values({
      userId: user.id,
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
      .where(and(eq(stocks.id, ligne.stockId!), eq(stocks.userId, user.id)));
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
