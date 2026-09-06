import { eq, and, sql, type SQLWrapper } from 'drizzle-orm';
import { ruchers, ruches, recoltes, mortalites } from '~~/server/database/schema';
import { anneeParis } from '~~/server/utils/horloge';

// Confidentialité : on n'expose un benchmark que si au moins N apiculteurs
// distincts ont des ruchers dans le département (agrégats globaux, jamais
// individuels → personne n'est identifiable).
const MIN_PEERS = 3;
const ACTIVE = sql`${ruches.statut} NOT IN ('morte', 'vendue', 'fusionnee')`;

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  const ownerId = await resolveOwnerId(event);
  const year = anneeParis(new Date());

  // Département principal de l'exploitation (le plus représenté).
  const [primary] = await db
    .select({ departement: ruchers.departement })
    .from(ruchers)
    .where(
      and(
        eq(ruchers.userId, ownerId),
        sql`${ruchers.departement} IS NOT NULL AND ${ruchers.departement} <> ''`,
      ),
    )
    .groupBy(ruchers.departement)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  if (!primary?.departement) {
    return { data: { available: false, reason: 'no_departement' as const } };
  }
  const dept = primary.departement;

  const [peers] = await db
    .select({ n: sql<number>`count(distinct ${ruchers.userId})::int` })
    .from(ruchers)
    .where(eq(ruchers.departement, dept));
  const nbApiculteurs = peers?.n ?? 0;
  if (nbApiculteurs < MIN_PEERS) {
    return {
      data: {
        available: false,
        reason: 'not_enough_peers' as const,
        departement: dept,
        nbApiculteurs,
      },
    };
  }

  const sumKg = sql<number>`coalesce(sum(${recoltes.quantiteKg}), 0)::float`;
  const sumCol = sql<number>`coalesce(sum(${mortalites.nombreColonies}), 0)::int`;
  const cnt = sql<number>`count(*)::int`;
  const thisYear = (col: SQLWrapper) => sql`extract(year from ${col}) = ${year}`;

  const [deptRuches, deptMiel, deptMort, userRuches, userMiel, userMort] = await Promise.all([
    db
      .select({ n: cnt })
      .from(ruches)
      .innerJoin(ruchers, eq(ruches.rucherId, ruchers.id))
      .where(and(eq(ruchers.departement, dept), ACTIVE)),
    db
      .select({ kg: sumKg })
      .from(recoltes)
      .innerJoin(ruchers, eq(recoltes.rucherId, ruchers.id))
      .where(
        and(
          eq(ruchers.departement, dept),
          eq(recoltes.typeProduit, 'miel'),
          thisYear(recoltes.dateRecolte),
        ),
      ),
    db
      .select({ n: sumCol })
      .from(mortalites)
      .innerJoin(ruchers, eq(mortalites.rucherId, ruchers.id))
      .where(and(eq(ruchers.departement, dept), thisYear(mortalites.dateConstatee))),
    db
      .select({ n: cnt })
      .from(ruches)
      .where(and(eq(ruches.userId, ownerId), ACTIVE)),
    db
      .select({ kg: sumKg })
      .from(recoltes)
      .where(
        and(
          eq(recoltes.userId, ownerId),
          eq(recoltes.typeProduit, 'miel'),
          thisYear(recoltes.dateRecolte),
        ),
      ),
    db
      .select({ n: sumCol })
      .from(mortalites)
      .where(and(eq(mortalites.userId, ownerId), thisYear(mortalites.dateConstatee))),
  ]);

  const r1 = (x: number) => Math.round(x * 10) / 10;
  const perHive = (kg: number, n: number) => (n > 0 ? r1(kg / n) : 0);
  const mortRate = (m: number, n: number) => (n + m > 0 ? Math.round((m / (n + m)) * 100) : 0);

  const dRuches = deptRuches[0]?.n ?? 0;
  const uRuches = userRuches[0]?.n ?? 0;

  return {
    data: {
      available: true as const,
      departement: dept,
      nbApiculteurs,
      annee: year,
      production: {
        vous: perHive(userMiel[0]?.kg ?? 0, uRuches),
        moyenne: perHive(deptMiel[0]?.kg ?? 0, dRuches),
        unite: 'kg/ruche',
      },
      mortalite: {
        vous: mortRate(userMort[0]?.n ?? 0, uRuches),
        moyenne: mortRate(deptMort[0]?.n ?? 0, dRuches),
        unite: '%',
      },
    },
  };
});
