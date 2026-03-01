import { eq } from 'drizzle-orm';
import { membres, profils } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const data = await db
    .select({
      id: membres.id,
      email: membres.email,
      role: membres.role,
      statut: membres.statut,
      invitedAt: membres.invitedAt,
      acceptedAt: membres.acceptedAt,
      userName: profils.nom,
      userPrenom: profils.prenom,
    })
    .from(membres)
    .leftJoin(profils, eq(membres.userId, profils.id))
    .where(eq(membres.ownerId, user.id))
    .orderBy(membres.createdAt);

  return { data };
});
