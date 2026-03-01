import { eq, sql } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

/**
 * Subscription guard middleware.
 * Checks plan limits for specific API routes.
 * Only runs on API routes that require a paid plan.
 */

const PLAN_LIMITS: Record<string, number> = {
  decouverte: 10,
  starter: 20,
  pro: 100,
  expert: Infinity,
};

// Routes that need subscription validation (ruche creation)
const GUARDED_PATTERNS = [{ method: 'POST', path: '/api/ruches' }];

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const method = getMethod(event);

  // Only check guarded routes
  const isGuarded = GUARDED_PATTERNS.some((p) => method === p.method && url.pathname === p.path);
  if (!isGuarded) return;

  // Get user
  let userId: string;
  try {
    const user = await requireAuth(event);
    userId = user.id;
  } catch {
    return; // Auth middleware will handle this
  }

  const [profil] = await db
    .select({ plan: profils.plan })
    .from(profils)
    .where(eq(profils.id, userId))
    .limit(1);

  if (!profil) return;

  const limit = PLAN_LIMITS[profil.plan] ?? 10;
  if (limit === Infinity) return; // Expert plan — no limit

  // Count current ruches
  const { ruches } = await import('~~/server/database/schema');
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ruches)
    .where(eq(ruches.userId, userId));

  const currentCount = countResult?.count ?? 0;

  if (currentCount >= limit) {
    setResponseStatus(event, 403);
    return {
      statusCode: 403,
      message: `Limite de ${limit} ruches atteinte pour le plan ${profil.plan}. Passez au plan superieur.`,
    };
  }
});
