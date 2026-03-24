# 🐝 APICULTURE 360° — PROMPT PRÉ-BETA 2/3 : Sécurité Express + Performance

> **Priorité** : 🔴 BLOQUANT — On prend de l'argent via Stripe, il faut sécuriser
> **Estimation** : 2-3 jours
> **Pré-requis** : Sprint Plans intégré

---

## POURQUOI MAINTENANT

L'app va prendre des paiements Stripe et stocker des données personnelles (nom, adresse, SIRET, NAPI, géolocalisation des ruchers). Avant de mettre ça entre les mains de vrais utilisateurs, il faut un passage sécurité express (pas un audit complet de 2 semaines — juste les failles critiques) et un passage performance (l'app doit être rapide sur un téléphone 4G au rucher).

---

## PARTIE A — SÉCURITÉ EXPRESS (10 vérifications)

### A.1 — Routes mutation sans auth

```bash
# Trouver TOUTE route POST/PUT/DELETE qui n'appelle PAS requireAuth
for f in $(find server/api -name "*.post.ts" -o -name "*.put.ts" -o -name "*.delete.ts" | grep -v node_modules); do
  if ! grep -q "requireAuth" "$f" && ! grep -q "webhook" "$f" && ! grep -q "cron" "$f" && ! grep -q "/public/" "$f"; then
    echo "⚠️  SANS AUTH: $f"
  fi
done
```

**Action** : Chaque résultat doit soit avoir `requireAuth()` ajouté, soit être justifié (webhook Stripe, cron Vercel, route publique campagne).

### A.2 — Body non validé par Zod

```bash
# Trouver readBody() utilisé SANS Zod
grep -rn "readBody(" server/api/ --include="*.ts" | grep -v "readValidatedBody" | grep -v node_modules
# Aussi vérifier getQuery sans validation
grep -rn "getQuery(" server/api/ --include="*.ts" | grep -v "getValidatedQuery" | grep -v node_modules
```

**Action** : Remplacer chaque `readBody()` par `readValidatedBody(event, schema.parse)` ou au minimum `readBody()` + `safeParse()` comme fait dans `bulk.post.ts`.

### A.3 — RLS activé sur TOUTES les tables

```sql
-- Exécuter dans Supabase SQL Editor
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Action** : Chaque table doit avoir `rowsecurity = true`. Si une table est à `false` :

```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own" ON [table] FOR ALL USING (user_id = auth.uid());
```

### A.4 — IDOR (accès aux données d'un autre user)

L'audit Session 13 a patché 13 IDOR. Vérifier qu'il n'en reste pas sur les nouvelles routes Phase 3 :

```bash
# Toutes les routes qui font un SELECT/UPDATE/DELETE par ID sans vérifier userId
grep -rn "eq(.*\.id," server/api/ --include="*.ts" | grep -v "userId" | grep -v "user.id"
```

**Pattern correct** (double condition) :

```typescript
const [item] = await db
  .select()
  .from(table)
  .where(and(eq(table.id, id), eq(table.userId, user.id)));
if (!item) throw notFound('Resource');
```

**Pattern DANGER** (pas de check user) :

```typescript
const [item] = await db.select().from(table).where(eq(table.id, id)); // ← N'IMPORTE QUI peut accéder
```

### A.5 — Secrets dans le code source

```bash
# Vérifier qu'aucun secret n'est hardcodé
grep -rn "sk_live\|sk_test\|eyJ\|whsec_\|xkeysib\|password.*=" . \
  --include="*.ts" --include="*.vue" --include="*.js" \
  | grep -v node_modules | grep -v ".env" | grep -v ".git"
