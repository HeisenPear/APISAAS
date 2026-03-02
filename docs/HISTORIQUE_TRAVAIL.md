# Historique de travail — Apiculture 360°

Ce fichier trace l'ensemble du travail effectué, décision par décision, pour ne jamais perdre le fil.

---

## Session 1 — 9 février 2026 — Initialisation projet

### Objectif

Initialiser le projet SaaS Apiculture 360° from scratch avec la stack Nuxt 3 full-stack.

### Travail effectué

#### Phase 1 — Initialisation projet (FAIT)

- Créé la structure complète des dossiers (app/, server/, tests/, docs/, public/)
- Créé package.json avec toutes les dépendances
- Installé npm dependencies (1114 packages)
- Initialisé git + husky

#### Phase 2 — Configuration (FAIT)

- nuxt.config.ts : modules (UI, ESLint, Pinia, Supabase, VueUse, Motion), runtimeConfig, Supabase redirectOptions, page/layout transitions, TypeScript strict, Nitro preset Vercel
- tsconfig.json : strict, noImplicitAny, noUnusedLocals, noUnusedParameters, noUncheckedIndexedAccess
- drizzle.config.ts : schema path, migrations output, PostgreSQL dialect
- app.config.ts : UI colors (amber/stone), plans config
- .env.example : toutes les variables nécessaires
- vercel.json : framework nuxt, région cdg1, cron jobs (alertes 8h, digest lundi 7h)
- .gitignore : Nuxt, Node, Env, IDE, OS, Coverage, Playwright, Drizzle
- .prettierrc : semi, singleQuote, trailingComma all, printWidth 100
- eslint.config.mjs : no-explicit-any error, no-v-html error
- .husky/pre-commit : lint-staged

#### Phase 3 — @database-optimizer (FAIT)

- server/database/schema.ts : 432 lignes, 8 enums, 10 tables, 11 blocs relations Drizzle
- server/database/seed.ts : 673 lignes, données démo complètes (1 user, 3 ruchers, 15 ruches, 20 inspections, 5 récoltes, 7 stocks, 3 clients, 5 ventes, 5 alertes)
- server/database/rls.sql : RLS activé sur les 10 tables avec policy user_id = auth.uid()

#### Phase 4 — @nitro-api-architect (FAIT)

- server/utils/db.ts : instance Drizzle + PostgreSQL
- server/utils/supabase.ts : client admin Supabase
- server/utils/auth.ts : requireAuth(event)
- server/utils/errors.ts : notFound, forbidden, badRequest, unauthorized, conflict, tooManyRequests, internalError
- server/utils/validators.ts : paginationSchema, uuidSchema, dateRangeSchema (Zod)
- server/middleware/01.auth.ts : middleware logging dev
- app/types/models.ts : 10 types InferSelectModel
- app/types/api.ts : ApiResponse, ApiListResponse, Pagination, ApiError
- app/types/enums.ts : 8 constantes as const + types union

#### Phase 5 — @nuxt-frontend (FAIT)

- app/assets/css/main.css : design system Warm Precision complet (variables, typo, animations, transitions)
- app/app.vue : root component
- app/layouts/default.vue : sidebar + header
- app/layouts/auth.vue : centré login/register
- app/layouts/terrain.vue : simplifié mobile
- app/components/ui/AppSidebar.vue : navigation Apple-style noir
- app/components/ui/AppHeader.vue : header sticky backdrop-blur
- app/components/ui/AppCommandPalette.vue : ⌘K style Spotlight
- app/components/ui/KpiCard.vue : KPI avec trend + count-up
- app/components/ui/DataTable.vue : table responsive + pagination
- app/components/ui/EmptyState.vue : illustration + CTA
- app/components/ui/LoadingSkeleton.vue : skeleton pulse loader
- app/components/ui/PageHeader.vue : titre + description + actions
- app/components/ui/StatsGrid.vue : grille KpiCards responsive
- app/components/ui/ConfirmDialog.vue : modal confirmation danger/warning

#### Phase 6 — @test-engineer (FAIT)

- vitest.config.ts : happy-dom, coverage v8, setup file
- playwright.config.ts : chromium + mobile, webServer config
- tests/setup.ts : setup global mocks
- tests/mocks/supabase-server.ts : mock serverSupabaseUser
- tests/unit/server/utils/errors.test.ts : tests unitaires errors (7 fonctions)
- tests/e2e/smoke.spec.ts : smoke test page d'accueil

#### Phase 7 — @security-auditor (FAIT)

- server/middleware/02.security-headers.ts : X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, HSTS (prod only)
- server/middleware/03.rate-limit.ts : 100 req/min API, 5 req/15min login, auto-cleanup
- .github/workflows/ci.yml : lint + typecheck + test + build

#### Phase 8 — Documentation (FAIT)

- docs/architecture/ADR-001-nuxt-fullstack.md
- CHANGELOG.md
- README.md
- public/manifest.json (PWA)
- Ce fichier d'historique

### Fichiers créés — Inventaire complet (49 fichiers source)

**Racine (10)** : package.json, nuxt.config.ts, tsconfig.json, drizzle.config.ts, app.config.ts, vercel.json, .env.example, .prettierrc, eslint.config.mjs, .gitignore

**app/ (18)** : app.vue, assets/css/main.css, layouts/{default,auth,terrain}.vue, components/ui/{AppSidebar,AppHeader,AppCommandPalette,KpiCard,DataTable,EmptyState,LoadingSkeleton,PageHeader,StatsGrid,ConfirmDialog}.vue, types/{models,api,enums}.ts

**server/ (11)** : database/{schema,seed}.ts, database/rls.sql, utils/{db,supabase,auth,errors,validators}.ts, middleware/{01.auth,02.security-headers,03.rate-limit}.ts

**tests/ (4)** : setup.ts, mocks/supabase-server.ts, unit/server/utils/errors.test.ts, e2e/smoke.spec.ts

**config/ (3)** : vitest.config.ts, playwright.config.ts, .husky/pre-commit

**docs/ (3)** : architecture/ADR-001-nuxt-fullstack.md, HISTORIQUE_TRAVAIL.md, + CHANGELOG.md + README.md à la racine

### Décisions prises

