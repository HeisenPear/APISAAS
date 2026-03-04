import { eq, sql } from 'drizzle-orm';
import { membres, profils } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, paginationSchema.parse);
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const where = eq(membres.ownerId, user.id);

  const [data, countResult] = await Promise.all([
    db
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
      .where(where)
      .orderBy(membres.createdAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(membres)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
});
