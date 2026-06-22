import { hasFeature, minimumPlanFor, isPlanAtLeast, PLAN_CONFIGS } from '~/config/plans';
import type { Plan, PlanFeatures, PlanLimits } from '~/config/plans';

interface UsageEntry {
  current: number;
  max: number;
}

interface UsageData {
  plan: string;
  isAdmin: boolean;
  usage: Record<string, UsageEntry>;
  trial: {
    active: boolean;
    endsAt: string | null;
    daysRemaining: number | null;
  };
}

interface EspaceActif {
  ownerId: string;
  role: string;
  isOwner: boolean;
  plan: string;
  label: string;
  isAdmin: boolean;
}

export function useGating() {
  const authStore = useAuthStore();

  // Contexte de l'espace actif : en espace partagé, le plan EFFECTIF est celui
  // du propriétaire (le membre hérite de ses features).
  const { data: espaceActif, refresh: refreshWorkspace } = useFetch<EspaceActif>(
    '/api/membres/espace-actif',
    { key: 'espace-actif', dedupe: 'defer', lazy: true },
  );

  const plan = computed<Plan>(() => {
    if (espaceActif.value && !espaceActif.value.isOwner) {
      return (espaceActif.value.plan as Plan) || 'decouverte';
    }
    return (authStore.profil?.plan as Plan) || 'decouverte';
  });

  // Flag admin issu du profil (acteur) ou du contexte d'espace
  const isAdmin = computed<boolean>(
    () =>
      espaceActif.value?.isAdmin === true ||
      (authStore.profil as Record<string, unknown> & { isAdmin?: boolean })?.isAdmin === true,
  );

  // Usage depuis l'API (lazy, rafraîchi à la demande)
  const { data: usageData, refresh: refreshUsage } = useFetch<UsageData>(
    '/api/subscription/usage',
    {
      key: 'subscription-usage',
      dedupe: 'defer',
      immediate: false,
    },
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
    if (usage.max === Infinity) return false;
    return usage.current >= usage.max;
  }

  // ─── Usage percentage ────────────────────────────────────────────

  function usagePercent(resource: keyof PlanLimits): number {
    if (isAdmin.value) return 0;
    const usage = usageData.value?.usage[resource];
    if (!usage || usage.max === Infinity || usage.max === 0) return 0;
    return Math.round((usage.current / usage.max) * 100);
  }

  // ─── Usage display "7/20" ────────────────────────────────────────

  function usageDisplay(resource: keyof PlanLimits): string {
    if (isAdmin.value) return '∞';
    const usage = usageData.value?.usage[resource];
    if (!usage) return '';
    if (usage.max === Infinity) return `${usage.current}`;
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
    await $fetch('/api/subscription/trial', { method: 'POST' });
    await authStore.fetchProfil();
    await refreshUsage();
  }

  return {
    plan,
    isAdmin,
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
    workspace: espaceActif,
    refreshWorkspace,
  };
}
