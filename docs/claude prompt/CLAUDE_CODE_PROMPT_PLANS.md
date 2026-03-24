# 🐝 APICULTURE 360° — SPRINT ABONNEMENTS & FEATURE GATING

> **Version** : 1.0 — Mars 2026
> **Suite de** : Phases 1-3 (15 sessions) + Sprint UX
> **Objectif** : Implémenter le système complet de restrictions par plan, le trial Pro 14j, le gating UI cadenas, et le downgrade gracieux

---

## 📋 TABLE DES MATIÈRES

1. [Matrice des plans — Source de vérité unique](#1-matrice-des-plans--source-de-vérité-unique)
2. [Super Admin — Bypass par whitelist email](#2-super-admin--bypass-par-whitelist-email)
3. [Architecture du feature gating](#3-architecture-du-feature-gating)
4. [Backend — Middleware + enforcement API](#4-backend--middleware--enforcement-api)
5. [Frontend — Sidebar cadenas + pages premium teaser](#5-frontend--sidebar-cadenas--pages-premium-teaser)
6. [Trial Pro 14 jours](#6-trial-pro-14-jours)
7. [Downgrade gracieux](#7-downgrade-gracieux)
8. [Usage meters (jauges d'utilisation)](#8-usage-meters-jauges-dutilisation)
9. [Stripe webhooks — Sync statut plan](#9-stripe-webhooks--sync-statut-plan)
10. [Page tarifs in-app](#10-page-tarifs-in-app)
11. [Conventions & rappels](#11-conventions--rappels)
12. [Checklist d'implémentation](#12-checklist-dimplémentation)
13. [Matrice de tests](#13-matrice-de-tests)

---

## 1. MATRICE DES PLANS — SOURCE DE VÉRITÉ UNIQUE

### Le fichier central : `app/config/plans.ts`

Ce fichier est importé par le middleware serveur ET les composables client. C'est LA source de vérité. Aucune condition `if` dispersée dans le code — tout passe par ce fichier.

```typescript
// app/config/plans.ts

export const PLANS = ['decouverte', 'starter', 'pro', 'expert'] as const;
export type Plan = (typeof PLANS)[number];

export interface PlanLimits {
  ruchers: number;
  ruches: number;
  clients: number;
  facturesParMois: number;
  templatesIntervention: number;
  interventionGroupeeMaxRuches: number;
  alertesActives: number;
  photosStorageMb: number;
  membresEquipe: number;
}

export interface PlanFeatures {
  // Interventions
  interventionsGroupees: boolean;
  templatesIntervention: boolean;
  moduleReine: boolean;

  // Dashboard & Analytics
  chartsEcharts: boolean;
  scorePredictif: boolean;
  suggestionsNationales: boolean;
  previsionnelTresorerie: boolean;
  comparaisonAnnuelle: boolean; // Expert only
  correlationMeteoProd: boolean; // Expert only
  analyticsRentabilite: boolean;

  // Production & Commerce
  production: boolean;
  tracabiliteLots: boolean;
  stocksBasique: boolean;
  stocksTvaAuto: boolean;
  clients: boolean;
  facturationPdf: boolean;
  comptabiliteAchats: boolean;
  exportFec: boolean;

  // Exports & Médias
  photos: boolean;
  exportCsv: boolean;
  exportXlsx: boolean;
  logoExploitation: boolean;
  bilanAnnuelPdf: boolean;
  registreElevagePdf: boolean; // Gratuit (obligation réglementaire)

  // UX & Technique
  syncIcal: boolean;
  qrCodesRuches: boolean;
  couleursRuches: boolean;
  modeOffline: boolean;
  rechercheGlobale: boolean;
  multiUsers: boolean;
}

export interface PlanConfig {
  id: Plan;
  label: string;
  prix: { mois: number; an: number } | null; // null = gratuit
  description: string;
  limites: PlanLimits;
  features: PlanFeatures;
  stripePriceId?: { mois: string; an: string };
  badge?: { label: string; color: string };
}

// ─── SOURCE DE VÉRITÉ ───────────────────────────────────────

export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  decouverte: {
    id: 'decouverte',
    label: 'Découverte',
    prix: null,
    description: 'Découvrez Apiculture 360° avec 1 ruche',
    badge: { label: 'Gratuit', color: 'neutral' },
    limites: {
      ruchers: 1,
      ruches: 1,
      clients: 0,
      facturesParMois: 0,
      templatesIntervention: 0,
      interventionGroupeeMaxRuches: 0,
      alertesActives: 3,
      photosStorageMb: 0,
      membresEquipe: 0,
    },
    features: {
      // Interventions
      interventionsGroupees: false,
      templatesIntervention: false,
      moduleReine: false,

      // Dashboard
      chartsEcharts: false,
      scorePredictif: false,
      suggestionsNationales: false,
      previsionnelTresorerie: false,
      comparaisonAnnuelle: false,
      correlationMeteoProd: false,
      analyticsRentabilite: false,

      // Commerce
      production: false,
      tracabiliteLots: false,
      stocksBasique: false,
      stocksTvaAuto: false,
      clients: false,
      facturationPdf: false,
      comptabiliteAchats: false,
      exportFec: false,

      // Exports
      photos: false,
      exportCsv: false,
      exportXlsx: false,
      logoExploitation: false,
      bilanAnnuelPdf: false,
      registreElevagePdf: true, // ✅ Gratuit (obligation réglementaire)

      // UX
      syncIcal: false,
      qrCodesRuches: false,
      couleursRuches: false,
      modeOffline: false,
      rechercheGlobale: false,
      multiUsers: false,
    },
  },

  starter: {
    id: 'starter',
    label: 'Starter',
    prix: { mois: 9.99, an: 99 },
    description: "L'essentiel pour gérer jusqu'à 20 ruches",
    badge: { label: 'Populaire', color: 'primary' },
    limites: {
      ruchers: 5,
      ruches: 20,
      clients: 20,
      facturesParMois: 10,
      templatesIntervention: 3,
      interventionGroupeeMaxRuches: 10,
      alertesActives: Infinity,
      photosStorageMb: 50,
      membresEquipe: 0,
    },
    features: {
      interventionsGroupees: true,
      templatesIntervention: true,
      moduleReine: true,

      chartsEcharts: true,
      scorePredictif: false,
      suggestionsNationales: false,
      previsionnelTresorerie: false,
      comparaisonAnnuelle: false,
      correlationMeteoProd: false,
      analyticsRentabilite: false,

      production: true,
      tracabiliteLots: false,
      stocksBasique: true,
      stocksTvaAuto: false,
      clients: true,
      facturationPdf: true,
      comptabiliteAchats: false,
      exportFec: false,

      photos: true,
      exportCsv: true,
      exportXlsx: false,
      logoExploitation: false,
      bilanAnnuelPdf: false,
      registreElevagePdf: true,

      syncIcal: true,
      qrCodesRuches: true,
      couleursRuches: true,
      modeOffline: true,
      rechercheGlobale: true,
      multiUsers: false,
    },
  },

  pro: {
    id: 'pro',
    label: 'Pro',
    prix: { mois: 39.99, an: 399 },
    description: 'Gestion complète pour apiculteurs professionnels',
    badge: { label: 'Pro', color: 'warning' },
    limites: {
      ruchers: 20,
      ruches: 100,
      clients: Infinity,
      facturesParMois: Infinity,
      templatesIntervention: Infinity,
      interventionGroupeeMaxRuches: Infinity,
      alertesActives: Infinity,
      photosStorageMb: 2048, // 2 GB
      membresEquipe: 3,
    },
    features: {
      interventionsGroupees: true,
      templatesIntervention: true,
      moduleReine: true,

      chartsEcharts: true,
      scorePredictif: true,
      suggestionsNationales: true,
      previsionnelTresorerie: true,
      comparaisonAnnuelle: false, // Expert only
      correlationMeteoProd: false, // Expert only
      analyticsRentabilite: true,

      production: true,
      tracabiliteLots: true,
      stocksBasique: true,
      stocksTvaAuto: true,
      clients: true,
      facturationPdf: true,
      comptabiliteAchats: true,
      exportFec: true,

      photos: true,
      exportCsv: true,
      exportXlsx: true,
      logoExploitation: true,
      bilanAnnuelPdf: true,
      registreElevagePdf: true,

      syncIcal: true,
      qrCodesRuches: true,
      couleursRuches: true,
      modeOffline: true,
      rechercheGlobale: true,
      multiUsers: true,
    },
  },

  expert: {
    id: 'expert',
    label: 'Expert',
    prix: { mois: 79.99, an: 799 },
    description: 'Illimité pour les grandes exploitations',
    badge: { label: 'Expert', color: 'info' },
    limites: {
      ruchers: Infinity,
      ruches: Infinity,
      clients: Infinity,
      facturesParMois: Infinity,
      templatesIntervention: Infinity,
      interventionGroupeeMaxRuches: Infinity,
      alertesActives: Infinity,
      photosStorageMb: 10240, // 10 GB
      membresEquipe: Infinity,
    },
    features: {
      interventionsGroupees: true,
      templatesIntervention: true,
      moduleReine: true,

      chartsEcharts: true,
      scorePredictif: true,
      suggestionsNationales: true,
      previsionnelTresorerie: true,
      comparaisonAnnuelle: true,
      correlationMeteoProd: true,
      analyticsRentabilite: true,

      production: true,
      tracabiliteLots: true,
      stocksBasique: true,
      stocksTvaAuto: true,
      clients: true,
      facturationPdf: true,
      comptabiliteAchats: true,
      exportFec: true,

      photos: true,
      exportCsv: true,
      exportXlsx: true,
      logoExploitation: true,
      bilanAnnuelPdf: true,
      registreElevagePdf: true,

      syncIcal: true,
      qrCodesRuches: true,
      couleursRuches: true,
      modeOffline: true,
      rechercheGlobale: true,
      multiUsers: true,
    },
  },
};

// ─── HELPERS ────────────────────────────────────────────────

export function getPlanConfig(plan: Plan): PlanConfig {
  return PLAN_CONFIGS[plan];
}

export function hasFeature(plan: Plan, feature: keyof PlanFeatures): boolean {
  return PLAN_CONFIGS[plan].features[feature];
}

export function getLimit(plan: Plan, limit: keyof PlanLimits): number {
  return PLAN_CONFIGS[plan].limites[limit];
}

// Retourne le plan minimum requis pour une feature
export function minimumPlanFor(feature: keyof PlanFeatures): Plan {
  for (const plan of PLANS) {
    if (PLAN_CONFIGS[plan].features[feature]) return plan;
  }
  return 'expert';
}

// Retourne le plan minimum requis pour une limite donnée
export function minimumPlanForLimit(limit: keyof PlanLimits, needed: number): Plan {
  for (const plan of PLANS) {
    if (PLAN_CONFIGS[plan].limites[limit] >= needed) return plan;
  }
  return 'expert';
}

// Ordre des plans pour comparaison
export function planIndex(plan: Plan): number {
  return PLANS.indexOf(plan);
}

export function isPlanAtLeast(current: Plan, required: Plan): boolean {
  return planIndex(current) >= planIndex(required);
}
```

### Mapping routes API → features/limites

```typescript
// app/config/route-gates.ts

import type { PlanFeatures, PlanLimits } from './plans';

interface RouteGate {
  feature?: keyof PlanFeatures;
  limit?: keyof PlanLimits;
  // Pour les limites, le middleware doit compter l'existant
  countQuery?: string; // ex: 'ruches' → count ruches de l'user
}

// Seules les routes de CRÉATION sont gatées (les GET passent toujours)
export const ROUTE_GATES: Record<string, RouteGate> = {
  // Ruchers
  'POST /api/ruchers': { limit: 'ruchers' },

  // Ruches
  'POST /api/ruches': { limit: 'ruches' },

  // Interventions
  'POST /api/interventions/bulk-group': { feature: 'interventionsGroupees' },
  'POST /api/interventions/templates': { feature: 'templatesIntervention' },

  // Module Reine
  'POST /api/ruches/*/evenements-reine': { feature: 'moduleReine' },
  'PUT /api/ruches/*/reine': { feature: 'moduleReine' },

  // Production
  'POST /api/production/recoltes': { feature: 'production' },

  // Stocks
  'POST /api/stocks': { feature: 'stocksBasique' },

  // Clients
  'POST /api/clients': { feature: 'clients', limit: 'clients' },

  // Finances
  'POST /api/finances/ventes': { feature: 'facturationPdf', limit: 'facturesParMois' },
  'POST /api/finances/achats': { feature: 'comptabiliteAchats' },

  // Exports
  'GET /api/export/bilan': { feature: 'bilanAnnuelPdf' },
  'GET /api/export/ruches.xlsx': { feature: 'exportXlsx' },
  'GET /api/finances/export': { feature: 'exportCsv' },

  // Analytics
  'GET /api/analytics': { feature: 'analyticsRentabilite' },
  'GET /api/analytics/suggestions': { feature: 'suggestionsNationales' },
  'GET /api/ruches/*/prediction': { feature: 'scorePredictif' },

  // Calendrier sync
  'POST /api/calendrier/tokens': { feature: 'syncIcal' },

  // Multi-users
  'POST /api/membres/inviter': { feature: 'multiUsers', limit: 'membresEquipe' },

  // Photos (vérifié par le storage, pas par route)
  // Offline (vérifié côté client, pas par API)
};
```

---

## 2. SUPER ADMIN — BYPASS PAR WHITELIST EMAIL

### Principe

Les administrateurs (toi, et tout email ajouté à la whitelist) ont accès à **100% des fonctionnalités** sans abonnement Stripe. Le bypass est total : aucune restriction de plan, aucune limite de ruches/ruchers/clients, toutes les features débloquées. Le plan en DB peut rester `'decouverte'` — ça n'a aucune importance.

### Variable d'environnement

```env
# .env — liste d'emails admin séparés par des virgules
NUXT_ADMIN_EMAILS=antoine@lajocondienne.com
```

On peut ajouter plusieurs emails :

```env
NUXT_ADMIN_EMAILS=antoine@lajocondienne.com,tech@lajocondienne.com,demo@apiculture360.com
```

### Helper partagé : `app/config/admin.ts`

```typescript
// app/config/admin.ts
// Importé côté serveur ET côté client

// Côté serveur : lit la variable d'env directement
// Côté client : lit depuis runtimeConfig.public (on expose juste un booléen, pas la liste)

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;

  // Côté serveur
  if (import.meta.server) {
    const adminEmails = (process.env.NUXT_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return adminEmails.includes(email.toLowerCase());
  }

  // Côté client : on ne check pas ici, on utilise le flag du profil
  // (le serveur enrichit le profil avec isAdmin dans /api/auth/me ou /api/profils/me)
  return false;
}
```

### Côté serveur — Enrichir le profil avec `isAdmin`

```typescript
// server/api/profils/me.get.ts — MODIFIER
// Après avoir récupéré le profil, ajouter le flag admin

import { isAdminEmail } from '~~/app/config/admin';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const profil = await getUserProfil(user.id);

  return {
    ...profil,
    isAdmin: isAdminEmail(user.email), // Flag calculé, pas stocké en DB
  };
});
```

```typescript
// server/api/auth/me.get.ts — MÊME MODIFICATION
// Ajouter isAdmin dans la réponse
```

### Côté serveur — Bypass middleware

```typescript
// server/middleware/04.subscription.ts — AJOUTER en tout début

import { isAdminEmail } from '~~/app/config/admin';

export default defineEventHandler(async (event) => {
  // ... (routes exemptées existantes)

  const user = await requireAuth(event);

  // ─── ADMIN BYPASS ─── Aucune restriction pour les admins
  if (isAdminEmail(user.email)) return;

  // ... (reste du middleware : vérification plan, limites, etc.)
});
```

### Côté client — Bypass dans `useGating.ts`

```typescript
// app/composables/useGating.ts — MODIFIER

export function useGating() {
  const authStore = useAuthStore();
  const plan = computed<Plan>(() => (authStore.profil?.plan as Plan) || 'decouverte');

  // ─── ADMIN FLAG ─── Vient de /api/profils/me (calculé côté serveur)
  const isAdmin = computed<boolean>(() => authStore.profil?.isAdmin === true);

  // Feature check — admin bypass tout
  function can(feature: keyof PlanFeatures): boolean {
    if (isAdmin.value) return true;
    return hasFeature(plan.value, feature);
  }

  // Limit check — admin = jamais à la limite
  function isAtLimit(resource: keyof PlanLimits): boolean {
    if (isAdmin.value) return false;
    // ... (reste existant)
  }

  // Usage display — admin voit "∞"
  function usageDisplay(resource: keyof PlanLimits): string {
    if (isAdmin.value) return '∞';
    // ... (reste existant)
  }

  return { plan, isAdmin, can, isAtLimit, usageDisplay /* ... */ };
}
```

### Côté client — Sidebar sans cadenas pour admin

```vue
<!-- app/components/ui/AppSidebar.vue — MODIFIER -->

<!-- Le cadenas ne s'affiche PAS si admin -->
<UIcon
  v-if="link.feature && !gating.can(link.feature)"
  name="i-lucide-lock"
  class="ml-auto text-xs text-stone-400"
/>
<!-- gating.can() retourne true pour admin → cadenas jamais affiché -->

<!-- La jauge ruches affiche "∞" pour admin -->
<UsageMeter v-if="!gating.isAdmin" :current="..." :max="..." label="Ruches" />
<div v-else class="px-4 py-2 text-xs text-stone-400">
  <UIcon name="i-lucide-shield-check" class="mr-1 text-green-500" />
  Admin — Accès illimité
</div>
```

### Côté client — TrialBanner masqué pour admin

```vue
<!-- app/components/ui/TrialBanner.vue — MODIFIER -->
<template>
  <!-- Pas de bannière trial pour les admins -->
  <div v-if="show && !gating.isAdmin" ...>...</div>
</template>
```

### Côté client — FeatureGate transparent pour admin

```vue
<!-- app/components/ui/FeatureGate.vue — pas besoin de modifier -->
<!-- gating.can() retourne true → le slot default s'affiche, jamais le teaser flou -->
<!-- Le composant fonctionne déjà correctement grâce au bypass dans useGating -->
```

### Sécurité

- La liste d'emails admin n'est **JAMAIS exposée au client**. Seul le flag booléen `isAdmin` est retourné dans le profil.
- Le flag est **calculé à chaque requête** côté serveur (pas stocké en DB). Si tu retires un email de la variable d'env et redéploies, l'accès est immédiatement révoqué.
- Un utilisateur ne peut PAS se donner le flag `isAdmin` — il est calculé par le serveur à partir de la variable d'env.
- En prod, la variable d'env est définie dans Vercel → Dashboard → Settings → Environment Variables.

### Config nuxt pour le flag admin (rien à exposer côté public)

```typescript
// nuxt.config.ts — runtimeConfig
runtimeConfig: {
  // Privé serveur only (jamais exposé au client)
  adminEmails: process.env.NUXT_ADMIN_EMAILS || '',

  // Public (rien à ajouter pour l'admin)
  public: {
    // ...
  },
},
```

---

## 3. ARCHITECTURE DU FEATURE GATING

### Principe : 3 couches de protection

```
Couche 1 — UI (client)
  Sidebar : cadenas sur les liens premium
  Pages : teaser flou + CTA upgrade
  Boutons : disabled/caché si feature non disponible
  → Empêche l'utilisateur de VOIR les fonctionnalités bloquées
  → Réduit les appels API inutiles
  → JAMAIS suffisant seul (contournable)

Couche 2 — Middleware API (serveur)
  server/middleware/04.subscription.ts
  → Intercepte les routes gatées AVANT le handler
  → Vérifie le plan de l'utilisateur
  → Retourne 402 Payment Required avec message explicite
  → PROTECTION RÉELLE

Couche 3 — Logique métier (serveur)
  Dans chaque handler, vérifications spécifiques :
  → Comptage ruches avant INSERT ruche
  → Comptage factures du mois avant INSERT vente
  → Vérification storage utilisé avant upload photo
  → GRANULARITÉ FINE
```

---

## 4. BACKEND — MIDDLEWARE + ENFORCEMENT API

### 3.1 Middleware subscription enrichi

```typescript
// server/middleware/04.subscription.ts — RÉÉCRIRE

import { ROUTE_GATES } from '~~/app/config/route-gates';
import { getPlanConfig, hasFeature, getLimit, minimumPlanFor } from '~~/app/config/plans';
import type { Plan } from '~~/app/config/plans';

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;
  const method = getMethod(event);

  // Routes exemptées (pas d'auth requise)
  if (
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/stripe/') ||
    path.startsWith('/api/public/') ||
    (method === 'GET' &&
      !Object.keys(ROUTE_GATES).some((k) => k.startsWith('GET') && matchRoute(k, method, path)))
  )
    return;

  // Trouver le gate applicable
  const routeKey = `${method} ${path}`;
  const gate = findMatchingGate(routeKey);
  if (!gate) return; // Pas de gate = accès libre

  // Récupérer le plan de l'utilisateur
  const user = await requireAuth(event);
  const profil = await getUserProfil(user.id);
  const plan = (profil?.plan || 'decouverte') as Plan;

  // Vérifier la feature
  if (gate.feature && !hasFeature(plan, gate.feature)) {
    const requiredPlan = minimumPlanFor(gate.feature);
    throw createError({
      statusCode: 402,
      statusMessage: 'Plan insuffisant',
      data: {
        code: 'PLAN_REQUIRED',
        feature: gate.feature,
        currentPlan: plan,
        requiredPlan,
        message: `Cette fonctionnalité nécessite le plan ${getPlanConfig(requiredPlan).label}`,
      },
    });
  }

  // Vérifier la limite (si applicable)
  if (gate.limit) {
    const currentCount = await countUserResource(user.id, gate.limit);
    const maxAllowed = getLimit(plan, gate.limit);

    if (currentCount >= maxAllowed) {
      const requiredPlan = findNextPlanForLimit(plan, gate.limit, currentCount + 1);
      throw createError({
        statusCode: 402,
        statusMessage: 'Limite du plan atteinte',
        data: {
          code: 'LIMIT_REACHED',
          limit: gate.limit,
          current: currentCount,
          max: maxAllowed,
          currentPlan: plan,
          requiredPlan,
          message: `Vous avez atteint la limite de ${maxAllowed} ${gate.limit} de votre plan ${getPlanConfig(plan).label}`,
        },
      });
    }
  }
});

// Helper : compter les resources de l'utilisateur
async function countUserResource(userId: string, resource: string): Promise<number> {
  const counts: Record<string, () => Promise<number>> = {
    ruchers: () =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(ruchers)
        .where(eq(ruchers.userId, userId))
        .then((r) => Number(r[0].count)),
    ruches: () =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(ruches)
        .where(and(eq(ruches.userId, userId), ne(ruches.statutColonie, 'morte')))
        .then((r) => Number(r[0].count)),
    clients: () =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(clients)
        .where(eq(clients.userId, userId))
        .then((r) => Number(r[0].count)),
    facturesParMois: () => countFacturesThisMonth(userId),
    membresEquipe: () =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(membres)
        .where(and(eq(membres.ownerId, userId), eq(membres.statut, 'acceptee')))
        .then((r) => Number(r[0].count)),
    templatesIntervention: () =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(templatesIntervention)
        .where(eq(templatesIntervention.userId, userId))
        .then((r) => Number(r[0].count)),
  };

  const counter = counts[resource];
  return counter ? counter() : 0;
}

async function countFacturesThisMonth(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'vente'),
        gte(transactions.createdAt, startOfMonth),
      ),
    )
    .then((r) => Number(r[0].count));
}
```

### 3.2 API usage — `GET /api/subscription/usage`

```typescript
// server/api/subscription/usage.get.ts
// Retourne l'utilisation actuelle de l'utilisateur vs ses limites

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const profil = await getUserProfil(user.id);
  const plan = (profil?.plan || 'decouverte') as Plan;
  const config = getPlanConfig(plan);

  const [ruchersCount, ruchesCount, clientsCount, facturesMoisCount, membresCount, templatesCount] =
    await Promise.all([
      countUserResource(user.id, 'ruchers'),
      countUserResource(user.id, 'ruches'),
      countUserResource(user.id, 'clients'),
      countUserResource(user.id, 'facturesParMois'),
      countUserResource(user.id, 'membresEquipe'),
      countUserResource(user.id, 'templatesIntervention'),
    ]);

  return {
    plan,
    planConfig: config,
    usage: {
      ruchers: { current: ruchersCount, max: config.limites.ruchers },
      ruches: { current: ruchesCount, max: config.limites.ruches },
      clients: { current: clientsCount, max: config.limites.clients },
      facturesParMois: { current: facturesMoisCount, max: config.limites.facturesParMois },
      membresEquipe: { current: membresCount, max: config.limites.membresEquipe },
      templatesIntervention: { current: templatesCount, max: config.limites.templatesIntervention },
    },
    trial: {
      active: profil?.trialActive ?? false,
      endsAt: profil?.trialEndsAt ?? null,
      daysRemaining: profil?.trialEndsAt
        ? Math.max(0, Math.ceil((new Date(profil.trialEndsAt).getTime() - Date.now()) / 86400000))
        : null,
    },
  };
});
```

---

## 5. FRONTEND — SIDEBAR CADENAS + PAGES PREMIUM TEASER

### 4.1 Composable `useGating.ts`

```typescript
// app/composables/useGating.ts

import { PLAN_CONFIGS, hasFeature, getLimit, minimumPlanFor, isPlanAtLeast } from '~/config/plans';
import type { Plan, PlanFeatures, PlanLimits } from '~/config/plans';

export function useGating() {
  const authStore = useAuthStore();
  const plan = computed<Plan>(() => (authStore.profil?.plan as Plan) || 'decouverte');

  // Fetch usage (cached, refresh on demand)
  const { data: usageData, refresh: refreshUsage } = useFetch('/api/subscription/usage', {
    key: 'subscription-usage',
    dedupe: 'defer',
  });

  // Feature check
  function can(feature: keyof PlanFeatures): boolean {
    return hasFeature(plan.value, feature);
  }

  // Limit check
  function isAtLimit(resource: keyof PlanLimits): boolean {
    if (!usageData.value) return false;
    const usage = usageData.value.usage[resource];
    if (!usage) return false;
    return usage.current >= usage.max;
  }

  // Usage percentage (for meters)
  function usagePercent(resource: keyof PlanLimits): number {
    if (!usageData.value) return 0;
    const usage = usageData.value.usage[resource];
    if (!usage || usage.max === Infinity) return 0;
    return Math.round((usage.current / usage.max) * 100);
  }

  // Usage display string "7/20"
  function usageDisplay(resource: keyof PlanLimits): string {
    if (!usageData.value) return '';
    const usage = usageData.value.usage[resource];
    if (!usage) return '';
    if (usage.max === Infinity) return `${usage.current}`;
    return `${usage.current}/${usage.max}`;
  }

  // Which plan is needed for a feature?
  function requiredPlan(feature: keyof PlanFeatures): Plan {
    return minimumPlanFor(feature);
  }

  // Is current plan at least X?
  function isAtLeast(required: Plan): boolean {
    return isPlanAtLeast(plan.value, required);
  }

  // Trial info
  const trial = computed(
    () => usageData.value?.trial ?? { active: false, endsAt: null, daysRemaining: null },
  );

  return {
    plan,
    can,
    isAtLimit,
    usagePercent,
    usageDisplay,
    requiredPlan,
    isAtLeast,
    trial,
    refreshUsage,
    usageData,
  };
}
```

### 4.2 Sidebar avec cadenas — `app/components/ui/AppSidebar.vue`

```typescript
// Structure des liens sidebar avec gating

interface SidebarLink {
  label: string;
  icon: string;
  to: string;
  feature?: keyof PlanFeatures; // Si défini, cadenas si pas accès
  badge?: string | number;
}

const links: SidebarLink[] = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/dashboard' },
  { label: 'Ruchers', icon: 'i-lucide-map-pin', to: '/ruchers' },
  { label: 'Ruches', icon: 'i-lucide-hexagon', to: '/ruches' },
  { label: 'Interventions', icon: 'i-lucide-clipboard-check', to: '/interventions' },
  { label: 'Production', icon: 'i-lucide-jar', to: '/production', feature: 'production' },
  { label: 'Stocks', icon: 'i-lucide-warehouse', to: '/stocks', feature: 'stocksBasique' },
  { label: 'Clients', icon: 'i-lucide-users', to: '/clients', feature: 'clients' },
  { label: 'Finances', icon: 'i-lucide-wallet', to: '/finances', feature: 'facturationPdf' },
  {
    label: 'Analytics',
    icon: 'i-lucide-bar-chart-3',
    to: '/analytics',
    feature: 'analyticsRentabilite',
  },
  { label: 'Calendrier', icon: 'i-lucide-calendar', to: '/calendrier' },
  { label: 'Météo', icon: 'i-lucide-cloud-sun', to: '/meteo' },
  { label: 'Alertes', icon: 'i-lucide-bell', to: '/alertes' },
  { label: 'Exports', icon: 'i-lucide-download', to: '/exports' },
];
```

```vue
<!-- Dans le template sidebar -->
<template v-for="link in links" :key="link.to">
  <NuxtLink
    :to="link.to"
    class="sidebar-link"
    :class="{ 'opacity-60': link.feature && !gating.can(link.feature) }"
  >
    <UIcon :name="link.icon" />
    <span>{{ link.label }}</span>

    <!-- Cadenas si feature bloquée -->
    <UIcon
      v-if="link.feature && !gating.can(link.feature)"
      name="i-lucide-lock"
      class="ml-auto text-xs text-stone-400"
    />
  </NuxtLink>
</template>
```

**Comportement** : Le clic sur un lien avec cadenas navigue quand même vers la page — c'est la page elle-même qui affiche le teaser. On ne bloque pas la navigation.

### 4.3 Composant FeatureGate — Wrapper premium

```vue
<!-- app/components/ui/FeatureGate.vue -->

<script setup lang="ts">
import type { PlanFeatures } from '~/config/plans';
import { PLAN_CONFIGS, minimumPlanFor } from '~/config/plans';

const props = defineProps<{
  feature: keyof PlanFeatures;
  blur?: boolean; // true = contenu flou, false = masqué
}>();

const gating = useGating();
const hasAccess = computed(() => gating.can(props.feature));
const required = computed(() => minimumPlanFor(props.feature));
const requiredConfig = computed(() => PLAN_CONFIGS[required.value]);
</script>

<template>
  <!-- L'utilisateur a accès → afficher normalement -->
  <slot v-if="hasAccess" />

  <!-- Pas accès + mode blur → teaser flou avec overlay -->
  <div v-else-if="blur" class="relative">
    <!-- Contenu flou en arrière-plan -->
    <div class="pointer-events-none select-none blur-sm opacity-50">
      <slot name="preview">
        <slot />
      </slot>
    </div>

    <!-- Overlay CTA -->
    <div
      class="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl"
    >
      <div class="text-center px-6 py-8 max-w-sm">
        <div
          class="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center"
        >
          <UIcon name="i-lucide-lock" class="text-amber-500 text-xl" />
        </div>
        <h3 class="text-lg font-semibold text-stone-800 mb-2">
          Fonctionnalité {{ requiredConfig.label }}
        </h3>
        <p class="text-sm text-stone-500 mb-6">
          Disponible à partir du plan {{ requiredConfig.label }}
          <template v-if="requiredConfig.prix"> ({{ requiredConfig.prix.mois }}€/mois) </template>
        </p>
        <div class="flex flex-col gap-2">
          <UButton color="primary" to="/tarifs" block> Voir les plans </UButton>
          <UButton
            v-if="gating.plan === 'decouverte' && !gating.trial.active"
            variant="outline"
            color="neutral"
            block
            @click="$emit('activate-trial')"
          >
            Essayer Pro 14 jours gratuitement
          </UButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Pas accès + pas blur → rien affiché -->
  <template v-else />
</template>
```

### 4.4 Utilisation dans les pages

```vue
<!-- app/pages/analytics/index.vue — EXEMPLE -->

<template>
  <div>
    <UiPageHeader title="Analytics" description="Rentabilité et prévisions" />

    <FeatureGate feature="analyticsRentabilite" blur>
      <!-- Contenu réel analytics (charts, KPIs, etc.) -->
      <div class="grid gap-6">
        <AnalyticsRentabilite />
        <AnalyticsPrevisionnel />
      </div>

      <!-- Preview flou (slot 'preview') : données factices -->
      <template #preview>
        <div class="grid gap-6">
          <div class="bg-surface-secondary rounded-xl p-6 h-64" />
          <div class="bg-surface-secondary rounded-xl p-6 h-48" />
        </div>
      </template>
    </FeatureGate>
  </div>
</template>
```

```vue
<!-- app/pages/finances/index.vue — EXEMPLE bouton conditionnel -->

<template>
  <UButton
    v-if="gating.can('facturationPdf')"
    icon="i-lucide-plus"
    color="primary"
    @click="openVenteModal"
  >
    Nouvelle vente
  </UButton>
  <UButton v-else icon="i-lucide-lock" color="neutral" variant="outline" to="/tarifs">
    Nouvelle vente · Plan Starter
  </UButton>
</template>
```

---

## 6. TRIAL PRO 14 JOURS

### 5.1 Colonnes à ajouter sur table `profils`

```typescript
trialActive: boolean('trial_active').default(false),
trialStartedAt: timestamp('trial_started_at'),
trialEndsAt: timestamp('trial_ends_at'),
trialUsed: boolean('trial_used').default(false),  // Ne peut activer qu'une seule fois
```

### 5.2 API activation — `POST /api/subscription/trial`

```typescript
// server/api/subscription/trial.post.ts

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const profil = await getUserProfil(user.id);

  // Vérifications
  if (profil.plan !== 'decouverte') {
    throw badRequest('Le trial est réservé au plan Découverte');
  }
  if (profil.trialUsed) {
    throw badRequest('Vous avez déjà utilisé votre essai gratuit');
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 jours

  await db
    .update(profils)
    .set({
      plan: 'pro', // Upgrade temporaire vers Pro
      trialActive: true,
      trialStartedAt: now,
      trialEndsAt: endsAt,
      trialUsed: true,
      updatedAt: now,
    })
    .where(eq(profils.id, user.id));

  return {
    success: true,
    trial: { active: true, startsAt: now.toISOString(), endsAt: endsAt.toISOString() },
  };
});
```

### 5.3 Cron d'expiration — `server/api/cron/trial-expiry.post.ts`

```typescript
// Appelé par le cron Vercel tous les jours à minuit
// vercel.json : { "path": "/api/cron/trial-expiry", "schedule": "0 0 * * *" }

export default defineEventHandler(async (event) => {
  // Vérifier que c'est bien le cron Vercel (header Authorization)
  const authHeader = getHeader(event, 'authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401 });
  }

  const now = new Date();

  // Trouver les trials expirés
  const expired = await db
    .select({ id: profils.id })
    .from(profils)
    .where(and(eq(profils.trialActive, true), lte(profils.trialEndsAt, now)));

  // Downgrade vers Découverte
  for (const user of expired) {
    await db
      .update(profils)
      .set({
        plan: 'decouverte',
        trialActive: false,
        updatedAt: now,
      })
      .where(eq(profils.id, user.id));

    // Créer une alerte pour informer l'utilisateur
    await db.insert(alertes).values({
      userId: user.id,
      type: 'trial_expired',
      titre: 'Votre essai Pro est terminé',
      message:
        'Votre essai gratuit de 14 jours est terminé. Vos données sont préservées en lecture seule. Passez au plan Starter pour continuer.',
      priorite: 'haute',
      actionUrl: '/tarifs',
    });
  }

  return { expired: expired.length };
});
```

### 5.4 Bannière trial dans l'app

```vue
<!-- app/components/ui/TrialBanner.vue -->

<script setup>
const gating = useGating();
const show = computed(() => gating.trial.value.active && gating.trial.value.daysRemaining !== null);
const urgent = computed(() => (gating.trial.value.daysRemaining ?? 0) <= 3);
</script>

<template>
  <div
    v-if="show"
    class="px-4 py-2 text-center text-sm font-medium"
    :class="urgent ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'"
  >
    <UIcon :name="urgent ? 'i-lucide-alert-triangle' : 'i-lucide-sparkles'" class="mr-1" />
    Essai Pro :
    <strong
      >{{ gating.trial.value.daysRemaining }} jour{{
        gating.trial.value.daysRemaining > 1 ? 's' : ''
      }}</strong
    >
    restant{{ gating.trial.value.daysRemaining > 1 ? 's' : '' }}
    <NuxtLink to="/tarifs" class="underline ml-2 font-semibold hover:no-underline">
      Passer au plan Pro →
    </NuxtLink>
  </div>
</template>
```

Intégrer dans `app/layouts/default.vue` juste au-dessus du contenu principal.

---

## 7. DOWNGRADE GRACIEUX

### Principe : jamais supprimer de données, toujours lecture seule

Quand un utilisateur downgrade (trial expiré, annulation Stripe), ses données excédentaires passent en **lecture seule**. Il peut tout voir mais ne peut plus créer au-delà des limites.

### Comportement par cas

| Situation                           | Comportement                                                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Pro → Découverte avec 50 ruches     | Les 50 ruches restent visibles. Seule 1 ruche est "active" (la plus récente). Impossible de créer des interventions sur les 49 autres. |
| Starter → Découverte avec 15 ruches | Idem, 1 seule active.                                                                                                                  |
| Pro → Starter avec 50 ruches        | Les 50 restent visibles. Les 20 plus récentes sont actives, les 30 autres en lecture seule.                                            |
| Avec 5 ruchers → plan limité à 1    | Tous visibles, seul le premier (par date) est modifiable.                                                                              |

### API — `GET /api/subscription/active-resources`

```typescript
// Retourne les IDs des resources "actives" (modifiables) selon le plan

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const profil = await getUserProfil(user.id);
  const plan = (profil?.plan || 'decouverte') as Plan;
  const limits = getPlanConfig(plan).limites;

  // Ruches actives = les N plus récentes (par date de création)
  const activeRuches = await db
    .select({ id: ruches.id })
    .from(ruches)
    .where(and(eq(ruches.userId, user.id), ne(ruches.statutColonie, 'morte')))
    .orderBy(desc(ruches.createdAt))
    .limit(limits.ruches === Infinity ? 99999 : limits.ruches);

  const activeRuchers = await db
    .select({ id: ruchers.id })
    .from(ruchers)
    .where(eq(ruchers.userId, user.id))
    .orderBy(desc(ruchers.createdAt))
    .limit(limits.ruchers === Infinity ? 99999 : limits.ruchers);

  return {
    activeRucheIds: activeRuches.map((r) => r.id),
    activeRucherIds: activeRuchers.map((r) => r.id),
  };
});
```

### Frontend — Badge "Lecture seule" sur les fiches

```vue
<!-- Sur les cards ruche/rucher non actives -->
<div v-if="!isActive" class="absolute top-2 right-2">
  <UBadge color="neutral" variant="subtle" size="xs">
    <UIcon name="i-lucide-eye" class="mr-1" />
    Lecture seule
  </UBadge>
</div>
```

---

## 8. USAGE METERS (JAUGES D'UTILISATION)

### 7.1 Composant `UsageMeter.vue`

```vue
<!-- app/components/ui/UsageMeter.vue -->

<script setup lang="ts">
const props = defineProps<{
  current: number;
  max: number;
  label: string;
  compact?: boolean;
}>();

const percent = computed(() =>
  props.max === Infinity ? 0 : Math.round((props.current / props.max) * 100),
);
const color = computed(() => {
  if (props.max === Infinity) return 'bg-green-500';
  if (percent.value >= 100) return 'bg-red-500';
  if (percent.value >= 80) return 'bg-amber-500';
  return 'bg-green-500';
});
const display = computed(() =>
  props.max === Infinity ? `${props.current}` : `${props.current}/${props.max}`,
);
</script>

<template>
  <div v-if="max !== Infinity" :class="compact ? 'flex items-center gap-2' : ''">
    <div class="flex justify-between text-xs text-stone-500 mb-1" v-if="!compact">
      <span>{{ label }}</span>
      <span :class="percent >= 100 ? 'text-red-600 font-semibold' : ''">{{ display }}</span>
    </div>
    <div
      class="h-1.5 bg-stone-100 rounded-full overflow-hidden"
      :class="compact ? 'w-16' : 'w-full'"
    >
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="color"
        :style="{ width: `${Math.min(percent, 100)}%` }"
      />
    </div>
    <span v-if="compact" class="text-xs text-stone-400">{{ display }}</span>
  </div>
</template>
```

### 7.2 Intégration sidebar — Jauge ruches

```vue
<!-- Dans AppSidebar.vue, sous la liste des liens -->
<div class="px-4 py-3 border-t border-stone-800">
  <UsageMeter
    :current="gating.usageData?.usage?.ruches?.current ?? 0"
    :max="gating.usageData?.usage?.ruches?.max ?? 1"
    label="Ruches"
  />
  <UButton
    v-if="gating.isAtLimit('ruches')"
    size="xs"
    color="primary"
    variant="soft"
    to="/tarifs"
    block
    class="mt-2"
  >
    Augmenter la limite →
  </UButton>
</div>
```

---

## 9. STRIPE WEBHOOKS — SYNC STATUT PLAN

### 8.1 Webhook complet — `server/api/stripe/webhook.post.ts`

```typescript
// Événements à gérer :

// checkout.session.completed
//   → L'utilisateur a payé
//   → Extraire customer_id, subscription_id, plan depuis metadata
//   → UPDATE profils SET plan, stripe_customer_id, stripe_subscription_id
//   → Si trialActive = true → désactiver le trial

// customer.subscription.updated
//   → Changement de plan (upgrade/downgrade)
//   → Extraire le nouveau price_id → mapper vers plan
//   → UPDATE profils SET plan

// customer.subscription.deleted
//   → Annulation
//   → UPDATE profils SET plan = 'decouverte', stripe_subscription_id = null

// invoice.payment_failed
//   → Paiement échoué
//   → INSERT alertes (type: 'payment_failed', priorité: 'critique')
//   → Ne PAS downgrader immédiatement (Stripe retry pendant ~3 semaines)

// customer.subscription.trial_will_end (si on utilise Stripe trials plus tard)
//   → 3 jours avant fin trial Stripe
//   → INSERT alertes (type: 'trial_ending')
```

### 8.2 Mapping price_id → plan

```typescript
// server/utils/stripe-plans.ts

const PRICE_TO_PLAN: Record<string, Plan> = {
  [process.env.NUXT_PRICE_STARTER_MONTHLY!]: 'starter',
  [process.env.NUXT_PRICE_STARTER_YEARLY!]: 'starter',
  [process.env.NUXT_PRICE_PRO_MONTHLY!]: 'pro',
  [process.env.NUXT_PRICE_PRO_YEARLY!]: 'pro',
  [process.env.NUXT_PRICE_EXPERT_MONTHLY!]: 'expert',
  [process.env.NUXT_PRICE_EXPERT_YEARLY!]: 'expert',
};

export function planFromPriceId(priceId: string): Plan | null {
  return PRICE_TO_PLAN[priceId] ?? null;
}
```

---

## 10. PAGE TARIFS IN-APP

### `app/pages/tarifs.vue`

Page dédiée dans l'app (pas juste Paramètres/Facturation).

```
Layout :
  - Hero : "Choisissez le plan qui correspond à votre exploitation"
  - Toggle annuel/mensuel (avec badge "-17% annuel")
  - 4 colonnes plans (responsive : 1 col mobile, 2 col tablette, 4 col desktop)
  - Chaque colonne :
    - Badge plan (Gratuit / Populaire / Pro / Expert)
    - Prix (mensuel ou annuel selon toggle)
    - Description
    - Liste features avec ✅/❌
    - Bouton CTA :
      - Plan actuel → "Plan actuel" (disabled)
      - Plan inférieur → "Downgrader" (outline, confirmation modal)
      - Plan supérieur → "Passer au plan X" (primary, → Stripe checkout)
      - Découverte + pas de trial utilisé → "Essayer Pro 14j" (secondary)
  - Section FAQ en bas : "Que se passe-t-il si je downgrade ?", "Mes données sont-elles supprimées ?", etc.
```

---

## 11. CONVENTIONS & RAPPELS

### Pattern d'utilisation du gating dans les composants

```vue
<script setup>
// 1. Importer le composable
const gating = useGating();

// 2. Vérifier une feature
if (gating.can('analyticsRentabilite')) {
  /* ... */
}

// 3. Vérifier une limite
if (gating.isAtLimit('ruches')) {
  /* ... */
}

// 4. Afficher l'usage
gating.usageDisplay('ruches'); // "7/20"

// 5. Utiliser FeatureGate pour une section entière
// <FeatureGate feature="xxx" blur> ... </FeatureGate>
</script>
```

### Gestion des erreurs 402 côté client

```typescript
// app/utils/apiError.ts — ENRICHIR

export function getApiErrorMessage(e: unknown, fallback: string): string {
  if (typeof e === 'object' && e !== null && 'data' in e) {
    const data = (e as any).data;
    if (data?.data?.code === 'PLAN_REQUIRED' || data?.data?.code === 'LIMIT_REACHED') {
      return data.data.message;
    }
    if (data?.message) return data.message;
  }
  // ... reste existant
  return fallback;
}

// + Handler global 402 dans les pages de mutation :
// catch (e) {
//   if (e.statusCode === 402) {
//     showUpgradeModal(e.data.data);  // Affiche le modal upgrade avec contexte
//   }
// }
```

### Fichiers à créer

```
app/config/plans.ts                    → Source de vérité matrice plans
app/config/route-gates.ts             → Mapping routes → features/limites
app/config/admin.ts                   → Helper isAdminEmail (whitelist env var)
app/composables/useGating.ts          → Composable client feature gating (avec admin bypass)
app/components/ui/FeatureGate.vue     → Wrapper teaser flou
app/components/ui/UsageMeter.vue      → Jauge d'utilisation
app/components/ui/TrialBanner.vue     → Bannière trial countdown
app/pages/tarifs.vue                  → Page comparaison plans
server/api/subscription/usage.get.ts  → Usage courant vs limites
server/api/subscription/trial.post.ts → Activer trial Pro 14j
server/api/subscription/active-resources.get.ts → IDs resources actives
server/api/cron/trial-expiry.post.ts  → Cron expiration trials
server/utils/stripe-plans.ts         → Mapping price_id → plan
```

### Fichiers à modifier

```
server/middleware/04.subscription.ts  → RÉÉCRIRE avec matrice plans + admin bypass
server/api/stripe/webhook.post.ts    → Compléter tous les events
server/api/profils/me.get.ts         → Ajouter isAdmin: isAdminEmail(user.email)
server/api/auth/me.get.ts            → Ajouter isAdmin: isAdminEmail(user.email)
app/components/ui/AppSidebar.vue     → Cadenas + jauge ruches + badge admin
app/layouts/default.vue              → TrialBanner (masqué pour admin)
app/pages/parametres/facturation.vue → Lien vers /tarifs
app/composables/useSubscription.ts   → Remplacer par useGating (ou merger)
app/utils/apiError.ts               → Handler 402

+ Toutes les pages premium : wraper avec <FeatureGate>
  app/pages/analytics/index.vue
  app/pages/production/*.vue
  app/pages/stocks/index.vue
  app/pages/clients/*.vue
  app/pages/finances/*.vue
  app/pages/parametres/equipe.vue
```

---

## 12. CHECKLIST D'IMPLÉMENTATION

### Étape 1 — Config + Types

- [ ] Créer `app/config/plans.ts` (matrice complète)
- [ ] Créer `app/config/route-gates.ts` (mapping routes)
- [ ] Créer `app/config/admin.ts` (helper isAdminEmail)
- [ ] Ajouter `NUXT_ADMIN_EMAILS` dans `.env` et dans Vercel env vars
- [ ] Créer `server/utils/stripe-plans.ts` (mapping price_id)
- [ ] Ajouter colonnes trial sur table `profils` (trialActive, trialStartedAt, trialEndsAt, trialUsed)
- [ ] `npm run db:push` ou SQL Supabase

### Étape 2 — Backend enforcement

- [ ] Réécrire `server/middleware/04.subscription.ts` (avec admin bypass en première ligne)
- [ ] Modifier `server/api/profils/me.get.ts` — ajouter `isAdmin: isAdminEmail(user.email)`
- [ ] Modifier `server/api/auth/me.get.ts` — ajouter `isAdmin: isAdminEmail(user.email)`
- [ ] Créer `server/api/subscription/usage.get.ts`
- [ ] Créer `server/api/subscription/trial.post.ts`
- [ ] Créer `server/api/subscription/active-resources.get.ts`
- [ ] Créer `server/api/cron/trial-expiry.post.ts`
- [ ] Compléter `server/api/stripe/webhook.post.ts`

### Étape 3 — Frontend composables + composants

- [ ] Créer `app/composables/useGating.ts`
- [ ] Créer `app/components/ui/FeatureGate.vue`
- [ ] Créer `app/components/ui/UsageMeter.vue`
- [ ] Créer `app/components/ui/TrialBanner.vue`
- [ ] Modifier `AppSidebar.vue` (cadenas + jauge)
- [ ] Modifier `default.vue` (TrialBanner)
- [ ] Enrichir `apiError.ts` (handler 402)

### Étape 4 — Pages gating

- [ ] Créer `app/pages/tarifs.vue`
- [ ] Wrapper `analytics/index.vue` avec FeatureGate
- [ ] Wrapper `production/*.vue` avec FeatureGate
- [ ] Wrapper `stocks/index.vue` avec FeatureGate
- [ ] Wrapper `clients/*.vue` avec FeatureGate
- [ ] Wrapper `finances/*.vue` avec FeatureGate
- [ ] Wrapper `parametres/equipe.vue` avec FeatureGate
- [ ] Boutons conditionnels partout (créer ruche, créer intervention groupée, etc.)

### Étape 5 — Trial + Downgrade

- [ ] UI activation trial (bouton dans FeatureGate + page tarifs)
- [ ] Bannière countdown trial
- [ ] Cron Vercel trial-expiry
- [ ] Badges "Lecture seule" sur les resources inactives après downgrade
- [ ] Test downgrade : données préservées, seules les N premières actives

### VALIDATION

- [ ] `npm run typecheck` → 0 erreurs
- [ ] `npm run build` → PASS
- [ ] `npm run test` → tous PASS
- [ ] `npm run lint` → 0 erreurs

---

## 13. MATRICE DE TESTS

### Tests restrictions (critiques)

| #   | Scénario                           | Plan       | Résultat attendu                         |
| --- | ---------------------------------- | ---------- | ---------------------------------------- |
| 1   | Créer 2ème ruche                   | Découverte | 402 "Limite de 1 ruche atteinte"         |
| 2   | Créer 2ème rucher                  | Découverte | 402 "Limite de 1 rucher atteinte"        |
| 3   | POST /api/production/recoltes      | Découverte | 402 "Plan Starter requis"                |
| 4   | POST /api/clients                  | Découverte | 402 "Plan Starter requis"                |
| 5   | POST /api/finances/ventes          | Découverte | 402 "Plan Starter requis"                |
| 6   | GET /api/analytics                 | Découverte | 402 "Plan Pro requis"                    |
| 7   | POST /api/interventions/bulk-group | Découverte | 402 "Plan Starter requis"                |
| 8   | Créer 21ème ruche                  | Starter    | 402 "Limite de 20 ruches, passez au Pro" |
| 9   | Créer 21ème client                 | Starter    | 402 "Limite de 20 clients"               |
| 10  | 11ème facture du mois              | Starter    | 402 "Limite de 10 factures/mois"         |
| 11  | POST /api/finances/achats          | Starter    | 402 "Plan Pro requis"                    |
| 12  | GET /api/analytics                 | Starter    | 402 "Plan Pro requis"                    |
| 13  | POST /api/membres/inviter          | Starter    | 402 "Plan Pro requis"                    |
| 14  | 4ème membre équipe                 | Pro        | 402 "Limite de 3 membres"                |
| 15  | Créer 101ème ruche                 | Pro        | 402 "Limite de 100 ruches"               |
| 16  | Tout illimité                      | Expert     | 200 (aucune restriction)                 |

### Tests trial

| #   | Scénario                                      | Résultat attendu                                |
| --- | --------------------------------------------- | ----------------------------------------------- |
| 17  | Activer trial depuis Découverte               | Plan passe à Pro, trialActive=true, endsAt=+14j |
| 18  | Activer trial une 2ème fois                   | 400 "Déjà utilisé"                              |
| 19  | Activer trial depuis Starter                  | 400 "Réservé au plan Découverte"                |
| 20  | Cron J+15 après activation                    | Plan revient à Découverte, alerte créée         |
| 21  | Pendant trial : créer 50 ruches               | 200 (limites Pro)                               |
| 22  | Après trial expiré : créer ruche              | 402 "Limite de 1 ruche"                         |
| 23  | Après trial : les 50 ruches existent toujours | Visibles en lecture seule, seule 1 active       |

### Tests UI gating

| #   | Scénario                     | Résultat attendu                                                  |
| --- | ---------------------------- | ----------------------------------------------------------------- |
| 24  | Sidebar en Découverte        | Cadenas sur Production, Stocks, Clients, Finances, Analytics      |
| 25  | Clic lien cadenas Analytics  | Page s'affiche avec teaser flou + CTA upgrade                     |
| 26  | Jauge ruches 1/1             | Jauge rouge + lien "Augmenter la limite"                          |
| 27  | Jauge ruches 15/20 (Starter) | Jauge orange (75%)                                                |
| 28  | Bannière trial J-3           | Bannière rouge "3 jours restants"                                 |
| 29  | Page /tarifs                 | 4 plans, bouton actif sur plan actuel, CTA upgrade sur les autres |

### Tests Stripe webhook

| #   | Scénario                                      | Résultat attendu            |
| --- | --------------------------------------------- | --------------------------- |
| 30  | checkout.session.completed avec price_starter | profil.plan = 'starter'     |
| 31  | customer.subscription.updated vers price_pro  | profil.plan = 'pro'         |
| 32  | customer.subscription.deleted                 | profil.plan = 'decouverte'  |
| 33  | invoice.payment_failed                        | Alerte créée, plan inchangé |

### Tests Super Admin

| #   | Scénario                                                      | Résultat attendu                                |
| --- | ------------------------------------------------------------- | ----------------------------------------------- |
| 34  | Admin (email whitelisté) plan Découverte → POST /api/ruches   | 200 (bypass total, pas de 402)                  |
| 35  | Admin → POST /api/analytics                                   | 200 (pas de restriction feature)                |
| 36  | Admin → créer 200 ruches                                      | 200 (pas de limite ruches)                      |
| 37  | Admin → sidebar                                               | Aucun cadenas, badge "Admin — Accès illimité"   |
| 38  | Admin → jauge ruches                                          | Affiche "∞" au lieu de "X/Y"                    |
| 39  | Admin → page premium (analytics)                              | Contenu affiché normalement, pas de teaser flou |
| 40  | Admin → TrialBanner                                           | Masquée (pas de bannière trial)                 |
| 41  | Non-admin avec même plan Découverte → POST /api/ruches (2ème) | 402 (restrictions normales)                     |
| 42  | Retirer email de NUXT_ADMIN_EMAILS + redeploy → même user     | Restrictions normales rétablies                 |
| 43  | GET /api/profils/me en tant qu'admin                          | Réponse contient `isAdmin: true`                |
| 44  | GET /api/profils/me en tant que non-admin                     | Réponse contient `isAdmin: false`               |

---

_Fin du Sprint Abonnements & Feature Gating. Source de vérité unique dans `plans.ts`, admin bypass par whitelist email, enforcement serveur + UI cadenas + teaser flou + trial 14j + downgrade gracieux._
