import { desc, eq, sql } from 'drizzle-orm';
import { codesPromo, acquisitionsPromo } from '~~/server/database/schema';

/** Liste des codes promo avec compteurs d'acquisition + résumé par type de sponsor. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const codes = await db
    .select({
      id: codesPromo.id,
      code: codesPromo.code,
      sponsorNom: codesPromo.sponsorNom,
      typeSponsoring: codesPromo.typeSponsoring,
      reductionPourcent: codesPromo.reductionPourcent,
      dureeMois: codesPromo.dureeMois,
      maxRedemptions: codesPromo.maxRedemptions,
      actif: codesPromo.actif,
      createdAt: codesPromo.createdAt,
      acquisitions: sql<number>`count(${acquisitionsPromo.id})::int`,
      remiseTotaleCents: sql<number>`coalesce(sum(${acquisitionsPromo.montantRemiseCents}), 0)::int`,
    })
    .from(codesPromo)
    .leftJoin(acquisitionsPromo, eq(acquisitionsPromo.codePromoId, codesPromo.id))
    .groupBy(codesPromo.id)
    .orderBy(desc(codesPromo.createdAt));

  const parType = await db
    .select({
      typeSponsoring: codesPromo.typeSponsoring,
      codes: sql<number>`count(distinct ${codesPromo.id})::int`,
      acquisitions: sql<number>`count(${acquisitionsPromo.id})::int`,
    })
    .from(codesPromo)
    .leftJoin(acquisitionsPromo, eq(acquisitionsPromo.codePromoId, codesPromo.id))
    .groupBy(codesPromo.typeSponsoring);

  return { data: { codes, parType } };
});
