// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

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
    // Admin whitelist (NUXT_ADMIN_EMAILS=email1,email2)
    adminEmails: '',
    cronSecret: '',
    // Public
    public: {
      baseUrl: 'http://localhost:3000',
      supabaseUrl: '',
      supabaseKey: '',
      sentryDsn: '',
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
    // Persiste la session 30 jours — couvre largement le refresh token Supabase (7j)
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },

  // Page & layout transitions
  app: {
    head: {
      title: 'APIGO — Logiciel de gestion apicole tout-en-un',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover',
        },
        {
          name: 'description',
          content:
            'Gérez vos ruches, interventions, production et comptabilité dans un seul outil. Mode hors-ligne, facturation conforme, analytics intelligents. Essai gratuit 14 jours.',
        },
        {
          name: 'keywords',
          content:
            'logiciel apiculture, gestion rucher, suivi ruches, registre élevage apicole, facturation apiculteur, comptabilité apicole, SaaS apiculture',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'fr_FR' },
        { property: 'og:title', content: 'APIGO — Logiciel de gestion apicole' },
        {
          property: 'og:description',
          content:
            "Du rucher à la comptabilité. 14 types d'interventions, analytics, facturation conforme. Essai gratuit.",
        },
        { property: 'og:image', content: '/og-image.jpg' },
        { name: 'theme-color', content: '#F5A623' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      script: [
        {
          src: 'https://plausible.io/js/script.js',
          defer: true,
          'data-domain': 'apigo.fr',
        },
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
  },

  // PWA + Service Worker
  pwa: {
    registerType: 'autoUpdate',
    manifest: false, // on utilise public/manifest.json statique
    workbox: {
      // Précacher uniquement les assets statiques (JS, CSS, fonts, images)
      // Les pages HTML sont servies depuis le CDN Vercel — pas de précache HTML
      // pour éviter les mismatches de contenu après déploiement
      globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
      // Pas de navigateFallback : quand le réseau échoue sur une page non cachée,
      // le navigateur affiche sa propre erreur (pas de boucle offline → crash iOS).
      // Les pages déjà visitées restent servies depuis le cache NetworkFirst.
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
