import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { signalementsFrelon } from '~~/server/database/schema';

const bodySchema = z.object({ vote: z.enum(['confirme', 'infirme', 'detruit']) });

// Amortissement sybil léger : borne les votes par IP (best-effort, en mémoire
// par instance). La vraie défense reste le 1-vote-par-compte (upsert) + l'anti
// auto-vote ci-dessous ; ceci limite juste le bourrage multi-comptes depuis une
// même IP.
const voteThrottle = new Map<string, { count: number; resetAt: number }>();
const VOTE_MAX = 30;
const VOTE_WINDOW_MS = 10 * 60 * 1000;

/**
 * POST /api/frelon/[id]/vote — vote communautaire (confirme / infirme / détruit).
 * Anti-fraude : 1 vote par compte (upsert), et on NE PEUT PAS voter son propre
 * signalement (pas d'auto-validation). Recalcule score + statut + réputation.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const ip = getClientIp(event);
  const nowMs = Date.now();
  const throttle = voteThrottle.get(ip);
  if (!throttle || nowMs >= throttle.resetAt) {
    voteThrottle.set(ip, { count: 1, resetAt: nowMs + VOTE_WINDOW_MS });
  } else if (++throttle.count > VOTE_MAX) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Trop de votes en peu de temps. Réessayez plus tard.',
    });
  }

  const id = getRouterParam(event, 'id');
  if (!id) return badRequest('ID manquant');
  uuidSchema.parse(id);
  const { vote } = await readValidatedBody(event, bodySchema.parse);

  const [sig] = await db
    .select({ auteurId: signalementsFrelon.auteurId })
    .from(signalementsFrelon)
    .where(eq(signalementsFrelon.id, id))
    .limit(1);
  if (!sig) return notFound('Signalement introuvable');

  if (sig.auteurId === user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Vote interdit',
      message: 'Vous ne pouvez pas voter votre propre signalement.',
    });
  }

  await appliquerVote(id, user.id, vote);
  return { ok: true };
});
