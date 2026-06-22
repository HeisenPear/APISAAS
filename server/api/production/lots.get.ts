import { eq, and, desc, sql, isNotNull } from 'drizzle-orm';
import { recoltes, ruchers } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const query = await getValidatedQuery(event, paginationSchema.parse);

  const { page, limit, search } = query;
  const offset = (page - 1) * limit;

  const conditions = [
    eq(recoltes.userId, user.id),
    isNotNull(recoltes.numeroLot),
    sql`${recoltes.numeroLot} != ''`,
  ];

  if (search) {
    const escaped = '%' + escapeIlike(search) + '%';
    conditions.push(
      sql`(${recoltes.numeroLot} ILIKE ${escaped} OR ${recoltes.typeMiel} ILIKE ${escaped})`,
    );
  }

  const where = and(...conditions);

  // Group by lot number, aggregate quantities
  const data = await db
    .select({
      numeroLot: recoltes.numeroLot,
      typeMiel: sql<string>`MAX(${recoltes.typeMiel})`.as('type_miel'),
      totalKg: sql<string>`COALESCE(SUM(${recoltes.quantiteKg}::numeric), 0)`.as('total_kg'),
      nombreRecoltes: sql<number>`count(*)::int`.as('nombre_recoltes'),
      dateDebut: sql<Date>`MIN(${recoltes.dateRecolte})`.as('date_debut'),
      dateFin: sql<Date>`MAX(${recoltes.dateRecolte})`.as('date_fin'),
      rucherNom: sql<string>`MAX(${ruchers.nom})`.as('rucher_nom'),
      humiditeMoyenne: sql<string>`ROUND(AVG(${recoltes.humidite}::numeric), 1)`.as(
        'humidite_moyenne',
      ),
    })
    .from(recoltes)
    .leftJoin(ruchers, eq(recoltes.rucherId, ruchers.id))
    .where(where)
    .groupBy(recoltes.numeroLot)
    .orderBy(desc(sql`MAX(${recoltes.dateRecolte})`))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({
      total: sql<number>`count(DISTINCT ${recoltes.numeroLot})::int`,
    })
    .from(recoltes)
    .where(where);

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
