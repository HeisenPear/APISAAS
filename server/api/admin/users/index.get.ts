import { desc } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { PLAN_CONFIGS } from '~~/app/config/plans';

// MRR dérivé de la source de vérité des tarifs (plans.ts) — plus de valeurs en
// dur qui dérivent après un changement de prix.
const PLAN_MRR: Record<string, number> = Object.fromEntries(
  Object.entries(PLAN_CONFIGS).map(([plan, cfg]) => [plan, cfg.prix?.mois ?? 0]),
);

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  // Protégé (watchdog + relance + recyclage du pool) : sans ça, sur un pool DB
  // mort (réveil de lambda), cette requête unique pendait sans timeout jusqu'au
  // plafond Vercel (~30 s) → page /admin/users « qui charge à l'infini », et le
  // pool empoisonné n'était pas recyclé pour la requête suivante.
  const users = await withDbRetry(
    () =>
      db
        .select({
          id: profils.id,
          email: profils.email,
          telephone: profils.telephone,
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
        .orderBy(desc(profils.createdAt)),
    'admin/users',
  );

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
