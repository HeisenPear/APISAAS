import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { messagesForum, profils, signalementsAbus, sujetsForum } from '~~/server/database/schema';

/**
 * GET /api/admin/forum/signalements — la file d'arbitrage. Admin uniquement.
 *
 * ⚠️ ICI, ET SEULEMENT ICI, LE CONTENU D'UN MESSAGE MASQUÉ EST RENDU EN CLAIR.
 * C'est le seul endroit du produit où c'est nécessaire : on ne peut pas arbitrer
 * ce qu'on ne peut pas lire. La route publique, elle, remplace ce contenu par
 * `TEXTE_MESSAGE_MASQUE` avant de répondre — la différence tient à
 * `requireAdmin`, et c'est pour ça qu'il est la toute première ligne.
 *
 * ⚠️ L'AUTEUR EST NOMMÉ, ET ÇA AUSSI EST DÉLIBÉRÉ. Un arbitrage porte des
 * conséquences (masquage, torts comptés, suspension) : les rendre anonymes
 * rendrait impossible de voir qu'un même compte revient dix fois. Le
 * pseudonymat protège des LECTEURS, pas de la modération.
 */
const querySchema = z.object({
  arbitrage: z.enum(['en_attente', 'retenu', 'retabli']).default('en_attente'),
  limite: z.coerce.number().int().min(1).max(200).default(100),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { arbitrage, limite } = await getValidatedQuery(event, querySchema.parse);

  const lignes = await db
    .select({
      id: signalementsAbus.id,
      motif: signalementsAbus.motif,
      precision: signalementsAbus.precision,
      arbitrage: signalementsAbus.arbitrage,
      createdAt: signalementsAbus.createdAt,
      signaleurId: signalementsAbus.auteurId,
      signaleurEmail: profils.email,
      messageId: messagesForum.id,
      messageContenu: messagesForum.contenu,
      messageStatut: messagesForum.statut,
      messageSignalements: messagesForum.signalements,
      messageAuteurId: messagesForum.auteurId,
      sujetTitre: sujetsForum.titre,
      sujetSlug: sujetsForum.slug,
    })
    .from(signalementsAbus)
    .innerJoin(messagesForum, eq(signalementsAbus.messageId, messagesForum.id))
    .innerJoin(sujetsForum, eq(messagesForum.sujetId, sujetsForum.id))
    .innerJoin(profils, eq(signalementsAbus.auteurId, profils.id))
    .where(eq(signalementsAbus.arbitrage, arbitrage))
    .orderBy(desc(signalementsAbus.createdAt))
    .limit(limite);

  return { data: lignes };
});
