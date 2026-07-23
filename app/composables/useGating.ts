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

  // Plan EFFECTIF de l'espace courant (propriétaire si membre).
  //
  // BUG PROD (client Expert bloquée à 1 rucher) : la jauge `usage` est mise en
  // cache (key partagée, immediate:false) et n'était rafraîchie qu'à la demande.
  // Après une souscription EN COURS de session, `usageData.plan` restait
  // « decouverte » et, comme il était prioritaire, RÉTROGRADAIT le plan effectif
  // — donc réappliquait les limites Découverte alors que le profil (rafraîchi par
  // fetchProfil au retour du paiement) est déjà Expert.
  //
  // Correctif : le PROFIL fait foi. Si le snapshot usage le contredit, on garde le
  // plan du profil (le plus frais) — l'usage ne sert plus qu'aux compteurs.
  const plan = computed<Plan>(() => {
    const parProfil = authStore.effectivePlan;
    const parUsage = usageData.value?.plan as Plan | undefined;
    if (parProfil && parUsage && parProfil !== parUsage) return parProfil;
    return parUsage || parProfil || 'decouverte';
  });

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
    const snap = usageData.value;
    if (!snap) return false;
    // Garde anti-obsolescence : si le snapshot usage ne reflète plus le plan
    // effectif (abonnement souscrit sans refresh de la jauge), on NE bloque PAS
    // sur des limites périmées et on redéclenche le fetch (auto-guérison).
    if ((snap.plan as Plan) !== plan.value) {
      void refreshUsage();
      return false;
    }
    const usage = snap.usage[resource];
    if (!usage || usage.max == null) return false;
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
