import { isAdminEmail } from '~~/app/config/admin';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  if (!isAdminEmail(user.email)) {
    throw createError({ statusCode: 403, message: 'Accès réservé aux administrateurs' });
  }
  return { ok: true };
});
