import { z } from 'zod';
import { eq, and, ilike, desc, sql, inArray, notInArray } from 'drizzle-orm';
import { emplacements, ruchers, ruches } from '~~/server/database/schema';
import { paginationSchema } from '~~/server/utils/validators';

const querySchema = paginationSchema.extend({
  actif: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const query = await getValidatedQuery(event, querySchema.parse);
  const { page, limit, search, actif } = query;
  const offset = (page - 1) * limit;

  const conditions = [eq(emplacements.userId, ownerId)];
  if (actif !== undefined) conditions.push(eq(emplacements.estActif, actif));
  if (search) conditions.push(ilike(emplacements.nom, `%${escapeIlike(search)}%`));

  const where = and(...conditions);
  const [rows, [countResult]] = await Promise.all([
    db
      .select()
      .from(emplacements)
      .where(where)
      .orderBy(desc(emplacements.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(emplacements)
      .where(where),
  ]);

  // Occupation réelle de chaque emplacement — combien de ruchers y sont posés
  // et combien de ruches ils représentent (jauge de remplissage vs capacité).
  const ids = rows.map((r) => r.id);
  let occupation: Record<string, { ruchersCount: number; ruchesCount: number }> = {};

  if (ids.length > 0) {
    // Seules les colonies VIVANTES occupent réellement la place : compter les
    // ruches mortes ou vendues gonflerait la jauge de remplissage. Idem pour
    // les ruchers inactifs, qui ne sont plus sur le terrain.
    const stats = await db
      .select({
        emplacementId: ruchers.emplacementId,
        ruchersCount: sql<number>`count(distinct ${ruchers.id})::int`,
        ruchesCount: sql<number>`count(${ruches.id})::int`,
      })
      .from(ruchers)
      .leftJoin(
        ruches,
        and(
          eq(ruches.rucherId, ruchers.id),
          eq(ruches.userId, ownerId),
          notInArray(ruches.statut, ['morte', 'vendue', 'fusionnee']),
        ),
      )
      .where(
        and(
          inArray(ruchers.emplacementId, ids),
          eq(ruchers.userId, ownerId),
          eq(ruchers.actif, true),
        ),
      )
      .groupBy(ruchers.emplacementId);

    occupation = Object.fromEntries(
      stats
        .filter((s) => s.emplacementId != null)
        .map((s) => [
          s.emplacementId as string,
          { ruchersCount: s.ruchersCount, ruchesCount: s.ruchesCount },
        ]),
    );
  }

  const data = rows.map((r) => ({
    ...r,
    ruchersCount: occupation[r.id]?.ruchersCount ?? 0,
    ruchesCount: occupation[r.id]?.ruchesCount ?? 0,
  }));

  return { data, total: countResult?.count ?? 0, page, limit };
});
