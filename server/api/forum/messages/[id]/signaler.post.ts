import { and, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { messagesForum, profils, signalementsAbus } from '~~/server/database/schema';
import {
  FORUM_MAX_SIGNALEMENTS_PAR_JOUR,
  REFUS_SIGNALEMENT_SUSPENDU,
  peutSignaler,
  refusPlafondQuotidien,
} from '~~/app/utils/forumModeration';
import { recomputerMessage } from '~~/server/utils/forumSignalement';
import { uuidSchema } from '~~/server/utils/validators';

const bodySchema = z.object({
  motif: z.enum(['hors_sujet', 'insultes', 'publicite', 'danger_sanitaire', 'autre']),
  precision: z.string().trim().max(1000).optional(),
});

/**
 * POST /api/forum/messages/[id]/signaler — signale un message.
 *
 * Trois portes, dans cet ordre : le droit de signaler (suspendu ou non), le
 * plafond quotidien, puis l'unicité par compte. Chacune refuse par une PHRASE.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const id = uuidSchema.parse(getRouterParam(event, 'id'));
  const body = await readValidatedBody(event, bodySchema.parse);

  /**
   * ⚠️ LA SUSPENSION EST DÉFINITIVE — CHOIX DE L'APICULTEUR — donc la seule
   * chose qui la lève est un geste d'administration
   * (`/api/admin/forum/suspensions/[id]/lever`). C'est pour ça que la lecture
   * porte sur DEUX colonnes : sans `forumSuspensionLevee`, la levée n'aurait
   * aucun effet et la décision serait irréversible en pratique.
   */
  const [compte] = await db
    .select({
      torts: profils.forumSignalementsRetablis,
      levee: profils.forumSuspensionLevee,
    })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  if (
    !compte ||
    !peutSignaler({ signalementsRetablis: compte.torts, suspensionLevee: compte.levee })
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Signalement suspendu',
      message: REFUS_SIGNALEMENT_SUSPENDU,
    });
  }

  const depuis = new Date(Date.now() - 24 * 3600 * 1000);
  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(signalementsAbus)
    .where(and(eq(signalementsAbus.auteurId, user.id), gte(signalementsAbus.createdAt, depuis)));

  if (n >= FORUM_MAX_SIGNALEMENTS_PAR_JOUR) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Trop de signalements',
      message: refusPlafondQuotidien(FORUM_MAX_SIGNALEMENTS_PAR_JOUR, 'signalements'),
    });
  }

  const [message] = await db
    .select({ id: messagesForum.id, auteurId: messagesForum.auteurId })
    .from(messagesForum)
    .where(eq(messagesForum.id, id))
    .limit(1);

  if (!message) {
    throw createError({ statusCode: 404, message: 'Ce message n’existe pas ou plus.' });
  }

  /**
   * ⚠️ ON NE SIGNALE PAS SON PROPRE MESSAGE. C'est la même règle que
   * l'anti-auto-validation du frelon, vue à l'envers : trois comptes distincts
   * masquent un message, et si son auteur peut être l'un des trois, il lui
   * suffit de deux complices au lieu de trois. Refuser ici coûte une ligne ;
   * l'oublier abaisse silencieusement le seuil que l'apiculteur a fixé.
   */
  if (message.auteurId === user.id) {
    throw createError({
      statusCode: 400,
      message: 'Vous ne pouvez pas signaler votre propre message. Vous pouvez le supprimer.',
    });
  }

  /**
   * ⚠️ `onConflictDoNothing` PLUTÔT QU'UNE LECTURE PRÉALABLE. `uniq_abus_message_auteur`
   * garantit « un signalement par compte et par message » — c'est LUI qui fait
   * du seuil de 3 un seuil de trois PERSONNES. Lire puis insérer laisserait
   * deux clics simultanés passer tous les deux, et le seuil deviendrait
   * atteignable par une seule personne pressée.
   */
  await db
    .insert(signalementsAbus)
    .values({
      messageId: message.id,
      auteurId: user.id,
      motif: body.motif,
      precision: body.precision ?? null,
    })
    .onConflictDoNothing();

  // Le masquage se DÉRIVE du recompte : il n'est écrit nulle part à la main.
  const signalements = await recomputerMessage(message.id);

  return { data: { signalements } };
});
