import * as Sentry from '@sentry/vue';

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.env.MODE !== 'production') return;

  const config = useRuntimeConfig();
  if (!config.public.sentryDsn) {
    // En prod sans Sentry on perd la visibilite sur les crashs — warn explicite
    console.warn('[sentry] NUXT_PUBLIC_SENTRY_DSN non defini — monitoring desactive');
    return;
  }

  Sentry.init({
    app: nuxtApp.vueApp,
    dsn: config.public.sentryDsn,
    // Release = SHA du déploiement → « quelle version a introduit ce bug ».
    release: (config.public.appVersion as string) || undefined,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,

    // Filtre le bruit qui n'est pas un vrai bug applicatif.
    // - AbortError : Mobile Safari abort les fetches quand la page passe
    //   en background, ou quand on navigue rapidement (useFetch s'annule).
    //   Pas une erreur, pas d'impact utilisateur.
    // - ResizeObserver loop : warning Chrome cosmétique, pas un bug.
    // - Extensions navigateur : injections externes, hors de notre contrôle.
    ignoreErrors: [
      'AbortError',
      'The operation was aborted',
      /aborted/i,
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Erreurs réseau standard offline — déjà gérées par notre offline mode
      'NetworkError when attempting to fetch',
      'Failed to fetch',
      'Load failed',
      // Navigateurs in-app (Facebook/Instagram/TikTok webview Android) : leur
      // PROPRE instrumentation plante quand l'utilisateur navigue (pont Java GC).
      // Aucun rapport avec notre code — fréquent car le trafic pub arrive de là.
      'enableButtonsClickedMetaDataLogging',
      'Java object is gone',
      'Java bridge method invocation error',
      // Chunk périmé après un déploiement (l'utilisateur a un vieux bundle en
      // cache) : se résout au reload, pas un bug applicatif.
      'Importing a module script failed',
      'Failed to fetch dynamically imported module',
      'error loading dynamically imported module',
    ],

    denyUrls: [
      // Extensions navigateur
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
      /^safari-extension:\/\//,
      /^safari-web-extension:\/\//,
      // Scripts injectés par les navigateurs in-app (Facebook/IG/TikTok)
      /^iabjs:\/\//,
      /navigation_performance_logger/,
    ],

    beforeSend(event, hint) {
      const original = hint?.originalException;

      // DOMException.code 20 = ABORT_ERR (variante DOMException de l'AbortError)
      if (original && typeof original === 'object') {
        const exc = original as { code?: number; name?: string; message?: string };
        if (exc.code === 20) return null;
        if (exc.name === 'AbortError') return null;
        if (typeof exc.message === 'string' && exc.message.toLowerCase().includes('abort')) {
          return null;
        }
      }

      return event;
    },
  });

  // Contexte utilisateur — attribue les erreurs à un compte (id seul, pas d'email
  // ni d'IP : cohérent avec l'anonymisation RGPD du reste de l'app). Mis à jour
  // au login / logout via le ref Supabase.
  const supaUser = useSupabaseUser();
  watch(
    supaUser,
    (u) => {
      if (u?.id) Sentry.setUser({ id: u.id });
      else Sentry.setUser(null);
    },
    { immediate: true },
  );
});
