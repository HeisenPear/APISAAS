import { desc } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { isAdminEmail } from '~~/app/config/admin';

const PLAN_MRR: Record<string, number> = {
  starter: 4.99,
  pro: 14.99,
  expert: 39.99,
};

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  if (!isAdminEmail(user.email)) {
    throw createError({ statusCode: 403, message: 'Accès réservé aux administrateurs' });
  }

  const users = await db
    .select({
      id: profils.id,
      email: profils.email,
      nom: profils.nom,
      prenom: profils.prenom,
      plan: profils.plan,
      trialActive: profils.trialActive,
      trialStartedAt: profils.trialStartedAt,
      trialEndsAt: profils.trialEndsAt,
      trialUsed: profils.trialUsed,
      stripeCustomerId: profils.stripeCustomerId,
      stripeSubscriptionId: profils.stripeSubscriptionId,
      onboardingComplete: profils.onboardingComplete,
      createdAt: profils.createdAt,
    })
    .from(profils)
    .orderBy(desc(profils.createdAt));

  const payingUsers = users.filter((u) => u.stripeSubscriptionId && !u.trialActive);
  const mrr = payingUsers.reduce((sum, u) => sum + (PLAN_MRR[u.plan] ?? 0), 0);

  const stats = {
    total: users.length,
    enTrial: users.filter((u) => u.trialActive).length,
    payants: payingUsers.length,
    decouverte: users.filter((u) => u.plan === 'decouverte' && !u.trialActive).length,
    mrr: Math.round(mrr * 100) / 100,
    mrrAnnuel: Math.round(mrr * 12 * 100) / 100,
  };

  return { data: users, stats };
});
