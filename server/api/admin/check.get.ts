import { isAdminEmail } from '~~/app/config/admin';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  if (!isAdminEmail(user.email)) {
    throw createError({ statusCode: 404, message: 'Not found' });
  }
  return { ok: true };
});
