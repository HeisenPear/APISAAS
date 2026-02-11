import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const profil = await db.query.profils.findFirst({
    where: eq(profils.id, user.id),
  });

  if (!profil) {
    notFound('Profil introuvable');
  }

  return { data: profil };
});
