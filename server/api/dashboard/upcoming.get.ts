import { eq, asc, sql } from 'drizzle-orm';
import { interventions, ruches } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);

  const rows = await withDbRetry(
    () =>
      db
        .select({
          id: interventions.id,
          type: interventions.type,
          dateVisite: interventions.dateVisite,
          notes: interventions.notes,
          rucheNumero: ruches.numero,
        })
        .from(interventions)
        .leftJoin(ruches, eq(interventions.rucheId, ruches.id))
        .where(sql`${interventions.userId} = ${ownerId} AND ${interventions.dateVisite} >= now()`)
        .orderBy(asc(interventions.dateVisite))
        .limit(5),
    'dashboard/upcoming',
  );

  const now = new Date();
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    dateVisite: r.dateVisite,
    rucheNumero: r.rucheNumero,
    notes: r.notes,
    daysUntil: Math.max(
      0,
      Math.floor((new Date(r.dateVisite).getTime() - now.getTime()) / 86400000),
    ),
  }));
});
