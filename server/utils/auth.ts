import type { H3Event } from 'h3';
import { serverSupabaseUser } from '#supabase/server';

export async function requireAuth(event: H3Event) {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Non authentifie' });
  }
  return user;
}
