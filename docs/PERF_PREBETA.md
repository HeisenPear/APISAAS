# Performance Pré-Beta — 24 mars 2026

## Actions réalisées

### B.1 — ECharts import sélectif centralisé ✅

Création de `app/utils/echarts.ts` — import unique `echarts/core` avec registration de tous les composants nécessaires. Tous les composants importent maintenant depuis ce fichier unique.

**Fichiers mis à jour :**

- `app/components/dashboard/SanteChart.vue`
- `app/components/dashboard/ProductionChart.vue`
- `app/components/finances/RevenueChart.vue`
- `app/pages/analytics/index.vue`

**Gain estimé :** ECharts full bundle ~1 MB → ~200 KB gzipped avec import sélectif.

### B.2 — Leaflet lazy load ✅

Remplacement de `<RuchersRucherMap>` par `<LazyRuchersRucherMap>` dans :

- `app/pages/ruchers/index.vue`
- `app/pages/ruchers/[id].vue`

Nuxt charge Leaflet (~150 KB) uniquement quand les pages ruchers sont visitées.

### B.3 — Prerender pages statiques ✅

Ajout de `/tarifs` dans `routeRules` prerender. Pages statiques prérendues :

- `/`, `/login`, `/register`, `/reset-password`
- `/mentions-legales`, `/politique-confidentialite`, `/cgu`, `/tarifs`

### B.4 — Cache API intelligent ✅

```typescript
'/api/meteo/**': { swr: 1800 },      // 30 min
'/api/dashboard/**': { swr: 120 },   // 2 min
'/api/analytics/**': { swr: 300 },   // 5 min
'/api/suggestions': { swr: 3600 },   // 1h
```

### B.5 — dns-prefetch Stripe ✅

Ajout de `{ rel: 'dns-prefetch', href: 'https://js.stripe.com' }` dans `nuxt.config.ts`.

### B.6 — browser-image-compression ✅

- Package installé : `browser-image-compression@2.0.2`
- Utilitaire créé : `app/utils/image-compress.ts`
- À intégrer dans les futurs composants d'upload photo (module photos Sprint 9)

### B.7 — Analyse bundle

À lancer manuellement :

```bash
NUXT_ANALYZE=true npm run build
```

Objectifs : First Load JS < 300 KB gzipped, ECharts ~200 KB (sélectif), Leaflet 0 KB hors pages ruchers.

### B.8 — Lighthouse

À mesurer après déploiement sur https://apisaas-360.vercel.app/
Cibles : Performance > 85, Accessibility > 90, Best Practices > 90, SEO > 90.
