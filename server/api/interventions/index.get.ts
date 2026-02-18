import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { inspections, ruches, ruchers } from '~~/server/database/schema';
import { TYPES_INTERVENTION } from '~~/server/utils/validation/interventions';

// Accept both old inspection types and new intervention types
const allTypes = [...TYPES_INTERVENTION, 'visite_printemps', 'traitement', 'hivernage'] as const;

const querySchema = paginationSchema.extend({
  rucheId: z.string().uuid().optional(),
  rucherId: z.string().uuid().optional(),
  type: z.enum(allTypes).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, querySchema.parse);
  const { page, limit, search, rucheId, rucherId, type, from, to } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(inspections.userId, user.id)];

  if (rucheId) conditions.push(eq(inspections.rucheId, rucheId));

  if (rucherId) {
    conditions.push(
      sql`(${inspections.rucherId} = ${rucherId} OR ${ruches.rucherId} = ${rucherId})`,
    );
  }

  if (type) conditions.push(eq(inspections.type, type));

  if (from) conditions.push(gte(inspections.dateVisite, from));
  if (to) conditions.push(lte(inspections.dateVisite, to));

  if (search) {
    conditions.push(
      sql`(${inspections.notes} ILIKE ${'%' + search + '%'} OR ${inspections.type} ILIKE ${'%' + search + '%'})`,
    );
  }

  const where = and(...conditions);

  const [data, [countResult]] = await Promise.all([
    db
      .select({
        id: inspections.id,
        userId: inspections.userId,
        rucheId: inspections.rucheId,
        rucherId: inspections.rucherId,
        dateVisite: inspections.dateVisite,
        type: inspections.type,
        meteo: inspections.meteo,
        donnees: inspections.donnees,
        commentaire: inspections.notes,
        photos: inspections.photos,
        dureeMinutes: inspections.dureeMinutes,
        createdAt: inspections.createdAt,
        updatedAt: inspections.updatedAt,
        // Legacy inspection fields (for old records without donnees)
        forceColonie: inspections.forceColonie,
        comportement: inspections.comportement,
        reineVue: inspections.reineVue,
        reserves: inspections.reserves,
        rucheNumero: ruches.numero,
        rucherNom:
          sql<string>`COALESCE(${ruchers.nom}, (SELECT r2.nom FROM ruchers r2 WHERE r2.id = ${ruches.rucherId}))`.as(
            'rucher_nom',
          ),
      })
      .from(inspections)
      .leftJoin(ruches, eq(inspections.rucheId, ruches.id))
      .leftJoin(ruchers, eq(inspections.rucherId, ruchers.id))
      .where(where)
      .orderBy(desc(inspections.dateVisite))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(inspections)
      .leftJoin(ruches, eq(inspections.rucheId, ruches.id))
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
