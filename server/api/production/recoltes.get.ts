import { z } from 'zod';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { recoltes, ruchers, ruches } from '~~/server/database/schema';

const querySchema = paginationSchema.extend({
  rucherId: z.string().uuid().optional(),
  rucheId: z.string().uuid().optional(),
  typeMiel: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const { page, limit, search, rucherId, rucheId, typeMiel, from, to } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(recoltes.userId, user.id)];

  if (rucherId) conditions.push(eq(recoltes.rucherId, rucherId));
  if (rucheId) conditions.push(eq(recoltes.rucheId, rucheId));
  if (typeMiel) conditions.push(eq(recoltes.typeMiel, typeMiel));
  if (from) conditions.push(gte(recoltes.dateRecolte, from));
  if (to) conditions.push(lte(recoltes.dateRecolte, to));
  if (search) {
    conditions.push(
      sql`(${recoltes.typeMiel} ILIKE ${'%' + search + '%'} OR ${recoltes.notes} ILIKE ${'%' + search + '%'} OR ${recoltes.numeroLot} ILIKE ${'%' + search + '%'})`,
    );
  }

  const where = and(...conditions);

  const [data, [countResult]] = await Promise.all([
    db
      .select({
        id: recoltes.id,
        userId: recoltes.userId,
        rucherId: recoltes.rucherId,
        rucheId: recoltes.rucheId,
        dateRecolte: recoltes.dateRecolte,
        typeMiel: recoltes.typeMiel,
        quantiteKg: recoltes.quantiteKg,
        humidite: recoltes.humidite,
        nombreHausses: recoltes.nombreHausses,
        numeroLot: recoltes.numeroLot,
        notes: recoltes.notes,
        createdAt: recoltes.createdAt,
        updatedAt: recoltes.updatedAt,
        rucherNom: ruchers.nom,
        rucheNumero: ruches.numero,
      })
      .from(recoltes)
      .leftJoin(ruchers, eq(recoltes.rucherId, ruchers.id))
      .leftJoin(ruches, eq(recoltes.rucheId, ruches.id))
      .where(where)
      .orderBy(desc(recoltes.dateRecolte))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(recoltes)
      .where(where),
  ]);

  const total = countResult?.total ?? 0;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
});