```

**Action** : Zéro résultat attendu. Si un secret apparaît, le déplacer dans `.env`.

### A.6 — XSS via v-html

```bash
grep -rn "v-html" app/ --include="*.vue" | grep -v node_modules
```

**Action** : Si `v-html` est utilisé avec des données utilisateur (notes, commentaires, noms) → remplacer par `{{ }}` (échappement auto Vue). `v-html` n'est acceptable que pour du contenu statique maîtrisé.

### A.7 — Content Security Policy

Vérifier dans `server/middleware/02.security-headers.ts` que le CSP est présent et couvre :

- `default-src 'self'`
- `script-src` avec Stripe JS
- `connect-src` avec Supabase + Open-Meteo + api-adresse
- `worker-src blob:` (ECharts workers)
- `frame-src` avec Stripe checkout

### A.8 — Webhook Stripe signature

Vérifier que `server/api/stripe/webhook.post.ts` :

1. Lit le raw body (pas le parsed body)
2. Vérifie la signature avec `stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)`
3. Rejette 400 si la signature est invalide
4. N'appelle PAS `requireAuth()`

### A.9 — Rate limiting sur les routes sensibles

Vérifier dans `server/middleware/03.rate-limit.ts` :

- `/api/auth/login` : 5 req / 15 min
- `/api/auth/register` : 3 req / heure
- `/api/auth/reset-password` : 3 req / heure (AJOUTER SI MANQUANT)
- `/api/stripe/webhook` : 100 req / min (Stripe rafale)

### A.10 — runtimeConfig — Rien de secret côté public

```typescript
// Vérifier nuxt.config.ts → runtimeConfig.public
// SEULES ces valeurs sont acceptables côté public :
// - supabaseUrl
// - supabaseKey (anon key, PAS service_role)
// TOUT LE RESTE doit être dans runtimeConfig (privé serveur)
```

### Fichier de résultats

Créer `docs/AUDIT_SECURITE_PREBETA.md` :

```markdown
# Audit Sécurité Pré-Beta — [DATE]

## Résumé : X/10 vérifications OK

| #   | Vérification     | Résultat | Action |
| --- | ---------------- | -------- | ------ |
| A.1 | Routes sans auth | ✅/❌    | ...    |
| A.2 | Body non validé  | ✅/❌    | ...    |

...
```

---

## PARTIE B — PERFORMANCE

### B.1 — ECharts import sélectif

**Problème** : `import * as echarts from 'echarts'` charge ~1 MB. On n'utilise que line, bar, pie.

**Rechercher** :

```bash
grep -rn "from 'echarts'" app/ --include="*.ts" --include="*.vue"
```

**Remplacer chaque occurrence par** :

```typescript
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  CanvasRenderer,
]);
```

**Fichiers concernés** (probablement) :

- `app/components/dashboard/ProductionChart.vue`
- `app/components/dashboard/SanteScore.vue`
- `app/components/finances/RevenueChart.vue`
- `app/components/production/ProductionChart.vue`
- `app/pages/analytics/index.vue`

**Astuce** : Créer un fichier `app/utils/echarts.ts` qui fait l'import sélectif + `echarts.use()` une seule fois, et que tous les composants importent depuis ce fichier.

```typescript
// app/utils/echarts.ts
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  CanvasRenderer,
]);

