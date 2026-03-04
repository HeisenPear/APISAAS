export function useSubscription() {
  const authStore = useAuthStore();
  const loading = ref(false);
  const showUpgradeModal = ref(false);

  const currentPlan = computed(() => authStore.profil?.plan ?? 'decouverte');
  const hasSubscription = computed(() => currentPlan.value !== 'decouverte');
  const stripeCustomerId = computed(() => authStore.profil?.stripeCustomerId ?? null);

  const planLimits: Record<string, { ruches: number; label: string; prix: string }> = {
    decouverte: { ruches: 10, label: 'Découverte', prix: 'Gratuit' },
    starter: { ruches: 20, label: 'Starter', prix: '9,99€/mois' },
    pro: { ruches: 100, label: 'Pro', prix: '39,99€/mois' },
    expert: { ruches: Infinity, label: 'Expert', prix: '79,99€/mois' },
  };

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

  async function checkout(plan: 'starter' | 'pro' | 'expert') {
    loading.value = true;
    try {
      const res = await $fetch<{ data: { url: string } }>('/api/stripe/checkout', {
        method: 'POST',
        body: { plan },
      });
      if (res.data.url) {
        await navigateTo(res.data.url, { external: true });
      }
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
