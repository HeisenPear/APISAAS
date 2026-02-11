import { z } from 'zod';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { inspections, ruches, ruchers } from '~~/server/database/schema';

const querySchema = paginationSchema.extend({
  rucheId: z.string().uuid().optional(),
  rucherId: z.string().uuid().optional(),
  type: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const { page, limit, search, rucheId, rucherId, type, from, to } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(inspections.userId, user.id)];

  if (rucheId) {
    conditions.push(eq(inspections.rucheId, rucheId));
  }

  if (rucherId) {
    conditions.push(
      sql`${inspections.rucheId} IN (SELECT id FROM ruches WHERE rucher_id = ${rucherId} AND user_id = ${user.id})`,
    );
  }

  if (type) {
    conditions.push(eq(inspections.type, type));
  }

  if (from) {
    conditions.push(gte(inspections.dateVisite, from));
  }

  if (to) {
    conditions.push(lte(inspections.dateVisite, to));
  }

  if (search) {
    conditions.push(sql`${inspections.notes} ILIKE ${'%' + search + '%'}`);
  }

  const where = and(...conditions);

  const [data, [countResult]] = await Promise.all([
    db
      .select({
        id: inspections.id,
        userId: inspections.userId,
        rucheId: inspections.rucheId,
        dateVisite: inspections.dateVisite,
        type: inspections.type,
        meteo: inspections.meteo,
        forceColonie: inspections.forceColonie,
        couvain: inspections.couvain,
        reserves: inspections.reserves,
        comportement: inspections.comportement,
        reineVue: inspections.reineVue,
        celluleRoyale: inspections.celluleRoyale,
        signeEssaimage: inspections.signeEssaimage,
        varroa: inspections.varroa,
        traitementApplique: inspections.traitementApplique,
        maladieObservee: inspections.maladieObservee,
        actionsRealisees: inspections.actionsRealisees,
        nourrissementType: inspections.nourrissementType,
        nourrissementQuantite: inspections.nourrissementQuantite,
        notes: inspections.notes,
        photos: inspections.photos,
        dureeMinutes: inspections.dureeMinutes,
        createdAt: inspections.createdAt,
        updatedAt: inspections.updatedAt,
        rucheNumero: ruches.numero,
        rucherNom: ruchers.nom,
      })
      .from(inspections)
      .leftJoin(ruches, eq(inspections.rucheId, ruches.id))
      .leftJoin(ruchers, eq(ruches.rucherId, ruchers.id))
      .where(where)
      .orderBy(desc(inspections.dateVisite))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(inspections)
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
