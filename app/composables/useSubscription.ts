export function useSubscription() {
  const authStore = useAuthStore();
  const loading = ref(false);

  const currentPlan = computed(() => authStore.profil?.plan ?? 'decouverte');
  const hasSubscription = computed(() => currentPlan.value !== 'decouverte');
  const stripeCustomerId = computed(() => authStore.profil?.stripeCustomerId ?? null);

  const planLimits: Record<string, { ruches: number; label: string }> = {
    decouverte: { ruches: 10, label: 'Découverte' },
    starter: { ruches: 20, label: 'Starter' },
    pro: { ruches: 100, label: 'Pro' },
    expert: { ruches: Infinity, label: 'Expert' },
  };

  const currentLimits = computed(() => planLimits[currentPlan.value] ?? planLimits.decouverte);

  /** Redirect to Stripe Checkout for a plan upgrade. */
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

  /** Open Stripe Customer Portal (manage subscription, invoices, payment methods). */
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
    loading,
    checkout,
    openPortal,
  };
}
