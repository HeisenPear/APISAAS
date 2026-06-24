import { eq, and, desc, or, ilike, sql } from 'drizzle-orm';
import { clients } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, paginationSchema.parse);
  const { page, limit, search } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(clients.userId, ownerId)];

  if (search) {
    const escaped = `%${escapeIlike(search)}%`;
    conditions.push(
      or(
        ilike(clients.nom, escaped),
        ilike(clients.entreprise, escaped),
        ilike(clients.email, escaped),
        ilike(clients.ville, escaped),
      )!,
    );
  }

  const where = and(...conditions);

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(clients)
      .where(where)
      .orderBy(desc(clients.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(clients)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
});
