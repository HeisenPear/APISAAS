import * as Sentry from '@sentry/vue';

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.env.MODE !== 'production') return;

  const config = useRuntimeConfig();
  if (!config.public.sentryDsn) return;

  Sentry.init({
    app: nuxtApp.vueApp,
    dsn: config.public.sentryDsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
  });
});
