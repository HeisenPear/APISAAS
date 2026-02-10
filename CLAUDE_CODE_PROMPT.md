# 🐝 APICULTURE 360° — PROMPT CLAUDE CODE

> **Version** : 2.0 — Février 2026
> **Stack** : Nuxt 3 Nitro (full-stack) + Supabase + Vercel + Capacitor
> **Auteur** : Antoine — La Jocondienne
> **Objectif** : SaaS de gestion apicole tout-en-un, du rucher à la comptabilité

---

## 📋 TABLE DES MATIÈRES

1. [Contexte projet](#1-contexte-projet)
2. [Stack technique](#2-stack-technique)
3. [Design system — Philosophy Apple](#3-design-system)
4. [Architecture projet](#4-architecture-projet)
5. [Schéma base de données](#5-schéma-base-de-données)
6. [Modules & fonctionnalités](#6-modules--fonctionnalités)
7. [API Routes Nitro](#7-api-routes-nitro)
8. [Agents IA — Répartition des tâches](#8-agents-ia)
9. [Workflow de développement](#9-workflow-de-développement)
10. [Design guidelines détaillées](#10-design-guidelines)
11. [Performance & qualité](#11-performance--qualité)
12. [Déploiement](#12-déploiement)

---

## 1. CONTEXTE PROJET

### Le problème

63 000 apiculteurs en France. Aucune solution ne propose dans un seul produit : gestion ruches + suivi sanitaire + comptabilité + facturation + stocks + analytics + mode hors-ligne. Les apiculteurs jonglent entre carnets papier, fichiers Excel et logiciels génériques.

### La solution

**Apiculture 360°** : plateforme SaaS française tout-en-un couvrant l'intégralité des besoins d'un apiculteur professionnel, du rucher à la comptabilité. Interface simple comme une app Apple, utilisable avec des gants au rucher.

### Cible

- **Primaire** : ~5 600 apiculteurs de 50+ ruches (pros, pluri-actifs)
- **Secondaire** : ~10 000 apiculteurs sérieux (10-50 ruches)
- **Tertiaire** : coopératives, groupements (CUMA, GIE, GAEC)

### Business model

| Plan       | Ruches   | Prix/mois | Prix/an |
| ---------- | -------- | --------- | ------- |
| Découverte | 0-10     | Gratuit   | Gratuit |
| Starter    | 0-20     | 19€       | 190€    |
| Pro        | 21-100   | 49€       | 490€    |
| Expert     | Illimité | 99€       | 990€    |

---

## 2. STACK TECHNIQUE

### Règle absolue : 1 langage, 1 repo, 1 déploiement

```
TypeScript PARTOUT — front, back, API, tests, scripts
```

### Stack complète

| Couche              | Technologie              | Justification                                       |
| ------------------- | ------------------------ | --------------------------------------------------- |
| **Full-stack**      | Nuxt 3 (Vue 3 + Nitro)   | SSR + SPA + API serverless dans 1 repo              |
| **Base de données** | Supabase (PostgreSQL 16) | Auth + DB + Storage + Realtime, free tier généreux  |
| **ORM**             | Drizzle ORM              | SQL-first, léger, cold start rapide pour serverless |
| **Auth**            | Supabase Auth            | Email/password, OAuth, magic links — gratuit        |
| **Storage**         | Supabase Storage         | Photos ruches, documents, exports — S3-compatible   |
| **Paiements**       | Stripe SDK               | Abonnements récurrents, portail client, webhooks    |
| **Emails**          | Brevo (ex-Sendinblue)    | Français, RGPD, 300 emails/jour gratuit             |
| **Météo**           | Open-Meteo               | Gratuit, open source, prévisions 16 jours           |
| **Cartographie**    | Leaflet + OpenStreetMap  | Gratuit, open source, PostGIS via Supabase          |
| **Graphiques**      | Apache ECharts           | Plus puissant que Chart.js, animations fluides      |
| **PDF**             | Puppeteer / Gotenberg    | Factures HTML→PDF pixel-perfect                     |
| **Queues**          | Inngest (si besoin)      | Queues serverless TypeScript, pas nécessaire au MVP |
| **Déploiement**     | Vercel                   | Auto-deploy à chaque git push, CDN global           |
| **CI/CD**           | GitHub Actions           | Tests auto, lint, type-check                        |
| **Monitoring**      | Sentry                   | Erreurs frontend + API                              |
| **Mobile**          | PWA → Capacitor          | PWA d'abord, apps natives Store en phase 3          |
| **UI Components**   | Nuxt UI v3 + custom      | Base solide + composants custom Apple-style         |
| **Icons**           | Lucide Icons             | Cohérent, léger, tree-shakable                      |
| **Animations**      | @vueuse/motion + CSS     | Transitions fluides Apple-style                     |
| **Forms**           | VeeValidate + Zod        | Validation TypeScript-first                         |
| **State**           | Pinia                    | Store management Vue 3 officiel                     |

### Versions exactes

```json
{
  "nuxt": "^3.15",
  "vue": "^3.5",
  "typescript": "^5.7",
  "drizzle-orm": "^0.38",
  "@supabase/supabase-js": "^2.47",
  "stripe": "^17",
  "@nuxt/ui": "^3",
  "echarts": "^5.6",
  "leaflet": "^1.9",
  "zod": "^3.24",
  "pinia": "^2.3",
  "@vueuse/core": "^12",
  "@vueuse/motion": "^2.5"
}
```

---

## 3. DESIGN SYSTEM — PHILOSOPHY APPLE

### Principe fondamental

> **"Le meilleur design est celui que tu ne remarques pas."**
> L'interface doit être si intuitive qu'un apiculteur de 60 ans la maîtrise en 5 minutes.
> Penser iPhone : chaque interaction est fluide, chaque pixel a sa place.

### Direction esthétique : "Warm Precision"

Ni froid corporate, ni fun enfantin. Un design **chaleureux mais précis** — comme un instrument de travail Apple.

### Palette de couleurs

```css
:root {
  /* — Signature — */
  --honey: #f5a623; /* Or miel — accent principal */
  --honey-light: #fff3dc; /* Fond subtle honey */
  --honey-dark: #c47d0e; /* Hover/active honey */

  /* — Neutres chauds (pas gris froid !) — */
  --surface-primary: #fafaf8; /* Fond principal — blanc cassé chaud */
  --surface-secondary: #f3f2ef; /* Fond cards — lin */
  --surface-tertiary: #e8e6e1; /* Fond input/hover — sable */
  --surface-elevated: #ffffff; /* Cards surélevées — blanc pur */

  /* — Textes — */
  --text-primary: #1a1a18; /* Titres — noir chaud */
  --text-secondary: #6b6860; /* Corps — gris chaud */
  --text-tertiary: #9c978e; /* Labels, captions — gris doux */
  --text-inverse: #fafaf8; /* Texte sur fond sombre */

  /* — Sémantiques — */
  --success: #34a853; /* Vert nature — colonies saines */
  --warning: #f5a623; /* Honey — attention requise */
  --danger: #d93025; /* Rouge discret — alertes critiques */
  --info: #4285f4; /* Bleu Google-style — info neutre */

  /* — Sidebar — */
  --sidebar-bg: #1c1c1e; /* Noir Apple */
  --sidebar-hover: #2c2c2e; /* Hover item */
  --sidebar-active: #3a3a3c; /* Item actif */
  --sidebar-text: #e5e5e7; /* Texte sidebar */
  --sidebar-accent: #f5a623; /* Honey accent sidebar */

  /* — Ombres (chaudes, pas grises) — */
  --shadow-sm: 0 1px 2px rgba(26, 26, 24, 0.04);
  --shadow-md: 0 4px 12px rgba(26, 26, 24, 0.06);
  --shadow-lg: 0 12px 40px rgba(26, 26, 24, 0.08);
  --shadow-xl: 0 24px 60px rgba(26, 26, 24, 0.12);

  /* — Rayons — */
  --radius-sm: 8px; /* Inputs, badges */
  --radius-md: 12px; /* Cards, dropdowns */
  --radius-lg: 16px; /* Modals, panels */
  --radius-xl: 24px; /* Large containers */
  --radius-full: 9999px; /* Pills, avatars */

  /* — Transitions Apple — */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;
}
```

### Typographie

```css
/* — Display / Titres — */
font-family:
  'SF Pro Display',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  system-ui,
  sans-serif;

/* — Corps — */
font-family:
  'SF Pro Text',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  system-ui,
  sans-serif;

/* — Mono (code, données) — */
font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;

/* Fallback si SF Pro non dispo : utiliser Inter comme alternative */
/* @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); */

/* — Échelle — */
--text-xs: 0.75rem; /* 12px — captions */
--text-sm: 0.8125rem; /* 13px — labels */
--text-base: 0.9375rem; /* 15px — corps (Apple standard) */
--text-lg: 1.0625rem; /* 17px — sous-titres */
--text-xl: 1.25rem; /* 20px — titres section */
--text-2xl: 1.5rem; /* 24px — titres page */
--text-3xl: 2rem; /* 32px — hero, dashboards */

/* — Line heights — */
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.7;

/* — Font weights — */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Principes d'interaction Apple-style

#### 1. Gestes et transitions

```
- Chaque changement de page = transition fluide (slide, fade, scale)
- Chaque action = feedback immédiat (ripple, scale-down au click)
- Les cards s'élèvent au hover (translateY -2px + shadow-lg)
- Les modals apparaissent avec un léger scale (0.95→1) + fade
- Le sidebar a un backdrop-blur (glassmorphism subtil)
- Les listes se chargent en stagger (décalage 50ms entre items)
```

#### 2. Micro-interactions obligatoires

```
- Bouton CTA : scale(0.97) au mousedown, bounce-back au mouseup
- Toggle switch : spring animation (léger dépassement)
- Notifications : slide-in depuis le haut + auto-dismiss
- Graphiques : animation d'entrée progressive des données
- KPI cards : count-up animation au chargement
- Suppression : item shrink + fade-out avant retrait du DOM
- Formulaires : labels qui glissent vers le haut au focus (floating labels)
```

#### 3. Layout & Spatial Design

```
- Sidebar fixe à gauche : 260px, collapsible en icônes (72px)
- Header top : 64px, sticky, backdrop-blur sur scroll
- Content : max-width 1440px, padding 32px, grid 12 colonnes
- Cards : padding 24px, gap 24px, radius 12px
- Sections : séparées par 48px minimum
- Mobile : sidebar → bottom tab bar (5 items max)
- Touch targets : minimum 44x44px (Apple HIG)
```

#### 4. Patterns UX innovants

**Command Palette (⌘K)**

- Recherche globale : ruches, ruchers, inspections, clients, commandes
- Actions rapides : "Ajouter visite", "Voir production", "Exporter PDF"
- Navigation instantanée entre modules
- Style Spotlight macOS / Linear

**Carte interactive plein écran**

- Vue satellite/terrain des ruchers
- Clusters de ruches avec code couleur santé
- Click rucher → panel latéral glissant avec détails
- Filtres par statut, production, dernière visite
- Géolocalisation auto du téléphone

**Dashboard adaptatif**

- Widgets réarrangeables en drag & drop
- KPI animés avec sparklines intégrées
- Timeline d'activité récente (style GitHub)
- Météo contextuelle par rucher sélectionné
- Mode focus : 1 rucher à la fois, deep-dive

**Quick Actions (FAB contextuel)**

- Bouton flottant en bas à droite (mobile)
- Actions changent selon la page :
  - Dashboard → "Nouvelle visite", "Note rapide"
  - Ruches → "Ajouter ruche", "Inspection rapide"
  - Production → "Enregistrer récolte"
- Animation : fan-out des options au tap

**Mode Terrain**

- Activable manuellement ou auto (détection GPS proche d'un rucher)
- Interface simplifiée : gros boutons, peu de texte
- Saisie vocale (Web Speech API)
- Gestion offline complète (IndexedDB + sync auto)
- Timer de visite intégré

---

## 4. ARCHITECTURE PROJET

### Structure monorepo

```
apiculture-360/
├── .claude/
│   └── agents/                    # 7 agents IA
│       ├── spec-orchestrator.md
│       ├── nitro-api-architect.md  # (ex laravel-architect)
│       ├── nuxt-frontend.md        # (ex nuxt-expert)
│       ├── database-optimizer.md
│       ├── test-engineer.md
│       ├── security-auditor.md
│       └── code-reviewer.md
├── CLAUDE.md                       # Constitution du projet
│
├── nuxt.config.ts                  # Config Nuxt 3
├── app.config.ts                   # Config runtime (thème, etc.)
├── tailwind.config.ts              # Tailwind avec design tokens
├── drizzle.config.ts               # Config Drizzle ORM
├── package.json
├── tsconfig.json
├── .env.example
│
├── app/                            # Frontend Nuxt 3
│   ├── layouts/
│   │   ├── default.vue             # Layout principal (sidebar + header)
│   │   ├── auth.vue                # Layout login/register
│   │   └── terrain.vue             # Layout mode terrain (simplifié)
│   │
│   ├── pages/
│   │   ├── index.vue               # Landing page (SSR + SEO)
│   │   ├── login.vue
│   │   ├── register.vue
│   │   ├── onboarding/
│   │   │   ├── index.vue           # Wizard onboarding 4 étapes
│   │   │   └── [...step].vue
│   │   ├── dashboard/
│   │   │   └── index.vue           # Dashboard principal
│   │   ├── ruchers/
│   │   │   ├── index.vue           # Liste + carte
│   │   │   ├── [id].vue            # Détail rucher
│   │   │   └── nouveau.vue
│   │   ├── ruches/
│   │   │   ├── index.vue           # Liste avec filtres
│   │   │   ├── [id].vue            # Fiche ruche complète
│   │   │   └── nouveau.vue
│   │   ├── inspections/
│   │   │   ├── index.vue           # Timeline inspections
│   │   │   ├── [id].vue            # Détail inspection
│   │   │   └── nouvelle.vue        # Formulaire smart
│   │   ├── production/
│   │   │   ├── index.vue           # Dashboard production
│   │   │   ├── recoltes.vue        # Liste récoltes
│   │   │   └── traçabilite.vue     # Lots & suivi
│   │   ├── stocks/
│   │   │   ├── index.vue           # Inventaire
│   │   │   └── alertes.vue
│   │   ├── finances/
│   │   │   ├── index.vue           # Dashboard financier
│   │   │   ├── ventes.vue          # Facturation
│   │   │   ├── achats.vue          # Charges
│   │   │   └── rapports.vue        # Exports comptables
│   │   ├── clients/
│   │   │   ├── index.vue
│   │   │   └── [id].vue
│   │   ├── calendrier.vue          # Planning inspections + traitements
│   │   ├── meteo.vue               # Météo par rucher
│   │   └── parametres/
│   │       ├── index.vue           # Profil, abonnement
│   │       ├── exploitation.vue    # Config exploitation
│   │       └── facturation.vue     # Stripe portal
│   │
│   ├── components/
│   │   ├── ui/                     # Design system custom
│   │   │   ├── AppSidebar.vue
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppCommandPalette.vue
│   │   │   ├── AppQuickAction.vue
│   │   │   ├── KpiCard.vue
│   │   │   ├── DataTable.vue
│   │   │   ├── EmptyState.vue
│   │   │   ├── LoadingSkeleton.vue
│   │   │   ├── PageHeader.vue
│   │   │   ├── StatsGrid.vue
│   │   │   ├── Timeline.vue
│   │   │   └── ConfirmDialog.vue
│   │   ├── ruchers/
│   │   │   ├── RucherCard.vue
│   │   │   ├── RucherMap.vue       # Carte Leaflet
│   │   │   ├── RucherForm.vue
│   │   │   └── RucherPanel.vue     # Panel latéral carte
│   │   ├── ruches/
│   │   │   ├── RucheCard.vue
│   │   │   ├── RucheForm.vue
│   │   │   ├── RucheTimeline.vue
│   │   │   └── RucheHealthBadge.vue
│   │   ├── inspections/
│   │   │   ├── InspectionForm.vue   # Formulaire wizard multi-étapes
│   │   │   ├── InspectionCard.vue
│   │   │   └── InspectionQuick.vue  # Version terrain rapide
│   │   ├── production/
│   │   │   ├── RecolteForm.vue
│   │   │   ├── ProductionChart.vue
│   │   │   └── LotTracker.vue
│   │   ├── finances/
│   │   │   ├── VenteForm.vue
│   │   │   ├── FacturePDF.vue
│   │   │   ├── RevenueChart.vue
│   │   │   └── RentabiliteTable.vue
│   │   ├── dashboard/
│   │   │   ├── WidgetGrid.vue       # Widgets drag & drop
│   │   │   ├── ActivityFeed.vue
│   │   │   ├── MeteoWidget.vue
│   │   │   └── AlertsWidget.vue
│   │   └── shared/
│   │       ├── PhotoUploader.vue
│   │       ├── DateRangePicker.vue
│   │       └── SearchGlobal.vue
│   │
│   ├── composables/
│   │   ├── useAuth.ts
│   │   ├── useRuchers.ts
│   │   ├── useRuches.ts
│   │   ├── useInspections.ts
│   │   ├── useProduction.ts
│   │   ├── useStocks.ts
│   │   ├── useFinances.ts
│   │   ├── useClients.ts
│   │   ├── useMeteo.ts
│   │   ├── useOffline.ts           # Sync IndexedDB
│   │   ├── useCommandPalette.ts
│   │   ├── useNotifications.ts
│   │   └── useSubscription.ts      # Gestion plan Stripe
│   │
│   ├── stores/
│   │   ├── auth.ts
│   │   ├── ruchers.ts
│   │   ├── ruches.ts
│   │   ├── inspections.ts
│   │   ├── ui.ts                    # Theme, sidebar state, etc.
│   │   └── offline.ts              # Queue offline sync
│   │
│   ├── utils/
│   │   ├── formatters.ts           # Dates FR, devises, poids
│   │   ├── validators.ts           # Schemas Zod partagés
│   │   ├── constants.ts            # Enums, types de ruches, races
│   │   └── helpers.ts
│   │
│   └── types/
│       ├── models.ts               # Types DB synchronisés
│       ├── api.ts                   # Types request/response
│       └── enums.ts                 # TypeRuche, StatutColonie, etc.
│
├── server/                          # Backend Nuxt Nitro
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.post.ts
│   │   │   ├── register.post.ts
│   │   │   ├── logout.post.ts
│   │   │   ├── me.get.ts
│   │   │   └── reset-password.post.ts
│   │   ├── ruchers/
│   │   │   ├── index.get.ts         # Liste avec pagination + filtres
│   │   │   ├── index.post.ts        # Création
│   │   │   ├── [id].get.ts          # Détail avec ruches
│   │   │   ├── [id].put.ts          # Mise à jour
│   │   │   ├── [id].delete.ts       # Suppression soft
│   │   │   └── [id]/
│   │   │       ├── ruches.get.ts    # Ruches du rucher
│   │   │       └── stats.get.ts     # Stats du rucher
│   │   ├── ruches/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].put.ts
│   │   │   ├── [id].delete.ts
│   │   │   └── [id]/
│   │   │       ├── inspections.get.ts
│   │   │       ├── recoltes.get.ts
│   │   │       └── timeline.get.ts
│   │   ├── inspections/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].get.ts
│   │   │   ├── [id].put.ts
│   │   │   └── [id].delete.ts
│   │   ├── production/
│   │   │   ├── recoltes.get.ts
│   │   │   ├── recoltes.post.ts
│   │   │   ├── lots.get.ts
│   │   │   ├── lots.post.ts
│   │   │   └── stats.get.ts
│   │   ├── stocks/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].put.ts
│   │   │   ├── mouvements.post.ts
│   │   │   └── alertes.get.ts
│   │   ├── finances/
│   │   │   ├── ventes.get.ts
│   │   │   ├── ventes.post.ts
│   │   │   ├── achats.get.ts
│   │   │   ├── achats.post.ts
│   │   │   ├── factures/
│   │   │   │   ├── [id].get.ts
│   │   │   │   └── [id]/pdf.get.ts   # Génération PDF facture
│   │   │   ├── dashboard.get.ts       # KPIs financiers
│   │   │   └── export.get.ts          # Export FEC / CSV
│   │   ├── clients/
│   │   │   ├── index.get.ts
│   │   │   ├── index.post.ts
│   │   │   ├── [id].get.ts
│   │   │   └── [id].put.ts
│   │   ├── meteo/
│   │   │   └── [rucherId].get.ts      # Proxy Open-Meteo
│   │   ├── stripe/
│   │   │   ├── checkout.post.ts       # Créer session checkout
│   │   │   ├── portal.post.ts         # Portail client Stripe
│   │   │   └── webhook.post.ts        # Webhook Stripe
│   │   ├── dashboard/
│   │   │   └── index.get.ts           # Données agrégées dashboard
│   │   └── export/
│   │       ├── registre.get.ts        # Export registre d'élevage PDF
│   │       └── bilan.get.ts           # Export bilan annuel
│   │
│   ├── middleware/
│   │   ├── auth.ts                     # Vérification token Supabase
│   │   ├── subscription.ts             # Vérification plan actif
│   │   └── rate-limit.ts               # Rate limiting par IP/user
│   │
│   ├── utils/
│   │   ├── supabase.ts                 # Client Supabase serveur
│   │   ├── db.ts                       # Instance Drizzle
│   │   ├── stripe.ts                   # Client Stripe
│   │   ├── meteo.ts                    # Client Open-Meteo
│   │   ├── pdf.ts                      # Génération PDF
│   │   ├── email.ts                    # Client Brevo
│   │   ├── validators.ts              # Schemas Zod serveur
│   │   └── errors.ts                   # Error handling centralisé
│   │
│   └── database/
│       ├── schema.ts                   # Schéma Drizzle complet
│       ├── migrations/                 # Migrations auto Drizzle
│       └── seed.ts                     # Données de démo
│
├── public/
│   ├── favicon.ico
│   ├── icons/                          # PWA icons
│   └── manifest.json                   # PWA manifest
│
├── tests/
│   ├── unit/
│   │   ├── server/                     # Tests API routes
│   │   └── composables/                # Tests composables
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── ruchers.spec.ts
│   │   ├── inspections.spec.ts
│   │   └── finances.spec.ts
│   └── setup.ts
│
└── docs/
    ├── architecture/
    │   └── ADR-001-nuxt-fullstack.md
    ├── api/
    │   └── endpoints.md
    └── design/
        └── design-system.md
```

---

## 5. SCHÉMA BASE DE DONNÉES

### Tables Drizzle (PostgreSQL via Supabase)

```typescript
// server/database/schema.ts

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

// === ENUMS ===

export const typeRucheEnum = pgEnum('type_ruche', [
  'dadant_10',
  'dadant_12',
  'langstroth',
  'warre',
  'voirnot',
  'kenyane',
  'autre',
]);

export const statutColonieEnum = pgEnum('statut_colonie', [
  'active',
  'faible',
  'orpheline',
  'essaimee',
  'morte',
  'vendue',
  'fusionnee',
]);

export const qualiteReineEnum = pgEnum('qualite_reine', [
  'excellente',
  'bonne',
  'moyenne',
  'faible',
  'absente',
  'inconnue',
]);

export const raceAbeilleEnum = pgEnum('race_abeille', [
  'noire',
  'buckfast',
  'carnica',
  'italienne',
  'caucasienne',
  'hybride',
  'inconnue',
]);

export const categorieStockEnum = pgEnum('categorie_stock', [
  'cadres',
  'hausses',
  'corps',
  'nourrissement',
  'traitement',
  'conditionnement',
  'equipement',
  'outillage',
  'autre',
]);

export const typeTransactionEnum = pgEnum('type_transaction', ['vente', 'achat']);

export const statutFactureEnum = pgEnum('statut_facture', [
  'brouillon',
  'envoyee',
  'payee',
  'en_retard',
  'annulee',
]);

export const planEnum = pgEnum('plan', ['decouverte', 'starter', 'pro', 'expert']);

// === TABLES ===

// Utilisateurs (extension de Supabase Auth)
export const profils = pgTable('profils', {
  id: uuid('id').primaryKey(), // = auth.users.id
  email: text('email').notNull().unique(),
  nom: text('nom').notNull(),
  prenom: text('prenom').notNull(),
  telephone: text('telephone'),
  adresse: text('adresse'),
  codePostal: text('code_postal'),
  ville: text('ville'),
  siret: text('siret'), // N° SIRET si pro
  napi: text('napi'), // N° apiculteur DGAL
  plan: planEnum('plan').default('decouverte').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  onboardingComplete: boolean('onboarding_complete').default(false),
  preferences: jsonb('preferences').default({}), // { theme, langue, etc. }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Ruchers
export const ruchers = pgTable('ruchers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  description: text('description'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  adresse: text('adresse'),
  codePostal: text('code_postal'),
  commune: text('commune'),
  departement: text('departement'),
  environnement: text('environnement'), // Forêt, culture, mixte...
  notesAcces: text('notes_acces'), // Comment y accéder
  photoUrl: text('photo_url'),
  actif: boolean('actif').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Ruches
export const ruches = pgTable('ruches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucherId: uuid('rucher_id')
    .notNull()
    .references(() => ruchers.id, { onDelete: 'cascade' }),
  numero: text('numero').notNull(), // Numéro/nom unique
  type: typeRucheEnum('type').notNull(),
  statut: statutColonieEnum('statut').default('active').notNull(),
  raceAbeille: raceAbeilleEnum('race_abeille').default('inconnue'),
  qualiteReine: qualiteReineEnum('qualite_reine').default('inconnue'),
  dateInstallation: timestamp('date_installation'),
  origineEssaim: text('origine_essaim'), // Achat, essaimage, division...
  marquageReine: text('marquage_reine'), // Couleur/année
  nombreCadres: integer('nombre_cadres'),
  nombreHausses: integer('nombre_hausses'),
  notes: text('notes'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Inspections / Visites
export const inspections = pgTable('inspections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  dateVisite: timestamp('date_visite').notNull(),
  type: text('type').notNull(), // visite_printemps, controle, traitement, recolte, hivernage
  meteo: jsonb('meteo'), // { temp, vent, ciel, humidite }

  // État colonie
  forceColonie: integer('force_colonie'), // 1-5
  couvain: integer('couvain'), // 1-5 (0 = absent)
  reserves: integer('reserves'), // 1-5
  comportement: text('comportement'), // calme, agressive, nerveuse
  reineVue: boolean('reine_vue'),
  celluleRoyale: boolean('cellule_royale'),
  signeEssaimage: boolean('signe_essaimage'),

  // Sanitaire
  varroa: integer('varroa'), // Comptage (chute naturelle)
  traitementApplique: text('traitement_applique'), // Nom du traitement
  maladieObservee: text('maladie_observee'),

  // Actions
  actionsRealisees: jsonb('actions_realisees'), // ["ajout_hausse", "nourrissement", ...]
  nourrissementType: text('nourrissement_type'), // Sirop, candi, etc.
  nourrissementQuantite: decimal('nourrissement_quantite'), // En kg ou litres

  // Notes & photos
  notes: text('notes'),
  photos: jsonb('photos').default([]), // URLs array
  dureeMinutes: integer('duree_minutes'),

  // Sync offline
  syncedAt: timestamp('synced_at'),
  offlineId: text('offline_id'), // ID local pour sync

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Récoltes
export const recoltes = pgTable('recoltes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucherId: uuid('rucher_id').references(() => ruchers.id),
  rucheId: uuid('ruche_id').references(() => ruches.id),
  dateRecolte: timestamp('date_recolte').notNull(),
  typeMiel: text('type_miel').notNull(), // Acacia, toutes fleurs, châtaigner...
  quantiteKg: decimal('quantite_kg', { precision: 8, scale: 2 }).notNull(),
  humidite: decimal('humidite', { precision: 4, scale: 1 }), // % humidité
  nombreHausses: integer('nombre_hausses'),
  numeroLot: text('numero_lot'), // Traçabilité
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Stocks
export const stocks = pgTable('stocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  categorie: categorieStockEnum('categorie').notNull(),
  quantite: decimal('quantite', { precision: 10, scale: 2 }).notNull(),
  unite: text('unite').notNull(), // pièces, kg, litres, pots...
  seuilAlerte: decimal('seuil_alerte', { precision: 10, scale: 2 }),
  prixUnitaire: decimal('prix_unitaire', { precision: 8, scale: 2 }),
  fournisseur: text('fournisseur'),
  emplacement: text('emplacement'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Mouvements de stock
export const mouvementsStock = pgTable('mouvements_stock', {
  id: uuid('id').primaryKey().defaultRandom(),
  stockId: uuid('stock_id')
    .notNull()
    .references(() => stocks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id),
  type: text('type').notNull(), // entree, sortie, ajustement
  quantite: decimal('quantite', { precision: 10, scale: 2 }).notNull(),
  motif: text('motif'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Clients
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // particulier, professionnel
  nom: text('nom').notNull(),
  prenom: text('prenom'),
  entreprise: text('entreprise'),
  email: text('email'),
  telephone: text('telephone'),
  adresse: text('adresse'),
  codePostal: text('code_postal'),
  ville: text('ville'),
  siret: text('siret'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions (achats + ventes)
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => clients.id),
  type: typeTransactionEnum('type').notNull(),
  numero: text('numero'), // N° facture/bon
  dateTransaction: timestamp('date_transaction').notNull(),
  dateEcheance: timestamp('date_echeance'),
  statut: statutFactureEnum('statut').default('brouillon'),
  sousTotal: decimal('sous_total', { precision: 10, scale: 2 }).notNull(),
  tva: decimal('tva', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  pdfUrl: text('pdf_url'),
  notes: text('notes'),
  lignes: jsonb('lignes').default([]), // [{description, quantite, prixUnitaire, total}]
  categorie: text('categorie'), // Pour classification comptable
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Alertes
export const alertes = pgTable('alertes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // varroa, stock_bas, inspection_due, meteo, facture_retard
  titre: text('titre').notNull(),
  message: text('message').notNull(),
  priorite: text('priorite').notNull(), // basse, moyenne, haute, critique
  lue: boolean('lue').default(false),
  actionUrl: text('action_url'), // Lien vers la ressource concernée
  referenceType: text('reference_type'), // ruche, rucher, stock, transaction
  referenceId: uuid('reference_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Row Level Security (Supabase)

```sql
-- Chaque table a une politique RLS :
-- l'utilisateur ne voit que SES données
ALTER TABLE ruchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own ruchers" ON ruchers
  FOR ALL USING (user_id = auth.uid());

-- Répéter pour : ruches, inspections, recoltes, stocks, mouvements_stock,
-- clients, transactions, alertes
```

---

## 6. MODULES & FONCTIONNALITÉS

### Phase 1 — MVP (Mois 1-4)

#### Module Auth & Onboarding

- Login email/password + magic link
- Register avec onboarding wizard (4 étapes) :
  1. Infos personnelles (nom, adresse, NAPI)
  2. Premier rucher (nom, localisation GPS auto)
  3. Premières ruches (ajout rapide par lot)
  4. Choix du plan (Stripe checkout)
- Reset password
- Session persistante (Supabase Auth tokens)

#### Module Dashboard

- KPIs animés (count-up) : ruches actives, production saison, CA, prochaine inspection
- Sparklines intégrées dans chaque KPI
- Graphique production mensuelle (ECharts, area chart)
- Graphique répartition santé colonies (donut chart)
- Météo du rucher principal (widget compact)
- Timeline activité récente (dernières inspections, récoltes, ventes)
- Alertes actives (stock bas, inspections dues, factures en retard)

#### Module Ruchers

- Liste en cards avec miniature carte + stats
- Carte interactive plein écran (Leaflet + clusters)
- Click card ou marker → page détail rucher
- Formulaire création/édition avec géolocalisation auto
- Panel latéral sur la carte : infos rucher + liste ruches
- Stats : nombre ruches, production totale, dernière visite

#### Module Ruches

- Liste avec filtres (statut, rucher, type, race)
- Fiche individuelle complète :
  - Informations générales (numéro, type, race, reine)
  - Timeline chronologique (inspections, récoltes, traitements)
  - Graphiques de suivi (force colonie, varroa, production)
  - Photos historiques
  - Badge santé visuel (vert/jaune/orange/rouge)
- Ajout rapide par lot (5 ruches d'un coup)

#### Module Inspections

- Formulaire wizard multi-étapes intelligent :
  1. Sélection ruche + date + météo auto
  2. État colonie (sliders visuels 1-5 pour force, couvain, réserves)
  3. Sanitaire (varroa, traitements, observations)
  4. Actions réalisées (checkboxes : ajout hausse, nourrissement, etc.)
  5. Notes + photos
- Templates pré-remplis : visite printemps, contrôle varroa, récolte, hivernage
- Timer de visite intégré
- Mode terrain : version simplifiée gros boutons

#### Module Production

- Dashboard : production saison, comparaison N/N-1, production par rucher
- Formulaire récolte : rucher, ruches, type miel, quantité, humidité, lot
- Traçabilité lots : numéro, rucher d'origine, date, type, quantité
- Graphiques : évolution mensuelle, répartition par type de miel

#### Module Stocks

- Inventaire visuel par catégorie (cards avec icônes)
- Alertes stock bas (seuil configurable)
- Historique mouvements (entrées, sorties, ajustements)
- Coût de revient automatique

#### Module Comptabilité simplifiée

- Achats → charges auto-catégorisées
- Ventes → produits auto-calculés
- Dashboard : CA, charges, résultat, rentabilité/ruche, coût/kg miel
- Export CSV

### Phase 2 — Avancé (Mois 5-7)

#### Alertes intelligentes

- Rappels traitements varroa selon calendrier
- Alertes météo (gel, canicule) par rucher
- Inspections dues (configurable : tous les X jours)
- Stock bas
- Factures en retard
- Push notifications (Web Push API)
- Email digest hebdomadaire

#### Météo intégrée

- Prévisions 7 jours par rucher (Open-Meteo, auto GPS)
- Historique météo
- Alertes gel/canicule
- Calendrier apicole régional (floraisons suggérées)

#### Commercial

- Gestion clients B2C/B2B
- Catalogue produits (miel, pollen, propolis, cire...)
- Devis/Factures PDF professionnelles
- Envoi email direct
- Relances automatiques
- Conformité facturation française (mentions légales)

#### Comptabilité avancée

- Export FEC (Fichier des Écritures Comptables)
- Prévisionnel trésorerie 12 mois
- Analyse rentabilité par ruche, par rucher, par produit
- Seuil de rentabilité

#### Mode hors-ligne

- Service Worker + IndexedDB
- Saisie inspections offline complète
- Sync automatique au retour réseau
- Indicateur visuel sync (vert = synced, orange = en attente)

### Phase 3 — Scaling (Mois 8-9)

#### Apps natives (Capacitor)

- Wrapping Nuxt → iOS/Android
- Push notifications natives (FCM/APNs)
- Caméra native, GPS haute précision
- Publication App Store + Google Play

#### Exports avancés

- Bilan annuel PDF
- Registre d'élevage réglementaire PDF
- Bilan sanitaire
- Stats production (PDF, Excel, CSV)

#### API REST publique

- Documentation OpenAPI/Swagger
- Webhooks
- Intégrations tierces (comptables, marketplaces)

#### Multi-utilisateurs

- Rôles : admin, apiculteur, comptable (lecture seule)
- Partage de ruchers entre utilisateurs
- Logs d'activité

---

## 7. API ROUTES NITRO — CONVENTIONS

### Structure URL

```
GET    /api/[resource]          → Liste paginée
POST   /api/[resource]          → Création
GET    /api/[resource]/[id]     → Détail
PUT    /api/[resource]/[id]     → Mise à jour
DELETE /api/[resource]/[id]     → Suppression (soft delete)
GET    /api/[resource]/[id]/[sub-resource] → Sous-ressources
```

### Pattern standard pour chaque route

```typescript
// server/api/ruchers/index.get.ts
import { z } from 'zod';
import { db } from '~/server/utils/db';
import { ruchers } from '~/server/database/schema';
import { eq, desc, ilike, and, sql } from 'drizzle-orm';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  actif: z.coerce.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  // 1. Auth
  const user = await requireAuth(event);

  // 2. Validation
  const query = await getValidatedQuery(event, querySchema.parse);

  // 3. Query DB avec filtres
  const conditions = [eq(ruchers.userId, user.id)];
  if (query.search) conditions.push(ilike(ruchers.nom, `%${query.search}%`));
  if (query.actif !== undefined) conditions.push(eq(ruchers.actif, query.actif));

  const offset = (query.page - 1) * query.limit;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(ruchers)
      .where(and(...conditions))
      .orderBy(desc(ruchers.createdAt))
      .limit(query.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(ruchers)
      .where(and(...conditions)),
  ]);

  // 4. Response
  return {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: Number(countResult[0].count),
      totalPages: Math.ceil(Number(countResult[0].count) / query.limit),
    },
  };
});
```

### Middleware Auth standard

```typescript
// server/utils/auth.ts
import { serverSupabaseUser } from '#supabase/server';

export async function requireAuth(event: H3Event) {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Non authentifié' });
  }
  return user;
}
```

### Error handling centralisé

```typescript
// server/utils/errors.ts
export function notFound(resource: string) {
  throw createError({ statusCode: 404, message: `${resource} introuvable` });
}

export function forbidden() {
  throw createError({ statusCode: 403, message: 'Accès interdit' });
}

export function badRequest(message: string) {
  throw createError({ statusCode: 400, message });
}
```

---

## 8. AGENTS IA — RÉPARTITION DES TÂCHES

### Mapping agents → nouvelle stack

| Agent                    | Ancien rôle               | Nouveau rôle                            |
| ------------------------ | ------------------------- | --------------------------------------- |
| **@spec-orchestrator**   | Coordination Laravel+Nuxt | Coordination Nuxt full-stack + Supabase |
| **@nitro-api-architect** | Laravel backend           | API Nitro + Drizzle + Supabase          |
| **@nuxt-frontend**       | Frontend Nuxt             | Frontend + Design system Apple          |
| **@database-optimizer**  | MySQL + Eloquent          | PostgreSQL + Drizzle + Supabase RLS     |
| **@test-engineer**       | PHPUnit + Vitest          | Vitest + Playwright (TypeScript only)   |
| **@security-auditor**    | Sécurité Laravel          | Sécurité Supabase + RLS + API Nitro     |
| **@code-reviewer**       | Review code               | Review + deploy Vercel + performance    |

### @spec-orchestrator — Orchestrateur principal

**Responsabilités :**

- Analyse les specs de chaque module
- Décompose en tâches atomiques
- Délègue aux agents spécialisés
- Génère les ADRs (Architecture Decision Records)
- Valide les Quality Gates entre phases
- Maintient le CHANGELOG.md

**Workflow de délégation par feature :**

```
1. Spec + ADR                       → @spec-orchestrator
2. Schéma DB + migrations           → @database-optimizer
3. API routes Nitro                 → @nitro-api-architect
4. Frontend pages + composants      → @nuxt-frontend
5. Tests unitaires + E2E            → @test-engineer
6. Audit sécurité                   → @security-auditor
7. Review finale + merge            → @code-reviewer
```

### @nitro-api-architect — Backend API

**Responsabilités :**

- Toutes les routes dans `server/api/`
- Middlewares (auth, rate-limit, subscription)
- Utils serveur (supabase.ts, stripe.ts, email.ts, pdf.ts)
- Validation Zod côté serveur
- Intégration Stripe (checkout, webhooks, portal)
- Intégration Brevo (emails transactionnels)
- Intégration Open-Meteo (météo)
- Génération PDF (factures, registre, bilan)
- Export FEC / CSV

**Standards :**

- Chaque route suit le pattern : auth → validate → query → response
- Zod schema pour TOUS les inputs
- Error handling centralisé (utils/errors.ts)
- Types partagés avec le frontend (types/)
- Pas de logique métier dans les routes — extraire dans utils/services si > 30 lignes

### @nuxt-frontend — Frontend & Design System

**Responsabilités :**

- Toutes les pages dans `app/pages/`
- Tous les composants dans `app/components/`
- Tous les composables dans `app/composables/`
- Stores Pinia dans `app/stores/`
- Design system Apple-style (couleurs, typo, animations, interactions)
- Layouts (default, auth, terrain)
- Command Palette (⌘K)
- Mode terrain
- PWA (Service Worker, manifest, offline)
- Responsive (desktop-first, mobile excellent)
- Accessibilité (ARIA, focus management, keyboard nav)
- Animations et micro-interactions

**Standards :**

- Composants < 200 lignes (découper si plus)
- Props TypeScript strict
- Emits déclarés
- Composables pour toute logique réutilisable
- Tailwind CSS uniquement (pas de CSS scopé sauf exception)
- Skeleton loaders sur tous les chargements
- Empty states illustrés sur toutes les listes vides
- Transitions page-to-page (slide ou fade)
- JAMAIS de `any` en TypeScript

### @database-optimizer — Base de données

**Responsabilités :**

- Schéma Drizzle complet (`server/database/schema.ts`)
- Migrations Drizzle
- Index stratégiques (userId, rucherId, dates)
- Row Level Security Supabase (politique par table)
- Seeds de données de démo
- Requêtes complexes (agrégations dashboard, stats)
- Performance queries (EXPLAIN ANALYZE)
- Supabase Functions si besoin (triggers, computed)

**Standards :**

- UUID pour toutes les clés primaires
- Timestamps `createdAt` + `updatedAt` sur toutes les tables
- Soft delete via champ `actif` ou `deletedAt` (jamais de DELETE physique)
- Index composite sur `(userId, createdAt)` pour les requêtes courantes
- Index sur toute FK
- Contraintes NOT NULL explicites
- Enums PostgreSQL pour les valeurs fixes

### @test-engineer — Tests & Qualité

**Responsabilités :**

- Tests unitaires API routes (Vitest)
- Tests composables (Vitest)
- Tests E2E parcours critiques (Playwright)
- Coverage > 80% backend, > 70% frontend
- Tests Zod schemas
- Tests offline/sync
- CI pipeline GitHub Actions

**Tests prioritaires :**

```
1. Auth (login, register, session, permissions)
2. CRUD ruchers/ruches (création, édition, suppression)
3. Inspections (formulaire multi-étapes, offline)
4. Finances (facturation, calculs, export)
5. Stripe (webhook, subscription)
```

### @security-auditor — Sécurité

**Responsabilités :**

- RLS Supabase (chaque table = policy `user_id = auth.uid()`)
- Validation inputs (Zod) sur TOUTES les routes
- Rate limiting API
- CORS configuration
- Headers sécurité (CSP, X-Frame-Options, etc.)
- Protection Stripe webhook (signature verification)
- Sanitization données utilisateur
- Audit OWASP Top 10
- RGPD (suppression compte, export données, consentement)

### @code-reviewer — Review & Déploiement

**Responsabilités :**

- Review code avant merge (qualité, lisibilité, performance)
- Vérification TypeScript strict (no `any`, types complets)
- Vérification standards ESLint + Prettier
- Performance audit (Lighthouse > 90)
- Bundle size check
- Documentation (README, API docs, composants)
- Config Vercel (vercel.json, env vars)
- Config GitHub Actions (CI/CD pipeline)
- Pre-deploy checklist

---

## 9. WORKFLOW DE DÉVELOPPEMENT

### Sprint type (1 module = 1-2 semaines)

```
Jour 1-2 : Specs + DB
├─ @spec-orchestrator : user stories + ADR
├─ @database-optimizer : schéma + migrations + seeds + RLS

Jour 3-4 : API
├─ @nitro-api-architect : routes CRUD + logique métier
├─ @test-engineer : tests unitaires API

Jour 5-7 : Frontend
├─ @nuxt-frontend : pages + composants + composables
├─ @nuxt-frontend : animations + responsive + skeletons

Jour 8 : Tests + Sécurité
├─ @test-engineer : tests E2E parcours complet
├─ @security-auditor : audit RLS + validation + OWASP

Jour 9 : Review + Deploy
├─ @code-reviewer : review complète + documentation
├─ @code-reviewer : deploy preview Vercel + smoke tests
```

### Ordre des sprints

```
Sprint 1 (Sem 1-2)  : Auth + Onboarding + Layout (sidebar, header, command palette)
Sprint 2 (Sem 3-4)  : Dashboard + Ruchers (carte + CRUD)
Sprint 3 (Sem 5-6)  : Ruches (CRUD + timeline + fiche)
Sprint 4 (Sem 7-8)  : Inspections (formulaire wizard + mode terrain)
Sprint 5 (Sem 9-10) : Production + Stocks
Sprint 6 (Sem 11-12): Comptabilité + Facturation PDF
Sprint 7 (Sem 13-14): Alertes + Météo + Calendrier
Sprint 8 (Sem 15-16): Mode offline + PWA + Exports
Sprint 9 (Sem 17-18): Stripe (abonnements) + Multi-users
```

### Commandes de lancement par sprint

```bash
# Sprint 1
@spec-orchestrator lance Sprint 1 : Auth + Layout.
Lis CLAUDE_CODE_PROMPT.md sections 3 (design), 4 (architecture), 5 (DB tables profils), 6 (module Auth).
Délègue :
- @database-optimizer : table profils + RLS + seeds
- @nitro-api-architect : routes auth/* + middleware auth + Supabase Auth
- @nuxt-frontend : pages login/register/onboarding + layouts default/auth + AppSidebar + AppHeader + CommandPalette
- @test-engineer : tests auth E2E (register→login→dashboard→logout)
- @security-auditor : audit RLS profils + rate-limit login
- @code-reviewer : review + deploy preview Vercel
Design : respecter intégralement la section 3 (Apple-style "Warm Precision")
```

---

## 10. DESIGN GUIDELINES DÉTAILLÉES

### Composant Card standard

```vue
<!-- Pattern Apple card -->
<template>
  <div
    class="group relative bg-white rounded-xl border border-stone-200/60 
              shadow-sm hover:shadow-md hover:-translate-y-0.5
              transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]
              overflow-hidden"
  >
    <slot />
  </div>
</template>
```

### Page Layout standard

```vue
<template>
  <div class="min-h-screen">
    <!-- Page header -->
    <PageHeader title="Mes ruchers" description="Gérez vos emplacements de ruches">
      <template #actions>
        <UButton icon="i-lucide-plus" label="Nouveau rucher" />
      </template>
    </PageHeader>

    <!-- Content -->
    <div class="px-8 py-6 max-w-7xl mx-auto">
      <!-- Stats grid -->
      <StatsGrid :stats="stats" class="mb-8" />

      <!-- Content grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RucherCard v-for="rucher in ruchers" :key="rucher.id" :rucher="rucher" />
      </div>

      <!-- Empty state si vide -->
      <EmptyState
        v-if="!ruchers.length"
        icon="i-lucide-map-pin"
        title="Aucun rucher"
        description="Commencez par ajouter votre premier emplacement de ruches"
        action-label="Créer un rucher"
        @action="navigateTo('/ruchers/nouveau')"
      />
    </div>
  </div>
</template>
```

### Animations de page

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in',
    },
    layoutTransition: {
      name: 'layout',
      mode: 'out-in',
    },
  },
});
```

```css
/* app.vue ou assets/css/transitions.css */

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Layout transitions */
.layout-enter-active,
.layout-leave-active {
  transition: opacity 300ms ease;
}
.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}
```

### Loading Skeleton pattern

```vue
<!-- Toujours montrer un skeleton, jamais un spinner nu -->
<template>
  <div v-if="pending" class="space-y-4">
    <div v-for="i in 6" :key="i" class="h-32 bg-stone-100 rounded-xl animate-pulse" />
  </div>
  <div v-else>
    <!-- Contenu réel -->
  </div>
</template>
```

### KPI Card pattern

```vue
<template>
  <div class="bg-white rounded-xl border border-stone-200/60 p-6 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
        <Icon :name="icon" class="w-5 h-5 text-amber-600" />
      </div>
      <span
        v-if="trend"
        :class="[
          'text-sm font-medium px-2 py-0.5 rounded-full',
          trend > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50',
        ]"
      >
        {{ trend > 0 ? '+' : '' }}{{ trend }}%
      </span>
    </div>
    <p class="text-2xl font-bold text-stone-900 tabular-nums">
      <!-- Count-up animation -->
      <CountUp :end-val="value" :duration="1.5" />
    </p>
    <p class="text-sm text-stone-500 mt-1">{{ label }}</p>
  </div>
</template>
```

---

## 11. PERFORMANCE & QUALITÉ

### Lighthouse targets

- **Performance** : > 90
- **Accessibility** : > 95
- **Best Practices** : > 95
- **SEO** : > 95

### Rules

- Bundle JS initial < 200 KB gzipped
- Images : WebP, lazy loading, srcset responsive
- Fonts : preload SF Pro, fallback system fonts
- API : < 200ms temps de réponse moyen
- First Contentful Paint : < 1.5s
- Largest Contentful Paint : < 2.5s
- Cumulative Layout Shift : < 0.1

### TypeScript strict

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### ESLint + Prettier

```
- @nuxt/eslint-config
- eslint-plugin-vue
- prettier avec trailingComma, singleQuote, semi: true
- Lint auto en pre-commit (husky + lint-staged)
```

---

## 12. DÉPLOIEMENT

### Vercel

```json
// vercel.json
{
  "framework": "nuxt",
  "regions": ["cdg1"],
  "env": {
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_KEY": "@supabase-key",
    "SUPABASE_SERVICE_KEY": "@supabase-service-key",
    "STRIPE_SECRET_KEY": "@stripe-secret-key",
    "STRIPE_WEBHOOK_SECRET": "@stripe-webhook-secret",
    "BREVO_API_KEY": "@brevo-api-key"
  },
  "crons": [
    {
      "path": "/api/cron/alertes",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/digest",
      "schedule": "0 7 * * 1"
    }
  ]
}
```

### Variables d'environnement

```env
# .env.example
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...                         # Anon key (public)
SUPABASE_SERVICE_KEY=eyJ...                 # Service key (serveur only)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_EXPERT=price_...
BREVO_API_KEY=xkeysib-...
BASE_URL=https://apiculture360.fr
```

### CI/CD GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint-type-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
```

---

## ANNEXE : COMMANDE DE LANCEMENT GLOBALE

```
@spec-orchestrator initialise le projet SaaS Apiculture 360°.

CONTEXTE :
Lis intégralement le fichier CLAUDE_CODE_PROMPT.md — c'est la bible du projet.

ACTIONS :
1. Initialise le projet Nuxt 3 avec TypeScript strict
2. Configure Supabase (auth + DB + storage)
3. Configure Drizzle ORM avec le schéma complet
4. Configure Tailwind avec le design system Apple "Warm Precision"
5. Crée les layouts (default + auth + terrain)
6. Crée les composants UI de base (AppSidebar, AppHeader, CommandPalette, KpiCard, DataTable, EmptyState, LoadingSkeleton, PageHeader)
7. Configure Vercel deployment
8. Configure ESLint + Prettier + Husky

DÉLÉGATION :
- @database-optimizer : schéma Drizzle complet (toutes tables) + RLS + seeds
- @nitro-api-architect : utils serveur (supabase.ts, db.ts, auth.ts, errors.ts) + middleware auth
- @nuxt-frontend : design system complet + layouts + composants UI base
- @test-engineer : setup Vitest + Playwright + premier test smoke
- @security-auditor : audit config Supabase + RLS + headers
- @code-reviewer : review structure + deploy Vercel preview

DESIGN : Section 3 du prompt — "Warm Precision" Apple-style.
Stack : Nuxt 3 Nitro + Supabase + Drizzle + Vercel. ZÉRO Laravel.
1 langage (TypeScript), 1 repo, 1 déploiement.

Commence maintenant !
```
