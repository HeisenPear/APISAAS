import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { transactions, clients, profils } from '~~/server/database/schema';
import { genererNumeroFacture } from '~~/server/utils/factureNumero';
import { sendFactureAuClient } from '~~/server/utils/email';

/**
 * Envoie une facture (PDF généré côté client) au client par email.
 * Envoyer une facture = l'ÉMETTRE : si elle est en brouillon, on la passe en
 * « envoyée » et on lui attribue son numéro séquentiel.
 */
const bodySchema = z.object({
  // PDF en base64 (~6 Mo max), généré côté navigateur depuis la facture rendue.
  pdfBase64: z.string().min(100).max(8_000_000),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = getRouterParam(event, 'id');
  if (!id) badRequest('ID manquant');
  uuidSchema.parse(id);
  const { pdfBase64 } = await readValidatedBody(event, bodySchema.parse);

  const [facture] = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      statut: transactions.statut,
      numero: transactions.numero,
      clientId: transactions.clientId,
      total: transactions.total,
    })
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
    .limit(1);

  if (!facture) notFound('Facture introuvable');
  if (facture.type !== 'vente') badRequest('Seules les factures de vente peuvent être envoyées');
  if (!facture.clientId) badRequest('Aucun client associé à cette facture');

  const [client] = await db
    .select({ email: clients.email })
    .from(clients)
    .where(and(eq(clients.id, facture.clientId), eq(clients.userId, user.id)))
    .limit(1);
  if (!client?.email) badRequest("Ce client n'a pas d'adresse email — complétez sa fiche.");

  const [vendeur] = await db
    .select({ nom: profils.nom, prenom: profils.prenom, email: profils.email })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);
  const vendeurNom = [vendeur?.prenom, vendeur?.nom].filter(Boolean).join(' ') || 'APIGO';

  // Émission si brouillon : numéro + statut « envoyée ».
  let numero = facture.numero;
  if (facture.statut === 'brouillon') {
    if (!numero) numero = await genererNumeroFacture(user.id);
    await db
      .update(transactions)
      .set({ statut: 'envoyee', numero, updatedAt: new Date() })
      .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));
  }

  const content = pdfBase64.replace(/^data:[^;]*;base64,/, '');

  const ok = await sendFactureAuClient({
    to: client.email,
    replyTo: vendeur?.email ?? undefined,
    vendeurNom,
    numeroFacture: numero ?? 'brouillon',
    montantTtc: Number(facture.total ?? 0),
    attachments: [{ filename: `facture-${numero ?? id}.pdf`, content }],
  });
  if (!ok) internalError("Service d'email non configuré");

  return { data: { sent: true, numero } };
});
