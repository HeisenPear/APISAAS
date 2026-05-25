import { eq, and, desc, sql, gte, lte, ne } from 'drizzle-orm';
import { z } from 'zod';
import { interventions, ruches, ruchers } from '~~/server/database/schema';
import { TYPES_INTERVENTION } from '~~/server/utils/validation/interventions';

// Accept both old inspection types and new intervention types
const allTypes = [...TYPES_INTERVENTION, 'visite_printemps', 'traitement', 'hivernage'] as const;

const querySchema = paginationSchema.extend({
  rucheId: z.string().uuid().optional(),
  rucherId: z.string().uuid().optional(),
  type: z.enum(allTypes).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  excludeRdvPro: z.coerce.boolean().default(true),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, querySchema.parse);
  const { page, limit, search, rucheId, rucherId, type, from, to, excludeRdvPro } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(interventions.userId, user.id)];
  if (excludeRdvPro) conditions.push(ne(interventions.type, 'rendez_vous_pro'));

  if (rucheId) conditions.push(eq(interventions.rucheId, rucheId));

  if (rucherId) {
    conditions.push(
      sql`(${interventions.rucherId} = ${rucherId} OR ${ruches.rucherId} = ${rucherId})`,
    );
  }

  if (type) conditions.push(eq(interventions.type, type));

  if (from) conditions.push(gte(interventions.dateVisite, from));
  if (to) conditions.push(lte(interventions.dateVisite, to));

  if (search) {
    const escaped = '%' + escapeIlike(search) + '%';
    conditions.push(
      sql`(${interventions.notes} ILIKE ${escaped} OR ${interventions.type} ILIKE ${escaped})`,
    );
  }

  const where = and(...conditions);

  const [data, [countResult]] = await Promise.all([
    db
      .select({
        id: interventions.id,
        userId: interventions.userId,
        rucheId: interventions.rucheId,
        rucherId: interventions.rucherId,
        dateVisite: interventions.dateVisite,
        type: interventions.type,
        meteo: interventions.meteo,
        donnees: interventions.donnees,
        commentaire: interventions.notes,
        photos: interventions.photos,
        dureeMinutes: interventions.dureeMinutes,
        createdAt: interventions.createdAt,
        updatedAt: interventions.updatedAt,
        // Legacy inspection fields (for old records without donnees)
        forceColonie: interventions.forceColonie,
        comportement: interventions.comportement,
        reineVue: interventions.reineVue,
        reserves: interventions.reserves,
        rucheNumero: ruches.numero,
        rucherNom:
          sql<string>`COALESCE(${ruchers.nom}, (SELECT r2.nom FROM ruchers r2 WHERE r2.id = ${ruches.rucherId}))`.as(
            'rucher_nom',
          ),
      })
      .from(interventions)
      .leftJoin(ruches, eq(interventions.rucheId, ruches.id))
      .leftJoin(ruchers, eq(interventions.rucherId, ruchers.id))
      .where(where)
      .orderBy(desc(interventions.dateVisite))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(interventions)
      .leftJoin(ruches, eq(interventions.rucheId, ruches.id))
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
