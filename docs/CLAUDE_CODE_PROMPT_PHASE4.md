# 🐝 APICULTURE 360° — PROMPT CLAUDE CODE PHASE 4

> **Version** : 1.0 — Mars 2026
> **Suite de** : Phase 1 (Sprints 1-12) + Phase 2 (Interventions, Stripe, Multi-users) + Phase 3 (Reine, Capacitor, Intelligence, Beekube parité)
> **Auteur** : Antoine — La Jocondienne
> **Objectif** : Audit cybersécurité complet, optimisations performance, et intégration des modules communautaires/associatifs pour dépasser Beekube

---

## 📋 TABLE DES MATIÈRES

1. [Contexte et état actuel](#1-contexte-et-état-actuel)
2. [Objectifs Phase 4 — 3 chantiers](#2-objectifs-phase-4--3-chantiers)
3. [CHANTIER A — Audit cybersécurité & hardening](#3-chantier-a--audit-cybersécurité--hardening)
4. [CHANTIER B — Optimisations performance](#4-chantier-b--optimisations-performance)
5. [CHANTIER C — Modules communautaires & associatifs](#5-chantier-c--modules-communautaires--associatifs)
6. [Conventions du projet — Rappel](#6-conventions-du-projet--rappel)
7. [Checklist d'implémentation](#7-checklist-dimplémentation)
8. [Tests et validation](#8-tests-et-validation)

---

## 1. CONTEXTE ET ÉTAT ACTUEL

### Stack complète après Phase 3

| Couche      | Technologie                                          |
| ----------- | ---------------------------------------------------- |
| Full-stack  | Nuxt 3 (Vue 3 + Nitro)                               |
| DB          | Supabase PostgreSQL 16 + Drizzle ORM (30+ tables)    |
| Auth        | Supabase Auth (email/password, magic link)           |
| Paiements   | Stripe (checkout, webhooks, portal, middleware plan) |
| UI          | Nuxt UI v3 + design system Warm Precision            |
| Charts      | Apache ECharts                                       |
| Carte       | Leaflet + OpenStreetMap                              |
| QR          | qrcode library                                       |
| PWA         | Workbox + IndexedDB offline                          |
| Mobile      | Capacitor iOS + Android                              |
| Exports     | window.print PDF + exceljs XLSX + CSV/FEC            |
| Calendrier  | Flux iCal RFC 5545                                   |
| Déploiement | Vercel serverless cdg1                               |

### Tables DB (30+)

`profils`, `ruchers`, `ruches`, `interventions`, `recoltes`, `stocks`, `mouvements_stock`, `clients`, `transactions`, `alertes`, `membres`, `pesees`, `comptages_varroa`, `traitements_varroa`, `mouvements_materiel`, `deplacements_ruches`, `divisions`, `divisions_ruches`, `essaimages`, `empilements`, `evenements_sanitaires`, `transvasements`, `evenements_reine`, `templates_intervention`, `tokens_calendrier`

### Modules complétés (Phases 1-3)

Auth, Dashboard analytique, Ruchers, Ruches (QR + couleurs), 14 sous-catégories intervention (incluant Reine), Interventions groupées, Templates intervention, Production + traçabilité, Stocks + TVA auto (20 catégories), Finances + facturation PDF conforme, Alertes, Météo, Calendrier + sync iCal, Paramètres + logo, PWA offline, Capacitor iOS/Android, Score prédictif, Analytics rentabilité/prévisionnel, Suggestions saisonnières, Export XLSX, Multi-users, Stripe complet

### Nouvelles features Beekube à contrer

Beekube vient d'annoncer en plus de leur Premium :

| Feature Beekube                                                                                                     |            Notre statut             |
| ------------------------------------------------------------------------------------------------------------------- | :---------------------------------: |
| Générateur de hausses par lots + QR codes (compatible plaquettes Le Besson)                                         |             ❌ À créer              |
| Module Commande Groupée pour associations (campagnes, catalogue, panier, invités, QR papier, Stripe+HelloAsso, CGV) |             ❌ À créer              |
| Dashboard communautaire (activité membres, stats collectives, cartes densité, tendances récolte)                    |             ❌ À créer              |
| Photos d'interventions                                                                                              |   ✅ On a déjà (Supabase Storage)   |
| Sync Google Agenda                                                                                                  | ✅ On a mieux (flux iCal universel) |
| Export XLSX                                                                                                         |               ✅ Fait               |
| Couleurs ruches                                                                                                     |               ✅ Fait               |
| Logo exploitation                                                                                                   |               ✅ Fait               |

---

## 2. OBJECTIFS PHASE 4 — 3 CHANTIERS

| #     | Chantier                             | Priorité    | Résumé                                                                                                          |
| ----- | ------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------- |
| **A** | Cybersécurité & hardening            | 🔴 Critique | Audit complet OWASP, pentest API, RLS validation, RGPD, rate limiting, XSS/CSRF/injection, headers, dépendances |
| **B** | Optimisations performance            | 🟡 Haute    | Build size, cold start Vercel, lazy loading, cache stratégique, DB queries, bundle analysis, Core Web Vitals    |
| **C** | Modules communautaires & associatifs | 🔴 Critique | Générateur hausses QR, Commandes groupées associations, Dashboard communautaire                                 |

---

## 3. CHANTIER A — AUDIT CYBERSÉCURITÉ & HARDENING

### Méthodologie

Audit structuré en 10 axes basé sur l'OWASP Top 10 2021, adapté au stack Nuxt 3 + Supabase + Vercel.

### A.1 — Authentification & gestion de sessions

#### Tests à effectuer

```typescript
// 1. BRUTE FORCE LOGIN
// Vérifier que le rate limiting est effectif sur /api/auth/login
// Attendu : 5 req/15min/IP (configuré dans middleware/03.rate-limit.ts)
// Test : envoyer 10 requêtes login en boucle avec mauvais password
// Résultat attendu : 429 Too Many Requests après la 5ème

// 2. REGISTER ABUSE
// Vérifier rate limit sur /api/auth/register
// Attendu : 3 req/heure/IP
// Test : envoyer 5 requêtes register en boucle
// Résultat attendu : 429 après la 3ème

// 3. SESSION FIXATION
// Vérifier que le token Supabase Auth est renouvelé après login
// Vérifier que le token est invalidé après logout
// Vérifier que serverSupabaseUser() ne retourne pas un user après logout

// 4. JWT VALIDATION
// Vérifier que les tokens expirés sont rejetés (401)
// Vérifier que les tokens forgés sont rejetés
// Vérifier que les tokens d'un autre projet Supabase sont rejetés

// 5. PASSWORD POLICY
// Vérifier la longueur minimale (Supabase default = 6, recommandé = 8)
// Configurer dans Supabase Dashboard > Auth > Settings
```

#### Actions de hardening

```typescript
// server/middleware/03.rate-limit.ts — VÉRIFIER ET RENFORCER

// Limites actuelles :
const RATE_LIMITS = {
  '/api/auth/login': { max: 5, window: 15 * 60 * 1000 }, // 5/15min
  '/api/auth/register': { max: 3, window: 60 * 60 * 1000 }, // 3/h
  '/api/auth/reset-password': { max: 3, window: 60 * 60 * 1000 }, // 3/h — AJOUTER SI MANQUANT
  '/api/stripe/webhook': { max: 100, window: 60 * 1000 }, // Stripe peut envoyer des rafales
  default: { max: 100, window: 60 * 1000 }, // 100/min général
};

// ⚠️ PROBLÈME CONNU : rate limiting in-memory = reset à chaque cold start Vercel
// SOLUTION : accepter pour l'anti-abuse basique
// AMÉLIORATION FUTURE : Upstash Redis pour rate limiting persistant
```

### A.2 — Injection SQL & ORM Safety

#### Tests à effectuer

```typescript
// 1. SQL INJECTION VIA QUERY PARAMS
// Tester sur tous les endpoints avec paramètre `search` :
// GET /api/ruchers?search=' OR 1=1 --
// GET /api/ruches?search='; DROP TABLE ruches; --
// GET /api/clients?search=<script>alert(1)</script>
// Résultat attendu : Drizzle ORM paramétrise TOUT → pas d'injection possible

// 2. SQL INJECTION VIA BODY
// POST /api/interventions/bulk avec rucheId = "'; DROP TABLE ruches;--"
// Résultat attendu : Zod valide z.string().uuid() → rejeté 400

// 3. RAW SQL AUDIT
// Rechercher TOUS les usages de sql`` (template literal Drizzle)
// dans le codebase serveur. Vérifier que CHAQUE valeur interpolée
// est un paramètre Drizzle, jamais une concaténation string directe.
// Pattern SAFE :  sql`count(*)`  sql`${table.column} + ${value}`
// Pattern DANGER : sql`SELECT * FROM ${tableName}` (si tableName vient du client)

// Commande d'audit :
// grep -rn "sql\`" server/ --include="*.ts" | grep -v node_modules
```

#### Script d'audit automatisé

```bash
#!/bin/bash
# scripts/audit-sql.sh

echo "=== AUDIT SQL INJECTION ==="
echo ""

echo "1. Usages de sql\` raw :"
grep -rn 'sql`' server/ --include="*.ts" | grep -v node_modules | grep -v '.d.ts'

echo ""
echo "2. Usages de .execute() (requêtes raw) :"
grep -rn '\.execute(' server/ --include="*.ts" | grep -v node_modules

echo ""
echo "3. Concaténation de strings dans les requêtes :"
grep -rn "sql\`.*\${" server/ --include="*.ts" | grep -v node_modules

echo ""
echo "4. Usages de ilike/like avec input non sanitizé :"
grep -rn 'ilike\|like(' server/ --include="*.ts" | grep -v node_modules

echo ""
echo "=== Vérifier manuellement chaque occurrence ci-dessus ==="
```

### A.3 — Row Level Security (RLS) — Validation exhaustive

#### Tests à effectuer

```typescript
// POUR CHAQUE TABLE (30+), vérifier :

// 1. RLS ACTIVÉ
// SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
// Toutes les tables doivent avoir rowsecurity = true

// 2. POLICY EXISTS
// SELECT * FROM pg_policies WHERE schemaname = 'public';
// Chaque table doit avoir au moins 1 policy

// 3. CROSS-USER ACCESS
// Avec le token de User A, tenter d'accéder aux données de User B :
// GET /api/ruchers → ne doit retourner QUE les ruchers de User A
// GET /api/ruches/[id_ruche_user_B] → doit retourner 404 (pas 403)
// PUT /api/ruches/[id_ruche_user_B] → doit retourner 404
// DELETE /api/alertes/[id_alerte_user_B] → doit retourner 404

// 4. IDOR (Insecure Direct Object Reference)
// Tester avec des UUIDs devinés ou itérés
// Aucune donnée d'un autre user ne doit être accessible

// 5. MULTI-TENANT (membres)
// Un membre avec rôle 'lecteur' ne doit PAS pouvoir :
// - POST /api/ruches (créer)
// - DELETE /api/interventions/[id] (supprimer)
// - PUT /api/finances/factures/[id] (modifier)
// Un membre avec rôle 'comptable' doit pouvoir accéder aux finances mais PAS aux ruches
```

#### Script SQL d'audit RLS

```sql
-- scripts/audit-rls.sql
-- Exécuter dans Supabase SQL Editor

-- 1. Tables SANS RLS
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;

-- 2. Tables AVEC RLS mais SANS policy
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND p.policyname IS NULL;

-- 3. Toutes les policies existantes
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Vérifier que chaque policy utilise auth.uid()
SELECT tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual NOT LIKE '%auth.uid()%';
-- Si résultats → DANGER : policy sans vérification user
```

### A.4 — XSS (Cross-Site Scripting)

#### Tests à effectuer

```typescript
// 1. STORED XSS — Données persistées
// Tenter d'injecter dans tous les champs texte :
// Nom rucher : <script>alert('XSS')</script>
// Notes intervention : <img onerror="alert(1)" src="x">
// Commentaire : javascript:alert(1)
// Nom client : <svg onload="alert(1)">

// Vue 3 échappe par défaut avec {{ }}
// VÉRIFIER qu'aucun composant n'utilise v-html avec des données utilisateur
// Commande : grep -rn "v-html" app/ --include="*.vue"

// 2. REFLECTED XSS — Paramètres URL
// /ruches?search=<script>alert(1)</script>
// Vérifier que le paramètre est échappé dans le rendu

// 3. DOM XSS
// Vérifier les usages de innerHTML, document.write, eval
// Commande : grep -rn "innerHTML\|document\.write\|eval(" app/ --include="*.ts" --include="*.vue"
```

#### Actions de hardening

```typescript
// server/middleware/02.security-headers.ts — VÉRIFIER

// Headers existants (Session 1) :
// X-Frame-Options: DENY
// X-Content-Type-Options: nosniff
// X-XSS-Protection: 1; mode=block
// Referrer-Policy: strict-origin-when-cross-origin

// AJOUTER SI MANQUANT :
// Content-Security-Policy (CSP)
setResponseHeader(
  event,
  'Content-Security-Policy',
  [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com", // Stripe JS
    "style-src 'self' 'unsafe-inline'", // Nuxt UI inline styles
    "img-src 'self' data: blob: https://*.supabase.co https://tile.openstreetmap.org", // Supabase Storage + Leaflet
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.open-meteo.com https://api-adresse.data.gouv.fr",
    'frame-src https://js.stripe.com https://hooks.stripe.com', // Stripe checkout iframe
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; '),
);

// Permissions-Policy (déjà présent, vérifier) :
setResponseHeader(
  event,
  'Permissions-Policy',
  'camera=(self), microphone=(), geolocation=(self), payment=(self)',
);

// HSTS (prod only, déjà présent, vérifier force) :
setResponseHeader(
  event,
  'Strict-Transport-Security',
  'max-age=63072000; includeSubDomains; preload',
);
```

### A.5 — CSRF (Cross-Site Request Forgery)

```typescript
// Nuxt 3 + Supabase Auth utilise des Bearer tokens dans le header Authorization
// → PAS de cookies de session → CSRF n'est PAS un risque direct

// MAIS vérifier :
// 1. Que le cookie Supabase (sb-*) a les flags SameSite=Lax et HttpOnly
// 2. Que les mutations (POST/PUT/DELETE) vérifient toutes requireAuth()
// 3. Que le webhook Stripe vérifie la signature (pas requireAuth)

// Commande d'audit :
// grep -rn "defineEventHandler" server/api/ --include="*.ts" -l | xargs grep -L "requireAuth\|webhook"
// Si des routes de mutation (post/put/delete) n'appellent pas requireAuth → FAILLE
```

### A.6 — Validation des inputs

```typescript
// POUR CHAQUE ROUTE API, vérifier :

// 1. Body validation avec Zod
// grep -rn "readBody\|readRawBody" server/api/ --include="*.ts" | grep -v "readValidatedBody"
// Si des routes utilisent readBody au lieu de readValidatedBody → FAILLE
// Toutes les mutations DOIVENT utiliser readValidatedBody(event, schema.parse)

// 2. Query validation
// grep -rn "getQuery" server/api/ --include="*.ts" | grep -v "getValidatedQuery"
// Idem

// 3. Param validation (UUIDs)
// Vérifier que event.context.params?.id est validé comme UUID
// avant d'être utilisé dans une requête DB
// Pattern correct : const id = z.string().uuid().parse(event.context.params?.id)

// 4. File upload validation
// Si Supabase Storage est utilisé pour photos :
// - Vérifier le type MIME (image/jpeg, image/png uniquement)
// - Vérifier la taille max (ex: 5 MB)
// - Ne PAS faire confiance au Content-Type du client
// - Renommer le fichier avec un UUID (pas le nom original)
```

#### Script d'audit validation

```bash
#!/bin/bash
# scripts/audit-validation.sh

echo "=== AUDIT VALIDATION INPUTS ==="

echo "1. Routes avec readBody NON validé (DANGER) :"
grep -rn "readBody(" server/api/ --include="*.ts" | grep -v "readValidatedBody" | grep -v node_modules

echo ""
echo "2. Routes avec getQuery NON validé (DANGER) :"
grep -rn "getQuery(" server/api/ --include="*.ts" | grep -v "getValidatedQuery" | grep -v node_modules

echo ""
echo "3. Params non validés (à vérifier manuellement) :"
grep -rn "params\?\.id\|params\.id" server/api/ --include="*.ts" | grep -v node_modules

echo ""
echo "4. Routes mutation sans requireAuth (CRITIQUE) :"
for f in $(find server/api -name "*.post.ts" -o -name "*.put.ts" -o -name "*.delete.ts" | grep -v node_modules); do
  if ! grep -q "requireAuth" "$f" && ! grep -q "webhook" "$f"; then
    echo "  ⚠️  $f"
  fi
done

echo ""
echo "5. v-html dans les composants (risque XSS) :"
grep -rn "v-html" app/ --include="*.vue"

echo ""
echo "6. innerHTML / eval dans le code (risque XSS/RCE) :"
grep -rn "innerHTML\|\.write(\|eval(" app/ --include="*.ts" --include="*.vue" | grep -v node_modules
```

### A.7 — Secrets & configuration

```typescript
// 1. VÉRIFIER qu'aucun secret n'est dans le code source
// grep -rn "sk_live\|sk_test\|eyJ\|supabase\|whsec_\|xkeysib" . --include="*.ts" --include="*.vue" | grep -v node_modules | grep -v .env
// Résultat attendu : AUCUN résultat

// 2. VÉRIFIER .gitignore
// .env, .env.local, .env.*.local doivent être ignorés
// node_modules/, .nuxt/, .output/ doivent être ignorés

// 3. VÉRIFIER les runtimeConfig exposées au client
// Dans nuxt.config.ts, seules les valeurs dans runtimeConfig.public
// sont envoyées au navigateur. Vérifier que :
// - STRIPE_SECRET_KEY n'est PAS dans public
// - SUPABASE_SERVICE_KEY n'est PAS dans public
// - DATABASE_URL n'est PAS dans public
// - Seuls SUPABASE_URL et SUPABASE_KEY (anon) sont dans public

// 4. VÉRIFIER les headers de réponse
// Aucune réponse API ne doit exposer :
// - X-Powered-By (désactivé par défaut dans Nitro)
// - Server version
// - Stack traces en production (Nitro les masque en prod)
```

### A.8 — RGPD & protection des données

```typescript
// 1. DROIT À L'EFFACEMENT (Art. 17)
// L'utilisateur doit pouvoir supprimer son compte et TOUTES ses données
// Vérifier que CASCADE est bien configuré sur user_id FK de chaque table
// Test : supprimer un user → toutes ses ruches, interventions, factures, etc. doivent disparaître

// 2. DROIT À LA PORTABILITÉ (Art. 20)
// L'export RGPD existe dans Paramètres → "Exporter mes données"
// Vérifier qu'il exporte TOUT : profil, ruchers, ruches, interventions, finances, clients

// 3. DONNÉES MINIMALES
// Vérifier que nous ne collectons pas plus de données que nécessaire
// Les champs requis dans l'onboarding sont justifiés (nom, prénom, adresse pour facturation, NAPI pour réglementaire)

// 4. SUPABASE AUTH
// Les mots de passe sont hashés par Supabase (bcrypt)
// Les tokens JWT expirent (1h par défaut, refresh token 1 semaine)
// Vérifier les settings dans Supabase Dashboard > Auth > Settings

// 5. CONSENTEMENT
// Si on ajoute du tracking (Plausible/PostHog), il faut :
// - Bannière cookie/consentement
// - Possibilité de refuser
// - Pas de tracking avant consentement

// 6. POLITIQUE DE CONFIDENTIALITÉ
// Page /politique-confidentialite requise (lien dans footer + Store submissions)
// Mentionner : responsable traitement, données collectées, finalités, durée conservation, droits

// 7. API : NE JAMAIS retourner le mot de passe hashé, ni le service_role key dans les réponses
// Vérifier que les SELECT ne font pas select() sur les colonnes sensibles de profils
```

### A.9 — Dépendances & supply chain

```bash
#!/bin/bash
# scripts/audit-deps.sh

echo "=== AUDIT DÉPENDANCES ==="

echo "1. Vulnérabilités connues (npm audit) :"
npm audit --production

echo ""
echo "2. Packages obsolètes :"
npm outdated

echo ""
echo "3. Licences problématiques :"
npx license-checker --production --failOn "GPL-3.0;AGPL-3.0" || echo "⚠️ Licences restrictives trouvées"

echo ""
echo "4. Packages non utilisés :"
npx depcheck

echo ""
echo "=== Actions recommandées ==="
echo "- npm audit fix pour les vulnérabilités auto-fixables"
echo "- Mettre à jour les packages critiques (nuxt, supabase, stripe)"
echo "- Supprimer les dépendances inutilisées"
```

### A.10 — Tests de charge & DoS

```typescript
// 1. RATE LIMITING EFFECTIF
// Envoyer 200 requêtes en 1 minute sur /api/ruchers
// Résultat attendu : 429 après 100 requêtes

// 2. PAYLOAD SIZE
// Envoyer un body de 10 MB sur POST /api/interventions/bulk
// Résultat attendu : 413 Payload Too Large
// AJOUTER SI MANQUANT dans nuxt.config.ts :
// nitro: { routeRules: { '/api/**': { maxBodySize: '1mb' } } }

// 3. QUERY DEPTH
// Envoyer ?page=1&limit=999999 sur les endpoints paginés
// Résultat attendu : Zod valide .max(100) → 400 Bad Request

// 4. PAGINATION ABUSE
// GET /api/ruchers?page=999999999
// Résultat attendu : retourne une liste vide, pas un crash

// 5. WEBHOOK REPLAY
// Renvoyer un ancien webhook Stripe avec la même signature
// Stripe fournit un timestamp → vérifier que les events trop vieux sont rejetés
```

### A.11 — Fichier de résultat d'audit

Créer `docs/AUDIT_SECURITE.md` avec le résultat de chaque test :

```markdown
# Audit Cybersécurité — Apiculture 360°

Date : [DATE]

## Résumé

- Tests effectués : XX
- ✅ Passés : XX
- ⚠️ Avertissements : XX
- ❌ Échoués : XX

## Détail par axe

### A.1 — Auth & Sessions

| Test             | Résultat | Action |
| ---------------- | -------- | ------ |
| Rate limit login | ✅ / ❌  | ...    |

...
```

---

## 4. CHANTIER B — OPTIMISATIONS PERFORMANCE

### B.1 — Analyse du bundle

```bash
# Analyser la taille du build
NUXT_ANALYZE=true npm run build

# Objectifs :
# - Bundle client < 300 KB gzipped (first load)
# - Pas de dépendance dupliquée
# - ECharts : import sélectif (pas le package entier)
# - Leaflet : lazy load (pas chargé sur les pages sans carte)
```

#### ECharts — Import sélectif

```typescript
// AVANT (probablement dans le code actuel) :
import * as echarts from 'echarts'; // ~1 MB non gzippé

// APRÈS :
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
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
  CanvasRenderer,
]);
// Résultat : ~200 KB au lieu de ~1 MB
```

#### Leaflet — Lazy load

```typescript
// Les pages qui n'ont pas de carte (dashboard, finances, interventions...)
// ne doivent PAS charger Leaflet (~150 KB)

// Utiliser defineAsyncComponent pour les composants carte :
const RucherMap = defineAsyncComponent(() => import('~/components/ruchers/RucherMap.vue'));

// Ou un lazy import Nuxt :
// components/ruchers/RucherMap.vue → components/ruchers/LazyRucherMap.vue
```

### B.2 — Cold start Vercel

```typescript
// nuxt.config.ts — routeRules pour optimiser les cold starts

export default defineNuxtConfig({
  routeRules: {
    // Pages statiques — prerender (0 cold start)
    '/login': { prerender: true },
    '/register': { prerender: true },
    '/reset-password': { prerender: true },
    '/politique-confidentialite': { prerender: true },

    // API publiques — cache CDN
    '/api/meteo/**': { swr: 1800 }, // 30 min
    '/api/calendrier/ics': { swr: 3600 }, // 1h

    // API privées — no cache (données user-specific)
    '/api/ruchers/**': { cache: false },
    '/api/ruches/**': { cache: false },
    '/api/interventions/**': { cache: false },

    // Dashboard — cache court côté serveur
    '/api/dashboard/**': { swr: 120 }, // 2 min

    // Analytics — cache moyen (calculs lourds)
    '/api/analytics/**': { swr: 300 }, // 5 min

    // Suggestions — cache moyen
    '/api/suggestions': { swr: 3600 }, // 1h
  },
});
```

### B.3 — Optimisation requêtes DB

```typescript
// 1. INDEXES MANQUANTS — Vérifier
// Les pages listes font des ORDER BY created_at DESC sur chaque table
// S'assurer que chaque table a un index :
// CREATE INDEX IF NOT EXISTS idx_[table]_user_created ON [table](user_id, created_at DESC);

// 2. N+1 QUERIES
// Vérifier que les pages détail ne font pas N requêtes en boucle
// Utiliser des JOINs ou des sous-requêtes batch
// Exemple : timeline ruche → 1 requête par table enfant (10 requêtes parallèles) plutôt que 1 requête par événement

// 3. COUNT OPTIMIZATION
// Les listes paginées font un COUNT(*) séparé
// Sur les grandes tables, utiliser une estimation si > 10000 rows :
// SELECT reltuples FROM pg_class WHERE relname = 'interventions';

// 4. CONNEXION POOLING
// Déjà configuré (Supabase Transaction Pooler port 6543)
// Vérifier que Drizzle ne crée pas une nouvelle connexion par requête
```

### B.4 — Core Web Vitals

```typescript
// Objectifs :
// LCP (Largest Contentful Paint) : < 2.5s
// FID (First Input Delay) : < 100ms
// CLS (Cumulative Layout Shift) : < 0.1

// Actions :
// 1. Preload les fonts système (SF Pro = déjà sur Apple, Inter comme fallback)
// 2. Skeleton loaders sur les KPI cards (déjà fait)
// 3. Image optimization : <NuxtImg> avec sizes/format si @nuxt/image installé
// 4. Lazy load des composants sous le fold (dashboard widgets en bas)
// 5. Preconnect aux domaines externes :

// nuxt.config.ts :
app: {
  head: {
    link: [
      { rel: 'preconnect', href: 'https://xxx.supabase.co' },
      { rel: 'dns-prefetch', href: 'https://api.open-meteo.com' },
      { rel: 'dns-prefetch', href: 'https://tile.openstreetmap.org' },
    ],
  },
},
```

### B.5 — Compression images & photos

```typescript
// Si photos d'intervention uploadées en Supabase Storage :

// 1. Compression côté client AVANT upload (réduire 5 MB → 200 KB)
// Utiliser browser-image-compression :
import imageCompression from 'browser-image-compression';

async function compressAndUpload(file: File) {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });
  // Upload compressed vers Supabase Storage
}

// 2. Supabase Image Transformation (si activé)
// URL : /storage/v1/object/public/photos/xxx.jpg?width=400&height=300
// Sert des thumbnails sans stocker plusieurs versions

// Package : browser-image-compression
```

---

## 5. CHANTIER C — MODULES COMMUNAUTAIRES & ASSOCIATIFS

> Beekube cible les **associations apicoles** avec le module commande groupée.
> C'est un marché distinct : les syndicats/GDSA/groupements achètent du matériel en gros.
> On doit proposer la même chose, en mieux, intégré dans notre design system.

### C.1 — Générateur de hausses par lots + QR codes

#### Concept

Permettre à un apiculteur de créer N hausses en une opération, chacune avec un QR code unique imprimable. Compatible avec le format des plaquettes Le Besson (standard français pour l'identification du matériel apicole).

#### Table `hausses`

```typescript
export const hausses = pgTable('hausses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id').references(() => ruches.id), // Affectation optionnelle
  numero: text('numero').notNull(), // Numéro unique (auto-généré ou manuel)
  type: text('type').notNull(), // dadant, langstroth, warre, voirnot
  nombreCadres: integer('nombre_cadres').default(10),
  statut: text('statut').default('disponible'), // disponible, en_service, en_stock, hors_service
  anneeAcquisition: integer('annee_acquisition'),
  qrCodeData: text('qr_code_data'), // URL encodée dans le QR
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### API

```
POST   /api/hausses/generer        → Créer N hausses (batch) + générer QR codes
GET    /api/hausses                 → Liste avec filtres (statut, ruche, type)
PUT    /api/hausses/[id]           → Modifier (affecter à ruche, changer statut)
DELETE /api/hausses/[id]           → Supprimer
GET    /api/hausses/[id]/qr        → Télécharger QR code PNG
GET    /api/hausses/export-qr      → Exporter planche de QR codes PDF (format Le Besson)
```

#### Schéma Zod batch

```typescript
const genererHaussesSchema = z.object({
  nombre: z.number().int().min(1).max(100),
  type: z.enum(['dadant_10', 'dadant_12', 'langstroth', 'warre', 'voirnot']),
  nombreCadres: z.number().int().min(1).max(20).default(10),
  prefixeNumero: z.string().max(10).optional(), // ex: "H-2026-" → H-2026-001, H-2026-002
  anneeAcquisition: z.number().int().optional(),
});
```

#### Format QR Le Besson

```typescript
// Le Besson fabrique des plaquettes d'identification 50×30mm
// avec QR code + numéro lisible en dessous
// Format d'export : PDF A4 avec grille de plaquettes

// Données encodées dans le QR :
// URL : https://app.apiculture360.com/hausses/[id]
// Ou format compact : A360:H:[numero]:[type]

// PDF export : grille 4 colonnes × 8 lignes = 32 plaquettes par page A4
// Chaque plaquette : 50mm × 30mm, QR 20×20mm + texte numéro
```

#### UI

- Page `app/pages/hausses/index.vue` : liste cards avec statut coloré, filtre par ruche/type/statut
- Modal de génération batch : input nombre + select type + preview des numéros qui seront créés
- Bouton "Exporter QR codes" → PDF imprimable
- Drag & drop pour affecter hausse → ruche (ou select)

### C.2 — Module Commande Groupée pour associations

#### Concept

Un module complet pour les **responsables d'association apicole** (GDSA, syndicats, CUMA) permettant de gérer des campagnes d'achat groupé pour leurs membres. C'est un sous-module dédié accessible aux plans Pro et Expert.

#### Modèle de données

```typescript
// Table organisations (l'association apicole)
export const organisations = pgTable('organisations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  type: text('type').notNull(), // gdsa, syndicat, cuma, gie, gaec, association, autre
  siret: text('siret'),
  adresse: text('adresse'),
  codePostal: text('code_postal'),
  ville: text('ville'),
  email: text('email'),
  telephone: text('telephone'),
  logoUrl: text('logo_url'),
  cgvUrl: text('cgv_url'),
  stripeAccountId: text('stripe_account_id'), // Stripe Connect pour paiements
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Table campagnes (une commande groupée)
export const campagnesCommande = pgTable('campagnes_commande', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(), // "Commande printemps 2026"
  description: text('description'),
  dateOuverture: timestamp('date_ouverture').notNull(),
  dateFermeture: timestamp('date_fermeture').notNull(),
  statut: text('statut').default('brouillon'), // brouillon, ouverte, fermee, en_traitement, terminee
  tokenPublic: text('token_public').notNull().unique(), // Pour accès invités non-inscrits
  cgvAcceptees: boolean('cgv_acceptees').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Table produits de la campagne (catalogue)
export const produitsCampagne = pgTable('produits_campagne', {
  id: uuid('id').primaryKey().defaultRandom(),
  campagneId: uuid('campagne_id')
    .notNull()
    .references(() => campagnesCommande.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  description: text('description'),
  prixUnitaireHt: decimal('prix_unitaire_ht', { precision: 10, scale: 2 }).notNull(),
  tauxTva: decimal('taux_tva', { precision: 4, scale: 1 }).notNull(),
  unite: text('unite').default('pièce'), // pièce, kg, litre, lot
  stockDisponible: integer('stock_disponible'), // null = illimité
  quantiteMin: integer('quantite_min').default(1),
  quantiteMax: integer('quantite_max'),
  categorie: text('categorie'), // materiel, nourrissement, traitement, equipement
  photoUrl: text('photo_url'),
  ordre: integer('ordre').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Table commandes (une commande d'un membre)
export const commandesGroupees = pgTable('commandes_groupees', {
  id: uuid('id').primaryKey().defaultRandom(),
  campagneId: uuid('campagne_id')
    .notNull()
    .references(() => campagnesCommande.id),
  membreId: uuid('membre_id').references(() => profils.id), // null si invité
  nomInvite: text('nom_invite'), // Pour non-inscrits
  emailInvite: text('email_invite'),
  telephoneInvite: text('telephone_invite'),
  statut: text('statut').default('en_attente'), // en_attente, validee, payee, annulee
  totalHt: decimal('total_ht', { precision: 10, scale: 2 }),
  totalTva: decimal('total_tva', { precision: 10, scale: 2 }),
  totalTtc: decimal('total_ttc', { precision: 10, scale: 2 }),
  lignes: jsonb('lignes').notNull(), // [{produitId, nom, quantite, prixHt, tva}]
  modePaiement: text('mode_paiement'), // stripe, helloasso, especes, cheque, virement
  paiementRef: text('paiement_ref'),
  saisieAdmin: boolean('saisie_admin').default(false), // Commande papier ressaisie
  tokenQr: text('token_qr'), // Pour fiche imprimable
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### API Campagnes

```
# Organisation
POST   /api/organisations                     → Créer mon association
GET    /api/organisations/mine                 → Mon association
PUT    /api/organisations/[id]                 → Modifier

# Campagnes
POST   /api/campagnes                         → Créer une campagne
GET    /api/campagnes                         → Liste mes campagnes
GET    /api/campagnes/[id]                    → Détail + stats
PUT    /api/campagnes/[id]                    → Modifier
PUT    /api/campagnes/[id]/ouvrir             → Publier (statut → ouverte)
PUT    /api/campagnes/[id]/fermer             → Fermer les commandes
DELETE /api/campagnes/[id]                    → Supprimer (si brouillon)

# Produits catalogue
POST   /api/campagnes/[id]/produits           → Ajouter un produit
PUT    /api/campagnes/[id]/produits/[prodId]  → Modifier
DELETE /api/campagnes/[id]/produits/[prodId]  → Retirer

# Commandes (côté admin association)
GET    /api/campagnes/[id]/commandes          → Toutes les commandes
PUT    /api/campagnes/[id]/commandes/[cmdId]  → Valider/annuler
POST   /api/campagnes/[id]/commandes/saisie   → Ressaisie commande papier
GET    /api/campagnes/[id]/export             → Export récapitulatif XLSX

# Commandes (côté membre / invité — routes publiques avec token)
GET    /api/public/campagne/[token]           → Catalogue public
POST   /api/public/campagne/[token]/commander → Passer commande (inscrit ou invité)
GET    /api/public/commande/[tokenQr]         → Fiche commande imprimable
```

#### Parcours utilisateur — Administrateur association

1. **Créer l'organisation** : Paramètres → "Mon association" → formulaire (nom, SIRET, logo, CGV)
2. **Créer une campagne** : Campagnes → "Nouvelle campagne" → nom, dates ouverture/fermeture
3. **Ajouter des produits** : Catalogue interactif → ajouter produits avec prix, TVA, stock, photo
4. **Publier** : Bouton "Ouvrir la campagne" → génère le lien public + QR code
5. **Partager** : Copier le lien ou le QR code → envoyer par email / WhatsApp / afficher en réunion
6. **Suivre** : Dashboard campagne → commandes en temps réel, stats, montant total
7. **Fermer + traiter** : Fermer la campagne → export récapitulatif XLSX par produit avec quantités totales
8. **Ressaisie papier** : Pour les membres qui ont commandé sur papier → formulaire admin de ressaisie

#### Parcours utilisateur — Membre / Invité

1. **Accéder** : Cliquer le lien ou scanner le QR code → page catalogue public
2. **Commander** : Parcourir le catalogue → ajouter au panier → valider
3. **S'identifier** : Si inscrit → connexion. Si invité → formulaire nom/email/téléphone
4. **Payer** : Stripe Checkout ou note "Paiement à la livraison"
5. **Confirmation** : Page récapitulative avec QR code de la commande → imprimable

#### UI Pages

```
app/pages/
├── association/
│   ├── index.vue                  # Dashboard association (si admin)
│   ├── parametres.vue             # Config organisation
│   └── campagnes/
│       ├── index.vue              # Liste campagnes
│       ├── nouvelle.vue           # Créer campagne + catalogue
│       └── [id].vue               # Détail campagne + commandes + stats
├── public/
│   └── campagne/
│       └── [token].vue            # Catalogue public + commande (invités)
```

### C.3 — Dashboard communautaire

#### Concept

Pour les responsables d'association : vue agrégée des données de leurs membres (anonymisées ou avec consentement). Stats collectives, carte de densité des ruchers, tendances de récolte.

#### API : `GET /api/organisations/[id]/dashboard`

```typescript
interface DashboardCommunautaire {
  // Stats globales
  nombreMembres: number;
  nombreRuchesTotal: number;
  productionTotaleKg: number;
  productionMoyenneParRuche: number;

  // Activité récente
  interventionsParSemaine: { semaine: string; count: number }[];
  membresActifsMois: number;

  // Carte de densité
  densiteRuchers: {
    lat: number;
    lng: number;
    nombreRuches: number;
    // Pas de nom de membre (anonymisé)
  }[];

  // Tendances production
  productionParMois: { mois: string; totalKg: number; moyenneParRuche: number }[];
  productionParTypeMiel: { type: string; quantiteKg: number; partPercent: number }[];

  // Santé collective
  tauxMortalite: number; // % colonies mortes dans l'année
  scoresSanteDistribution: { tranche: string; count: number }[]; // 0-25, 25-50, 50-75, 75-100

  // Comparaison régionale (si assez de données)
  comparaisonDepartement?: {
    productionMoyenne: number;
    mortaliteMoyenne: number;
  };
}
```

#### Consentement des membres

```typescript
// Colonne à ajouter sur table membres :
consentementStats: boolean('consentement_stats').default(false),

// Lors de l'acceptation d'une invitation d'association, le membre peut cocher :
// "J'accepte de partager mes statistiques anonymisées avec l'association"
// Seuls les membres ayant consenti sont inclus dans le dashboard communautaire
```

#### UI Dashboard communautaire

- **Layout** : Page full-width dans la section association
- **KPIs héro** : 4 cards (membres, ruches total, production, mortalité)
- **Carte** : Leaflet heatmap (densité ruchers) — utiliser `leaflet.heat` plugin
- **Graphiques** : Production mensuelle (ECharts area), répartition miel (donut), activité (bar chart)
- **Table** : Membres actifs avec dernière connexion (si consentement)

---

## 6. CONVENTIONS DU PROJET — RAPPEL

Identiques aux Phases 2-3 (voir prompts précédents). Points essentiels :

- `<script setup lang="ts">`, strict mode, zéro `any`
- Nuxt UI v3, charte boutons, PageHeader + breadcrumbs, ExpandableCard
- `useFetch` key = string, mutations = `$fetch`, erreurs = `getApiErrorMessage()`
- Drizzle schema : UUID, user_id cascade, created_at/updated_at, RLS
- Env vars : préfixe `NUXT_`
- Design system Warm Precision : honey `#F5A623`, fonds chauds, transitions ease-out-expo
- Touch targets 44×44px, CTA 56px terrain

---

## 7. CHECKLIST D'IMPLÉMENTATION

### PHASE A — Cybersécurité (3-5 jours)

#### A.1 Scripts d'audit automatisés

- [ ] Créer `scripts/audit-sql.sh`
- [ ] Créer `scripts/audit-validation.sh`
- [ ] Créer `scripts/audit-deps.sh`
- [ ] Créer `scripts/audit-rls.sql`
- [ ] Exécuter chaque script et documenter les résultats

#### A.2 Hardening

- [ ] Vérifier/renforcer rate limiting sur toutes les routes auth
- [ ] Ajouter rate limit sur `/api/auth/reset-password` si manquant
- [ ] Ajouter Content-Security-Policy dans security-headers.ts
- [ ] Vérifier qu'aucune route mutation n'existe sans `requireAuth()`
- [ ] Vérifier qu'aucun `readBody()` n'existe sans validation Zod
- [ ] Vérifier qu'aucun `v-html` n'est utilisé avec des données utilisateur
- [ ] Vérifier que les runtimeConfig.public ne contiennent aucun secret
- [ ] Ajouter `maxBodySize: '1mb'` sur les routes API dans nitro config
- [ ] Vérifier cascade DELETE sur toutes les FK user_id
- [ ] Exécuter l'audit RLS SQL et corriger les tables sans policy

#### A.3 Documentation

- [ ] Créer `docs/AUDIT_SECURITE.md` avec tous les résultats
- [ ] Créer `app/pages/politique-confidentialite.vue`
- [ ] Créer `app/pages/cgu.vue` (conditions générales d'utilisation)

### PHASE B — Optimisations (2-3 jours)

- [ ] ECharts import sélectif (remplacer `import * as echarts` partout)
- [ ] Leaflet lazy load (defineAsyncComponent sur RucherMap)
- [ ] `nuxt.config.ts` routeRules optimisées (prerender pages statiques, SWR API)
- [ ] Preconnect/dns-prefetch sur domaines externes
- [ ] Compression images côté client (browser-image-compression)
- [ ] Index DB manquants (`user_id, created_at DESC` sur chaque table)
- [ ] Vérifier N+1 queries dans les pages détail/timeline
- [ ] `NUXT_ANALYZE=true npm run build` → documenter le résultat
- [ ] Mesurer Core Web Vitals (Lighthouse) → documenter le score

### PHASE C — Modules communautaires (2-3 semaines)

#### C.1 Générateur de hausses

- [ ] Créer table `hausses` + RLS + index
- [ ] API CRUD hausses + batch génération
- [ ] API export QR codes PDF (format Le Besson)
- [ ] Page `app/pages/hausses/index.vue`
- [ ] Modal batch création
- [ ] Composable `useHausses.ts`

#### C.2 Module commande groupée

- [ ] Créer tables `organisations`, `campagnes_commande`, `produits_campagne`, `commandes_groupees` + RLS
- [ ] API organisations (3 routes)
- [ ] API campagnes (7 routes)
- [ ] API produits catalogue (3 routes)
- [ ] API commandes admin (4 routes)
- [ ] API publiques campagne/commande (3 routes — sans auth via token)
- [ ] Pages association : dashboard, paramètres, campagnes liste/detail/nouvelle
- [ ] Page publique catalogue + commande invité
- [ ] Export XLSX récapitulatif campagne
- [ ] QR code commande imprimable
- [ ] Composables `useOrganisation.ts`, `useCampagnes.ts`

#### C.3 Dashboard communautaire

- [ ] Colonne `consentement_stats` sur table membres
- [ ] API `GET /api/organisations/[id]/dashboard`
- [ ] Section consentement dans le flow d'acceptation invitation
- [ ] Page dashboard communautaire avec carte heatmap, charts, KPIs
- [ ] Plugin Leaflet heat (`leaflet.heat`)

### VALIDATION FINALE

- [ ] `npm run typecheck` → 0 erreurs
- [ ] `npm run build` → PASS
- [ ] `npm run test` → tous PASS
- [ ] `npm run lint` → 0 erreurs
- [ ] Scripts d'audit sécu exécutés → 0 critique
- [ ] Lighthouse score > 90 (Performance, Accessibility, Best Practices)

---

## 8. TESTS ET VALIDATION

### Cybersécurité — Tests manuels critiques

| #   | Test                                            | Résultat attendu                           |
| --- | ----------------------------------------------- | ------------------------------------------ |
| 1   | 10 login rate → même IP                         | 429 après le 5ème                          |
| 2   | SQL injection `search=' OR 1=1`                 | 200 avec résultats vides (pas d'injection) |
| 3   | XSS `<script>alert(1)</script>` dans nom rucher | Texte échappé à l'affichage                |
| 4   | Accéder à la ruche de User B avec token User A  | 404 (pas 200 ni 403)                       |
| 5   | Body 10 MB sur POST                             | 413 Payload Too Large                      |
| 6   | `?page=1&limit=99999`                           | 400 Bad Request (Zod max 100)              |
| 7   | Token JWT expiré                                | 401 Unauthorized                           |
| 8   | Webhook Stripe sans signature valide            | 400 (rejeté)                               |
| 9   | Route POST sans requireAuth                     | Ne doit pas exister                        |
| 10  | RLS — SELECT sans policy                        | Ne doit pas exister                        |

### Performance — Métriques cibles

| Métrique                  | Cible    |
| ------------------------- | -------- |
| Lighthouse Performance    | > 90     |
| Lighthouse Accessibility  | > 95     |
| Lighthouse Best Practices | > 90     |
| First Load Bundle (gzip)  | < 300 KB |
| LCP                       | < 2.5s   |
| CLS                       | < 0.1    |
| Cold start API            | < 500ms  |

### Modules communautaires — Tests fonctionnels

| #   | Test                            | Résultat attendu                       |
| --- | ------------------------------- | -------------------------------------- |
| 1   | Générer 20 hausses batch        | 20 records créés, QR codes générés     |
| 2   | Export QR PDF Le Besson         | PDF A4 avec grille 32 plaquettes       |
| 3   | Créer campagne + 5 produits     | Campagne en brouillon avec catalogue   |
| 4   | Ouvrir campagne → lien public   | Page catalogue accessible sans auth    |
| 5   | Invité passe commande           | Commande créée avec nom/email/tel      |
| 6   | Admin ressaisit commande papier | Commande créée avec flag saisie_admin  |
| 7   | Fermer campagne → export        | XLSX avec récapitulatif par produit    |
| 8   | Dashboard communautaire         | Stats agrégées des membres consentants |
| 9   | Carte densité                   | Heatmap Leaflet sans noms de membres   |

---

## ANNEXE — POSITIONNEMENT FINAL VS BEEKUBE

```
BEEKUBE (Gratuit + Premium confort + Module Organisations)
├── CRUD basique interventions
├── Photos + Sync Google Agenda + Export XLSX
├── Couleurs ruches + Logo
├── Générateur hausses + QR
├── Commande groupée associations
└── Dashboard communautaire

APICULTURE 360° (Freemium + 3 plans pro)
├── TOUT ce que Beekube fait ✅
│
├── --- INTELLIGENCE (exclusif) ---
├── Score prédictif IA par colonie
├── Suggestions saisonnières intelligentes
├── Rentabilité par ruche/rucher/produit
├── Prévisionnel trésorerie 12 mois
├── Corrélation météo-production
│
├── --- INTERVENTIONS (exclusif) ---
├── 14 sous-catégories structurées
├── Interventions groupées (200 ruches en 1 clic)
├── Templates d'intervention personnalisables
├── Module Reine complet (lignée, marquage, évaluation)
│
├── --- PRO (exclusif) ---
├── Comptabilité complète + TVA multi-taux
├── Facturation PDF conforme + Export FEC
├── Registre d'élevage réglementaire
├── Multi-users avec 4 rôles
│
├── --- TECHNIQUE (exclusif) ---
├── App native iOS + Android
├── Mode offline structuré
├── Cybersécurité auditée (OWASP)
├── Performance optimisée (Lighthouse > 90)
│
├── --- ASSOCIATIF (parité + mieux) ---
├── Générateur hausses QR (format Le Besson)
├── Commande groupée (Stripe + multi-paiements)
├── Dashboard communautaire avec carte densité
├── Consentement RGPD explicite pour stats
└── QR Code par ruche + par hausse
```

**Le pitch** : _"Beekube note vos visites. Apiculture 360° gère votre exploitation."_

---

_Fin du prompt Phase 4. Référence unique pour les 3 chantiers : Cybersécurité, Optimisations, Modules communautaires._
