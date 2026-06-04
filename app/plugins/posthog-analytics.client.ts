// Plugin principal PostHog — s'exécute après le plugin @posthog/nuxt.
// Responsabilités : consentement, pageviews, DataBus → PostHog bridge, identify.
export default defineNuxtPlugin({
  name: 'apigo-posthog-analytics',
  enforce: 'post',
  setup() {
    const posthog = usePostHog();
    if (!posthog) return;

    const { isGranted } = useAnalyticsConsent();
    const router = useRouter();

    // 1. Appliquer le consentement stocké
    if (isGranted.value) {
      posthog.opt_in_capturing();
      posthog.startSessionRecording();
    } else {
      posthog.opt_out_capturing();
    }

    // 2. Pageviews — chemin uniquement, jamais les query params (PII potentiel)
    router.afterEach((to) => {
      if (!isGranted.value) return;
      posthog.capture('$pageview', {
        $current_url: to.path,
        source: isPwa() ? 'pwa' : 'web',
      });
    });

    // 3. DataBus → PostHog bridge
    // Les events métier déjà émis par le DataBus sont automatiquement forwardés.
    const { on } = useDataBus();
    const BUS_MAP: Partial<Record<DataEvent, string>> = {
      'intervention:created': 'intervention_created',
      'recolte:created': 'recolte_created',
      'vente:created': 'vente_created',
      'achat:created': 'achat_created',
      'ruche:created': 'ruche_created',
      'rucher:created': 'rucher_created',
      'stock:created': 'stock_created',
      'client:created': 'client_created',
      'hausse:created': 'hausse_created',
      'bl:created': 'bl_created',
      'reine:created': 'reine_created',
      'membre:invited': 'membre_invited',
    };

    (Object.keys(BUS_MAP) as DataEvent[]).forEach((busEvent) => {
      on(busEvent, (payload) => {
        if (!isGranted.value) return;
        const phEvent = BUS_MAP[busEvent];
        if (phEvent) posthog.capture(phEvent, payload?.extra ?? {});
      });
    });
  },
});

function isPwa(): boolean {
  if (!import.meta.client) return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}
