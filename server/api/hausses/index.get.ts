import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { hausses, ruches } from '~~/server/database/schema';

const querySchema = paginationSchema.extend({
  statut: z.enum(['disponible', 'en_service', 'en_stock', 'hors_service']).optional(),
  rucheId: z.string().uuid().optional(),
  type: z
    .enum(['dadant_10', 'dadant_12', 'langstroth', 'warre', 'voirnot', 'kenyane', 'autre'])
    .optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, querySchema.parse);
  const { page, limit, search, statut, rucheId, type } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(hausses.userId, user.id)];

  if (statut) conditions.push(eq(hausses.statut, statut));
  if (rucheId) conditions.push(eq(hausses.rucheId, rucheId));
  if (type) conditions.push(eq(hausses.type, type));

  if (search) {
    const escaped = '%' + escapeIlike(search) + '%';
    conditions.push(sql`${hausses.numero} ILIKE ${escaped}`);
  }

  const where = and(...conditions);

  const [data, [countResult]] = await Promise.all([
    db
      .select({
        id: hausses.id,
        userId: hausses.userId,
        rucheId: hausses.rucheId,
        numero: hausses.numero,
        type: hausses.type,
        nombreCadres: hausses.nombreCadres,
        statut: hausses.statut,
        anneeAcquisition: hausses.anneeAcquisition,
        qrCodeData: hausses.qrCodeData,
        notes: hausses.notes,
        createdAt: hausses.createdAt,
        updatedAt: hausses.updatedAt,
        rucheNumero: ruches.numero,
      })
      .from(hausses)
      .leftJoin(ruches, eq(hausses.rucheId, ruches.id))
      .where(where)
      .orderBy(desc(hausses.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(hausses)
      .where(where),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total: countResult?.total ?? 0,
      totalPages: Math.ceil((countResult?.total ?? 0) / limit),
    },
  };
});
