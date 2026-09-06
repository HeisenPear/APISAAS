import { and, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { messagesForum, sujetsForum } from '~~/server/database/schema';
import { FORUM_MAX_SUJETS_PAR_JOUR, refusPlafondQuotidien } from '~~/app/utils/forumModeration';
import { slugCandidat, slugDeTitre } from '~~/app/utils/forumSlug';
import { recomputerSujet } from '~~/server/utils/forumSignalement';

const bodySchema = z.object({
  titre: z.string().trim().min(5).max(200),
  /** Le premier message part avec le sujet : un fil vide n'a rien à lire. */
  message: z.string().trim().min(10).max(10_000),
});

/**
 * POST /api/forum/sujets — ouvre un fil. ÉCRITURE RÉSERVÉE AUX COMPTES.
 *
 * ⚠️ LE PLAFOND SE COMPTE EN BASE, JAMAIS EN MÉMOIRE. Vercel démarre plusieurs
 * lambdas et les recycle sans prévenir : un compteur gardé en RAM se
 * réinitialise tout seul et ne plafonne donc rien. C'est un `count(*)` sur
 * 24 h, comme `server/api/frelon/index.post.ts`.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  const depuis = new Date(Date.now() - 24 * 3600 * 1000);
  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(sujetsForum)
    .where(and(eq(sujetsForum.auteurId, user.id), gte(sujetsForum.createdAt, depuis)));

  if (n >= FORUM_MAX_SUJETS_PAR_JOUR) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Trop de sujets',
      message: refusPlafondQuotidien(FORUM_MAX_SUJETS_PAR_JOUR, 'sujets'),
    });
  }

  /**
   * ⚠️ L'UNICITÉ DU SLUG SE MESURE PAR L'INSERTION, PAS PAR UNE LECTURE.
   * « je regarde si le slug existe, puis j'insère » est une course : deux
   * personnes qui ouvrent le même sujet à la même seconde lisent toutes deux
   * « libre » et la seconde insertion échoue — en 500, sur un geste parfaitement
   * légitime. C'est la même leçon que `membres/accepter.post.ts` : le contrôle
   * et l'écriture doivent être le MÊME ordre SQL.
   *
   * On essaie donc les candidats et on laisse `uniq_sujet_forum_slug` trancher.
   * La boucle est bornée : au-delà, on refuse plutôt que de tourner.
   */
  const base = slugDeTitre(body.titre);
  let cree: { id: string; slug: string } | undefined;
  for (let rang = 0; rang < 20 && !cree; rang++) {
    const [ligne] = await db
      .insert(sujetsForum)
      .values({ auteurId: user.id, titre: body.titre, slug: slugCandidat(base, rang) })
      .onConflictDoNothing({ target: sujetsForum.slug })
      .returning({ id: sujetsForum.id, slug: sujetsForum.slug });
    cree = ligne;
  }

  if (!cree) {
    throw createError({
      statusCode: 409,
      message: 'Un sujet portant ce titre existe déjà. Précisez-le un peu et réessayez.',
    });
  }

  await db.insert(messagesForum).values({
    sujetId: cree.id,
    auteurId: user.id,
    contenu: body.message,
  });

  // Le fil naît avec son compteur juste : recompté, jamais posé à 1 à la main.
  await recomputerSujet(cree.id);

  setResponseStatus(event, 201);
  return { data: { id: cree.id, slug: cree.slug } };
});
