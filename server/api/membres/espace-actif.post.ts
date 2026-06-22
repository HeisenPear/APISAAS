import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { membres } from '~~/server/database/schema';
import { WORKSPACE_COOKIE } from '~~/server/utils/workspace';

const schema = z.object({ ownerId: z.string().uuid() });

/**
 * Change l'espace de travail actif (cookie `apigo_ws`). Valide que l'acteur a
 * bien accès à l'espace demandé (le sien, ou un espace dont il est membre).
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { ownerId } = await readValidatedBody(event, schema.parse);

  // Retour à son propre espace → on supprime le cookie.
  if (ownerId === user.id) {
    deleteCookie(event, WORKSPACE_COOKIE, { path: '/' });
    return { ownerId, isOwner: true, role: 'owner' as const };
  }

  const [m] = await db
    .select({ role: membres.role })
    .from(membres)
    .where(
      and(
        eq(membres.ownerId, ownerId),
        eq(membres.userId, user.id),
        eq(membres.statut, 'acceptee'),
      ),
    )
    .limit(1);

  if (!m) {
    throw createError({ statusCode: 403, message: "Vous n'avez pas accès à cet espace" });
  }

  setCookie(event, WORKSPACE_COOKIE, ownerId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    secure: !import.meta.dev,
  });

  return { ownerId, isOwner: false, role: m.role };
});
