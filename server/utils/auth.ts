import type { H3Event } from 'h3';
import { serverSupabaseUser } from '#supabase/server';
import { isAdminEmail } from '~~/app/config/admin';

export async function requireAuth(event: H3Event) {
  let user;
  try {
    user = await serverSupabaseUser(event);
  } catch {
    throw createError({ statusCode: 401, message: 'Non authentifie' });
  }
  if (!user) {
    throw createError({ statusCode: 401, message: 'Non authentifie' });
  }
  return user;
}

/**
 * Garde admin — verifie qu'un utilisateur authentifie est dans la whitelist.
 * Retourne 403 (et non 404) pour ne pas laisser deviner l'existence des
 * endpoints, et garder un comportement coherent avec requireAuth.
 */
export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event);
  if (!isAdminEmail(user.email)) {
    throw createError({ statusCode: 403, message: 'Acces refuse' });
  }
  return user;
}
