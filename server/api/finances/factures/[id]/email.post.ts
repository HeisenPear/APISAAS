import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { transactions, clients, profils } from '~~/server/database/schema';
import { genererNumeroFacture } from '~~/server/utils/factureNumero';
import { sendFactureAuClient } from '~~/server/utils/email';
import { phraseDeRefus } from '~~/server/utils/refusEnvoi';
import { PLAFOND_PDF_BASE64_OCTETS } from '~~/app/config/tailles-envoi';

/**
 * Envoie une facture (PDF généré côté client) au client par email.
 * Envoyer une facture = l'ÉMETTRE : si elle est en brouillon, on la passe en
 * « envoyée » et on lui attribue son numéro séquentiel.
 *
 * ⚠️ CE QUI SE JOUE ICI EST L'ÉMISSION D'UNE PIÈCE COMPTABLE. Le numéro de
 * facture est une obligation légale à séquence continue (art. 242 nonies A du
 * CGI) : le graver, c'est le consommer. On ne le grave donc QU'APRÈS un envoi
 * CONFIRMÉ — et « confirmé » veut dire que Resend a rendu un identifiant de
 * message, pas qu'on lui a parlé sans exception. Voir `refusEnvoi.ts`.
 */
const bodySchema = z.object({
  /**
   * PDF en base64, généré côté navigateur depuis la facture rendue.
   *
   * Le plafond est PARTAGÉ avec l'écran (`app/config/tailles-envoi.ts`) : il
   * valait 8 Mo ici, presque le double de ce que Vercel laisse passer. Un
   * corps entre les deux était donc accepté par la validation et coupé par
   * l'infrastructure — la pire des combinaisons, puisque la coupure survient
   * AVANT la route et ne peut être expliquée par personne.
   */
  pdfBase64: z.string().min(100).max(PLAFOND_PDF_BASE64_OCTETS),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
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
    .where(and(eq(transactions.id, id), eq(transactions.userId, ownerId)))
    .limit(1);

  if (!facture) notFound('Facture introuvable');
  if (facture.type !== 'vente') badRequest('Seules les factures de vente peuvent être envoyées');
  if (!facture.clientId) badRequest('Aucun client associé à cette facture');

  const [client] = await db
    .select({ email: clients.email })
    .from(clients)
    .where(and(eq(clients.id, facture.clientId), eq(clients.userId, ownerId)))
    .limit(1);
  if (!client?.email) badRequest("Ce client n'a pas d'adresse email — complétez sa fiche.");

  const [vendeur] = await db
    .select({ nom: profils.nom, prenom: profils.prenom, email: profils.email })
    .from(profils)
    .where(eq(profils.id, ownerId))
    .limit(1);
  const vendeurNom = [vendeur?.prenom, vendeur?.nom].filter(Boolean).join(' ') || 'APIGO';

  // Numéro à afficher (calculé en mémoire si brouillon sans numéro). Rien n'est
  // réservé par ce calcul : `genererNumeroFacture` ne fait que lire le dernier
  // numéro émis et ajouter 1. L'émission n'est PERSISTÉE qu'après l'envoi
  // confirmé — si l'email est refusé, aucun numéro n'est brûlé et la facture
  // reste un brouillon modifiable, donc réessayable.
  let numero = facture.numero;
  if (facture.statut === 'brouillon' && !numero) {
    numero = await genererNumeroFacture(ownerId);
  }

  const content = pdfBase64.replace(/^data:[^;]*;base64,/, '');
  const cible = and(eq(transactions.id, id), eq(transactions.userId, ownerId));

  const envoi = await sendFactureAuClient({
    to: client.email,
    replyTo: vendeur?.email ?? undefined,
    vendeurNom,
    numeroFacture: numero ?? 'brouillon',
    montantTtc: Number(facture.total ?? 0),
    attachments: [{ filename: `facture-${numero ?? id}.pdf`, content }],
  });

  if (!envoi.ok) {
    const phrase = phraseDeRefus(envoi.code);
    // Le détail technique part au journal, jamais à l'écran : « invalid_from_
    // address » n'apprend rien à un apiculteur, mais c'est la seule chose qui
    // permette de diagnostiquer depuis les journaux Vercel.
    console.error(`[facture:email] ${id} refusée — ${envoi.code} : ${envoi.technique}`);
    // On garde la trace du refus pour que la fiche puisse le DIRE. Si même
    // cette écriture échoue, on refuse quand même : perdre la trace est moins
    // grave que laisser croire que la facture est partie.
    try {
      await db
        .update(transactions)
        .set({ emailDernierEchec: phrase, updatedAt: new Date() })
        .where(cible);
    } catch (e) {
      console.error(`[facture:email] ${id} — trace du refus non enregistrée`, e);
    }
    badGateway(phrase);
  }

  // Envoi CONFIRMÉ (Resend a rendu un identifiant de message) → on émet le
  // brouillon : statut « envoyée » + numéro définitif, et la trace d'envoi.
  const envoyeLe = new Date();
  await db
    .update(transactions)
    .set({
      ...(facture.statut === 'brouillon' ? { statut: 'envoyee' as const, numero } : {}),
      emailEnvoyeLe: envoyeLe,
      emailMessageId: envoi.messageId,
      emailDernierEchec: null,
      updatedAt: envoyeLe,
    })
    .where(cible);

  return { data: { sent: true, numero, envoyeLe: envoyeLe.toISOString() } };
});
