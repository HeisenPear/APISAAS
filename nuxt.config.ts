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
      ],
      exclude: ['/', '/register', '/reset-password'],
      cookieRedirect: false,
    },
  },

  // Page & layout transitions
  app: {
    head: {
      title: 'APIGO — Logiciel de gestion apicole tout-en-un',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
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
      // SSR : ne precacher que les assets statiques (pas html — les pages sont rendues server-side)
      globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
      // Désactiver explicitement le navigateFallback (auto-généré par vite-plugin-pwa sinon)
      navigateFallback: null,
      // Runtime caching pour les API GET
      runtimeCaching: [
        {
          urlPattern: /^\/api\/(ruchers|ruches|stocks|interventions|dashboard|profils)/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 24h
            networkTimeoutSeconds: 3,
          },
        },
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

    // Météo — change peu souvent (30 min)
    '/api/meteo/**': { swr: 1800 },

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
