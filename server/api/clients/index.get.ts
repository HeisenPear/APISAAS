import { eq, and, desc, or, ilike, sql } from 'drizzle-orm';
import { clients } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, paginationSchema.parse);
  const { page, limit, search } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(clients.userId, user.id)];

  if (search) {
    conditions.push(
      or(
        ilike(clients.nom, `%${search}%`),
        ilike(clients.entreprise, `%${search}%`),
        ilike(clients.email, `%${search}%`),
        ilike(clients.ville, `%${search}%`),
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