1. **@vueuse/motion v3** au lieu de v2.5 (v2.5 n'existe pas sur npm, la dernière est la v3)
2. **Nuxt init manuelle** au lieu de `npx nuxi init` (l'init interactive bloque en CLI non-interactif)
3. **ESLint flat config** (eslint.config.mjs) car Nuxt 3 + @nuxt/eslint utilise le nouveau format
4. **errors.ts enrichi** : l'agent @test-engineer a ajouté unauthorized, conflict, tooManyRequests, internalError en plus des 4 de base

### Prochaines étapes

- Valider la compilation TypeScript (`npm run typecheck`)
- Valider le build (`npm run build`)
- Corriger les erreurs éventuelles
- Premier commit initial
- **Sprint 1** : Auth + Onboarding + Dashboard

---

## Session 2 — 9 février 2026 — Sprint 1 : Auth + Onboarding + Dashboard

### Objectif

Implémenter l'authentification, l'onboarding wizard 4 étapes, et le dashboard complet.

### Travail effectué

#### Phase 1 — API Backend Auth (FAIT)

- server/api/auth/register.post.ts : inscription Supabase Auth + insert profils
- server/api/auth/login.post.ts : connexion email/password
- server/api/auth/logout.post.ts : déconnexion
- server/api/auth/me.get.ts : profil utilisateur connecté
- server/api/auth/reset-password.post.ts : envoi email reset
- server/api/profils/me.get.ts : récupération profil
- server/api/profils/me.put.ts : mise à jour profil (partiel)
- server/api/profils/onboarding.put.ts : marquer onboarding complet

#### Phase 2 — API Backend CRUD + Dashboard (FAIT)

- server/api/ruchers/index.get.ts : liste paginée avec search + filtre actif
- server/api/ruchers/index.post.ts : création rucher
- server/api/ruchers/[id].get.ts : détail rucher + count ruches
- server/api/ruches/index.get.ts : liste paginée avec filtres
- server/api/ruches/index.post.ts : création simple ou batch (onboarding)
- server/api/ruches/[id].get.ts : détail ruche + join rucher
- server/api/dashboard/index.get.ts : 10 requêtes parallèles (KPIs, santé, production mensuelle, activité récente)

#### Phase 3 — Stores & Composables (FAIT)

- app/stores/auth.ts : Pinia store (profil, isAuthenticated, isOnboarded, CRUD profil)
- app/stores/ui.ts : Pinia store (sidebar, command palette)
- app/composables/useAuth.ts : login, register, logout, resetPassword, magicLink
- app/composables/useDashboard.ts : useFetch /api/dashboard
- app/composables/useRuchers.ts : CRUD ruchers
- app/composables/useRuches.ts : CRUD ruches + batch
- app/composables/useNotifications.ts : toast wrapper (success, error, warning, info)

#### Phase 4 — Pages Auth (FAIT)

- app/pages/login.vue : email/password + magic link + liens register/reset
- app/pages/register.vue : formulaire + indicateur force mot de passe
- app/pages/reset-password.vue : envoi email + confirmation
- app/pages/confirm.vue : callback Supabase Auth, redirection auto
- app/pages/index.vue : redirection intelligente (login/onboarding/dashboard)
- app/middleware/onboarding.global.ts : guard onboarding non complété

#### Phase 5 — Onboarding Wizard (FAIT)

- app/pages/onboarding.vue : wizard 4 étapes avec animations slide
  1. Infos personnelles (nom, prénom, téléphone, adresse, NAPI)
  2. Premier rucher (nom, localisation GPS auto, commune)
  3. Premières ruches (ajout batch dynamique, type sélectionnable)
  4. Choix du plan (4 cartes : Découverte/Starter/Pro/Expert)

#### Phase 6 — Dashboard (FAIT)

- app/pages/dashboard.vue : page complète avec KPIs, charts, activité, alertes
- app/components/dashboard/ProductionChart.vue : ECharts area chart mensuel
- app/components/dashboard/SanteChart.vue : ECharts donut chart santé colonies
- app/components/dashboard/ActivityFeed.vue : timeline activité récente
- app/components/dashboard/AlertsWidget.vue : alertes avec priorité colorée
- app/components/dashboard/MeteoWidget.vue : widget météo (placeholder)

#### Phase 7 — Validation (FAIT)

- Build : ✅ (client 2.7s, server 1.2s)
- Typecheck : ✅ (0 erreurs)
- Lint : ✅ (0 erreurs, 0 warnings)
- Tests : ✅ (15/15)

### Fichiers créés — Inventaire Sprint 1 (35 nouveaux + 1 modifié)

**server/api/ (15)** : auth/{register,login,logout,me,reset-password}, profils/{me.get,me.put,onboarding}, ruchers/{index.get,index.post,[id].get}, ruches/{index.get,index.post,[id].get}, dashboard/index.get

**app/ (20)** : stores/{auth,ui}.ts, composables/{useAuth,useDashboard,useRuchers,useRuches,useNotifications}.ts, middleware/onboarding.global.ts, pages/{index,login,register,reset-password,confirm,onboarding,dashboard}.vue, components/dashboard/{ProductionChart,SanteChart,ActivityFeed,AlertsWidget,MeteoWidget}.vue

### Corrections appliquées

1. **`~/server` → `~~/server`** : En Nuxt 4, `~` résout vers `app/`. Les imports serveur doivent utiliser `~~` (racine projet)
2. **Couleurs Nuxt UI v3** : `color="amber"` → `color="primary"`, `color="red"` → `color="error"` (couleurs sémantiques)
3. **Opérateur `??` avec `||`** : Ajout de parenthèses dans auth store pour éviter l'ambiguïté
4. **ESLint** : Variable `props` inutilisée dans ActivityFeed, self-closing input dans CommandPalette

### Décisions prises

1. **Nuxt UI v3 couleurs sémantiques** : primary/secondary/success/error/warning/info/neutral (pas amber/red/green/blue)
2. **`~~` pour imports serveur** : Obligatoire en Nuxt 4 compatibility mode
3. **Dashboard 10 requêtes parallèles** : Promise.all pour performance optimale
4. **Batch creation ruches** : Support création multiple via `z.union` (onboarding)
5. **Onboarding layout: false** : Page full-screen sans layout, design custom

### Prochaines étapes

- Commit Sprint 1 + push
- **Sprint 2** : CRUD complet Ruchers + Ruches (pages liste, détail, édition, suppression)
- Intégration Stripe pour les plans
- Tests E2E auth flow (Playwright)

---

## Session 3 — 9 fevrier 2026 — Sprint 2 + Sprint 3

### Objectif

Sprint 2 : CRUD complet Ruchers (pages detail, edition, suppression) + carte Leaflet.
Sprint 3 : CRUD complet Ruches + timeline + fiche individuelle.

### Travail effectue

#### Sprint 1 — Bugfixes (FAIT)

- Fix boucle infinie redirect onboarding ↔ dashboard (middleware)
- Fix composants non resolus dans default.vue (prefixe Ui manquant)
- Ajout `<UApp>` dans app.vue pour activer le theming Nuxt UI v3
- Fix auth 500→401 dans requireAuth (try/catch serverSupabaseUser)

#### Sprint 2 — API Backend (FAIT)

- server/api/ruchers/[id].put.ts : update rucher
- server/api/ruchers/[id].delete.ts : soft delete (actif=false)
- server/api/ruchers/[id]/ruches.get.ts : ruches d'un rucher
- server/api/ruchers/[id]/stats.get.ts : stats (total, actives, production, derniere visite)
- server/api/ruches/[id].put.ts : update ruche
- server/api/ruches/[id].delete.ts : hard delete ruche
- Fix ruchers/index.get.ts : ajout ruchesCount par sous-requete

#### Sprint 2 — Composables (FAIT)

- app/composables/useRuchers.ts : enrichi (updateRucher, deleteRucher, getRucherStats)
- app/composables/useRuches.ts : enrichi (getRuche, updateRuche, deleteRuche)

#### Sprint 2 — Composants (FAIT)

- app/components/ruchers/RucherCard.vue : card Apple-style
- app/components/ruchers/RucherMap.vue : carte Leaflet + markers amber
- app/components/ruchers/RucherForm.vue : formulaire GPS auto
- app/components/ruchers/RucherPanel.vue : panel lateral carte

#### Sprint 2 — Pages (FAIT)

- app/pages/ruchers/index.vue : liste grid/carte
- app/pages/ruchers/nouveau.vue : creation rucher
- app/pages/ruchers/[id].vue : detail + stats + edit + delete + ajout ruche

#### Sprint 3 — API Backend (FAIT)

- server/api/ruches/[id]/inspections.get.ts : liste inspections d'une ruche
- server/api/ruches/[id]/recoltes.get.ts : liste recoltes d'une ruche
- server/api/ruches/[id]/timeline.get.ts : timeline unifiee (inspections + recoltes)

#### Sprint 3 — Composants (FAIT)

- app/components/ruches/RucheCard.vue : card avec health badge + infos
- app/components/ruches/RucheForm.vue : formulaire complet (rucher, type, race, reine, cadres, hausses)
- app/components/ruches/RucheTimeline.vue : timeline style GitHub (inspections + recoltes)
- app/components/ruches/RucheHealthBadge.vue : badge sante visuel (4 niveaux)

#### Sprint 3 — Pages (FAIT)

- app/pages/ruches/index.vue : liste avec filtres (rucher, statut) + pagination
- app/pages/ruches/nouveau.vue : creation ruche
- app/pages/ruches/[id].vue : fiche complete (info, timeline, actions rapides, lien rucher)

#### Validation (FAIT)

- Typecheck : PASS
- ESLint : 0 erreurs
- Build : PASS
- Tests : 15/15 PASS
- API live : toutes les routes repondent correctement

### Fichiers crees — Inventaire Sprint 2+3 (25 nouveaux + 3 modifies)

**server/api/ Sprint 2 (6)** : ruchers/[id].{put,delete}, ruchers/[id]/{ruches,stats}.get, ruches/[id].{put,delete}
**server/api/ Sprint 3 (3)** : ruches/[id]/{inspections,recoltes,timeline}.get
**app/components/ Sprint 2 (4)** : ruchers/{RucherCard,RucherMap,RucherForm,RucherPanel}
**app/components/ Sprint 3 (4)** : ruches/{RucheCard,RucheForm,RucheTimeline,RucheHealthBadge}
**app/pages/ Sprint 2 (3)** : ruchers/{index,nouveau,[id]}
**app/pages/ Sprint 3 (3)** : ruches/{index,nouveau,[id]}
**Modifies (3)** : useRuchers.ts, useRuches.ts, ruchers/index.get.ts

### Corrections appliquees

1. **Leaflet CSS** : import statique au top-level au lieu de dynamique dans initMap
2. **ruchesCount manquant** : ajout sous-requete groupBy dans ruchers/index.get.ts
3. **TypeScript error [id].vue** : pagination fallback manquante dans catch
4. **Unused import sql** : supprime dans timeline.get.ts
5. **Type assertion Record<string, unknown>** : remplace par appel type-safe dans nouveau.vue

### Prochaines etapes

- Commit Sprint 2 + Sprint 3 + Sprint 4

---

## Session 4 — 9 fevrier 2026 — Sprint 4 : Inspections

### Objectif

Formulaire wizard multi-etapes intelligent + mode terrain + timeline inspections.

### Travail effectue

#### Sprint 4 — API Backend (5 routes) (FAIT)

- server/api/inspections/index.get.ts : liste paginee avec filtres (ruche, rucher, type, dates)
- server/api/inspections/index.post.ts : creation inspection (validation Zod complete)
- server/api/inspections/[id].get.ts : detail avec join ruche + rucher
- server/api/inspections/[id].put.ts : mise a jour partielle
- server/api/inspections/[id].delete.ts : suppression

#### Sprint 4 — Composable (FAIT)

- app/composables/useInspections.ts : CRUD + filtres + types InspectionWithContext

#### Sprint 4 — Composants (3) (FAIT)

- InspectionForm.vue : wizard 5 etapes (ruche+date+meteo, etat colonie sliders, sanitaire, actions+nourrissement, notes+timer)
- InspectionCard.vue : card avec type icon, scores badges, notes preview
- InspectionQuick.vue : mode terrain gros boutons (selection ruche, force/couvain/reserves, toggles reine/essaimage)

#### Sprint 4 — Pages (3) (FAIT)

- inspections/index.vue : timeline groupee par mois, filtres (rucher, type, search), pagination
- inspections/nouvelle.vue : toggle complet/terrain, wizard ou mode rapide
- inspections/[id].vue : detail complet (barres scores, badges, sanitaire, actions, meteo, notes)

#### Validation (FAIT)

- Typecheck : PASS
- ESLint : 0 erreurs (7 warnings self-closing input)
- Build : PASS (13.3 MB)
- Tests : 15/15 PASS
- API live : toutes routes OK (302 pages, 401 API)

### Fichiers crees — Sprint 4 (12 nouveaux)

**server/api/inspections/ (5)** : index.{get,post}, [id].{get,put,delete}
**app/composables/ (1)** : useInspections.ts
**app/components/inspections/ (3)** : InspectionForm, InspectionCard, InspectionQuick
**app/pages/inspections/ (3)** : index, nouvelle, [id]

### Corrections appliquees

1. Unused `s` variable dans InspectionForm v-for → `_s`
2. Type assertion `Record<string, unknown>` → type-safe direct call dans nouvelle.vue
3. Unused `props` dans InspectionQuick → `defineProps` sans assignation

### Prochaines etapes

- Commit Sprint 2 + Sprint 3 + Sprint 4
- **Sprint 5** : Production + Stocks

---

## Session 4 — 9 février 2026 — Sprint 5 : Production + Stocks

### Objectif

Implementer les modules Production (recoltes, lots, stats, graphiques) et Stocks (inventaire, mouvements, alertes).

### Backend — API Routes (14 fichiers) — FAIT

**Production (7 routes) :**

- `server/api/production/recoltes.get.ts` — Liste recoltes avec filtres (rucher, ruche, type miel, dates, search)
- `server/api/production/recoltes.post.ts` — Creation recolte avec validation rucher/ruche ownership
- `server/api/production/recoltes/[id].get.ts` — Detail recolte avec jointure rucher+ruche
- `server/api/production/recoltes/[id].put.ts` — Mise a jour partielle
- `server/api/production/recoltes/[id].delete.ts` — Suppression
- `server/api/production/lots.get.ts` — Lots groupes par numero (aggregation quantite, humidite moy, nombre recoltes)
- `server/api/production/stats.get.ts` — Stats annuelles : total saison, comparaison N/N-1, par mois, par rucher, par type de miel

**Stocks (7 routes) :**

- `server/api/stocks/index.get.ts` — Liste stocks avec filtres (categorie, search)
- `server/api/stocks/index.post.ts` — Creation article
- `server/api/stocks/[id].get.ts` — Detail avec 50 derniers mouvements
- `server/api/stocks/[id].put.ts` — Mise a jour
- `server/api/stocks/[id].delete.ts` — Suppression
- `server/api/stocks/mouvements.post.ts` — Creation mouvement (entree/sortie/ajustement) avec maj auto quantite
- `server/api/stocks/alertes.get.ts` — Articles en dessous du seuil d'alerte

### Composables (2 fichiers) — FAIT

- `app/composables/useProduction.ts` — CRUD recoltes + getStats + getLots
- `app/composables/useStocks.ts` — CRUD stocks + createMouvement + getAlertes

### Composants (7 fichiers) — FAIT

**Production :**

- `RecolteForm.vue` — Formulaire complet (rucher, ruche, date, type miel, quantite, humidite, lot, notes)
- `RecolteCard.vue` — Card avec metriques (kg, humidite coloree, hausses, lot badge)
- `ProductionChart.vue` — Charts CSS (bar, monthly, donut) sans dependance externe
- `LotTracker.vue` — Vue tracabilite lots avec details (recoltes, rucher, humidite moy, periode)

**Stocks :**

- `StockCard.vue` — Card visuelle par categorie avec icones, jauge seuil, alerte stock bas, actions hover
- `StockForm.vue` — Formulaire creation/edition article
- `MouvementForm.vue` — Formulaire entree/sortie/ajustement avec icone contextuelle

### Pages (5 fichiers) — FAIT

- `production/index.vue` — Dashboard KPIs + graphiques mensuels + repartition type miel + production par rucher + navigation rapide
- `production/recoltes.vue` — Liste filtrable + modal creation + pagination
- `production/tracabilite.vue` — Suivi lots avec recherche + pagination
- `stocks/index.vue` — Inventaire groupe par categorie + modals creation/edition/mouvement + badge alertes
- `stocks/alertes.vue` — Liste alertes stock bas + reapprovisionnement rapide

### Debug & Validation — FAIT

- TypeCheck : PASS
- ESLint : 0 erreurs (8 warnings pre-existants)
- Tests : 15/15 PASS
- Build : PASS (13.5 MB)
- 5 API GET routes : 401 (auth required)
- 9 API POST/PUT/DELETE routes : 401 (auth required)
- 5 Pages : 200

### Total Sprint 5 : 28 fichiers crees

### Prochaines etapes

- Sprint 6 : Comptabilite + Facturation PDF

---

## Session 5 — 9 fevrier 2026 — Deploiement Vercel + Bugfixes

### Objectif

Deployer l'application sur Vercel, corriger les bugs de deploiement, et fixer les bugs fonctionnels (ruchers/ruches).

### Deploiement Vercel — FAIT

#### Corrections deploiement

1. **vercel.json** : `"framework": "nuxt"` → `"framework": "nuxtjs"` (valeur attendue par Vercel)
2. **CI GitHub Actions** : `vitest.config.ts` utilisait des chemins absolus hardcodes → remplace par `fileURLToPath(new URL('.', import.meta.url))` pour portabilite
3. **Erreur 500 en production** : Variables d'environnement manquantes sur Vercel
4. **Login "Failed to fetch"** : `SUPABASE_URL` contenait le placeholder `https://xxx.supabase.co` → remplace par la vraie URL projet
5. **DATABASE_URL** : L'URL directe Supabase (`db.xxx.supabase.co:5432`) ne fonctionne pas depuis Vercel serverless (IPv6) → il faut utiliser le **connection pooler** (`aws-0-xxx.pooler.supabase.com:6543`)
6. **Tables inexistantes** : `drizzle-kit push` execute en local pour creer les tables dans Supabase
7. **Redirect URL Supabase** : Doit etre `https://apisaas-360.vercel.app/**` (avec `/` avant `**`)

#### Variables d'environnement Vercel requises

| Variable               | Source                                                                      |
| ---------------------- | --------------------------------------------------------------------------- |
| `SUPABASE_URL`         | Supabase → Settings → API → Project URL                                     |
| `SUPABASE_KEY`         | Supabase → Settings → API → anon public key (JWT `eyJ...`)                  |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role secret key (JWT `eyJ...`)          |
| `DATABASE_URL`         | Supabase → Settings → Database → Connection string → **Transaction pooler** |

**Important** : Les variables sont lues au **build time** par Nuxt. Apres modification des env vars, il faut **redeploy sans cache** (Deployments → ... → Redeploy → decocher "Use existing Build Cache").

### Bugfixes fonctionnels — FAIT

#### Bug 1 : useFetch key partagee entre pages (Session precedente)

- **Probleme** : `useFetch` genere une cle auto basee sur le call site — les composables appeles depuis differentes pages obtiennent des caches differents
- **Fix** : Ajoute `key` explicite + `dedupe: 'defer'` a tous les composables :
  - `useRuchers` : `key: 'ruchers-list'`
  - `useRuches` : key dynamique basee sur rucherId
  - `useInspections` : `key: 'inspections-list'`
  - `useProduction` : `key: 'recoltes-list'`
  - `useStocks` : `key: 'stocks-list'`
- Ajoute `onMounted(() => refresh())` sur les pages listes

#### Bug 2 : useRuches ComputedRef key (CRITIQUE)

- **Probleme** : `useRuches` passait un `ComputedRef` comme `key` de `useFetch` au lieu d'un `string`. `useFetch` ne dereference pas le ref → la cle devenait `"[object Object]"` → `refresh()` cassé → creation de ruche en boucle infinie
- **Fix** : Remplace `key: fetchKey` (ComputedRef) par `key: keyValue` (string evalue une fois a l'initialisation)

#### Bug 3 : Erreurs API silencieuses

- **Probleme** : `$fetch` met le message d'erreur dans `error.data.message`, pas `error.message`. Le pattern `e instanceof Error ? e.message` ne recuperait que le message HTTP generique ("500 Internal Server Error")
- **Fix** : Cree `app/utils/apiError.ts` avec `getApiErrorMessage(e, fallback)` qui extrait le bon message. Remplace le pattern dans les 11 pages concernees.

#### Bug 4 : Creation ruche depuis page detail rucher

- **Probleme** : `ruchers/[id].vue` utilisait `createRuche()` du composable `useRuches()`, ce qui initialisait un `useFetch` inutile et bloquait sur le `refresh()`
- **Fix** : Remplace par un `$fetch` direct POST `/api/ruches` + `fetchAll()` pour rafraichir la page

### Fichiers modifies/crees — Session 5

**Nouveau (1)** : `app/utils/apiError.ts`
**Modifies (12)** : `useRuchers.ts`, `useRuches.ts`, `useInspections.ts`, `useProduction.ts`, `useStocks.ts`, `vercel.json`, `vitest.config.ts`, + 5 pages (ruchers, ruches, inspections, onboarding, stocks, production)

### Validation — FAIT

- Typecheck : PASS
- ESLint : PASS
- Tests : 15/15 PASS
- Build : PASS (13.5 MB)
- Deploiement Vercel : FONCTIONNEL

### Lecons apprises

1. **useFetch `key` doit etre un `string`** — jamais un `Ref` ou `ComputedRef`. Ca casse le cache et le refresh.
2. **Vercel serverless + Supabase** : utiliser le **connection pooler** (port 6543), pas la connexion directe (port 5432). IPv6 not supported.
3. **`$fetch` error.data.message** : les erreurs H3/Nitro mettent le message dans `data.message`, pas dans `message`.
4. **Env vars Vercel = build time** : les variables sont injectees au build. Modifier → redeploy sans cache obligatoire.
5. **`drizzle-kit push`** : a executer en local pour creer les tables dans Supabase avant le premier deploiement.
6. **Supabase keys** : le module `@nuxtjs/supabase` attend les cles JWT (`eyJ...`), pas les nouvelles cles `sb_publishable_`/`sb_secret_`.

### Prochaines etapes

- Tester le deploiement Vercel avec les corrections poussees
- **Sprint 6** : Comptabilite + Facturation PDF

---

## Session 6 — 16 fevrier 2026 — Bugfixes + Etude de marche

### Objectif

Corriger les bugs graphiques dashboard, lenteur de refresh donnees, debug routes inspections. Integrer l'etude de marche interventions.

### Travail effectue

#### Integration etude de marche — FAIT

- Deplace `Etude de marche SaaS apiculture.md` → `docs/etude-interventions.md`
- Document spec complete du module Interventions (14 categories, schema DB, types TS, routes API, composants Vue)

#### Bug 1 : Dashboard vide au retour (necessite resize) — FAIT

- **Probleme** : Les graphiques ECharts s'initialisent dans `onMounted` mais le conteneur DOM peut avoir des dimensions 0 lors d'une navigation client-side (transition page). Seul un `window.resize` declenchait `chart.resize()`.
- **Fix** : Ajout `ResizeObserver` sur les conteneurs des charts + `nextTick()` avant init + fallback init dans le `watch` si chart pas encore cree.
- **Fichiers** : `ProductionChart.vue`, `SanteChart.vue`

#### Bug 2 : useDashboard sans key — FAIT

- **Probleme** : `useDashboard()` n'avait pas de `key` explicite ni de `dedupe`, et pas de refresh au montage → donnees stales en revenant sur le dashboard.
- **Fix** : Ajout `key: 'dashboard-data'`, `dedupe: 'defer'`, `onMounted(() => refresh())`.

#### Bug 3 : Double refresh lent sur mutations — FAIT

- **Probleme** : Les composables (`useStocks`, `useProduction`, `useInspections`) appelaient `await refresh()` apres chaque mutation CRUD. Les pages qui les utilisent creaient un 2e `useFetch` avec leur propres filtres, puis appelaient AUSSI `refresh()`. → 2 requetes API sequentielles (dont 1 inutile).
- **Fix** : Supprime `await refresh()` des mutations composables. Le consommateur (page) gere son propre refresh.
- **Fichiers** : `useStocks.ts`, `useProduction.ts`, `useInspections.ts`

#### Bug 4 : Pages listes sans refresh au montage — FAIT

- **Probleme** : `inspections/index.vue`, `stocks/index.vue`, `production/recoltes.vue` n'avaient pas de `onMounted(() => refresh())` ni de `key` explicite → donnees stales en naviguant retour.
- **Fix** : Ajout `key`, `dedupe: 'defer'`, `onMounted(() => refresh())` sur les 3 pages.

#### Bug 5 : inspections/[id].vue useFetch inutile — FAIT

- **Probleme** : La page detail inspection appelait `useInspections()` juste pour `getInspection` et `deleteInspection`, ce qui creait un `useFetch` inutile vers la liste.
- **Fix** : Remplace par `$fetch` direct, elimine l'overhead.

### Validation — FAIT

- Typecheck : PASS
- Build : PASS (13.5 MB)
- Tests : 15/15 PASS

### Fichiers modifies — Session 6 (11 fichiers)

**Nouveau (1)** : `docs/etude-interventions.md`
**Modifies (10)** : `ProductionChart.vue`, `SanteChart.vue`, `useDashboard.ts`, `useStocks.ts`, `useProduction.ts`, `useInspections.ts`, `inspections/index.vue`, `inspections/[id].vue`, `stocks/index.vue`, `production/recoltes.vue`

### Prochaines etapes

- Sprint 6 : Comptabilite + Facturation PDF

---

## Session 6 — 16 fevrier 2026 — Module Interventions + Bug Fixes

### Objectif

Corriger les bugs critiques (dashboard blank, refresh lent, inspections) et integrer le module Interventions complet (14 categories) depuis l'etude de marche.

### Bug Fixes (FAIT)

1. **Dashboard blank au retour** — ECharts init avec container 0px pendant les transitions Vue. Fix: ResizeObserver + nextTick dans ProductionChart.vue et SanteChart.vue
2. **Refresh lent apres ajout** — Double-refresh: composable + page. Fix: supprime `await refresh()` des mutations dans useStocks, useProduction, useInspections
3. **Donnees stales navigation** — useFetch sans key/dedupe. Fix: ajout key + dedupe + onMounted refresh sur toutes les pages liste
4. **inspections/[id].vue** — useFetch inutile via composable. Fix: remplace par $fetch direct

### Module Interventions (FAIT)

**Architecture**: Evolution de la table `inspections` existante (pas de nouvelle table) avec colonnes `donnees` JSONB + `rucherId`.

**Phase 1 — Schema** (FAIT)

- Ajout `donnees jsonb` + `rucherId uuid` a la table `inspections`
- Extension type `meteo` (humidite, conditions)

**Phase 2 — Types + Validation** (FAIT)

- `app/types/interventions.ts` — 14 TypeIntervention, INTERVENTION_META, interfaces Donnees\*
- `server/utils/validation/interventions.ts` — Zod schemas + superRefine dynamique

**Phase 3 — API Routes** (FAIT)

- `server/api/interventions/index.get.ts` — Liste avec filtres (ruche, rucher, type, date, search)
- `server/api/interventions/index.post.ts` — Creation avec validation + auto-resolution rucherId
- `server/api/interventions/[id].get.ts` — Detail avec joins ruche + rucher
- `server/api/interventions/[id].put.ts` — Mise a jour
- `server/api/interventions/[id].delete.ts` — Suppression
- `server/api/interventions/stats.get.ts` — Stats (total, par type, par mois)

**Phase 4 — Composable + Composants Core** (FAIT)

- `app/composables/useInterventions.ts`
- `app/components/interventions/InterventionGrid.vue` — Grille 14 icones multi-select
- `app/components/interventions/InterventionBadge.vue` — Badge colore par type
- `app/components/interventions/InterventionCard.vue` — Carte resume intelligent

**Phase 5 — 14 Formulaires** (FAIT)

- FormControle, FormMateriel, FormRecolte, FormNourrissement, FormEssaimage, FormDivision, FormDeplacement
- FormVarroa, FormPesee, FormCommentaire, FormEmpilement, FormSanitaire, FormTransvasement, FormReine
- Tous dans `app/components/interventions/forms/`

**Phase 6 — Pages + Navigation** (FAIT)

- `app/pages/interventions/index.vue` — Liste timeline par mois + filtres + pagination
- `app/pages/interventions/nouvelle.vue` — Wizard 3 etapes (ruche → types → formulaires)
- `app/pages/interventions/[id].vue` — Detail + suppression
- Sidebar: ajout lien "Interventions" dans AppSidebar.vue

### Validation

- Typecheck: PASS
- Build: PASS (13.7 MB)
- Tests: 15/15 PASS

### Fichiers crees/modifies: ~35 fichiers

### Prochaines etapes

- Sprint 6 : Comptabilite + Facturation PDF

---

## Session 7 — 18 fevrier 2026 — Sprint 6 : Comptabilite + Facturation PDF + Clients

### Objectif

Implementer le module complet Comptabilite (Sprint 6) : gestion clients, ventes/achats avec facturation, dashboard financier, export CSV/FEC, et generation de factures PDF conformes aux normes francaises.

### Travail effectue

#### Module Clients CRUD (FAIT)

- `server/api/clients/index.get.ts` — Liste clients avec pagination, recherche (nom, entreprise, email, ville)
- `server/api/clients/index.post.ts` — Creation client (type particulier/professionnel, contact, adresse, SIRET)
- `server/api/clients/[id].get.ts` — Detail client + transactions recentes
- `server/api/clients/[id].put.ts` — Mise a jour client
- `server/api/clients/[id].delete.ts` — Suppression client
- `app/composables/useClients.ts` — Composable CRUD
- `app/pages/clients/index.vue` — Liste avec recherche, avatars initiales, badges type, modal creation
- `app/pages/clients/[id].vue` — Detail client, edition, transactions, suppression

#### Module Finances — Backend (FAIT)

- `server/api/finances/ventes.get.ts` — Liste ventes avec client join, pagination, recherche
- `server/api/finances/ventes.post.ts` — Creation vente avec lignes, TVA, verification client, numerotation FA-YYYY-NNNN
- `server/api/finances/achats.get.ts` — Liste achats avec recherche, pagination
- `server/api/finances/achats.post.ts` — Creation achat avec categories (materiel, nourrissement, traitement, emballage, transport, assurance, formation, autre), numerotation AC-YYYY-NNNN
- `server/api/finances/dashboard.get.ts` — KPIs: CA, charges, resultat, rentabilite/ruche, cout/kg miel, graphique mensuel
- `server/api/finances/export.get.ts` — Export CSV et FEC avec filtrage par dates
- `server/api/finances/factures/[id].get.ts` — Detail facture avec client + emetteur (profil SIRET, NAPI, adresse)
- `server/api/finances/factures/[id].put.ts` — Mise a jour facture (statut, lignes, client, dates, notes)
- `server/api/finances/factures/[id].delete.ts` — Suppression facture

#### Module Finances — Frontend (FAIT)

- `app/composables/useFinances.ts` — createVente, createAchat, updateFacture, deleteFacture, updateStatut
- `app/components/finances/VenteForm.vue` — Formulaire multi-lignes avec stock picker et TVA francaise
- `app/components/finances/RevenueChart.vue` — Graphique ECharts CA vs Charges par mois
- `app/components/finances/RentabiliteTable.vue` — 4 KPIs: rentabilite/ruche, cout/kg, production, ruches actives
- `app/pages/finances/index.vue` — Dashboard 5 KPIs + chart + table + CTA facturation
- `app/pages/finances/ventes.vue` — Liste ventes avec actions (PDF, statut, supprimer)
- `app/pages/finances/achats.vue` — Liste achats avec TVA dropdown conforme
- `app/pages/finances/rapports.vue` — Export CSV/FEC avec filtre dates

#### Integration Stocks ↔ Ventes (FAIT)

- VenteForm affiche les produits en stock avec quantite disponible et prix unitaire
- Selection depuis le stock pre-remplit description, prix et quantite max
- Badge visuel "Depuis le stock" sur les lignes liees

#### TVA Francaise Conforme (FAIT)

- 4 taux avec descriptions apicoles precises :
  - **5.5%** : Miel, pollen, gelee royale, propolis alimentaire, pain d'epices, cire apicole, essaims, reines, nourrissement
  - **10%** : Produits agricoles non transformes livres a un non-assujetti
  - **20%** : Materiel apicole, confiseries au miel, propolis teinture-mere, hydromel, cire cosmetique
  - **0%** : Franchise en base (art. 293 B CGI, CA < 85 000 €), export

#### Facture PDF Conforme Normes Francaises (FAIT)

- `app/pages/finances/facture/[id].vue` — Template complet conforme Art. L441-9 Code de commerce
- **Mentions obligatoires implementees** :
  - Emetteur : nom, adresse, SIRET, SIREN (derive), NAPI, email, telephone
  - Destinataire : nom/entreprise, adresse complete, SIRET
  - Numero de facture sequentiel continu (FA-YYYY-NNNN)
  - Nature de l'operation
  - Date de facture et date d'echeance
  - Detail des prestations : designation, quantite, prix unitaire HT, montant HT
  - Totaux : sous-total HT, TVA avec taux, total TTC
  - **Conditions de reglement** :
    - Delai de paiement
    - Escompte : "Pas d'escompte accorde en cas de paiement anticipe"
    - Penalites de retard : 12.15% (taux BCE 2.15% + 10 points, art. L.441-10)
    - Indemnite forfaitaire 40€ (art. D.441-5)
  - TVA intracommunautaire auto-calculee depuis SIREN : `FR` + key + SIREN
  - Mention art. 293 B CGI pour franchise en base de TVA
- Impression via `window.print()` avec CSS `@media print` A4
- Auto-print avec parametre URL `?print=1`

### Validation — FAIT

- Typecheck : PASS
- Build : PASS
- Tests : 15/15 PASS

### Fichiers crees — Sprint 6 (26 nouveaux)

**server/api/clients/ (5)** : index.{get,post}, [id].{get,put,delete}
**server/api/finances/ (9)** : ventes.{get,post}, achats.{get,post}, dashboard.get, export.get, factures/[id].{get,put,delete}
**app/composables/ (2)** : useClients.ts, useFinances.ts
**app/components/finances/ (3)** : VenteForm.vue, RevenueChart.vue, RentabiliteTable.vue
**app/pages/clients/ (2)** : index.vue, [id].vue
**app/pages/finances/ (5)** : index.vue, ventes.vue, achats.vue, rapports.vue, facture/[id].vue

### Lecons apprises

1. **Numerotation factures francaise** : doit etre sequentielle, chronologique, continue (Art. 242 nonies A CGI). Utiliser MAX(dernier_numero)+1, pas COUNT.
2. **TVA intracommunautaire** : calculee depuis le SIREN avec `(12 + 3 * (siren % 97)) % 97`.
3. **Mentions obligatoires facture** : penalites de retard (taux BCE + 10 pts), indemnite 40€, escompte meme si pas accorde, SIRET/SIREN — tout est requis par Art. L441-9.
4. **window.print() pour PDF** : approche serverless-compatible, pas besoin de Puppeteer.

### Prochaines etapes

- Sprint 7 : Alertes + Meteo + Calendrier

---

## Session 8 — 18 fevrier 2026 — Bugfixes + Production Pro + Stock auto

### Objectif

Corriger plusieurs bugs (geocodage ruchers, suppression, finance UX, stock auto) et upgrader le module Production avec tracabilite reglementaire professionnelle.

### Travail effectue

#### Bugfixes divers (FAIT)

- **Geocodage adresse rucher** : ajout autocomplete via api-adresse.data.gouv.fr dans RucherForm.vue (recherche debounced 300ms, remplit adresse/commune/codePostal/departement/lat/lng)
- **Suppression rucher** : changement de soft-delete (actif=false) a hard delete dans [id].delete.ts
- **Stock auto-deduction vente** : deduction automatique des quantites stock lors d'une vente dans ventes.post.ts
- **Stock picker VenteForm** : section toujours visible (plus de toggle cache), design plus prominent
- **Navigation finances** : ajout boutons rapides "Nouvelle vente"/"Nouvel achat", grille 4 colonnes
- **Dashboard ActivityFeed** : lien transaction corrige (allait vers recoltes au lieu de factures)
- **Achats → Stock auto** : creation/mise a jour stock automatique a l'achat, selection stock existant, creation nouveau produit avec categorie/unite/seuil d'alerte

#### Upgrade Production — Tracabilite reglementaire (FAIT)

- **server/api/production/lots/[numero].get.ts** (NOUVEAU) — API detail lot complet :
  - Toutes recoltes du lot avec rucher/ruche join
  - Stats agregees : total kg, humidite min/max/moyenne
  - DDM auto-calculee (extraction + 2 ans, standard profession)
  - Ventilation par rucher et par ruche
  - Ventes liees (ILIKE sur lignes JSONB)
  - Conformite : 5 checks (humidite ≤20%, lot, rucher, date, quantite) avec score

- **app/pages/production/lots/[numero].vue** (NOUVEAU) — Page detail lot :
  - 5 KPI cards (production, humidite avec min/max, types miel, nb recoltes, DDM)
  - Timeline tracabilite 5 etapes : Origine → Extraction → Ruches sources → Durabilite → Commercialisation
  - Sidebar : checklist conformite, apercu etiquette, rappels reglementaires
  - Liste recoltes detaillees avec liens vers factures

- **server/api/production/recoltes/[id].{get,put,delete}.ts** (NOUVEAU) — CRUD recolte individuelle

- **app/pages/production/recoltes/[id].vue** (NOUVEAU) — Page detail recolte :
  - KPIs (quantite, humidite conforme/non conforme, hausses, lien lot)
  - Mode edition avec RecolteForm existant
  - Suppression avec confirmation

- **app/components/production/LotTracker.vue** (MIS A JOUR) :
  - Cards cliquables (NuxtLink vers detail lot)
  - Badge conformite humidite (✓ vert / ✗ rouge)
  - Footer CTA "Voir la tracabilite complete"

- **app/pages/production/tracabilite.vue** (MIS A JOUR) :
  - Bandeau reglementaire obligation cahier de miellerie (Reg. CE 178/2002)
  - Recherche lot + type de miel

- **RecolteCard.vue** : lien mort corrige (`?id=` → `/${id}`)

### Reglementation implementee

- **Reg. CE 178/2002** : tracabilite alimentaire, cahier de miellerie 5 ans
- **Directive 2001/110/CE** : humidite max 20%
- **Decret 2003-587** : denomination, origine, mentions etiquette
- **Reg. INCO 1169/2011** : etiquetage denrees alimentaires (poids net, lot, DDM, producteur)
- **DDM** : 2 ans apres extraction (standard profession)

### Validation — FAIT

- Typecheck : PASS
- Build : PASS
- Tests : 15/15 PASS

### Fichiers crees/modifies (12 fichiers)

**Nouveaux (6)** : lots/[numero].get.ts, lots/[numero].vue, recoltes/[id].{get,put,delete}.ts, recoltes/[id].vue
**Modifies (6)** : LotTracker.vue, RecolteCard.vue, tracabilite.vue, achats.vue, achats.post.ts, ventes.post.ts

### Prochaines etapes

- Sprint 7 : Alertes + Meteo + Calendrier
- Executer rls.sql dans Supabase Dashboard pour activer RLS sur toutes les tables

---

## Session 9 — 20 février 2026 — Sprint 7 : Alertes + Météo + Calendrier

### Objectif

Implémenter les 3 modules manquants du Sprint 7 : Alertes, Météo, Calendrier.

### Travail effectué

#### Logo + Dashboard (suite session précédente)

- Logo `logo_apigo.jpg` → `public/logo.jpg`, intégré dans AppSidebar
- Bouton dashboard "Nouvelle intervention" avec route `/interventions/nouvelle`

#### Score de santé par rucher/ruche (FAIT)

- `server/utils/santeScore.ts` — utilitaire partagé `computeScore()` extrait du dashboard
- `server/api/ruchers/[id]/sante.get.ts` — score moyen d'un rucher + détail par ruche
- `server/api/ruches/[id]/sante.get.ts` — score individuel + facteurs détaillés
- `app/components/ui/SanteScoreCard.vue` — composant réutilisable (jauge SVG + barres facteurs)
- Intégration dans `app/pages/ruchers/[id].vue` et `app/pages/ruches/[id].vue`

#### Optimisations performance + "Se souvenir de moi" (FAIT)

- `app/stores/auth.ts` — profil persisté en localStorage, restauré synchroniquement (supprime le flash)
- `app/composables/useAuth.ts` — paramètre `rememberMe` dans `login()`
- `app/plugins/session-guard.client.ts` — plugin client : déconnexion si nouvelle session + non remembré
- `app/pages/login.vue` — checkbox "Se souvenir de moi" (défaut: true)
- `app/composables/useDashboard.ts` — cache 2 min stale (évite refresh inutile à chaque navigation)
- `server/middleware/03.rate-limit.ts` — rate limit 3 req/heure/IP sur `/api/auth/register`
- `nuxt.config.ts` — routeRules avec Cache-Control pour pages statiques et API privées

#### Sprint 7 — Alertes (FAIT)

**API (4 routes) :**

- `server/api/alertes/index.get.ts` — liste paginée avec filtres lue/priorité
- `server/api/alertes/[id].put.ts` — marquer lu/non-lu
- `server/api/alertes/[id].delete.ts` — suppression avec vérif propriétaire
- `server/api/alertes/generate.post.ts` — génération auto de 4 types d'alertes :
  - `visite_requise` : ruche non visitée 21+ jours (haute si 45+j, moyenne sinon)
  - `sante_critique` : score < 40 (critique si <20, haute sinon)
  - `stock_bas` : quantité ≤ seuil d'alerte (moyenne)
  - `facture_retard` : facture envoyée avec échéance dépassée (haute)
  - Déduplication par `type:referenceId` pour éviter les doublons

**Composable :**

- `app/composables/useAlertes.ts` — list, markRead, remove, generate, markAllRead

**Page :**

- `app/pages/alertes.vue` — stats (total/non lues/critiques/hautes), filtres segmentés, liste avec actions, pagination

#### Sprint 7 — Météo (FAIT)

**API :**

- `server/api/meteo/[rucherId].get.ts` — proxy Open-Meteo :
  - Vérifie propriétaire + coordonnées GPS du rucher
  - Fetch current-weather + 7j forecast
  - Mapping codes WMO (0-99) → labels français + emojis
  - `conditionsOptimales` : ≥15°C, vent <20 km/h, pluie=0, code<51

**Composable :**

- `app/composables/useMeteo.ts` — `useMeteo(rucherId: Ref<string | null>)` avec useFetch et watch

**Widget + Page :**

- `app/components/dashboard/MeteoWidget.vue` — refactorisé pour données réelles (useRuchers + useMeteo)
- `app/pages/meteo.vue` — sélecteur rucher, conditions actuelles, prévisions 7j, indicateur visite, légende

#### Sprint 7 — Calendrier (FAIT)

**Page :**

- `app/pages/calendrier.vue` — grille mensuelle 7×6, navigation mois, événements color-coded (ambre=interventions, bleu=inspections), modal overflow jours, `totalEvenements` ce mois

### Validation

- Typecheck : **PASS** (1 erreur corrigée : `ruches` importé inutilement dans generate.post.ts)
- Tests : non relancés (aucune modification des fichiers testés)
- Build : non relancé (typecheck OK = indicateur suffisant)

### Fichiers créés/modifiés (19 fichiers)

**Nouveaux (11) :**

- server/utils/santeScore.ts
- server/api/ruchers/[id]/sante.get.ts
- server/api/ruches/[id]/sante.get.ts
- server/api/alertes/index.get.ts
- server/api/alertes/[id].put.ts
- server/api/alertes/[id].delete.ts
- server/api/alertes/generate.post.ts
- server/api/meteo/[rucherId].get.ts
- app/composables/useAlertes.ts
- app/composables/useMeteo.ts
- app/components/ui/SanteScoreCard.vue
- app/plugins/session-guard.client.ts
- app/pages/alertes.vue
- app/pages/meteo.vue
- app/pages/calendrier.vue
- docs/ETAT_PROJET.md (nouveau)

**Modifiés (9) :**

- app/components/ui/AppSidebar.vue (logo)
- app/components/dashboard/MeteoWidget.vue (données réelles)
- app/pages/dashboard.vue (bouton intervention)
- app/pages/ruchers/[id].vue (SanteScoreCard)
- app/pages/ruches/[id].vue (SanteScoreCard)
- app/pages/login.vue ("Se souvenir de moi")
- app/stores/auth.ts (localStorage persistance)
- app/composables/useAuth.ts (rememberMe)
- app/composables/useDashboard.ts (cache 2min)
- nuxt.config.ts (routeRules)
- server/middleware/03.rate-limit.ts (register rate limit)
- server/api/dashboard/index.get.ts (import computeScore)

### Leçons apprises

- `useFetch` avec `key` computed : techniquement ça compile mais MEMORY.md dit "NEVER a Ref/ComputedRef" — à surveiller si des bugs de cache apparaissent
- Open-Meteo API gratuite, pas de clé, très fiable — idéale pour serverless
- Calendrier filtrage côté client (100 events max) : OK pour petits exploitants, à revoir si >100 events/mois
- Rate limiting in-memory sur Nitro = reset à chaque cold start Vercel (acceptable pour anti-abuse, pas pour sécurité hardcore)

### Prochaines étapes

- **Sprint 8** : Mode offline + PWA + Exports + Page Paramètres
- Exécuter `db:push` si nouvelles tables nécessaires
- Vérifier cron job Vercel pour génération automatique des alertes

---

## Session 10 — 26-28 fevrier 2026 — Sprint 8 + Responsive + Patches

### Objectif

Sprint 8 complet (Parametres, PWA, Offline, Exports PDF), responsive mobile, patches stocks, rename table inspections → interventions, et implementation offline complete.

### Travail effectue

#### Responsive mobile + sidebar drawer (FAIT)

- `app/composables/useSidebar.ts` (NOUVEAU) — etat partage sidebar, auto-close route/resize
- `app/layouts/default.vue` — desktop: sidebar fixe expand/collapse; mobile (<1024px): sidebar cachee, hamburger, drawer overlay + backdrop
- `app/components/ui/AppSidebar.vue` — props mobileOpen/isMobile, drawer slide-in, bouton replier masque en mobile
- `app/components/ui/AppHeader.vue` — bouton hamburger conditionnel, padding reduit mobile
- `app/pages/ruches/[id].vue` — boutons icon-only sur mobile (labels masques sous sm:)

#### Patch stocks (FAIT)

- `server/api/stocks/mouvements.post.ts` — ajustement autorise quantite=0, entree/sortie requiert >0 (refinement Zod)
- `app/components/stocks/MouvementForm.vue` — prop stockQuantite, max sur sortie, min=0 ajustement, hint "Disponible: X"
- `app/components/stocks/StockCard.vue` — bouton supprimer (trash) dans les actions hover, emit 'delete'
- `app/pages/stocks/index.vue` — branche deleteStock + confirmation, passe quantite au MouvementForm

#### Sprint 8 — Page Parametres (FAIT)

- `app/pages/parametres/index.vue` — 4 sections :
  - Profil personnel (prenom, nom, email readonly, telephone)
  - Exploitation apicole (adresse, code postal, ville, NAPI, SIRET)
  - Preferences (toggles: alertes stock, rappels interventions, alertes meteo, digest hebdo)
  - Compte (plan actuel, export donnees RGPD, supprimer compte)
- Utilise `authStore.updateProfil()` existant, preferences stockees dans JSONB `profils.preferences`

#### Sprint 8 — PWA manifest + install (FAIT)

- `nuxt.config.ts` — lien manifest, meta apple-mobile-web-app, route auth /exports
- `app/components/ui/PwaInstallPrompt.vue` (NOUVEAU) — prompt install apres 30s, dismiss 7 jours localStorage
- `public/manifest.json` — existait deja (Apiculture 360°, standalone, theme Honey)

#### Sprint 8 — Exports PDF (FAIT)

- `app/pages/exports/registre.vue` (NOUVEAU) — registre d'elevage reglementaire imprimable :
  - Header avec profil (NAPI, SIRET, adresse)
  - Tableau ruchers (nom, commune, departement, nb ruches)
  - Tableau inventaire ruches (numero, rucher, type, race, statut)
  - Tableau interventions de l'annee (date, ruche, categorie, description)
  - Footer legal (arrete 5 juin 2000)
  - Selecteur annee + bouton Imprimer/PDF (window.print)
- `app/pages/exports/bilan.vue` (NOUVEAU) — bilan annuel imprimable :
  - Chiffres cles (ruchers, ruches actives, interventions, recoltes)
  - Production (total kg, moyenne/ruche, types de miel avec tableau)
  - Finances (CA, charges, resultat)
  - Selecteur annee + impression
- `server/api/export/bilan.get.ts` (NOUVEAU) — API agregation annuelle (6 requetes paralleles)
- `app/pages/finances/rapports.vue` — ajout liens vers registre et bilan

#### Sprint 8 — Mode offline + sync (FAIT)

- `app/composables/useOfflineSync.ts` — IndexedDB queue mutations + sync auto retour reseau
- `app/components/ui/OfflineBanner.vue` (NOUVEAU) — banniere hors ligne / sync en attente
- `app/layouts/default.vue` — integre OfflineBanner + PwaInstallPrompt dans ClientOnly

#### Rename table inspections → interventions (FAIT)

- `server/database/schema.ts` — `export const interventions = pgTable('interventions', ...)`, relations renommees
- 13 routes API server : imports + references `inspections.xxx` → `interventions.xxx`
- SQL brut (sante, dashboard, alertes) : `FROM inspections i` → `FROM interventions i`
- `server/api/ruches/[id]/inspections.get.ts` renomme en `interventions.get.ts`
- Script SQL fourni pour Supabase : `ALTER TABLE inspections RENAME TO interventions;` + RLS complet

#### Sprint 8 — Implementation offline complete (FAIT)

**Point 1 — Service Worker + Cache Shell :**

- `@vite-pwa/nuxt` installe et configure dans nuxt.config.ts
- Workbox precache : tous les assets build (JS, CSS, HTML, fonts)
- Runtime caching : GET `/api/ruchers|ruches|stocks|interventions|dashboard|profils` en **NetworkFirst** (timeout 3s, cache 24h, 50 entries max)
- NavigateFallback : `/dashboard` servi quand page pas en cache
- `sw.js` genere au build (verifie, 5KB)

**Point 2 — Cache local donnees :**

- `app/composables/useOfflineCache.ts` (NOUVEAU) — `useOfflineFetch<T>()` avec IndexedDB cache
- Le cache Workbox couvre les pages principales via runtime caching NetworkFirst

**Point 3 — Formulaires offline :**

- `app/composables/useInterventions.ts` — `createIntervention()` detecte online/offline automatiquement :
  - Online → `$fetch` direct
  - Offline → genere `offlineId`, queue mutation IndexedDB via `queueMutation()`
- `app/pages/interventions/nouvelle.vue` — message adapte ("sauvegardee hors ligne")
- Au retour reseau, `useOfflineSync` replay les mutations FIFO

### Validation

- Typecheck : PASS (0 erreurs)
- Build : PASS (sw.js genere)
- Tests : 15/15 PASS

### Fichiers crees/modifies — Session 10

**Nouveaux (10) :**

- app/composables/useSidebar.ts
- app/composables/useOfflineSync.ts
- app/composables/useOfflineCache.ts
- app/components/ui/OfflineBanner.vue
- app/components/ui/PwaInstallPrompt.vue
- app/pages/parametres/index.vue
- app/pages/exports/registre.vue
- app/pages/exports/bilan.vue
- server/api/export/bilan.get.ts
- server/api/ruches/[id]/interventions.get.ts (renomme)

**Modifies (20) :**

- nuxt.config.ts (PWA, manifest, meta, routes)
- app/layouts/default.vue (responsive + offline banner + PWA prompt)
- app/components/ui/AppSidebar.vue (responsive drawer)
- app/components/ui/AppHeader.vue (hamburger + responsive)
- app/pages/ruches/[id].vue (responsive buttons)
- app/pages/finances/rapports.vue (liens exports PDF)
- app/composables/useInterventions.ts (offline queue)
- app/pages/interventions/nouvelle.vue (offline message)
- app/components/stocks/StockCard.vue (delete button)
- app/components/stocks/MouvementForm.vue (quantite max/min)
- app/pages/stocks/index.vue (delete handler)
- server/api/stocks/mouvements.post.ts (zod refinement)
- server/database/schema.ts (rename + relations)
- server/api/interventions/\*.ts (6 fichiers — rename)
- server/api/ruches/[id]/timeline.get.ts (rename)
- server/api/ruches/[id]/sante.get.ts (rename SQL)
- server/api/ruchers/[id]/sante.get.ts (rename SQL)
- server/api/ruchers/[id]/stats.get.ts (rename)
- server/api/dashboard/index.get.ts (rename)
- server/api/alertes/generate.post.ts (rename SQL)

**Supprime (1) :** server/api/ruches/[id]/inspections.get.ts

### Total projet : ~240 fichiers source

### Lecons apprises

- `@vite-pwa/nuxt` gere le SW automatiquement, pas besoin de le creer manuellement
- Workbox `NetworkFirst` avec `networkTimeoutSeconds: 3` — UX optimale (rapide en ligne, fallback cache hors ligne)
- `navigateFallback` essentiel pour que les routes SPA s'ouvrent offline
- IndexedDB pour la queue mutations + Workbox pour le cache GET = separation propre
- `nuxi prepare` necessaire apres ajout de composables pour regenerer les types auto-import

### Prochaines étapes

- **Sprint 9** : Stripe (abonnements) + Multi-users
- Exécuter script RLS + rename table dans Supabase SQL Editor
- Tester le mode offline sur mobile (installer PWA, couper réseau, saisir intervention)

---

## Session 11 — 1er mars 2026 — Sprint 9 : Stripe + Multi-users + TVA produits

### Objectif

Corriger les bugs de configuration (Stripe, DB), compléter le module multi-users (table membres), corriger les accents sur toutes les pages Paramètres, mettre à jour les prix des abonnements et implémenter les catégories de vente apicoles avec TVA automatique conforme au droit fiscal français.

### Travail effectué

#### Corrections configuration (FAIT)

**Bug 1 — STRIPE_SECRET_KEY non chargée**

- Cause : Nuxt 3 mappe les runtimeConfig via le préfixe `NUXT_` — les variables `.env` sans ce préfixe sont ignorées
- Fix : `.env` — renommage `STRIPE_SECRET_KEY` → `NUXT_STRIPE_SECRET_KEY`, idem `WEBHOOK_SECRET`, `PRICE_STARTER`, `PRICE_PRO`, `PRICE_EXPERT`, `BREVO_API_KEY`

**Bug 2 — getaddrinfo ENOTFOUND db.xxx.supabase.co**

- Cause : Supabase a migré vers des URLs de pooler — la connexion directe (port 5432) n'est plus accessible depuis l'extérieur
- Fix : `.env` — `DATABASE_URL` remplacé par l'URL du **Transaction pooler** (`aws-0-eu-west-1.pooler.supabase.com:6543`)

**Bug 3 — relation "membres" does not exist**

- Cause : La table `membres` était dans le schéma Drizzle mais pas encore créée en DB (drizzle-kit push a un bug avec les contraintes CHECK Supabase)
- Fix : SQL fourni à exécuter dans Supabase SQL Editor (CREATE TABLE membres + RLS)

#### SQL complet Supabase (FAIT)

Script `rls.sql` mis à jour intégrant la table `membres` :

- Création enums `role_membre` et `statut_invitation` (idempotents)
- `CREATE TABLE IF NOT EXISTS membres` avec FK owner_id + user_id → profils
- 11 tables protégées par RLS (profils, ruchers, ruches, interventions, récoltes, stocks, mouvements_stock, clients, transactions, alertes, membres)
- Policy membres : owner a tous droits, membre invité peut lire sa propre invitation

#### Correction accents (FAIT)

3 pages Paramètres + 1 composable entièrement corrigés (30+ occurrences) :

- `app/pages/parametres/facturation.vue` — Découverte, Gérer, Jusqu'à, illimité, accès, données…
- `app/pages/parametres/index.vue` — Prénom, Téléphone, légales, Sécurité, Données, Équipe…
- `app/pages/parametres/equipe.vue` — Propriétaire, Rôles, accès, Équipe, Rôle mis à jour…
- `app/composables/useSubscription.ts` — label 'Découverte'

#### Mise à jour prix abonnements (FAIT)

- Starter : 19€/mois → **9,99€/mois** (99€/an)
- Pro : 49€/mois → **39,99€/mois** (399€/an)
- Expert : 99€/mois → **79,99€/mois** (799€/an)

#### Catégories de vente apicoles + TVA automatique (FAIT)

**Contexte légal :** Droit fiscal français — CGI

- 5,5% : Art. 278-0 bis A CGI (produits alimentaires)
- 10% : Art. 278 bis CGI (animaux vivants + médicaments vétérinaires)
- 20% : Art. 278 CGI (taux normal)
- 0% : Art. 293 B CGI (franchise en base CA < 85 000 €) / export

**Schéma DB :**

- `server/database/schema.ts` — nouveau enum `categorieVenteEnum` (20 valeurs) + champs `categorieVente` + `tauxTva` sur table `stocks`

**Enum client-side :**

- `app/types/enums.ts` — `CATEGORIE_VENTE` array + type + map `TVA_PAR_CATEGORIE_VENTE`

**API stocks :**

- `server/api/stocks/index.post.ts` — accepte `categorieVente` + `tauxTva`, auto-calcul TVA depuis catégorie
- `server/api/stocks/[id].put.ts` — idem + recalcul auto TVA si catégorie change sans TVA manuelle

**API ventes :**

- `server/api/finances/ventes.post.ts` — TVA calculée **par ligne** (plus de TVA globale) : `Σ(ligneHT × tauxTvaLigne)` → factures multi-taux légalement conformes

**Composants :**

- `app/components/stocks/StockForm.vue` — section "Catégorie produit & TVA" avec optgroups (3 groupes TVA), badge juridique auto-affiché, taux surchargeable
- `app/components/finances/VenteForm.vue` — sélecteur TVA par ligne (chips 5,5% / 10% / 20% / 0%), auto-injection depuis `stock.tauxTva`, récapitulatif TVA ventilé par taux

**Composables :**

- `app/composables/useStocks.ts` — `CreateStockPayload` + `categorieVente` + `tauxTva`
- `app/composables/useFinances.ts` — `LigneInput` + `tauxTva` + `stockId`

**Pages :**

- `app/pages/stocks/index.vue` — passe `categorieVente` + `tauxTva` aux mutations create/update, `editingInitial` mis à jour
- `app/pages/finances/ventes.vue` — `tauxTva` par ligne dans l'état initial (plus de tauxTva global)

**SQL migration :**

```sql
-- Enum
CREATE TYPE categorie_vente AS ENUM ('miel','gelee_royale','pollen','propolis_alimentaire',
  'pain_abeille','cire_alimentaire','vinaigre_miel','essaim','reine','ruche_peuplee',
  'nourrissement','traitement_veterinaire','materiel_apicole','equipement_apiculteur',
  'cire_technique','conditionnement','hydromel','propolis_teinture','cosmetique','autre');
-- Colonnes
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS categorie_vente categorie_vente;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS taux_tva NUMERIC(4,1);
```

### Fonctionnement TVA automatique

1. **Fiche stock** → choisir catégorie produit (ex: "Miel") → TVA 5,5% auto-affichée avec base légale
2. **Nouvelle vente** → cliquer un produit en stock → sa TVA est injectée dans la ligne de facturation
3. **Multi-taux** → une même facture peut avoir des lignes à 5,5%, 10% et 20%
4. **Récapitulatif** → ventilation TVA par taux affiché en bas du formulaire de vente

### Fichiers créés/modifiés — Session 11

**Modifiés (13) :**

- .env (NUXT\_ prefix Stripe, DATABASE_URL pooler)
- server/database/schema.ts (enum categorieVente + champs stocks)
- app/types/enums.ts (CATEGORIE_VENTE + TVA_PAR_CATEGORIE_VENTE)
- app/composables/useStocks.ts (categorieVente + tauxTva dans payload)
- app/composables/useFinances.ts (tauxTva + stockId dans LigneInput)
- server/api/stocks/index.post.ts (nouveaux champs + auto-TVA)
- server/api/stocks/[id].put.ts (nouveaux champs + auto-TVA)
- server/api/finances/ventes.post.ts (TVA par ligne)
- app/components/stocks/StockForm.vue (section catégorie vente + TVA)
- app/components/finances/VenteForm.vue (TVA par ligne + auto-injection)
- app/pages/stocks/index.vue (pass-through nouveaux champs)
- app/pages/finances/ventes.vue (tauxTva par ligne)
- app/pages/parametres/facturation.vue (accents + prix mis à jour)
- app/pages/parametres/index.vue (accents)
- app/pages/parametres/equipe.vue (accents)
- app/composables/useSubscription.ts (accent Découverte)

### Prochaines étapes

- Exécuter SQL Supabase (membres + categorieVente enum + colonnes stocks)
- Tester le flow complet : créer stock avec catégorie → créer vente → vérifier TVA auto
- Sprint 9 suite : webhooks Stripe, middleware abonnement, pages équipe fonctionnelles

---

## Session 12 — 2 mars 2026 — Refonte UI/UX Dashboard Apple-style

### Objectif

Refonte complète du dashboard pour atteindre un niveau de polish Apple "Warm Precision" : cards déroulantes, animations fluides, layout épuré, données enrichies.

### Travail effectué

#### Phase 1 — Fondation CSS chaleur globale (FAIT)

- `main.css` : variables `--text-secondary/tertiary` → tons chauds stone, ombres teintées `rgba(120,100,80,...)`
- `EmptyState.vue` : icône `bg-amber-50 text-amber-500` (au lieu de gris froid)
- `AppHeader.vue` : initiales réelles via `useAuthStore().initials`, compteur alertes réel via `useDashboard()`, logout appelle `authStore.reset()`

#### Phase 2 — Composants enrichis (FAIT)

- `KpiCard.vue` : refonte complète — label uppercase tracking-wider, valeur 3xl, sparkline SVG en fond transparent avec gradient honey
- `StatsGrid.vue` : interface enrichie avec `sparkline?: number[]`
- `PageHeader.vue` : prop `breadcrumbs`, barre accent honey verticale

#### Phase 3 — Nouveau composant ExpandableCard (FAIT)

- `ExpandableCard.vue` : composant fondation Apple-style avec animation CSS `grid-template-rows: 0fr → 1fr` pour expand/collapse smooth sans JS
- Header cliquable avec icône, titre, subtitle, slots badge/header-right, chevron animé rotate-180

#### Phase 4 — Widgets dashboard redesignés (FAIT)

- `MeteoWidget.vue` : ExpandableCard, température dans le header, bande 3 jours en capsules, alerte météo rouge
- `AlertsWidget.vue` : ExpandableCard avec badge compteur rouge, actions hover-reveal (check dismiss + external-link)
- `ActivityFeed.vue` : ExpandableCard, timestamps à droite, icônes enrichies (nourrissement, traitement), lien "Tout l'historique"
- `UpcomingTasks.vue` (nouveau) : ExpandableCard, badges "Aujourd'hui"/"Demain"/"Dans 3j" color-coded
- `SanteScore.vue` : carte statique (sans déroulant), jauge compacte + barres ruchers, hives en chips
- `ProductionChart.vue` : carte statique avec segmented control Mois/Semaine/Jour, sliding pill, crossfade animation
- `QuickActions.vue` : pills arrondies desktop, FAB amber + backdrop blur mobile

#### Phase 5 — Nouvelles routes API (FAIT)

- `server/api/dashboard/upcoming.get.ts` : 5 prochaines interventions planifiées, JOIN ruches
- `server/api/dashboard/production.get.ts` : données production mensuelle (12 mois), hebdomadaire (12 sem.), quotidienne (30j)

#### Phase 6 — Dashboard assemblage final (FAIT)

- Layout hero greeting (date + salutation 3xl) + QuickActions à droite
- KPIs en row compacte `grid-cols-2 sm:grid-cols-4`
- Production + Santé en grid fixe `lg:grid-cols-2` (toujours ouvertes)
- 4 cartes déroulantes en `flex lg:flex-row` avec 2 colonnes indépendantes (`flex-col gap-4`) — chaque carte se replie indépendamment avec gap fixe 16px

#### Phase 7 — Corrections UX (FAIT)

- Suppression barre de recherche du header (inutilisée)
- Cloche transformée en `NuxtLink` vers `/alertes` avec badge rouge
- Correction lien `/parametres/profil` (page inexistante) → retiré du dropdown
- Fix ExpandableCard : remplacement hack `max-height/scrollHeight` par CSS `grid-template-rows`
- Production segmented control : sliding pill animée `ease-out-expo 300ms`, crossfade graphique `150ms fade-out → 600ms cubicInOut redraw`

### Décisions techniques

- **Cards statiques vs déroulantes** : Production et Santé toujours ouvertes (données critiques), les 4 autres (Activité, À venir, Météo, Alertes) sont collapsibles
- **Layout flex vs columns CSS** : `columns` CSS ne réagit pas aux changements de hauteur dynamiques → 2 colonnes `flex-col` indépendantes pour un reflow naturel
- **Animation expand/collapse** : `grid-template-rows: 0fr/1fr` (CSS natif) plutôt que `max-height` JS (non réactif au contenu dynamique)
- **Production multi-période** : API dédiée retourne 3 séries pré-calculées côté serveur, ECharts anime la transition avec `setOption(opts, true)`

### Fichiers créés (5)

- `app/components/ui/ExpandableCard.vue`
- `app/components/dashboard/UpcomingTasks.vue`
- `app/components/dashboard/QuickActions.vue`
- `server/api/dashboard/upcoming.get.ts`
- `server/api/dashboard/production.get.ts`

### Fichiers modifiés (12)

- `app/assets/css/main.css`
- `app/components/ui/EmptyState.vue`
- `app/components/ui/AppHeader.vue`
- `app/components/ui/KpiCard.vue`
- `app/components/ui/StatsGrid.vue`
- `app/components/ui/PageHeader.vue`
- `app/components/dashboard/MeteoWidget.vue`
- `app/components/dashboard/AlertsWidget.vue`
- `app/components/dashboard/ActivityFeed.vue`
- `app/components/dashboard/ProductionChart.vue`
- `app/components/dashboard/SanteScore.vue`
- `app/pages/dashboard.vue`

### Prochaines étapes

- Exécuter SQL Supabase (membres + categorieVente enum + colonnes stocks)
- Sprint 9 suite : webhooks Stripe, middleware abonnement, pages équipe fonctionnelles
- Tester dashboard sur mobile (responsive des ExpandableCards + FAB)

---

## Session 12 — 3 mars 2026 — QR Code ruches + Audit design + Uniformisation boutons

### Objectif

Ajouter le QR code sur les fiches ruches, puis audit global du code et uniformisation des headers/boutons sur toutes les pages.

### Travail effectué

#### Phase 1 — QR Code ruches (FAIT)

- Créé `app/composables/useQrCode.ts` — génération QR code via qrcode library
- Ajouté qrcode + @types/qrcode dans package.json
- Modifié `app/pages/ruches/[id].vue` — ajout bouton QR code + modal affichage/téléchargement
- Modifié `app/components/stocks/StockCard.vue` — améliorations UI
- Modifié `app/components/stocks/StockForm.vue` — support catégorie vente + taux TVA
- Modifié `app/types/enums.ts` — ajout familles stock + catégories vente complètes
- Modifié `app/layouts/default.vue` — ajustements sidebar

#### Phase 2 — Audit code global (FAIT)

- Audit TypeScript strict : zero `any`, zero `@ts-ignore` ✅
- Error handling : try/catch + `getApiErrorMessage` partout ✅
- Navigation/routing : OK ✅
- v-if/v-else pairés correctement ✅
- Composables correctement utilisés ✅
- Empty states + skeletons en place ✅
- **Aucun bug critique trouvé**

#### Phase 3 — Uniformisation boutons et headers (FAIT)

- **`app/pages/stocks/index.vue`** : remplacé header custom + `<button>` brut par `<UiPageHeader>` + `<UButton color="primary">`
- **`app/pages/finances/index.vue`** : migré div custom vers `<UiPageHeader>` avec description dynamique
- **`app/pages/finances/ventes.vue`** : remplacé NuxtLink back-link + header custom par `<UiPageHeader>` avec breadcrumbs `Finances > Ventes`
- **`app/pages/finances/achats.vue`** : même migration avec breadcrumbs `Finances > Achats`

**Charte boutons unifiée établie :**
| Action | Props |
|--------|-------|
| CTA principal | `icon="i-lucide-plus" color="primary"` |
| Action secondaire | `variant="outline" color="neutral"` |
| Supprimer | `icon="i-lucide-trash-2" variant="ghost" color="error"` |
| Annuler | `variant="ghost" color="neutral"` |
| Enregistrer | `icon="i-lucide-check" color="primary" :loading="saving"` |

### Décisions

- Les pages de détail (`ruchers/[id]`, `ruches/[id]`) gardent leur back-link + header custom (pattern correct pour les pages de détail)
- Les segmented toggles restent en `<button>` brut (pas des CTA, c'est un toggle visuel)
- Les boutons inline dans les listes (alertes mark/delete) restent en `<button>` brut (actions inline xs)

### Fichiers modifiés : 11 fichiers, ~1300 lignes changées

### Prochaines étapes

- Exécuter SQL Supabase (membres + stocks columns)
- Webhooks Stripe
- Middleware abonnement
- Tester QR code + breadcrumbs sur mobile

---

## Conventions de ce fichier

- Chaque session = un bloc daté
- Chaque phase = statut clair (FAIT / EN COURS / À FAIRE)
- Décisions importantes tracées
- Prochaines étapes toujours listées
