import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { ruches, ruchers } from '~~/server/database/schema';

const querySchema = paginationSchema.extend({
  rucherId: z.string().uuid('rucherId invalide').optional(),
  statut: z
    .enum(['active', 'faible', 'orpheline', 'essaimee', 'morte', 'vendue', 'fusionnee'])
    .optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const query = await getValidatedQuery(event, querySchema.parse);

  const { page, limit, search, rucherId, statut } = query;
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [eq(ruches.userId, user.id)];

  if (rucherId) {
    conditions.push(eq(ruches.rucherId, rucherId));
  }

  if (statut) {
    conditions.push(eq(ruches.statut, statut));
  }

  if (search) {
    conditions.push(sql`${ruches.numero} ILIKE ${'%' + search + '%'}`);
  }

  const where = and(...conditions);

  // Run data query (with rucher join) and count in parallel
  const [data, [countResult]] = await Promise.all([
    db
      .select({
        id: ruches.id,
        userId: ruches.userId,
        rucherId: ruches.rucherId,
        numero: ruches.numero,
        type: ruches.type,
        statut: ruches.statut,
        raceAbeille: ruches.raceAbeille,
        qualiteReine: ruches.qualiteReine,
        dateInstallation: ruches.dateInstallation,
        origineEssaim: ruches.origineEssaim,
        marquageReine: ruches.marquageReine,
        nombreCadres: ruches.nombreCadres,
        nombreHausses: ruches.nombreHausses,
        notes: ruches.notes,
        photoUrl: ruches.photoUrl,
        createdAt: ruches.createdAt,
        updatedAt: ruches.updatedAt,
        rucherNom: ruchers.nom,
      })
      .from(ruches)
      .leftJoin(ruchers, eq(ruches.rucherId, ruchers.id))
      .where(where)
      .orderBy(ruches.numero)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(ruches)
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
