import { eq, and, sql, gte } from 'drizzle-orm';
import { recoltes } from '~~/server/database/schema';

export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);
  const userId = user.id;
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);

  // 30 days ago for daily view
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  // 12 weeks ago for weekly view
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 86400000);

  const [mensuelleResult, hebdoResult, quotidienResult] = await Promise.all([
    // Monthly: group by month for current year
    db
      .select({
        period: sql<number>`extract(month from ${recoltes.dateRecolte})::int`,
        total: sql<number>`coalesce(sum(${recoltes.quantiteKg}::numeric), 0)::float`,
      })
      .from(recoltes)
      .where(and(eq(recoltes.userId, userId), gte(recoltes.dateRecolte, startOfYear)))
      .groupBy(sql`extract(month from ${recoltes.dateRecolte})`)
      .orderBy(sql`extract(month from ${recoltes.dateRecolte})`),

    // Weekly: group by ISO week for last 12 weeks
    db
      .select({
        period: sql<number>`extract(isodow from date_trunc('week', ${recoltes.dateRecolte}))`,
        weekStart: sql<string>`to_char(date_trunc('week', ${recoltes.dateRecolte}), 'YYYY-MM-DD')`,
        total: sql<number>`coalesce(sum(${recoltes.quantiteKg}::numeric), 0)::float`,
      })
      .from(recoltes)
      .where(and(eq(recoltes.userId, userId), gte(recoltes.dateRecolte, twelveWeeksAgo)))
      .groupBy(sql`date_trunc('week', ${recoltes.dateRecolte})`)
      .orderBy(sql`date_trunc('week', ${recoltes.dateRecolte})`),

    // Daily: group by day for last 30 days
    db
      .select({
        period: sql<string>`to_char(${recoltes.dateRecolte}, 'YYYY-MM-DD')`,
        total: sql<number>`coalesce(sum(${recoltes.quantiteKg}::numeric), 0)::float`,
      })
      .from(recoltes)
      .where(and(eq(recoltes.userId, userId), gte(recoltes.dateRecolte, thirtyDaysAgo)))
      .groupBy(sql`to_char(${recoltes.dateRecolte}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${recoltes.dateRecolte}, 'YYYY-MM-DD')`),
  ]);

  // Fill monthly (1-12)
  const monthMap = new Map(mensuelleResult.map((r) => [r.period, r.total]));
  const mensuelle = Array.from({ length: 12 }, (_, i) => ({
    label:
      ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'][i] ??
      '',
    total: monthMap.get(i + 1) ?? 0,
  }));

  // Fill weekly (last 12 weeks)
  const weekMap = new Map(hebdoResult.map((r) => [r.weekStart, r.total]));
  const hebdo: Array<{ label: string; total: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 86400000);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const label = `${monday.getDate()}/${monday.getMonth() + 1}`;
    hebdo.push({ label, total: weekMap.get(key) ?? 0 });
  }

  // Fill daily (last 30 days)
  const dayMap = new Map(quotidienResult.map((r) => [r.period, r.total]));
  const quotidien: Array<{ label: string; total: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    quotidien.push({ label, total: dayMap.get(key) ?? 0 });
  }

  return { mensuelle, hebdo, quotidien };
});
