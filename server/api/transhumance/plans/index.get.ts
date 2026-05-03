import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { plansTranshumance } from '~~/server/database/schema';
import { paginationSchema } from '~~/server/utils/validators';

const querySchema = paginationSchema.extend({
  annee: z.coerce.number().int().optional(),
  statut: z.enum(['planifie', 'en_cours', 'realise', 'annule']).optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, querySchema.parse);
  const { page, limit, annee, statut } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(plansTranshumance.userId, user.id)];
  if (annee) conditions.push(eq(plansTranshumance.annee, annee));
  if (statut) conditions.push(eq(plansTranshumance.statut, statut));

  const where = and(...conditions);
  const [rows, [countResult]] = await Promise.all([
    db.select().from(plansTranshumance).where(where).orderBy(desc(plansTranshumance.datePrevue)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(plansTranshumance).where(where),
  ]);

  return { data: rows, total: countResult?.count ?? 0, page, limit };
});