export { echarts };
export type { ECharts, EChartsOption } from 'echarts/core';
```

Puis dans les composants :

```typescript
import { echarts } from '~/utils/echarts';
```

### B.2 — Leaflet lazy load

**Problème** : Leaflet (~150 KB) est chargé même sur les pages sans carte.

**Solution** : Lazy import du composant RucherMap.

```typescript
// Dans les pages qui utilisent la carte :
const RucherMap = defineAsyncComponent(() => import('~/components/ruchers/RucherMap.vue'));
```

OU renommer le fichier pour que Nuxt le lazy-load automatiquement :

```
components/ruchers/RucherMap.vue → components/ruchers/LazyRucherMap.vue
```

Puis utiliser `<LazyRucherMap>` dans les templates.

### B.3 — Prerender pages statiques

```typescript
// nuxt.config.ts — routeRules
routeRules: {
  '/': { prerender: true },
  '/login': { prerender: true },
  '/register': { prerender: true },
  '/reset-password': { prerender: true },
  '/mentions-legales': { prerender: true },
  '/politique-confidentialite': { prerender: true },
  '/cgu': { prerender: true },
  '/tarifs': { prerender: true },
}
```

### B.4 — Cache API intelligent

```typescript
// nuxt.config.ts — routeRules API
routeRules: {
  // Météo : change peu souvent
  '/api/meteo/**': { swr: 1800 },           // 30 min

  // Dashboard : données agrégées, refresh fréquent mais cachable
  '/api/dashboard/**': { swr: 120 },         // 2 min

  // Analytics : calculs lourds, cachable plus longtemps
  '/api/analytics/**': { swr: 300 },         // 5 min

  // Suggestions : changent par saison
  '/api/suggestions': { swr: 3600 },         // 1h

  // Données user : jamais cacher côté Vercel (le cache Nuxt client suffit)
  '/api/ruchers/**': { headers: { 'cache-control': 'private, no-cache' } },
  '/api/ruches/**': { headers: { 'cache-control': 'private, no-cache' } },
  '/api/interventions/**': { headers: { 'cache-control': 'private, no-cache' } },
}
```

### B.5 — Preconnect domaines externes

```typescript
// nuxt.config.ts
app: {
  head: {
    link: [
      { rel: 'preconnect', href: 'https://[ton-projet].supabase.co' },
      { rel: 'dns-prefetch', href: 'https://api.open-meteo.com' },
      { rel: 'dns-prefetch', href: 'https://tile.openstreetmap.org' },
      { rel: 'dns-prefetch', href: 'https://js.stripe.com' },
    ],
  },
},
```

### B.6 — Compression photos avant upload

Si des photos sont uploadées dans Supabase Storage (interventions, logo), compresser côté client :

```bash
npm install browser-image-compression
```

```typescript
// app/utils/image-compress.ts
import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 0.5, // 500 KB max
    maxWidthOrHeight: 1920, // Full HD max
    useWebWorker: true,
  });
}
```

Intégrer dans tous les composants d'upload de photos.

### B.7 — Analyse du bundle

```bash
# Lancer l'analyse
NUXT_ANALYZE=true npm run build

# Objectifs :
# - First Load JS : < 300 KB gzipped
# - Pas de dépendance dupliquée dans le bundle
# - ECharts : ~200 KB (après import sélectif) au lieu de ~1 MB
# - Leaflet : 0 KB sur les pages sans carte (après lazy load)
```

Documenter les résultats dans `docs/PERF_PREBETA.md`.

### B.8 — Lighthouse

```bash
# Après déploiement, mesurer avec Lighthouse (Chrome DevTools)
# Ou via : npx lighthouse https://apisaas-360.vercel.app/ --output json

# Cibles :
# Performance : > 85
# Accessibility : > 90
# Best Practices : > 90
# SEO : > 90 (après landing page)
```

---

## CHECKLIST

### Sécurité

- [ ] Vérification A.1 (routes sans auth) → fix si nécessaire
- [ ] Vérification A.2 (body non validé) → fix si nécessaire
- [ ] Vérification A.3 (RLS toutes tables) → fix si nécessaire
- [ ] Vérification A.4 (IDOR restants) → fix si nécessaire
- [ ] Vérification A.5 (secrets dans code) → fix si nécessaire
- [ ] Vérification A.6 (v-html XSS) → fix si nécessaire
- [ ] Vérification A.7 (CSP headers)
- [ ] Vérification A.8 (Stripe webhook signature)
- [ ] Vérification A.9 (rate limiting routes sensibles)
- [ ] Vérification A.10 (runtimeConfig public)
- [ ] Créer `docs/AUDIT_SECURITE_PREBETA.md`

### Performance

- [ ] Créer `app/utils/echarts.ts` (import sélectif centralisé)
- [ ] Remplacer `import * as echarts from 'echarts'` dans tous les composants
- [ ] Lazy load Leaflet (defineAsyncComponent ou Lazy prefix)
- [ ] Prerender pages statiques (routeRules)
- [ ] Cache API routeRules (météo, dashboard, analytics)
- [ ] Preconnect/dns-prefetch domaines externes
- [ ] Installer browser-image-compression + intégrer
- [ ] `NUXT_ANALYZE=true npm run build` → documenter
- [ ] Lighthouse → documenter dans `docs/PERF_PREBETA.md`
- [ ] `npm run typecheck` → 0 erreurs
- [ ] `npm run build` → PASS
