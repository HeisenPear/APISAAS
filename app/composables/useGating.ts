import { hasFeature, minimumPlanFor, isPlanAtLeast, PLAN_CONFIGS } from '~/config/plans';
import type { Plan, PlanFeatures, PlanLimits } from '~/config/plans';

interface UsageEntry {
  current: number;
  /** null = illimité (l'API renvoie null pour Infinity, non sérialisable en JSON) */
  max: number | null;
}

interface UsageData {
  plan: string;
  isAdmin: boolean;
  isMember?: boolean;
  workspaceOwner?: string | null;
  usage: Record<string, UsageEntry>;
  trial: {
    active: boolean;
    endsAt: string | null;
    daysRemaining: number | null;
  };
}

export function useGating() {
  const authStore = useAuthStore();

  // Usage depuis l'API (lazy, rafraîchi à la demande). Pour un MEMBRE, l'endpoint
  // renvoie le plan + les compteurs du PROPRIÉTAIRE de l'espace.
  const { data: usageData, refresh: refreshUsage } = useFetch<UsageData>(
    '/api/subscription/usage',
    {
      key: 'subscription-usage',
      dedupe: 'defer',
      immediate: false,
    },
  );

  // Plan EFFECTIF : celui de l'espace courant (propriétaire si membre). Le fetch
  // usage l'affine (avec les compteurs) mais le fallback est désormais le plan
  // EFFECTIF exposé par le profil (/api/auth/me) — correct dès le montage, sans
  // attendre le fetch usage. Fini le « flash » du plan personnel pour un membre.
  const plan = computed<Plan>(
    () => (usageData.value?.plan as Plan) || authStore.effectivePlan || 'decouverte',
  );

  // Flag admin (calculé côté serveur) — via usage (acting user) puis profil.
  const isAdmin = computed<boolean>(
    () =>
      usageData.value?.isAdmin === true ||
      (authStore.profil as Record<string, unknown> & { isAdmin?: boolean })?.isAdmin === true,
  );

  // Contexte espace de travail partagé (multi-utilisateurs) — depuis usage si
  // chargé, sinon depuis le profil (eager).
  const isMember = computed<boolean>(
    () => usageData.value?.isMember ?? authStore.isWorkspaceMember,
  );
  const workspaceOwner = computed<string | null>(
    () => usageData.value?.workspaceOwner ?? authStore.workspaceOwnerName,
  );

  // ─── Feature check ───────────────────────────────────────────────

  function can(feature: keyof PlanFeatures): boolean {
    if (isAdmin.value) return true;
    return hasFeature(plan.value, feature);
  }

  // ─── Limit check ─────────────────────────────────────────────────

  function isAtLimit(resource: keyof PlanLimits): boolean {
    if (isAdmin.value) return false;
    const usage = usageData.value?.usage[resource];
    if (!usage) return false;
    if (usage.max == null) return false;
    return usage.current >= usage.max;
  }

  // ─── Usage percentage ────────────────────────────────────────────

  function usagePercent(resource: keyof PlanLimits): number {
    if (isAdmin.value) return 0;
    const usage = usageData.value?.usage[resource];
    if (!usage || usage.max == null || usage.max === 0) return 0;
    return Math.round((usage.current / usage.max) * 100);
  }

  // ─── Usage display "7/20" ────────────────────────────────────────

  function usageDisplay(resource: keyof PlanLimits): string {
    if (isAdmin.value) return '∞';
    const usage = usageData.value?.usage[resource];
    if (!usage) return '';
    if (usage.max == null) return `${usage.current}`;
    return `${usage.current}/${usage.max}`;
  }

  // ─── Plan minimum requis pour une feature ────────────────────────

  function requiredPlan(feature: keyof PlanFeatures): Plan {
    return minimumPlanFor(feature);
  }

  // ─── Plan actuel est au moins X ? ────────────────────────────────

  function isAtLeast(required: Plan): boolean {
    return isPlanAtLeast(plan.value, required);
  }

  // ─── Trial info ──────────────────────────────────────────────────

  const trial = computed(() => {
    if (usageData.value?.trial) return usageData.value.trial;
    const profil = authStore.profil as Record<string, unknown> | null;
    return {
      active: (profil?.trialActive as boolean) ?? false,
      endsAt: (profil?.trialEndsAt as string) ?? null,
      daysRemaining: null,
    };
  });

  // ─── Activer le trial ────────────────────────────────────────────

  async function activateTrial(): Promise<void> {
    // L'essai Pro exige la capture d'une carte AVANT de démarrer (parcours Stripe
    // /activer-essai → trial-checkout). On ne l'accorde plus jamais sans moyen de
    // paiement (l'ancien endpoint /api/subscription/trial a été supprimé).
    await navigateTo('/activer-essai');
  }

  return {
    plan,
    isAdmin,
    isMember,
    workspaceOwner,
    can,
    isAtLimit,
    usagePercent,
    usageDisplay,
    requiredPlan,
    isAtLeast,
    trial,
    refreshUsage,
    usageData,
    activateTrial,
    PLAN_CONFIGS,
  };
}
