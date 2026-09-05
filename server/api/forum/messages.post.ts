import { and, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { messagesForum, sujetsForum } from '~~/server/database/schema';
import { FORUM_MAX_MESSAGES_PAR_JOUR, refusPlafondQuotidien } from '~~/app/utils/forumModeration';
import { recomputerSujet } from '~~/server/utils/forumSignalement';
import { uuidSchema } from '~~/server/utils/validators';

const bodySchema = z.object({
  sujetId: uuidSchema,
  contenu: z.string().trim().min(2).max(10_000),
});

/** POST /api/forum/messages — répond dans un fil. Réservé aux comptes. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  /**
   * ⚠️ ON N'ÉCRIT PAS DANS UN FIL MASQUÉ. Sans ce contrôle, un fil retiré de la
   * liste continuerait d'accepter des réponses : elles s'empileraient dans une
   * page que personne ne peut plus ouvrir (le GET répond 404), et leurs auteurs
   * croiraient avoir participé à une conversation. Le masquage doit couper les
   * DEUX sens, pas seulement la lecture.
   */
  const [sujet] = await db
    .select({ id: sujetsForum.id, statut: sujetsForum.statut })
    .from(sujetsForum)
    .where(eq(sujetsForum.id, body.sujetId))
    .limit(1);

  if (!sujet || sujet.statut !== 'visible') {
    throw createError({ statusCode: 404, message: 'Ce sujet n’existe pas ou plus.' });
  }

  const depuis = new Date(Date.now() - 24 * 3600 * 1000);
  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messagesForum)
    .where(and(eq(messagesForum.auteurId, user.id), gte(messagesForum.createdAt, depuis)));

  if (n >= FORUM_MAX_MESSAGES_PAR_JOUR) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Trop de messages',
      message: refusPlafondQuotidien(FORUM_MAX_MESSAGES_PAR_JOUR, 'messages'),
    });
  }

  const [cree] = await db
    .insert(messagesForum)
    .values({ sujetId: sujet.id, auteurId: user.id, contenu: body.contenu })
    .returning({ id: messagesForum.id });

  await recomputerSujet(sujet.id);

  setResponseStatus(event, 201);
  return { data: { id: cree?.id } };
});
