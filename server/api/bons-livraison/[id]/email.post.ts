import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { bonsLivraison, clients } from '~~/server/database/schema';
import { uuidSchema } from '~~/server/utils/validators';
import { chargerEmetteur } from '~~/server/utils/emetteur';
import { sendBonLivraisonAuClient } from '~~/server/utils/email';
import { phraseDeRefus } from '~~/server/utils/refusEnvoi';
import { identiteEmetteur, nomLegal } from '~~/app/config/identite-emetteur';
import { sommeMontantsHt } from '~~/app/utils/prixLigne';
import { PLAFOND_PDF_BASE64_OCTETS } from '~~/app/config/tailles-envoi';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENVOYER LE BON DE LIVRAISON AU CLIENT.
 *
 * ⚠️ LE DOCUMENT NE SAVAIT QUE S'IMPRIMER. `window.print()`, et rien d'autre —
 * alors que c'est LE document que le client attend en même temps que la
 * marchandise, et que la facture, elle, sait s'envoyer depuis toujours.
 *
 * ─── CE QUE CETTE ROUTE NE FAIT PAS, ET POURQUOI ───────────────────────────
 * Elle ne change NI le statut, NI le numéro. C'est toute la différence avec
 * son homologue de la facture : là-bas, envoyer c'est ÉMETTRE, donc graver un
 * numéro légal à séquence continue. Ici le numéro existe depuis la création
 * (il DÉSIGNE le bon, il ne l'émet pas), et « livré » décrit un fait physique
 * — la marchandise remise — que l'envoi d'un email n'établit pas. Confondre
 * les deux marquerait comme livré un bon qu'on vient seulement d'annoncer.
 *
 * Elle écrit donc UNIQUEMENT la trace : est-ce parti, quand, et sinon pourquoi.
 * ═══════════════════════════════════════════════════════════════════════════
 */
const bodySchema = z.object({
  /**
   * PDF en base64, rendu par le navigateur depuis le bon affiché. Le plafond
   * est PARTAGÉ avec l'écran (`app/config/tailles-envoi.ts`) : au-delà, Vercel
   * coupe AVANT la route, et personne ne peut plus expliquer quoi que ce soit.
   */
  pdfBase64: z.string().min(100).max(PLAFOND_PDF_BASE64_OCTETS),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const { ownerId } = await assertCanWrite(event, 'commerce');
  const id = uuidSchema.parse(getRouterParam(event, 'id'));
  const { pdfBase64 } = await readValidatedBody(event, bodySchema.parse);

  const [bon] = await db
    .select({
      id: bonsLivraison.id,
      numero: bonsLivraison.numero,
      statut: bonsLivraison.statut,
      clientId: bonsLivraison.clientId,
      lignes: bonsLivraison.lignes,
    })
    .from(bonsLivraison)
    .where(and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId)))
    .limit(1);

  if (!bon) notFound('Bon de livraison introuvable');
  if (bon.statut === 'annule') badRequest("Ce bon est annulé — il n'y a rien à envoyer.");
  if (!bon.clientId) badRequest('Aucun client associé à ce bon de livraison.');

  const [client] = await db
    .select({ email: clients.email })
    .from(clients)
    .where(and(eq(clients.id, bon.clientId), eq(clients.userId, ownerId)))
    .limit(1);
  if (!client?.email) badRequest("Ce client n'a pas d'adresse email — complétez sa fiche.");

  const vendeur = await chargerEmetteur(ownerId);
  /**
   * ⚠️ ON N'ENVOIE PAS UN DOCUMENT ANONYME, et le refus est une PHRASE qui dit
   * où compléter. Contrairement à la facture, ce n'est pas une obligation
   * légale — c'est que le client doit savoir de qui vient la livraison pour
   * pouvoir contester une quantité. Un email signé de personne n'est pas
   * exploitable, et il ressemble à du courrier indésirable.
   */
  if (!nomLegal(vendeur)) {
    badRequest(
      'Votre bon de livraison ne peut pas partir sans votre nom : votre client doit ' +
        'savoir qui l’a livré pour pouvoir vous signaler une différence. Renseignez ' +
        'votre prénom et votre nom dans Réglages › Mon profil, puis réessayez — le bon ' +
        'vous attend, rien n’est perdu.',
    );
  }
  const vendeurNom = identiteEmetteur(vendeur).affichage;

  /**
   * La valeur des marchandises se lit sur les totaux STOCKÉS, par la même
   * fonction que le document imprimé — sinon l'email et la pièce jointe
   * pourraient annoncer deux montants différents. `null` quand le bon n'annonce
   * que des quantités : le prix vient parfois à la facturation, et inventer
   * 0,00 € annoncerait la gratuité.
   */
  const montantHt = (bon.lignes ?? []).some((l) => l.total != null || l.prixUnitaire != null)
    ? sommeMontantsHt(bon.lignes ?? [])
    : null;

  const content = pdfBase64.replace(/^data:[^;]*;base64,/, '');
  const cible = and(eq(bonsLivraison.id, id), eq(bonsLivraison.userId, ownerId));

  const envoi = await sendBonLivraisonAuClient({
    to: client.email,
    replyTo: vendeur?.email ?? undefined,
    vendeurNom,
    numeroBon: bon.numero,
    montantHt,
    attachments: [{ filename: `bon-livraison-${bon.numero}.pdf`, content }],
  });

  if (!envoi.ok) {
    const phrase = phraseDeRefus(envoi.code);
    // Le détail technique part au journal, jamais à l'écran : « invalid_from_
    // address » n'apprend rien à un apiculteur, mais c'est la seule chose qui
    // permette de diagnostiquer depuis les journaux Vercel.
    console.error(`[bon-livraison:email] ${id} refusé — ${envoi.code} : ${envoi.technique}`);
    try {
      await db
        .update(bonsLivraison)
        .set({ emailDernierEchec: phrase, updatedAt: new Date() })
        .where(cible);
    } catch (e) {
      console.error(`[bon-livraison:email] ${id} — trace du refus non enregistrée`, e);
    }
    badGateway(phrase);
  }

  const envoyeLe = new Date();
  await db
    .update(bonsLivraison)
    .set({
      emailEnvoyeLe: envoyeLe,
      emailMessageId: envoi.messageId,
      emailDernierEchec: null,
      updatedAt: envoyeLe,
    })
    .where(cible);

  return { data: { sent: true, envoyeLe: envoyeLe.toISOString() } };
});
