// https://nuxt.com/docs/api/configuration/nuxt-config
import { sentryVitePlugin } from '@sentry/vite-plugin';

// Upload des source maps Sentry : actif UNIQUEMENT si SENTRY_AUTH_TOKEN est
// présent (Vercel prod). Sinon : aucune source map générée, plugin non monté
// → zéro impact, build inchangé. Les .map sont supprimées après upload, jamais
// servies publiquement.
const sentryUploadEnabled = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  // Source maps client générées (cachées) seulement quand on les upload à Sentry.
  sourcemap: { client: sentryUploadEnabled ? 'hidden' : false },

  vite: {
    plugins: sentryUploadEnabled
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT || 'javascript-nuxt',
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev' },
            sourcemaps: { filesToDeleteAfterUpload: ['**/*.map'] },
            telemetry: false,
          }),
        ]
      : [],
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@vueuse/motion/nuxt',
    '@vite-pwa/nuxt',
    '@vercel/analytics/nuxt',
  ],

  // PostHog désactivé temporairement : le module @posthog/nuxt instancie un
  // client posthog-node avec une clé vide et fait échouer le build/prerender.
  // Le tracking côté code est conservé (no-op via composable usePostHog shim +
  // garde serveur). Pour réactiver : remettre '@posthog/nuxt' dans modules,
  // restaurer posthogConfig, supprimer app/composables/usePostHog.ts, et
  // fournir NUXT_PUBLIC_POSTHOG_PROJECT_TOKEN.

  // SSR pour SEO landing, SPA pour app dashboard
  ssr: true,

  // Runtime config
  runtimeConfig: {
    // Server-only
    supabaseServiceKey: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    stripePriceStarter: '',
    stripePricePro: '',
    stripePriceExpert: '',
    stripePriceStarterAnnual: '',
    stripePriceProAnnual: '',
    stripePriceExpertAnnual: '',
    brevoApiKey: '',
    resendApiKey: '',
    // Admin whitelist (NUXT_ADMIN_EMAILS=email1,email2)
    adminEmails: '',
    cronSecret: '',
    // Web Push (VAPID) — NUXT_VAPID_PRIVATE_KEY / NUXT_VAPID_SUBJECT
    vapidPrivateKey: '',
    vapidSubject: 'mailto:apigo360.apiculture@gmail.com',
    // PostHog — clé API PERSONNELLE (phx_…) pour INTERROGER l'API côté serveur
    // (≠ clé publique phc_ de capture). NUXT_POSTHOG_PERSONAL_API_KEY / NUXT_POSTHOG_PROJECT_ID.
    // Si absente, la section analytics PostHog de l'admin affiche un état « à connecter ».
    posthogPersonalApiKey: '',
    posthogProjectId: '',
    // Public
    public: {
      baseUrl: 'http://localhost:3000',
      supabaseUrl: '',
      supabaseKey: '',
      sentryDsn: '',
      // Version du déploiement (SHA git court, injecté par Vercel au build) —
      // taggue chaque erreur Sentry/PostHog avec la release qui l'a introduite.
      appVersion: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
      // Clé publique VAPID — NUXT_PUBLIC_VAPID_PUBLIC_KEY
      vapidPublicKey: '',
      // PostHog — NUXT_PUBLIC_POSTHOG_KEY. L'ingestion passe par le proxy
      // first-party '/relay-h7q' (cf. routeRules) ; posthogHost ne sert plus que
      // de ui_host (liens vers l'app PostHog).
      posthogKey: '',
      posthogHost: 'https://eu.posthog.com',
    },
  },

  // Supabase module config
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      include: [
        '/dashboard(/*)?',
        '/ruchers(/*)?',
        '/ruches(/*)?',
        '/interventions(/*)?',
        '/production(/*)?',
        '/stocks(/*)?',
        '/finances(/*)?',
        '/clients(/*)?',
        '/calendrier',
        '/meteo',
        '/parametres(/*)?',
        '/exports(/*)?',
        '/admin(/*)?',
        '/activer-essai',
      ],
      exclude: ['/', '/register', '/reset-password'],
      cookieRedirect: false,
    },
    // Politique « connecté en continu » : cookie longue durée (90 j) pour que la
    // session survive aux fermetures de navigateur et aux longues inactivités.
    // NB : la durée réelle reste plafonnée par les réglages Auth du projet
    // Supabase (Session timeout / Inactivity) — à vérifier côté dashboard si on
    // veut une persistance encore plus longue.
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 90,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },

  // Page & layout transitions
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'APIGO — Logiciel de gestion apicole tout-en-un',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover',
        },
        {
          name: 'description',
          content:
            'APIGO, le logiciel de gestion apicole tout-en-un : suivi des ruches, interventions, santé des colonies, production, conformité et facturation. Mobile et web, même hors-ligne. Essai gratuit 14 jours.',
        },
        {
          name: 'keywords',
          content:
            'logiciel apiculture, logiciel gestion apicole, gestion apicole, gestion de rucher, suivi des ruches, application apiculture, logiciel apiculteur, registre élevage apicole, carnet apiculture, comptabilité apicole',
        },
        { name: 'author', content: 'APIGO' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'fr_FR' },
        { property: 'og:site_name', content: 'APIGO' },
        { property: 'og:url', content: 'https://www.apigo.fr' },
        { property: 'og:title', content: 'APIGO — Logiciel de gestion apicole tout-en-un' },
        {
          property: 'og:description',
          content:
            'Du rucher à la comptabilité, dans un seul logiciel. Suivi des ruches, interventions, conformité et facturation. Essai gratuit.',
        },
        { property: 'og:image', content: 'https://www.apigo.fr/og-image.jpg' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'APIGO — Logiciel de gestion apicole tout-en-un' },
        {
          name: 'twitter:description',
          content:
            'Le logiciel de gestion apicole tout-en-un : ruches, interventions, conformité et facturation. Essai gratuit.',
        },
        { name: 'twitter:image', content: 'https://www.apigo.fr/og-image.jpg' },
        { name: 'theme-color', content: '#F5A623' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.json' },
        // Apple touch icons : Safari iOS preferentiellement le 180x180
        // (cf. public/apple-touch-icon*.png — 9 variantes presentes)
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-180x180.png' },
        { rel: 'apple-touch-icon', sizes: '167x167', href: '/apple-touch-icon-167x167.png' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: '/apple-touch-icon-152x152.png' },
        { rel: 'apple-touch-icon', sizes: '120x120', href: '/apple-touch-icon-120x120.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://supabase.co', crossorigin: '' },
        { rel: 'dns-prefetch', href: 'https://api.open-meteo.com' },
        { rel: 'dns-prefetch', href: 'https://tile.openstreetmap.org' },
        { rel: 'dns-prefetch', href: 'https://js.stripe.com' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' },
  },

  // CSS
  css: ['~/assets/css/main.css'],

  // TypeScript strict (typeCheck done via `npm run typecheck`, not during build)
  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Nitro server config
  nitro: {
    preset: 'vercel',
    prerender: {
      // Ne pas bloquer le build si une page prérendue échoue (ex: Supabase non dispo au build)
      // Les pages tombent en SSR classique à la place
      failOnError: false,
    },
    vercel: {
      functions: {
        // Le pooler Supabase (offre gratuite) peut mettre quelques secondes à
        // « réveiller » la base après inactivité : les premières requêtes
        // ralentissent et les endpoints lourds (admin/analytics, dashboard)
        // dépassaient le timeout par défaut (10 s) → 504. 30 s laisse la base
        // se réveiller et la requête aboutir au lieu d'échouer.
        maxDuration: 30,
      },
    },
  },

  // PWA + Service Worker
  pwa: {
    // 'prompt' (et non 'autoUpdate') : en autoUpdate, vite-plugin-pwa exécute
    // window.location.reload() dans TOUS les onglets dès qu'un nouveau SW
    // s'active — après chaque déploiement, le site se rechargeait en pleine
    // utilisation. En prompt, le SW attend ; le plugin pwa-silent-update
    // l'active alors EN SILENCE (skipWaiting + clientsClaim, sans reload) :
    // le cache hors-ligne se met à jour en arrière-plan, et comme les pages
    // HTML sont servies en NetworkFirst, une connexion en ligne charge
    // toujours la dernière version sans aucune intervention de l'utilisateur.
    registerType: 'prompt',
    manifest: false, // on utilise public/manifest.json statique
    workbox: {
      // Le nouveau SW prend le contrôle des onglets ouverts dès son activation
      // (sans reload) → le cache hors-ligne reflète la dernière version
      // déployée pour la prochaine navigation / réouverture.
      clientsClaim: true,
      // Handlers Web Push (push + notificationclick) injectés dans le SW généré
      importScripts: ['/push-sw.js'],
      // Précacher uniquement les assets statiques (JS, CSS, fonts, images)
      // Les pages HTML sont servies depuis le CDN Vercel — pas de précache HTML
      // pour éviter les mismatches de contenu après déploiement
      globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
      // Désactiver explicitement le navigateFallback :
      // @vite-pwa/nuxt détecte les routes prérendues (ex: '/') et injecte automatiquement
      // createHandlerBoundToURL('/') — mais '/' n'est pas dans le precache (pas de HTML).
      // Sans cette ligne, la console affiche "non-precached-url" et le SW plante en offline.
      // Les navigations sont gérées par les runtimeCaching NetworkFirst ci-dessous.
      navigateFallback: null,
      // Runtime caching
      runtimeCaching: [
        // Pages auth + landing — NetworkFirst (prérendues, stables, nécessaires au démarrage)
        {
          urlPattern: /^https?:\/\/[^/]+(:\d+)?\/(login|register|reset-password|confirm|offline)?$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'auth-pages',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
            networkTimeoutSeconds: 10,
          },
        },
        // Pages app (HTML) — NetworkFirst : met en cache à la première visite, sert offline ensuite
        {
          urlPattern:
            /^https?:\/\/[^/]+(:\d+)?\/(dashboard|ruchers|ruches|interventions|production|stocks|finances|clients|calendrier|meteo|parametres|exports|admin|activer-essai|guide|transhumance|onboarding|bons-livraison)(\/|$)/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-html',
            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 jours
            networkTimeoutSeconds: 8, // 8s — réduit pour éviter faux timeouts → navigateFallback → offline loop
          },
        },
        // API données (ruchers, ruches, stocks, interventions, dashboard, profils) — NetworkFirst 24h
        {
          urlPattern: /^\/api\/(ruchers|ruches|stocks|interventions|dashboard|profils)/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 24h
            networkTimeoutSeconds: 3,
          },
        },
        // Toutes les autres routes API — NetworkOnly (mutations, auth, stripe…)
        {
          urlPattern: /^\/api\//,
          handler: 'NetworkOnly',
        },
      ],
    },
    client: {
      installPrompt: false, // on gere avec PwaInstallPrompt.vue
    },
    devOptions: {
      enabled: false, // pas de SW en dev (cause des problemes HMR)
    },
  },

  // Fonts — disable external providers (we use system fonts: SF Pro / -apple-system)
  fonts: {
    providers: {
      bunny: false,
      google: false,
    },
  },

  // Tailwind via Nuxt UI v3 (uses @nuxt/ui built-in Tailwind)
  colorMode: {
    preference: 'light',
    fallback: 'light',
  },

  // Disable app manifest (known Nuxt 3.21.x dev error with #app-manifest)
  experimental: {
    appManifest: false,
  },

  // Route rules — prerender, SWR, CDN caching
  routeRules: {
    // Reverse-proxy PostHog en first-party — contourne les ad-blockers (uBlock,
    // Brave…) qui bloquent *.posthog.com. Aucun changement DNS : tout passe par
    // le domaine courant via Nitro. Les assets (/static, /array) vont sur le CDN
    // assets, le reste (/e, /flags…) sur l'ingestion. Voir api_host dans
    // app/plugins/posthog.client.ts.
    '/relay-h7q/static/**': { proxy: 'https://eu-assets.i.posthog.com/static/**' },
    '/relay-h7q/**': { proxy: 'https://eu.i.posthog.com/**' },

    // Prerender static pages (zero cold start)
    '/': { prerender: true },
    '/login': { prerender: true },
    '/register': { prerender: true },
    '/reset-password': { prerender: true },
    '/mentions-legales': { prerender: true },
    '/politique-confidentialite': { prerender: true },
    '/cgu': { prerender: true },
    '/tarifs': { prerender: true },
    '/offline': { prerender: true },

    // Service Worker — jamais en cache HTTP (iOS Safari cache agressivement sw.js sinon,
    // empêchant la détection des mises à jour et causant des boucles offline)
    '/sw.js': { headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' } },

    // Public API with SWR cache (calendrier only — meteo uses requireAuth)
    '/api/calendrier/*.ics': { swr: 3600 },

    // Private API — no CDN cache
    '/api/ruchers/**': {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    },
    '/api/ruches/**': {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    },
    '/api/stocks/**': {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    },
    '/api/interventions/**': {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    },

    // Météo — données per-user authentifiées, jamais de cache global
    '/api/meteo/**': { headers: { 'Cache-Control': 'private, no-store' } },

    // Dashboard — jamais de cache (données per-user authentifiées)
    '/api/dashboard/**': { headers: { 'Cache-Control': 'private, no-store' } },

    // Analytics — jamais de cache (données per-user authentifiées)
    '/api/analytics/**': { headers: { 'Cache-Control': 'private, no-store' } },

    // Suggestions — changent par saison (1h)
    '/api/suggestions': { swr: 3600 },

    // Payload size limit for all API routes
    '/api/**': {
      headers: { 'X-Content-Length-Limit': '1mb' },
    },
  },

  // Vue specific config
  vue: {
    propsDestructure: true,
  },

  // Pinia auto-imports
  pinia: {
    storesDirs: ['./app/stores/**'],
  },
});
