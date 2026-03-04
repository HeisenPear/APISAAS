import { eq, and, sql } from 'drizzle-orm';
import { profils, ruches } from '~~/server/database/schema';

/**
 * Subscription guard middleware.
 * Vérifie les limites du plan lors de la création de ruches.
 * Retourne 402 Payment Required si la limite est atteinte.
 */

const PLAN_LIMITS: Record<string, number> = {
  decouverte: 10,
  starter: 20,
  pro: 100,
  expert: Infinity,
};

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  const method = getMethod(event);

  // Ne vérifier que POST /api/ruches (création de ruche)
  if (method !== 'POST' || url.pathname !== '/api/ruches') return;

  let userId: string;
  try {
    const user = await requireAuth(event);
    userId = user.id;
  } catch {
    return; // La route gèrera l'auth
  }

  const profilRows = await db
    .select({ plan: profils.plan })
    .from(profils)
    .where(eq(profils.id, userId))
    .limit(1);

  const profil = profilRows[0];
  if (!profil) return;

  const limit = PLAN_LIMITS[profil.plan] ?? 10;
  if (limit === Infinity) return;

  // Compter les ruches actives uniquement (exclure mortes/vendues/fusionnées)
  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ruches)
    .where(
      and(eq(ruches.userId, userId), sql`${ruches.statut} NOT IN ('morte', 'vendue', 'fusionnee')`),
    );

  const currentCount = countRows[0]?.count ?? 0;

  if (currentCount >= limit) {
    throw createError({
      statusCode: 402,
      statusMessage: 'Payment Required',
      message: `Limite de ${limit} ruches atteinte pour le plan ${profil.plan}. Passez au plan supérieur.`,
    });
  }
});
