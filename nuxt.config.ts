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
    brevoApiKey: '',
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
      ],
      exclude: ['/', '/register', '/reset-password'],
      cookieRedirect: false,
    },
  },

  // Page & layout transitions
  app: {
    head: {
      title: 'Apiculture 360° — Gestion apicole tout-en-un',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Plateforme SaaS française de gestion apicole. Du rucher à la comptabilité.',
        },
        { name: 'theme-color', content: '#F5A623' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
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

  // Route rules — redirects + CDN caching pour les pages sans données perso
  routeRules: {
    // Pages statiques : HTML mis en cache 5 min côté CDN Vercel
    '/login': { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
    '/register': { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
    '/reset-password': { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
    // API : cache navigateur privé (pas CDN) pour les GET non-mutants
    '/api/ruchers': {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    },
    '/api/ruches': {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    },
    '/api/stocks': {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    },
    '/api/dashboard': {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
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
