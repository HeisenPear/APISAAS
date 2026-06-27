import { PLAN_CONFIGS } from '~/config/plans';

export function useSubscription() {
  const authStore = useAuthStore();
  const loading = ref(false);
  const showUpgradeModal = ref(false);

  const currentPlan = computed(() => authStore.profil?.plan ?? 'decouverte');
  const hasSubscription = computed(() => currentPlan.value !== 'decouverte');
  const stripeCustomerId = computed(() => authStore.profil?.stripeCustomerId ?? null);
  const trialActive = computed(() => authStore.profil?.trialActive ?? false);
  const trialEndsAt = computed(() => authStore.profil?.trialEndsAt ?? null);
  const hasStripePortalAccess = computed(() => !!stripeCustomerId.value);

  // Dérivé de PLAN_CONFIGS (source de vérité unique) — ce bloc était en dur et
  // affichait des tarifs d'avant la refonte des packs.
  const planLimits: Record<string, { ruches: number; label: string; prix: string }> =
    Object.fromEntries(
      Object.values(PLAN_CONFIGS).map((c) => [
        c.id,
        {
          ruches: c.limites.ruches,
          label: c.label,
          prix: c.prix ? `${c.prix.mois.toFixed(2).replace('.', ',')}€/mois` : 'Gratuit',
        },
      ]),
    );

  const currentLimits = computed(() => planLimits[currentPlan.value] ?? planLimits.decouverte);

  const isAtLimit = computed(() => {
    const limits = currentLimits.value;
    if (!limits || limits.ruches === Infinity) return false;
    // ruchesCount would need to be fetched separately; for now use limits check
    return false;
  });

  const canCreateHive = computed(() => !isAtLimit.value);

  const nextPlan = computed(() => {
    const order = ['decouverte', 'starter', 'pro', 'expert'];
    const idx = order.indexOf(currentPlan.value);
    if (idx < order.length - 1) return order[idx + 1];
    return null;
  });

  function showUpgradePrompt() {
    showUpgradeModal.value = true;
  }

  async function checkout(
    plan: 'starter' | 'pro' | 'expert',
    billing: 'mois' | 'an' = 'mois',
    context?: 'onboarding',
  ) {
    loading.value = true;
    try {
      const res = await $fetch<{ data: { url: string } }>('/api/stripe/checkout', {
        method: 'POST',
        body: { plan, billing, context },
      });
      if (res.data.url) {
        await navigateTo(res.data.url, { external: true });
      }
    } catch (e) {
      useToast().add({
        title: getApiErrorMessage(e, 'Impossible de démarrer le paiement'),
        color: 'error',
      });
    } finally {
      loading.value = false;
    }
  }

  async function openPortal() {
    loading.value = true;
    try {
      const res = await $fetch<{ data: { url: string } }>('/api/stripe/portal', {
        method: 'POST',
      });
      if (res.data.url) {
        await navigateTo(res.data.url, { external: true });
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    currentPlan,
    hasSubscription,
    stripeCustomerId,
    trialActive,
    trialEndsAt,
    hasStripePortalAccess,
    currentLimits,
    planLimits,
    isAtLimit,
    canCreateHive,
    nextPlan,
    loading,
    showUpgradeModal,
    showUpgradePrompt,
    checkout,
    openPortal,
  };
}
