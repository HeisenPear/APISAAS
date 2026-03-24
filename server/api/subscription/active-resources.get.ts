import { eq, and, sql, desc } from 'drizzle-orm';
import { profils, ruches, ruchers } from '~~/server/database/schema';
import { isAdminEmail } from '~~/app/config/admin';
import { getPlanConfig } from '~~/app/config/plans';
import type { Plan } from '~~/app/config/plans';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const profilRow = await db.query.profils.findFirst({
    where: eq(profils.id, user.id),
  });

  if (!profilRow) notFound('Profil introuvable');

  // Admin = toutes les resources actives
  if (isAdminEmail(user.email)) {
    const [allRuches, allRuchers] = await Promise.all([
      db
        .select({ id: ruches.id })
        .from(ruches)
        .where(
          and(
            eq(ruches.userId, user.id),
            sql`${ruches.statut} NOT IN ('morte', 'vendue', 'fusionnee')`,
          ),
        ),
      db.select({ id: ruchers.id }).from(ruchers).where(eq(ruchers.userId, user.id)),
    ]);
    return {
      activeRucheIds: allRuches.map((r) => r.id),
      activeRucherIds: allRuchers.map((r) => r.id),
    };
  }

  const plan = profilRow.plan as Plan;
  const limits = getPlanConfig(plan).limites;

  const ruchesLimit = limits.ruches === Infinity ? 99999 : limits.ruches;
  const ruchersLimit = limits.ruchers === Infinity ? 99999 : limits.ruchers;

  const [activeRuches, activeRuchers] = await Promise.all([
    db
      .select({ id: ruches.id })
      .from(ruches)
      .where(
        and(
          eq(ruches.userId, user.id),
          sql`${ruches.statut} NOT IN ('morte', 'vendue', 'fusionnee')`,
        ),
      )
      .orderBy(desc(ruches.createdAt))
      .limit(ruchesLimit),
    db
      .select({ id: ruchers.id })
      .from(ruchers)
      .where(eq(ruchers.userId, user.id))
      .orderBy(desc(ruchers.createdAt))
      .limit(ruchersLimit),
  ]);

  return {
    activeRucheIds: activeRuches.map((r) => r.id),
    activeRucherIds: activeRuchers.map((r) => r.id),
  };
});
