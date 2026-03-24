import { eq, and, gte, sql } from 'drizzle-orm';
import {
  profils,
  ruchers,
  ruches,
  clients,
  transactions,
  membres,
  templatesIntervention,
} from '~~/server/database/schema';
import { isAdminEmail } from '~~/app/config/admin';
import { getPlanConfig } from '~~/app/config/plans';
import type { Plan } from '~~/app/config/plans';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const profilRow = await db.query.profils.findFirst({
    where: eq(profils.id, user.id),
  });

  if (!profilRow) notFound('Profil introuvable');

  const isAdmin = isAdminEmail(user.email);
  const plan = profilRow.plan as Plan;
  const config = getPlanConfig(plan);

  const [ruchersCount, ruchesCount, clientsCount, facturesMoisCount, membresCount, templatesCount] =
    await Promise.all([
      countRuchers(user.id),
      countRuches(user.id),
      countClients(user.id),
      countFacturesThisMonth(user.id),
      countMembres(user.id),
      countTemplates(user.id),
    ]);

  const daysRemaining = profilRow.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(profilRow.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  return {
    plan,
    isAdmin,
    planConfig: {
      id: config.id,
      label: config.label,
      prix: config.prix,
      badge: config.badge,
    },
    usage: {
      ruchers: { current: ruchersCount, max: isAdmin ? Infinity : config.limites.ruchers },
      ruches: { current: ruchesCount, max: isAdmin ? Infinity : config.limites.ruches },
      clients: { current: clientsCount, max: isAdmin ? Infinity : config.limites.clients },
      facturesParMois: {
        current: facturesMoisCount,
        max: isAdmin ? Infinity : config.limites.facturesParMois,
      },
      membresEquipe: {
        current: membresCount,
        max: isAdmin ? Infinity : config.limites.membresEquipe,
      },
      templatesIntervention: {
        current: templatesCount,
        max: isAdmin ? Infinity : config.limites.templatesIntervention,
      },
    },
    trial: {
      active: profilRow.trialActive,
      endsAt: profilRow.trialEndsAt?.toISOString() ?? null,
      daysRemaining,
    },
  };
});

async function countRuchers(userId: string) {
  const r = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ruchers)
    .where(eq(ruchers.userId, userId));
  return r[0]?.count ?? 0;
}

async function countRuches(userId: string) {
  const r = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ruches)
    .where(
      and(eq(ruches.userId, userId), sql`${ruches.statut} NOT IN ('morte', 'vendue', 'fusionnee')`),
    );
  return r[0]?.count ?? 0;
}

async function countClients(userId: string) {
  const r = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clients)
    .where(eq(clients.userId, userId));
  return r[0]?.count ?? 0;
}

async function countFacturesThisMonth(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const r = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'vente'),
        gte(transactions.createdAt, startOfMonth),
      ),
    );
  return r[0]?.count ?? 0;
}

async function countMembres(userId: string) {
  const r = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(membres)
    .where(and(eq(membres.ownerId, userId), eq(membres.statut, 'acceptee')));
  return r[0]?.count ?? 0;
}

async function countTemplates(userId: string) {
  const r = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(templatesIntervention)
    .where(eq(templatesIntervention.userId, userId));
  return r[0]?.count ?? 0;
}
