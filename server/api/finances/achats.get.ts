import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { transactions } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, paginationSchema.parse);
  const { page, limit, search } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(transactions.userId, user.id), eq(transactions.type, 'achat')];

  if (search) {
    const escaped = `%${escapeIlike(search)}%`;
    conditions.push(
      or(
        ilike(transactions.numero, escaped),
        ilike(transactions.notes, escaped),
        ilike(transactions.categorie, escaped),
      )!,
    );
  }

  const where = and(...conditions);

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(where)
      .orderBy(desc(transactions.dateTransaction))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
});
