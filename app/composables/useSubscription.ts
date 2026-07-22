import { PLAN_CONFIGS, hasFeature, type PlanFeatures } from '~/config/plans';

export function useSubscription() {
  const authStore = useAuthStore();
  const loading = ref(false);
  // État PARTAGÉ (useState) → le modal monté dans le layout et le déclencheur
  // (intercepteur 402) parlent du même état, quelle que soit l'instance du composable.
  const showUpgradeModal = useState('upgrade-modal-open', () => false);

  // Plan EFFECTIF de l'espace (celui du propriétaire si l'utilisateur est membre
  // d'une équipe). Un membre voit ainsi les bonnes fonctionnalités/limites, pas
  // celles de son plan personnel (souvent Découverte).
  const currentPlan = computed(() => authStore.effectivePlan);
  const hasSubscription = computed(() => currentPlan.value !== 'decouverte');
  const stripeCustomerId = computed(() => authStore.profil?.stripeCustomerId ?? null);
  const trialActive = computed(() => authStore.profil?.trialActive ?? false);
  const trialEndsAt = computed(() => authStore.profil?.trialEndsAt ?? null);
  const hasStripePortalAccess = computed(() => !!stripeCustomerId.value);

  /**
   * La capacité est-elle réellement utilisable ICI ET MAINTENANT ?
   *
   * À préférer à `hasFeature(currentPlan, …)` appelé à la main : le middleware
   * serveur laisse passer les comptes de l'équipe APIGO (`NUXT_ADMIN_EMAILS`),
   * et un garde client qui l'ignore fait dire au client l'inverse du serveur.
   * C'est exactement ce qui a cassé les modes de présence de Maya : la carte
   * proactive était masquée côté client alors que la route répondait, si bien
   * que « partout » et « discrète » donnaient le même écran.
   *
   * Sert AUSSI à ne jamais APPELER une route verrouillée : un 402 déclenche le
   * modal d'abonnement, même sur une requête de fond que personne n'a demandée.
   */
  function aAcces(feature: keyof PlanFeatures): boolean {
    return authStore.isAdmin || hasFeature(currentPlan.value, feature);
  }

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
    acceptCgv?: boolean,
  ) {
    loading.value = true;
    try {
      const res = await $fetch<{ data: { url: string } }>('/api/stripe/checkout', {
        method: 'POST',
        body: { plan, billing, context, acceptCgv },
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
    aAcces,
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
