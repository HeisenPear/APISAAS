# 🐝 APICULTURE 360° — PROMPT CLAUDE CODE PHASE 2

> **Version** : 2.0 — Mars 2026
> **Suite de** : CLAUDE_CODE_PROMPT.md (Phase 1 — Sprints 1 à 12)
> **Auteur** : Antoine — La Jocondienne
> **Objectif** : Implémenter les 13 sous-catégories d'intervention avec tables dédiées, finaliser Stripe + multi-users, et optimiser l'existant

---

## 📋 TABLE DES MATIÈRES

1. [Contexte et état actuel](#1-contexte-et-état-actuel)
2. [Objectifs Phase 2 — 4 chantiers](#2-objectifs-phase-2--4-chantiers)
3. [Stack technique — Rappel](#3-stack-technique--rappel)
4. [Conventions du projet — À respecter impérativement](#4-conventions-du-projet--à-respecter-impérativement)
5. [CHANTIER A — 13 sous-catégories d'intervention](#5-chantier-a--13-sous-catégories-dintervention)
6. [CHANTIER B — Stripe complet + Middleware abonnement](#6-chantier-b--stripe-complet--middleware-abonnement)
7. [CHANTIER C — Multi-users fonctionnel](#7-chantier-c--multi-users-fonctionnel)
8. [CHANTIER D — Optimisations et polish](#8-chantier-d--optimisations-et-polish)
9. [Design system Warm Precision — Règles UI](#9-design-system-warm-precision--règles-ui)
10. [Checklist d'implémentation — Ordre obligatoire](#10-checklist-dimplémentation--ordre-obligatoire)
11. [Tests et validation](#11-tests-et-validation)

---

## 1. CONTEXTE ET ÉTAT ACTUEL

### Ce qui existe déjà (260+ fichiers, 12 sessions complétées)

Le projet Apiculture 360° est un SaaS Nuxt 3 full-stack déployé sur Vercel (`apisaas-360.vercel.app`). Voici l'état exact après 12 sessions de développement :

#### Modules complétés

- **Auth + Onboarding** : Login/register Supabase, wizard 4 étapes, "Se souvenir de moi", session-guard plugin
- **Dashboard** : Refonte Apple-style avec ExpandableCard, sparklines SVG, hero greeting, QuickActions FAB, UpcomingTasks, ProductionChart multi-période (mois/semaine/jour), SanteScore jauge
- **Ruchers** : CRUD complet, carte Leaflet, géocodage api-adresse.data.gouv.fr, score santé
- **Ruches** : CRUD, fiche individuelle, timeline, badge santé SVG, QR code (qrcode library + composable + modal téléchargement)
- **Interventions (v1 — À MIGRER)** : 14 formulaires Vue, stockage JSONB `donnees` dans table `interventions`, API CRUD
- **Production** : Récoltes CRUD, lots, traçabilité réglementaire (CE 178/2002, INCO 1169/2011), DDM auto, conformité 5 checks
- **Stocks** : Inventaire, mouvements, alertes stock bas, auto-déduction vente, catégories vente apicoles (20 catégories) avec TVA automatique conforme CGI
- **Finances** : Clients CRUD, ventes multi-taux TVA par ligne (5,5%/10%/20%/0%), achats auto-stock, facturation PDF conforme art. L441-9, export CSV/FEC
- **Alertes** : Génération auto (visite requise, santé critique, stock bas, facture retard)
- **Météo** : Open-Meteo par rucher, prévisions 7j, conditions optimales
- **Calendrier** : Grille mensuelle, événements color-coded
- **Paramètres** : Profil, exploitation, préférences, plan, page facturation
- **PWA + Offline** : Service Worker Workbox, IndexedDB queue, sync auto
- **Exports** : Registre d'élevage PDF, bilan annuel PDF
- **Stripe** : ⚠️ PARTIEL — checkout + portal routes créées, prix mis à jour (9,99/39,99/79,99€), env vars fixées (NUXT\_ prefix). **MANQUE** : webhooks, middleware abonnement, enforcement limites plan
- **Multi-users** : ⚠️ PARTIEL — table `membres` + enums créés, page équipe UI. **MANQUE** : invitations fonctionnelles, rôles effectifs, partage données
- **UI uniformisée** : Audit complet OK, PageHeader + UButton partout, charte boutons établie, ExpandableCard CSS grid, accents corrigés

#### Table `interventions` actuelle (renommée depuis `inspections` au Sprint 8)

```typescript
export const interventions = pgTable('interventions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  dateVisite: timestamp('date_visite').notNull(),
  type: text('type').notNull(),
  meteo: jsonb('meteo'),

  // État colonie (Contrôle)
  forceColonie: integer('force_colonie'),
  couvain: integer('couvain'),
  reserves: integer('reserves'),
  comportement: text('comportement'),
  reineVue: boolean('reine_vue'),
  celluleRoyale: boolean('cellule_royale'),
  signeEssaimage: boolean('signe_essaimage'),

  // Varroa basique
  varroa: integer('varroa'),
  traitementApplique: text('traitement_applique'),
  maladieObservee: text('maladie_observee'),

  // Actions + Nourrissement
  actionsRealisees: jsonb('actions_realisees'),
  nourrissementType: text('nourrissement_type'),
  nourrissementQuantite: decimal('nourrissement_quantite'),

  // Notes
  notes: text('notes'),
  photos: jsonb('photos').default([]),
  dureeMinutes: integer('duree_minutes'),

  // Offline
  syncedAt: timestamp('synced_at'),
  offlineId: text('offline_id'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Table `membres` existante

```typescript
export const roleMembre = pgEnum('role_membre', ['admin', 'apiculteur', 'comptable', 'lecteur']);
export const statutInvitation = pgEnum('statut_invitation', [
  'en_attente',
  'acceptee',
  'refusee',
  'expiree',
]);

export const membres = pgTable('membres', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profils.id),
  email: text('email').notNull(),
  role: roleMembre('role').notNull().default('apiculteur'),
  statut: statutInvitation('statut').notNull().default('en_attente'),
  inviteAt: timestamp('invite_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### Table `stocks` existante (avec TVA auto Session 11)

```typescript
// Colonnes ajoutées en Session 11 :
categorieVente: categorieVenteEnum('categorie_vente'),  // 20 catégories apicoles
tauxTva: decimal('taux_tva', { precision: 4, scale: 1 }), // 5.5, 10.0, 20.0, 0.0
```

#### Business model actuel

| Plan       | Ruches   | Prix/mois | Prix/an |
| ---------- | -------- | --------- | ------- |
| Découverte | 0-10     | Gratuit   | Gratuit |
| Starter    | 0-20     | 9,99€     | 99€     |
| Pro        | 21-100   | 39,99€    | 399€    |
| Expert     | Illimité | 79,99€    | 799€    |

#### Charte boutons unifiée (Session 12)

| Action        | Props Nuxt UI v3                                          |
| ------------- | --------------------------------------------------------- |
| CTA principal | `icon="i-lucide-plus" color="primary"`                    |
| Secondaire    | `variant="outline" color="neutral"`                       |
| Supprimer     | `icon="i-lucide-trash-2" variant="ghost" color="error"`   |
| Annuler       | `variant="ghost" color="neutral"`                         |
| Enregistrer   | `icon="i-lucide-check" color="primary" :loading="saving"` |

---

## 2. OBJECTIFS PHASE 2 — 4 CHANTIERS

| #     | Chantier                          | Priorité    | Scope                                                                               |
| ----- | --------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| **A** | 13 sous-catégories d'intervention | 🔴 Critique | Schema DB, 13 handlers, bulk API, 13 formulaires Vue, wizard, side-effects, alertes |
| **B** | Stripe complet + Middleware       | 🟡 Haute    | Webhooks, sync statut, middleware plan, enforcement limites ruches                  |
| **C** | Multi-users fonctionnel           | 🟡 Haute    | Invitations email, acceptation, rôles effectifs, partage données, RLS multi-tenant  |
| **D** | Optimisations + polish            | 🟢 Moyenne  | Timeline agrégée ruche, recherche globale ⌘K, notifications push, performance       |

### Ce qui est HORS scope Phase 2

- Module Reine (14ème catégorie — phase 3)
- Apps natives Capacitor
- API REST publique / webhooks tiers
- Interventions groupées multi-ruches
- Import balances connectées
- Templates d'intervention sauvegardés

---

## 3. STACK TECHNIQUE — RAPPEL

| Couche          | Technologie                                                               |
| --------------- | ------------------------------------------------------------------------- |
| Full-stack      | Nuxt 3 (Vue 3 + Nitro)                                                    |
| Base de données | Supabase (PostgreSQL 16)                                                  |
| ORM             | Drizzle ORM                                                               |
| Auth            | Supabase Auth                                                             |
| Paiements       | Stripe SDK                                                                |
| Validation      | Zod                                                                       |
| UI              | Nuxt UI v3 + composants custom (ExpandableCard, KpiCard, StatsGrid, etc.) |
| Icons           | Lucide Icons (`i-lucide-xxx` via Nuxt UI)                                 |
| Charts          | Apache ECharts                                                            |
| Cartographie    | Leaflet + OpenStreetMap                                                   |
| QR Codes        | qrcode library                                                            |
| State           | Pinia                                                                     |
| Déploiement     | Vercel serverless (région cdg1)                                           |

---

## 4. CONVENTIONS DU PROJET — À RESPECTER IMPÉRATIVEMENT

### TypeScript

- **Strict mode** : `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`
- **Zod** pour TOUTE validation serveur
- **Zéro `any`**, zéro `@ts-ignore` (audit Session 12 confirmé)

### Imports Nuxt

- `~` → `app/` (composants, composables, types frontend)
- `~~` → racine projet (server/, nuxt.config)
- Fichiers serveur : `import { ... } from '~~/server/database/schema'`

### API Routes Nitro

- Pattern : `auth → validate → query → response`
- Chaque route < 50 lignes (déléguer aux services)
- `requireAuth(event)` en première ligne
- `getValidatedQuery` / `readValidatedBody` avec Zod
- Error handling : `server/utils/errors.ts`

### Composants Vue

- `<script setup lang="ts">` obligatoire
- Chaque composant < 200 lignes
- Props : `defineProps<{ ... }>()`
- Emits : `defineEmits<{ ... }>()`
- Nuxt UI v3 : couleurs sémantiques (`primary`, `error`, `success`, `warning`, `info`, `neutral`)
- Headers : `<UiPageHeader>` avec breadcrumbs
- Boutons : charte unifiée Session 12

### useFetch — Règles critiques (bugs corrigés Sessions 5-6)

- **`key` = `string`** — JAMAIS un `Ref` ou `ComputedRef`
- `dedupe: 'defer'` sur les listes
- `onMounted(() => refresh())` sur les pages listes
- Mutations : `$fetch` direct, PAS `useFetch`
- Erreurs : `getApiErrorMessage(e, fallback)` depuis `app/utils/apiError.ts`

### Base de données

- UUID primary keys (`uuid('id').primaryKey().defaultRandom()`)
- `user_id` FK avec `onDelete: 'cascade'`
- `created_at` / `updated_at` sur TOUTES les tables
- RLS `user_id = auth.uid()` sur TOUTES les tables
- Index `(ruche_id, created_at DESC)` sur les tables liées aux ruches
- Variables env : préfixe `NUXT_` obligatoire pour les secrets

### Design System Warm Precision

- Honey : `#F5A623`, fonds chauds stone, ombres `rgba(120,100,80,...)`
- Cards : `border-radius: 12px`, padding `24px`, shadow chaude
- Transitions : `250ms cubic-bezier(0.16, 1, 0.3, 1)`
- Touch targets : minimum `44×44px`
- CTA terrain : `56px` hauteur, pleine largeur
- ExpandableCard : CSS `grid-template-rows: 0fr→1fr` pour expand/collapse

---

## 5. CHANTIER A — 13 SOUS-CATÉGORIES D'INTERVENTION

### Architecture : Hub Visite + Tables enfants

```
[Sélection ruche] → [Grille 13 icônes multi-select] → [Formulaires séquentiels] → [Résumé]
        ↓
[POST /api/interventions/bulk]
        ↓
[Transaction PostgreSQL unique]
  ├─ INSERT interventions (hub visite parent)
  ├─ Handler matériel    → INSERT mouvements_materiel + UPDATE ruches
  ├─ Handler contrôle    → UPDATE interventions (colonnes existantes)
  ├─ Handler récolte     → INSERT recoltes
  ├─ Handler nourrissement → UPDATE interventions (colonnes nourrissement)
  ├─ Handler essaimage   → INSERT essaimages + UPDATE ruches
  ├─ Handler division    → INSERT divisions + INSERT ruches filles
  ├─ Handler déplacement → INSERT deplacements_ruches + UPDATE ruches.rucher_id
  ├─ Handler varroa      → INSERT comptages_varroa OU traitements_varroa
  ├─ Handler pesée       → INSERT pesees
  ├─ Handler commentaire → UPDATE interventions.notes
  ├─ Handler empilement  → INSERT empilements + UPDATE ruches source/dest
  ├─ Handler sanitaire   → INSERT evenements_sanitaires + UPDATE ruches.statut
  └─ Handler transvasement → INSERT transvasements + UPDATE ruches source/dest
        ↓
[Side-effects : alertes, stocks, compteurs] → [Réponse agrégée]
```

### 5.1 Modifications table `interventions` existante

```typescript
// Colonnes à AJOUTER
nourrissementUnite: text('nourrissement_unite'),             // 'kg', 'g', 'litres', 'ml'
categoriesActivees: jsonb('categories_activees').default([]), // string[]
couvainPresent: boolean('couvain_present'),
rucherId: uuid('rucher_id').references(() => ruchers.id),
```

### 5.2 Modifications table `recoltes` existante

```typescript
inspectionId: uuid('inspection_id').references(() => interventions.id),
typeProduit: text('type_produit').default('miel'),  // 'miel', 'pollen', 'propolis'
```

### 5.3 Enum existant à enrichir

```sql
-- Exécuter hors transaction dans Supabase SQL Editor
ALTER TYPE statut_colonie ADD VALUE IF NOT EXISTS 'empilee';
```

### 5.4 Nouveaux enums

```typescript
export const typePeseeEnum = pgEnum('type_pesee', [
  'totale',
  'cote_droit',
  'cote_gauche',
  'arriere',
]);
export const typeComptageVarroaEnum = pgEnum('type_comptage_varroa', [
  'plancher',
  'vph',
  'suppression_couvain_male',
]);
export const actionMaterielEnum = pgEnum('action_materiel', ['ajout', 'retrait', 'remplacement']);
export const motifDeplacementEnum = pgEnum('motif_deplacement', [
  'transhumance',
  'reorganisation',
  'vente',
  'autre',
]);
export const devenirRucheEnum = pgEnum('devenir_ruche', [
  'stockage',
  'destruction',
  'reutilisation',
  'reutilisation_immediate',
]);
export const typeEvenementSanitaireEnum = pgEnum('type_evenement_sanitaire', [
  'essaim_mort',
  'nettoyer_ruche',
  'nettoyer_plancher',
  'retrait_couvain',
]);
export const causeMortaliteEnum = pgEnum('cause_mortalite', [
  'varroa',
  'famine',
  'pesticides',
  'maladie',
  'pillage',
  'froid',
  'inconnue',
  'autre',
]);
export const origineEssaimEnum = pgEnum('origine_essaim', [
  'sauvage',
  'transvasement',
  'recuperation_particulier',
  'achat',
  'autre',
]);
```

### 5.5 Nouvelles tables (11 tables)

#### `pesees`

```typescript
export const pesees = pgTable('pesees', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id),
  poidsKg: decimal('poids_kg', { precision: 6, scale: 1 }).notNull(),
  typePesee: typePeseeEnum('type_pesee').notNull(),
  poidsEstimeTotal: decimal('poids_estime_total', { precision: 6, scale: 1 }),
  variationKg: decimal('variation_kg', { precision: 6, scale: 1 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### `comptages_varroa`

```typescript
export const comptagesVarroa = pgTable('comptages_varroa', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id),
  typeComptage: typeComptageVarroaEnum('type_comptage').notNull(),
  nombreVarroas: integer('nombre_varroas').notNull(),
  dureeComptageJours: integer('duree_comptage_jours'),
  chuteParJour: decimal('chute_par_jour', { precision: 6, scale: 2 }),
  nombreAbeillesEchantillon: integer('nombre_abeilles_echantillon'),
  tauxVph: decimal('taux_vph', { precision: 5, scale: 2 }),
  nombreCadresRetires: integer('nombre_cadres_retires'),
  observations: text('observations'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### `traitements_varroa`

```typescript
export const traitementsVarroa = pgTable('traitements_varroa', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id),
  typeTraitement: text('type_traitement').notNull(),
  dosage: text('dosage'),
  dateDebut: timestamp('date_debut').notNull(),
  dateFinPrevue: timestamp('date_fin_prevue'),
  dateFinReelle: timestamp('date_fin_reelle'),
  numeroLotProduit: text('numero_lot_produit').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### `mouvements_materiel`

```typescript
export const mouvementsMateriel = pgTable('mouvements_materiel', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id),
  action: actionMaterielEnum('action').notNull(),
  element: text('element').notNull(),
  quantite: integer('quantite').notNull(),
  notes: text('notes'),
  stockId: uuid('stock_id').references(() => stocks.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### `deplacements_ruches`

```typescript
export const deplacementsRuches = pgTable('deplacements_ruches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id),
  rucherSourceId: uuid('rucher_source_id')
    .notNull()
    .references(() => ruchers.id),
  rucherDestinationId: uuid('rucher_destination_id')
    .notNull()
    .references(() => ruchers.id),
  dateDeplacement: timestamp('date_deplacement').notNull(),
  motif: motifDeplacementEnum('motif').default('reorganisation'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### `divisions` + `divisions_ruches`

```typescript
export const divisions = pgTable('divisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheSourceId: uuid('ruche_source_id')
    .notNull()
    .references(() => ruches.id),
  inspectionId: uuid('inspection_id').references(() => interventions.id),
  nombreDivisions: integer('nombre_divisions').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const divisionsRuches = pgTable('divisions_ruches', {
  id: uuid('id').primaryKey().defaultRandom(),
  divisionId: uuid('division_id')
    .notNull()
    .references(() => divisions.id, { onDelete: 'cascade' }),
  rucheDestinationId: uuid('ruche_destination_id')
    .notNull()
    .references(() => ruches.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### `essaimages`

```typescript
export const essaimages = pgTable('essaimages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheSourceId: uuid('ruche_source_id')
    .notNull()
    .references(() => ruches.id),
  inspectionId: uuid('inspection_id').references(() => interventions.id),
  dateEssaimage: timestamp('date_essaimage').notNull(),
  essaimRecupere: boolean('essaim_recupere').notNull(),
  rucheDestinationId: uuid('ruche_destination_id').references(() => ruches.id),
  nouvelleRucheCree: boolean('nouvelle_ruche_cree').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### `empilements`

```typescript
export const empilements = pgTable('empilements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheSourceId: uuid('ruche_source_id')
    .notNull()
    .references(() => ruches.id),
  rucheDestinationId: uuid('ruche_destination_id')
    .notNull()
    .references(() => ruches.id),
  inspectionId: uuid('inspection_id').references(() => interventions.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### `evenements_sanitaires`

```typescript
export const evenementsSanitaires = pgTable('evenements_sanitaires', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id),
  typeEvenement: typeEvenementSanitaireEnum('type_evenement').notNull(),
  causeProbable: causeMortaliteEnum('cause_probable'),
  dateConstat: timestamp('date_constat'),
  declarationGdsa: boolean('declaration_gdsa'),
  typeNettoyage: text('type_nettoyage'),
  produitUtilise: text('produit_utilise'),
  typeCouvain: text('type_couvain'),
  nombreCadres: integer('nombre_cadres'),
  notes: text('notes'),
  photos: jsonb('photos').default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

#### `transvasements`

```typescript
export const transvasements = pgTable('transvasements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheSourceId: uuid('ruche_source_id')
    .notNull()
    .references(() => ruches.id),
  rucheDestinationId: uuid('ruche_destination_id')
    .notNull()
    .references(() => ruches.id),
  inspectionId: uuid('inspection_id').references(() => interventions.id),
  cadresTransferes: integer('cadres_transferes').notNull(),
  devenirRucheSource: devenirRucheEnum('devenir_ruche_source').notNull(),
  lieuStockage: text('lieu_stockage'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 5.6 RLS + Indexes

```sql
-- RLS sur chaque nouvelle table (pesees, comptages_varroa, traitements_varroa,
-- mouvements_materiel, deplacements_ruches, divisions, essaimages,
-- empilements, evenements_sanitaires, transvasements)
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_[table]" ON [table] FOR ALL USING (user_id = auth.uid());

-- divisions_ruches : protégé via FK cascade, pas de user_id direct

-- Indexes performance
CREATE INDEX idx_[table]_ruche ON [table](ruche_id, created_at DESC);
```

### 5.7 Types + Metadata (frontend)

```typescript
// app/types/interventions.ts

export const CATEGORIES_INTERVENTION = [
  'materiel',
  'controle',
  'recolte',
  'nourrissement',
  'essaimage',
  'division',
  'deplacement',
  'varroa',
  'pesee',
  'commentaire',
  'empilement',
  'sanitaire',
  'transvasement',
] as const;

export type CategorieIntervention = (typeof CATEGORIES_INTERVENTION)[number];

export const CATEGORIES_META: Record<
  CategorieIntervention,
  {
    label: string;
    icon: string;
    color: string;
    emoji: string;
    description: string;
  }
> = {
  materiel: {
    label: 'Matériel',
    icon: 'Wrench',
    color: 'text-stone-500',
    emoji: '🔧',
    description: 'Ajouter ou retirer du matériel',
  },
  controle: {
    label: 'Contrôle',
    icon: 'Search',
    color: 'text-blue-500',
    emoji: '🔍',
    description: 'Inspection de la colonie',
  },
  recolte: {
    label: 'Récolte',
    icon: 'Jar',
    color: 'text-amber-500',
    emoji: '🍯',
    description: 'Enregistrer une récolte',
  },
  nourrissement: {
    label: 'Nourrissement',
    icon: 'Utensils',
    color: 'text-orange-500',
    emoji: '🥄',
    description: 'Nourrir la colonie',
  },
  essaimage: {
    label: 'Essaimage naturel',
    icon: 'Wind',
    color: 'text-yellow-500',
    emoji: '🐝',
    description: 'Essaim parti naturellement',
  },
  division: {
    label: 'Essaim artificiel',
    icon: 'Scissors',
    color: 'text-purple-500',
    emoji: '✂️',
    description: 'Diviser la colonie',
  },
  deplacement: {
    label: 'Déplacer',
    icon: 'Truck',
    color: 'text-green-500',
    emoji: '🚚',
    description: 'Changer de rucher',
  },
  varroa: {
    label: 'Varroa',
    icon: 'Bug',
    color: 'text-red-500',
    emoji: '🦟',
    description: 'Comptage ou traitement',
  },
  pesee: {
    label: 'Pesée',
    icon: 'Scale',
    color: 'text-sky-500',
    emoji: '⚖️',
    description: 'Peser la ruche',
  },
  commentaire: {
    label: 'Commentaire',
    icon: 'MessageSquare',
    color: 'text-stone-400',
    emoji: '💬',
    description: 'Note libre',
  },
  empilement: {
    label: 'Empiler',
    icon: 'Layers',
    color: 'text-indigo-500',
    emoji: '📦',
    description: 'Fusionner deux colonies',
  },
  sanitaire: {
    label: 'Sanitaire',
    icon: 'HeartPulse',
    color: 'text-rose-500',
    emoji: '🏥',
    description: 'Mortalité et nettoyage',
  },
  transvasement: {
    label: 'Transvasement',
    icon: 'Repeat',
    color: 'text-teal-500',
    emoji: '🔄',
    description: "Changer l'essaim de ruche",
  },
};
```

### 5.8 Schémas Zod — Les 13 catégories

```typescript
// server/utils/validation/interventions.ts

export const materielSchema = z.object({
  elements: z
    .array(
      z.object({
        element: z.enum([
          'cadres',
          'cadres_male',
          'partitions',
          'nourrisseurs',
          'corps',
          'hausses',
          'grille_reine',
          'grille_propolis',
          'trappe_pollen',
        ]),
        quantite: z.number().int().min(1),
      }),
    )
    .min(1),
});

export const controleSchema = z.object({
  reineVue: z.boolean().nullable().default(null),
  couvainPresent: z.boolean().nullable().default(null),
  celluleRoyale: z.boolean().nullable().default(null),
  reserves: z.boolean().nullable().default(null),
  forceColonie: z.number().int().min(1).max(4),
  comportement: z.enum(['calme', 'agitee', 'agressive']),
});

export const recolteSchema = z.object({
  typeProduit: z.enum(['miel', 'pollen', 'propolis']),
});

export const nourrissementSchema = z.object({
  type: z.enum(['sirop_sucre', 'sirop_glucose', 'candi', 'pate_proteique', 'miel', 'autre']),
  quantite: z.number().positive(),
  unite: z.enum(['kg', 'g', 'litres', 'ml']),
});

export const essaimageSchema = z.object({
  essaimRecupere: z.boolean(),
});

export const divisionSchema = z.object({
  nombreDivisions: z.number().int().min(1).max(10),
});

export const deplacementSchema = z.object({
  rucherDestinationId: z.string().uuid(),
});

export const varroaSchema = z.discriminatedUnion('sousAction', [
  z.object({
    sousAction: z.literal('comptage_plancher'),
    nombreVarroas: z.number().int().min(0),
    dureeJours: z.number().int().min(1).default(3),
  }),
  z.object({
    sousAction: z.literal('traitement'),
    typeTraitement: z.string().min(1),
    dateDebut: z.string().datetime(),
    numeroLotProduit: z.string().min(1),
  }),
  z.object({ sousAction: z.literal('suppression_couvain'), nombreCadres: z.number().int().min(1) }),
  z.object({
    sousAction: z.literal('vph'),
    nombreVarroas: z.number().int().min(0),
    nombreAbeilles: z.number().int().min(1).default(300),
  }),
]);

export const peseeSchema = z.object({
  poidsKg: z.number().positive(),
  typePesee: z.enum(['totale', 'cote_droit', 'cote_gauche', 'arriere']),
});

export const commentaireSchema = z.object({
  texte: z.string().max(2000),
});

export const empilementSchema = z.object({
  rucheDestinationId: z.string().uuid(),
});

export const sanitaireSchema = z.object({
  typeEvenement: z.enum(['essaim_mort', 'nettoyer_ruche', 'nettoyer_plancher', 'retrait_couvain']),
});

export const transvasementSchema = z.object({
  rucheDestinationId: z.string().uuid(),
  lieuStockage: z.string().optional(),
});
```

### 5.9 Services handlers (13 fichiers)

Chaque handler dans `server/services/interventions/[categorie].ts` :

```typescript
interface InterventionContext {
  userId: string;
  inspectionId: string;
  rucheId: string;
  rucherId: string;
  donnees: Record<string, unknown>;
}
// Signature : async function handleXxx(tx: DrizzleTransaction, ctx: InterventionContext)
```

**Side-effects par handler** :

| Handler       | INSERT                                          | UPDATE ruches                                               | Alertes                                     |
| ------------- | ----------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| materiel      | `mouvements_materiel`                           | `nombre_cadres`, `nombre_hausses`                           | —                                           |
| controle      | — (UPDATE interventions)                        | —                                                           | Cellules royales (haute), Force ≤ 1 (haute) |
| recolte       | `recoltes`                                      | —                                                           | —                                           |
| nourrissement | `mouvements_stock` (opt)                        | — (UPDATE interventions)                                    | —                                           |
| essaimage     | `essaimages`                                    | statut → `'essaimee'` si non récupéré                       | —                                           |
| division      | `divisions` + N `ruches` + N `divisions_ruches` | —                                                           | —                                           |
| deplacement   | `deplacements_ruches`                           | `rucher_id`                                                 | —                                           |
| varroa        | `comptages_varroa` OU `traitements_varroa`      | —                                                           | Chute > 3/j (haute), VPH > 2% (haute)       |
| pesee         | `pesees` (avec calcul variation)                | —                                                           | Perte > 2 kg (moyenne)                      |
| commentaire   | — (UPDATE interventions.notes)                  | —                                                           | —                                           |
| empilement    | `empilements`                                   | dest: +cadres/+hausses, source: `'fusionnee'` + compteurs 0 | —                                           |
| sanitaire     | `evenements_sanitaires`                         | statut → `'morte'` si essaim_mort                           | Mortalité (moyenne)                         |
| transvasement | `transvasements`                                | dest: +cadres, source: `'vendue'` + compteurs 0             | —                                           |

**Règle critique** : Tous les side-effects dans la même transaction PostgreSQL. UPDATE atomiques avec `sql\`nombre_cadres + ${n}\``.

### 5.10 Route API orchestrateur

```typescript
// server/api/interventions/bulk.post.ts
// Transaction unique : hub visite parent → dispatch vers handlers → side-effects
// Si un handler échoue → rollback complet → rien n'est écrit
```

### 5.11 UI spécifications rapides par catégorie

| #   | Catégorie     | UI clé                                                                                      |
| --- | ------------- | ------------------------------------------------------------------------------------------- |
| 1   | Matériel      | Grille 3×3 (9 éléments) + stepper quantité par élément                                      |
| 2   | Contrôle      | 4 questions tri-state (Oui/Non/Non vérifié) + barre force 1→4 + 3 icônes comportement       |
| 3   | Récolte       | 3 boutons exclusifs (Miel/Pollen/Propolis)                                                  |
| 4   | Nourrissement | Select type + stepper quantité + select unité                                               |
| 5   | Essaimage     | Toggle "Essaim récupéré ?"                                                                  |
| 6   | Division      | Stepper nombre divisions (1-10)                                                             |
| 7   | Déplacement   | Select rucher destination                                                                   |
| 8   | Varroa        | 4 boutons sous-action (plancher/traitement/suppression couvain/VPH) + sous-formulaire dédié |
| 9   | Pesée         | Input poids kg + select type + affichage variation                                          |
| 10  | Commentaire   | Textarea 2000 car. + compteur                                                               |
| 11  | Empilement    | Autocomplete ruche destination                                                              |
| 12  | Sanitaire     | 4 boutons action (mort/nettoyer ruche/plancher/retrait couvain)                             |
| 13  | Transvasement | Select ruche destination + select lieu stockage                                             |

### 5.12 Composants Vue

```
app/components/interventions/
├── InterventionGrid.vue          # Grille 13 icônes (RÉÉCRIRE)
├── InterventionCard.vue          # Card résumé timeline (ADAPTER)
├── InterventionBadge.vue         # Badge type + couleur (ADAPTER)
└── forms/
    ├── FormMateriel.vue          # RÉÉCRIRE
    ├── FormControle.vue          # RÉÉCRIRE
    ├── FormRecolte.vue           # RÉÉCRIRE
    ├── FormNourrissement.vue     # RÉÉCRIRE
    ├── FormEssaimage.vue         # RÉÉCRIRE
    ├── FormDivision.vue          # RÉÉCRIRE
    ├── FormDeplacement.vue       # RÉÉCRIRE
    ├── FormVarroa.vue            # RÉÉCRIRE
    ├── FormPesee.vue             # RÉÉCRIRE
    ├── FormCommentaire.vue       # RÉÉCRIRE
    ├── FormEmpilement.vue        # RÉÉCRIRE
    ├── FormSanitaire.vue         # RÉÉCRIRE
    └── FormTransvasement.vue     # RÉÉCRIRE
    # SUPPRIMER FormReine.vue (hors scope)
```

Wizard `app/pages/interventions/nouvelle.vue` : 3 étapes → sélection ruche → sélection catégories → formulaires séquentiels → résumé → `$fetch('/api/interventions/bulk')`.

---

## 6. CHANTIER B — STRIPE COMPLET + MIDDLEWARE ABONNEMENT

### État actuel

- Routes existantes : `server/api/stripe/checkout.post.ts`, `portal.post.ts`
- Env vars fixées : `NUXT_STRIPE_SECRET_KEY`, `NUXT_PRICE_STARTER`, `NUXT_PRICE_PRO`, `NUXT_PRICE_EXPERT`
- Page facturation : `app/pages/parametres/facturation.vue`
- Composable : `app/composables/useSubscription.ts`

### À implémenter

#### 6.1 Webhook Stripe — `server/api/stripe/webhook.post.ts`

```typescript
// Événements à gérer :
// checkout.session.completed → activer l'abonnement
// customer.subscription.updated → mettre à jour le plan
// customer.subscription.deleted → rétrograder vers Découverte
// invoice.payment_failed → marquer comme impayé, alerte

// Pattern :
// 1. Vérifier signature Stripe (constructEvent)
// 2. Switch sur event.type
// 3. UPDATE profils SET plan, stripe_customer_id, stripe_subscription_id, plan_expires_at
// 4. Return 200
```

**Important** : Le webhook ne passe PAS par `requireAuth()` — authentification via signature Stripe uniquement.

#### 6.2 Middleware abonnement — `server/middleware/04.subscription.ts`

```typescript
// Vérifie que l'utilisateur a un plan suffisant pour l'action demandée
// Routes protégées : toutes sauf /api/auth/*, /api/stripe/*, /api/profils/*

// Logique :
// 1. Récupérer profil utilisateur (plan actuel)
// 2. Compter les ruches actives
// 3. Vérifier les limites :
//    - Découverte : max 10 ruches
//    - Starter : max 20 ruches
//    - Pro : max 100 ruches
//    - Expert : illimité
// 4. Si dépassement sur POST /api/ruches → 402 "Limite de votre plan atteinte"
// 5. Les GET passent toujours (pas de blocage lecture)
```

#### 6.3 Composable enrichi — `app/composables/useSubscription.ts`

```typescript
// Ajouter :
// - isAtLimit: computed → booléen (nombre ruches ≥ limite plan)
// - canCreateHive: computed → booléen
// - planLimits: Record<Plan, number>  // { decouverte: 10, starter: 20, pro: 100, expert: Infinity }
// - showUpgradePrompt(): ouvre modal upgrade quand limite atteinte
```

#### 6.4 Modal upgrade — `app/components/ui/UpgradeModal.vue`

Quand l'utilisateur tente de créer une ruche au-delà de sa limite → modal avec :

- Message : "Vous avez atteint la limite de X ruches de votre plan Y"
- Comparaison plans (cards côte à côte)
- Bouton "Passer au plan Z" → Stripe checkout

---

## 7. CHANTIER C — MULTI-USERS FONCTIONNEL

### État actuel

- Table `membres` existe avec enums `role_membre` + `statut_invitation`
- Page `app/pages/parametres/equipe.vue` existe (UI skeleton)
- RLS basique sur `membres`

### À implémenter

#### 7.1 API invitations — `server/api/membres/`

```
POST   /api/membres/inviter     → Envoyer invitation (email + rôle)
GET    /api/membres              → Liste membres de mon exploitation
PUT    /api/membres/[id]        → Changer rôle
DELETE /api/membres/[id]        → Révoquer accès
POST   /api/membres/accepter    → Accepter une invitation (token URL)
GET    /api/membres/invitations → Mes invitations reçues
```

**Flow invitation** :

1. Owner envoie invitation → INSERT `membres` (statut: `en_attente`)
2. Email envoyé au destinataire avec lien magic (`/invitations/[token]`)
3. Destinataire clique → page d'acceptation → UPDATE `membres` (statut: `acceptee`, `user_id`)
4. Le membre voit maintenant les données de l'exploitation

#### 7.2 RLS multi-tenant

```sql
-- Les tables doivent être accessibles par le owner ET ses membres
-- Pattern : user_id = auth.uid() OR user_id IN (SELECT owner_id FROM membres WHERE user_id = auth.uid() AND statut = 'acceptee')

-- Alternative plus performante : ajouter une colonne exploitation_id
-- et regrouper owner + membres sous le même exploitation_id
```

**Décision recommandée** : Pour la v1, utiliser une sous-requête simple dans les policies RLS. Optimiser avec `exploitation_id` en phase 3 si nécessaire.

#### 7.3 Permissions par rôle

| Rôle       | Lecture       | Création | Modification | Suppression | Finances   |
| ---------- | ------------- | -------- | ------------ | ----------- | ---------- |
| admin      | ✅            | ✅       | ✅           | ✅          | ✅         |
| apiculteur | ✅            | ✅       | ✅ propres   | ❌          | ❌         |
| comptable  | finances only | ❌       | finances     | ❌          | ✅         |
| lecteur    | ✅            | ❌       | ❌           | ❌          | ❌ lecture |

#### 7.4 Page équipe fonctionnelle — `app/pages/parametres/equipe.vue`

- Formulaire invitation : email + select rôle + bouton "Inviter"
- Liste membres : avatar initiales, email, rôle, statut, date invitation
- Actions : changer rôle (dropdown), révoquer (bouton ghost error)
- Badge "Owner" distinct des membres invités

---

## 8. CHANTIER D — OPTIMISATIONS ET POLISH

### 8.1 Timeline agrégée ruche — `app/pages/ruches/[id].vue`

La timeline actuelle ne montre que les interventions (hub visite). Après migration vers tables dédiées, elle doit **agréger toutes les tables enfants** :

```typescript
// server/api/ruches/[id]/timeline.get.ts — RÉÉCRIRE
// Requêtes parallèles vers : interventions, pesees, comptages_varroa,
// traitements_varroa, essaimages, deplacements_ruches, empilements,
// evenements_sanitaires, transvasements
// → Fusionner, trier par date DESC, paginer
```

Chaque type d'événement dans la timeline a son propre design de card (icône, couleur, résumé).

### 8.2 Recherche globale ⌘K — `app/components/ui/AppCommandPalette.vue`

Le composant existe mais est un placeholder. L'enrichir :

```typescript
// Actions rapides (pas de recherche DB) :
// "Nouvelle intervention" → /interventions/nouvelle
// "Nouveau rucher" → /ruchers/nouveau
// "Nouvelle vente" → /finances/ventes (open modal)
// "Exporter registre" → /exports/registre
// "Paramètres" → /parametres

// Recherche live (fetch debounced 300ms) :
// GET /api/search?q=xxx → chercher dans ruches (numéro, nom), ruchers (nom), clients (nom)
// Résultats groupés par type avec icônes
```

Route API : `server/api/search.get.ts`

### 8.3 Notifications Push — Web Push API

```typescript
// 1. app/composables/useNotifications.ts — demander permission
// 2. server/api/notifications/subscribe.post.ts — stocker le subscription endpoint
// 3. Déclencher sur : alerte haute/critique créée, facture en retard, traitement varroa à retirer
// 4. Utiliser web-push library côté serveur
```

### 8.4 Performance Vercel

```typescript
// nuxt.config.ts — routeRules existantes à optimiser :
// - /api/meteo/** → cache 30min (swr)
// - /api/dashboard/** → cache 2min
// - Pages statiques (/login, /register) → prerender
// - Compression images via @nuxt/image si pas déjà
```

### 8.5 Calendrier enrichi

Le calendrier actuel affiche interventions + inspections. Après Phase 2, enrichir avec :

- Traitements varroa en cours (barre de durée)
- Date retour transhumance
- Rappels automatiques (intervention due, traitement à retirer)
- Click sur un jour → liste événements + bouton "Ajouter intervention"

---

## 9. DESIGN SYSTEM WARM PRECISION — RÈGLES UI

### Palette (rappel)

```css
--honey: #f5a623;
--surface-primary: #fafaf8;
--surface-secondary: #f3f2ef;
--text-primary: #1a1a18;
--text-secondary: #6b6860;
--text-tertiary: #9c978e;
```

### Composants spécifiques interventions

**InterventionGrid** : Cards 80×80px, icône 32px, label 12px. Sélectionné : honey-light bg, honey border, scale(1.05) spring.

**Toggle tri-state** : 3 états cycliques (Oui ✓ vert / Non ✗ rouge / Non vérifié — gris). Min 44px.

**Stepper quantité** : Boutons circulaires 40×40px, champ 60px, honey fill.

**Barre force (1→4)** : 4 segments 44px, rouge→orange→jaune→vert, tap sélection.

**Boutons CTA** : 56px hauteur terrain, pleine largeur, honey bg, blanc texte, radius 12px. Scale 0.97 au press.

**Sous-actions** : Grille 2×2 (Varroa/Sanitaire), sélection exclusive, honey border quand actif.

**ExpandableCard** (existant) : Utiliser pour les sections optionnelles dans les formulaires complexes.

### Charte boutons (Session 12 — à maintenir)

- CTA principal : `icon="i-lucide-plus" color="primary"`
- Secondaire : `variant="outline" color="neutral"`
- Supprimer : `icon="i-lucide-trash-2" variant="ghost" color="error"`
- Annuler : `variant="ghost" color="neutral"`
- Enregistrer : `icon="i-lucide-check" color="primary" :loading="saving"`

---

## 10. CHECKLIST D'IMPLÉMENTATION — ORDRE OBLIGATOIRE

### PHASE A — Interventions (priorité critique)

#### Étape A1 — Schema DB + Types

- [ ] Ajouter 8 nouveaux enums dans `server/database/schema.ts`
- [ ] Ajouter colonnes à `interventions` et `recoltes`
- [ ] Créer les 11 nouvelles tables
- [ ] Relations Drizzle
- [ ] `npm run db:push` + SQL RLS + indexes dans Supabase
- [ ] Réécrire `app/types/interventions.ts`
- [ ] Créer `server/types/interventions.ts`

#### Étape A2 — Validation + Utilitaires

- [ ] Réécrire `server/utils/validation/interventions.ts` (13 schemas Zod)
- [ ] Créer `server/utils/alertes.ts` (helper createAlerte transactionnel)

#### Étape A3 — 13 Services handlers

- [ ] `server/services/interventions/{materiel,controle,recolte,nourrissement,essaimage,division,deplacement,varroa,pesee,commentaire,empilement,sanitaire,transvasement}.ts`

#### Étape A4 — API orchestrateur

- [ ] Créer `server/api/interventions/bulk.post.ts`
- [ ] Adapter `[id].get.ts` (charger tables enfants)
- [ ] Adapter `index.get.ts` (filtre categoriesActivees)
- [ ] Adapter `stats.get.ts`

#### Étape A5 — Frontend

- [ ] Réécrire 13 `Form*.vue`, supprimer `FormReine.vue`
- [ ] Réécrire `InterventionGrid.vue` (13 catégories)
- [ ] Réécrire `interventions/nouvelle.vue` (wizard 3 étapes)
- [ ] Réécrire `useInterventions.ts`

#### Étape A6 — Pages existantes

- [ ] Adapter `interventions/index.vue` + `[id].vue`
- [ ] Réécrire `ruches/[id].vue` timeline (agréger toutes tables)

### PHASE B — Stripe (priorité haute)

- [ ] Créer `server/api/stripe/webhook.post.ts`
- [ ] Créer `server/middleware/04.subscription.ts`
- [ ] Enrichir `useSubscription.ts` (isAtLimit, canCreateHive, showUpgradePrompt)
- [ ] Créer `app/components/ui/UpgradeModal.vue`
- [ ] Brancher enforcement sur `POST /api/ruches`

### PHASE C — Multi-users (priorité haute)

- [ ] Créer API `server/api/membres/{inviter,index,accepter,[id].put,[id].delete}.ts`
- [ ] Page invitation : `app/pages/invitations/[token].vue`
- [ ] Compléter `app/pages/parametres/equipe.vue`
- [ ] Adapter RLS multi-tenant sur les tables principales
- [ ] Créer `app/composables/useMembres.ts`

### PHASE D — Optimisations (priorité moyenne)

- [ ] Réécrire timeline agrégée `ruches/[id]/timeline.get.ts`
- [ ] Enrichir ⌘K : `server/api/search.get.ts` + actions rapides
- [ ] Calendrier enrichi (traitements, rappels, click-to-add)
- [ ] Web Push notifications (si temps)
- [ ] Performance routeRules optimisées

### VALIDATION FINALE

- [ ] `npm run typecheck` → 0 erreurs
- [ ] `npm run build` → PASS
- [ ] `npm run test` → 15/15 PASS (ne pas casser l'existant)
- [ ] `npm run lint` → 0 erreurs

---

## 11. TESTS ET VALIDATION

### Critères

- Typecheck : 0 erreurs TS
- Build : PASS (< 16 MB)
- ESLint : 0 erreurs
- Tests existants : 15/15 PASS

### Validation manuelle critique

**Interventions :**

1. Créer intervention 3+ catégories → vérifier records dans toutes les tables
2. Essaimage non récupéré → statut `'essaimee'`
3. Division de 3 → 3 nouvelles ruches créées
4. Pesée perte > 2 kg → alerte créée
5. Empilement → source `'fusionnee'`, destination +cadres

**Stripe :** 6. Checkout Starter → webhook reçu → plan mis à jour en DB 7. Créer ruche n°11 en plan Découverte → erreur 402 8. Upgrade → ruche n°11 possible

**Multi-users :** 9. Inviter email → membre reçoit lien → accepte → voit les données 10. Lecteur ne peut pas créer d'intervention

---

## ANNEXE A — MAPPING INTERVENTIONS → TABLES

| #   | Catégorie     | INSERT                                    | UPDATE                   | Alertes                     |
| --- | ------------- | ----------------------------------------- | ------------------------ | --------------------------- |
| 1   | Matériel      | `mouvements_materiel`                     | `ruches` compteurs       | —                           |
| 2   | Contrôle      | —                                         | `interventions` colonnes | Cellules royales, Force ≤ 1 |
| 3   | Récolte       | `recoltes`                                | —                        | —                           |
| 4   | Nourrissement | `mouvements_stock` (opt)                  | `interventions` colonnes | —                           |
| 5   | Essaimage     | `essaimages`                              | `ruches` statut          | —                           |
| 6   | Division      | `divisions` + `ruches` × N                | —                        | —                           |
| 7   | Déplacement   | `deplacements_ruches`                     | `ruches` rucher_id       | —                           |
| 8   | Varroa        | `comptages_varroa` / `traitements_varroa` | —                        | Chute > 3, VPH > 2%         |
| 9   | Pesée         | `pesees`                                  | —                        | Perte > 2 kg                |
| 10  | Commentaire   | —                                         | `interventions` notes    | —                           |
| 11  | Empilement    | `empilements`                             | `ruches` × 2             | —                           |
| 12  | Sanitaire     | `evenements_sanitaires`                   | `ruches` statut          | Mortalité                   |
| 13  | Transvasement | `transvasements`                          | `ruches` × 2             | —                           |

## ANNEXE B — VARIABLES D'ENVIRONNEMENT REQUISES

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
DATABASE_URL=postgres://postgres.xxx:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres

# Stripe (préfixe NUXT_ obligatoire)
NUXT_STRIPE_SECRET_KEY=sk_live_...
NUXT_STRIPE_WEBHOOK_SECRET=whsec_...
NUXT_PRICE_STARTER=price_xxx
NUXT_PRICE_PRO=price_xxx
NUXT_PRICE_EXPERT=price_xxx

# Brevo (optionnel, pour emails invitation)
NUXT_BREVO_API_KEY=xkeysib-...
```

---

_Fin du prompt Phase 2 v2.0 — Référence unique pour les 4 chantiers : interventions, Stripe, multi-users, optimisations._
