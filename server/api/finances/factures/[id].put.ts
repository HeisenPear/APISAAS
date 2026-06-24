import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { transactions, clients } from '~~/server/database/schema';
import { genererNumeroFacture } from '~~/server/utils/factureNumero';
import { computeFactureTotals } from '~~/server/utils/pricing';

const ligneSchema = z.object({
  description: z.string().trim().min(1),
  quantite: z.coerce.number().min(0.01),
  prixUnitaire: z.coerce.number().min(0),
  total: z.coerce.number(),
  tauxTva: z.coerce.number().min(0).max(100).default(5.5),
  // Tarification format/poids — préservée et utilisée pour le recalcul serveur
  // (sans ces champs, une ligne au poids était recalculée à tort en format)
  modePrix: z.enum(['format', 'poids']).optional(),
  contenance: z.coerce.number().min(0).optional(),
  uniteContenance: z.string().max(20).optional(),
  stockId: z.string().uuid().optional(),
  typeMiel: z.string().max(100).optional(),
  presentation: z.string().max(50).optional(),
  numLot: z.string().max(100).optional(),
  origineGeo: z.string().max(200).optional(),
  anneeRecolte: z.coerce.number().int().min(2000).max(2100).optional(),
});

const updateFactureSchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  dateTransaction: z.coerce.date().optional(),
  dateEcheance: z.coerce.date().optional().nullable(),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard', 'annulee']).optional(),
  lignes: z.array(ligneSchema).optional(),
  remise: z.coerce.number().min(0).max(100).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  categorie: z.string().trim().max(100).optional().nullable(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);

  const body = await readValidatedBody(event, updateFactureSchema.parse);

  const [existing] = await db
    .select({
      id: transactions.id,
      statut: transactions.statut,
      numero: transactions.numero,
      sousTotal: transactions.sousTotal,
      tva: transactions.tva,
      remise: transactions.remise,
    })
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, ownerId)))
    .limit(1);

  if (!existing) notFound('Transaction introuvable');

  // ─── Cadre légal : une facture ÉMISE est immuable ───────────────────────────
  // Seules les transitions de statut sont permises (envoyée→payée, →annulée).
  // Toute modification de contenu d'une facture non-brouillon est refusée :
  // la correction passe par une facture d'avoir (Art. 242 nonies A / 289 CGI).
  const modifContenu =
    body.lignes !== undefined ||
    body.remise !== undefined ||
    body.dateTransaction !== undefined ||
    body.dateEcheance !== undefined ||
    body.clientId !== undefined ||
    body.notes !== undefined ||
    body.categorie !== undefined;
  if (existing.statut !== 'brouillon' && modifContenu) {
    badRequest(
      'Cette facture est émise : son contenu ne peut plus être modifié. Pour la corriger, créez une facture d’avoir.',
    );
  }

  // Verify client if changed
  if (body.clientId) {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, body.clientId), eq(clients.userId, ownerId)))
      .limit(1);
    if (!client) badRequest('Client introuvable');
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.dateTransaction) updates.dateTransaction = body.dateTransaction;
  if (body.dateEcheance !== undefined) updates.dateEcheance = body.dateEcheance;
  if (body.statut) updates.statut = body.statut;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.categorie !== undefined) updates.categorie = body.categorie;
  if (body.clientId !== undefined) updates.clientId = body.clientId;
  if (body.remise !== undefined)
    updates.remise = body.remise != null ? body.remise.toFixed(2) : null;

  // Émission d'un brouillon → attribution du numéro séquentiel (s'il n'en a pas).
  if (
    body.statut &&
    body.statut !== 'brouillon' &&
    existing.statut === 'brouillon' &&
    !existing.numero
  ) {
    updates.numero = await genererNumeroFacture(ownerId);
  }

  // Recalcul des totaux si les lignes (ou la remise) changent — via le MÊME
  // helper que la création (computeFactureTotals) : format/poids et remise gérés
  // à l'identique, fini la divergence création vs édition. Remise effective =
  // celle envoyée, sinon celle déjà stockée (pour rester cohérent).
  if (body.lignes) {
    const remiseEffective = body.remise !== undefined ? body.remise : existing.remise;
    const { lignes, sousTotal, tva, total } = computeFactureTotals(body.lignes, remiseEffective);
    updates.lignes = lignes;
    updates.sousTotal = sousTotal.toFixed(2);
    updates.tva = tva.toFixed(2);
    updates.total = total.toFixed(2);
  }

  const [updated] = await db
    .update(transactions)
    .set(updates)
    .where(and(eq(transactions.id, id), eq(transactions.userId, ownerId)))
    .returning();

  return { data: updated };
});
