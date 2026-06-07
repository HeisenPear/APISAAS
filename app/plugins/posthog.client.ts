import posthog from 'posthog-js';

export default defineNuxtPlugin({
  name: 'posthog',
  enforce: 'pre',
  setup() {
    const config = useRuntimeConfig();
    // Chemin first-party proxifié par Nitro (cf. routeRules '/relay-h7q/**' dans
    // nuxt.config.ts). Les requêtes ne touchent jamais *.posthog.com côté client
    // → invisibles pour les ad-blockers. ui_host garde les liens vers l'app PostHog.
    const uiHost = (config.public.posthogHost as string) || 'https://eu.posthog.com';

    // Sanitisation défensive de la clé : une valeur d'env mal collée (ex.
    // "NUXT_PUBLIC_POSTHOG_KEY    phc_xxx") produisait des requêtes /flags et
    // /config en 401/400. On extrait le token `phc_...` et on valide son format ;
    // toute clé invalide => on n'initialise pas PostHog (aucune requête cassée).
    const raw = (config.public.posthogKey as string) ?? '';
    const key = raw.match(/phc_[A-Za-z0-9]+/)?.[0] ?? raw.trim();
    if (!/^phc_[A-Za-z0-9]+$/.test(key)) return;

    posthog.init(key, {
      api_host: '/relay-h7q',
      ui_host: uiHost,
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
