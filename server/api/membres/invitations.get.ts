import { eq, and } from 'drizzle-orm';
import { membres, profils } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const [profil] = await db
    .select({ email: profils.email })
    .from(profils)
    .where(eq(profils.id, user.id))
    .limit(1);

  if (!profil?.email) return notFound('Profil introuvable');

  const data = await db
    .select({
      id: membres.id,
      ownerId: membres.ownerId,
      email: membres.email,
      role: membres.role,
      statut: membres.statut,
      invitedAt: membres.invitedAt,
      ownerNom: profils.nom,
      ownerPrenom: profils.prenom,
    })
    .from(membres)
    .leftJoin(profils, eq(membres.ownerId, profils.id))
    .where(and(eq(membres.email, profil.email), eq(membres.statut, 'en_attente')))
    .orderBy(membres.invitedAt);

  return { data };
});
