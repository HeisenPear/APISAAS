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
    ],

    denyUrls: [
      // Extensions navigateur
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
      /^safari-extension:\/\//,
      /^safari-web-extension:\/\//,
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
});
