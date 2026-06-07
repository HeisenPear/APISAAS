import posthog from 'posthog-js';

export default defineNuxtPlugin({
  name: 'posthog',
  enforce: 'pre',
  setup() {
    const config = useRuntimeConfig();
    const key = config.public.posthogKey as string;
    const host = (config.public.posthogHost as string) || 'https://eu.i.posthog.com';

    if (!key) return;

    posthog.init(key, {
      api_host: host,
      // Pas d'autocapture — events nommés uniquement
      autocapture: false,
      capture_pageview: false,
      // RGPD : opt-in requis avant tout tracking
      opt_out_capturing_by_default: true,
      // Session replay masqué strictement
      disable_session_recording: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '*',
      },
      // IP anonymisée
      ip: false,
      capture_exceptions: true,
      // Aucun feature flag / survey utilisé dans l'app : on désactive l'appel
      // /flags (ex-/decide) émis à l'init. Cet appel partait même en opt-out et,
      // lorsqu'il est bloqué (ad-blocker uBlock/Brave) ou injoignable, PostHog le
      // relançait en boucle (retriableRequest → _send_request) → bruit console.
      // À retirer le jour où des feature flags PostHog sont introduits.
      advanced_disable_flags: true,
    });

    return {
      provide: { posthog },
    };
  },
});
