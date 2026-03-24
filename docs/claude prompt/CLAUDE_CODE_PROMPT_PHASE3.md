# 🐝 APICULTURE 360° — PROMPT CLAUDE CODE PHASE 3

> **Version** : 1.0 — Mars 2026
> **Suite de** : Phase 1 (Sprints 1-12) + Phase 2 (Interventions, Stripe, Multi-users)
> **Auteur** : Antoine — La Jocondienne
> **Objectif** : Module Reine, interventions avancées, app mobile native Capacitor, intelligence métier & analytics différenciants

---

## 📋 TABLE DES MATIÈRES

1. [Contexte concurrentiel](#1-contexte-concurrentiel)
2. [État du projet après Phase 2](#2-état-du-projet-après-phase-2)
3. [Objectifs Phase 3 — 5 chantiers](#3-objectifs-phase-3--5-chantiers)
4. [CHANTIER A — Module Reine (14ème catégorie)](#4-chantier-a--module-reine-14ème-catégorie)
5. [CHANTIER B — Interventions avancées](#5-chantier-b--interventions-avancées)
6. [CHANTIER C — App mobile native Capacitor](#6-chantier-c--app-mobile-native-capacitor)
7. [CHANTIER D — Intelligence métier & Analytics](#7-chantier-d--intelligence-métier--analytics)
8. [CHANTIER E — Parité + dépassement Beekube](#8-chantier-e--parité--dépassement-beekube)
9. [Conventions du projet — Rappel](#9-conventions-du-projet--rappel)
10. [Checklist d'implémentation](#10-checklist-dimplémentation)
11. [Tests et validation](#11-tests-et-validation)

---

## 1. CONTEXTE CONCURRENTIEL

### Beekube — Ce qu'ils viennent d'annoncer (mars 2026)

Beekube se positionne "gratuit et illimité" avec un Premium de confort :

- 📸 Photos d'interventions (zoom, export PDF avec photos, backup)
- 📅 Synchronisation Google Agenda (OAuth + flux ICS)
- 💾 Export XLSX, JSON, SQLite + sauvegarde Google Drive/Dropbox + ZIP avec photos
- 🎨 Couleurs de ruche personnalisables + logo exploitation

### Notre avantage actuel (ce que Beekube n'a PAS)

| Fonctionnalité                                | Apiculture 360° |          Beekube          |
| --------------------------------------------- | :-------------: | :-----------------------: |
| Comptabilité complète (ventes/achats)         |       ✅        |            ❌             |
| Facturation PDF conforme art. L441-9          |       ✅        |            ❌             |
| TVA multi-taux automatique (5,5/10/20/0%)     |       ✅        |            ❌             |
| Export FEC comptable                          |       ✅        |            ❌             |
| Traçabilité lots réglementaire                |       ✅        |            ❌             |
| Registre d'élevage PDF (arrêté 5 juin 2000)   |       ✅        |            ❌             |
| Mode offline + sync auto                      |       ✅        |      ❌ (cloud only)      |
| 13 sous-catégories d'intervention structurées |       ✅        | ❌ (formulaire générique) |
| Score santé calculé par colonie               |       ✅        |            ❌             |
| Dashboard Apple-style avec analytics          |       ✅        |  ❌ (interface basique)   |
| Multi-users avec rôles                        |       ✅        |            ❌             |
| Stripe avec limites plan                      |       ✅        |            ❌             |
| QR Code par ruche                             |       ✅        |            ❌             |

### Ce qu'il nous manque pour dominer

| Manque                                                 | Impact business                                         |
| ------------------------------------------------------ | ------------------------------------------------------- |
| Module Reine (lignée, marquage, évaluation)            | 🔴 Critique — les pros gèrent leur cheptel par la reine |
| Interventions groupées (traitement sur tout un rucher) | 🔴 Critique — gain de temps x10 pour les pros           |
| Templates d'intervention sauvegardés                   | 🟡 Haute — réutilisation fréquente                      |
| App native Store (iOS/Android)                         | 🔴 Critique — crédibilité + GPS/caméra natifs           |
| Analytics prédictifs (santé, production, rentabilité)  | 🔴 Critique — LA différenciation vs tous                |
| Sync calendrier externe (Google/Apple Calendar)        | 🟡 Haute — parité Beekube                               |
| Export XLSX                                            | 🟡 Haute — parité Beekube                               |
| Couleurs ruches personnalisables                       | 🟢 Moyenne — nice to have                               |
| Logo exploitation                                      | 🟢 Moyenne — branding factures/registre                 |

---

## 2. ÉTAT DU PROJET APRÈS PHASE 2

### Stack technique

| Couche      | Technologie                                          |
| ----------- | ---------------------------------------------------- |
| Full-stack  | Nuxt 3 (Vue 3 + Nitro)                               |
| DB          | Supabase PostgreSQL 16 + Drizzle ORM                 |
| Auth        | Supabase Auth                                        |
| Paiements   | Stripe (checkout, webhooks, portal, middleware plan) |
| UI          | Nuxt UI v3 + design system Warm Precision            |
| Charts      | Apache ECharts                                       |
| Carte       | Leaflet + OpenStreetMap                              |
| QR          | qrcode library                                       |
| PWA         | Workbox + IndexedDB offline                          |
| Déploiement | Vercel serverless cdg1                               |

### Base de données (22+ tables)

`profils`, `ruchers`, `ruches`, `interventions` (hub visite), `recoltes`, `stocks`, `mouvements_stock`, `clients`, `transactions`, `alertes`, `membres`, `pesees`, `comptages_varroa`, `traitements_varroa`, `mouvements_materiel`, `deplacements_ruches`, `divisions`, `divisions_ruches`, `essaimages`, `empilements`, `evenements_sanitaires`, `transvasements`

### Business model

| Plan       | Ruches   | Prix/mois | Prix/an |
| ---------- | -------- | --------- | ------- |
| Découverte | 0-10     | Gratuit   | Gratuit |
| Starter    | 0-20     | 9,99€     | 99€     |
| Pro        | 21-100   | 39,99€    | 399€    |
| Expert     | Illimité | 79,99€    | 799€    |

---

## 3. OBJECTIFS PHASE 3 — 5 CHANTIERS

| #     | Chantier                     | Priorité    | Résumé                                                                           |
| ----- | ---------------------------- | ----------- | -------------------------------------------------------------------------------- |
| **A** | Module Reine                 | 🔴 Critique | 14ème catégorie d'intervention : marquage, changement, perte, évaluation, lignée |
| **B** | Interventions avancées       | 🔴 Critique | Interventions groupées (multi-ruches) + templates sauvegardés                    |
| **C** | App mobile Capacitor         | 🔴 Critique | iOS + Android natifs, GPS, caméra, push FCM/APNs, Store                          |
| **D** | Intelligence métier          | 🔴 Critique | Score prédictif, rentabilité, prévisionnel, suggestions saisonnières             |
| **E** | Parité + dépassement Beekube | 🟡 Haute    | Sync calendrier, export XLSX, couleurs ruches, logo exploitation                 |

---

## 4. CHANTIER A — MODULE REINE (14ÈME CATÉGORIE)

### Pourquoi c'est critique

Pour un apiculteur professionnel, la reine EST la colonie. Son âge, sa race, sa qualité de ponte, sa douceur déterminent la productivité, le comportement et la survie de la colonie. Aucun concurrent ne propose un suivi de lignée structuré.

### 4.1 Table `evenements_reine`

```typescript
export const typeEvenementReineEnum = pgEnum('type_evenement_reine', [
  'marquage',
  'changement',
  'perte',
  'evaluation',
]);

export const couleurReineEnum = pgEnum('couleur_reine', [
  'blanc',
  'jaune',
  'rouge',
  'vert',
  'bleu',
]);

export const origineReineEnum = pgEnum('origine_reine', [
  'elevage_personnel',
  'achat',
  'cellule_royale_naturelle',
  'essaim',
  'autre',
]);

export const actionOrphelineEnum = pgEnum('action_orpheline', [
  'introduction_reine',
  'reunion_colonie',
  'attente_cellule',
  'rien',
]);

export const evenementsReine = pgTable('evenements_reine', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id),
  typeEvenement: typeEvenementReineEnum('type_evenement').notNull(),

  // Marquage
  couleur: couleurReineEnum('couleur'),
  anneeMarquage: integer('annee_marquage'),
  clippage: boolean('clippage'),

  // Changement
  origineReine: origineReineEnum('origine_reine'),
  race: text('race'), // buckfast, noire, carnica, italienne, caucasienne, hybride, autre
  fournisseur: text('fournisseur'),
  prix: decimal('prix', { precision: 8, scale: 2 }),
  dateIntroduction: timestamp('date_introduction'),

  // Perte / Orpheline
  dateConstat: timestamp('date_constat'),
  actionOrpheline: actionOrphelineEnum('action_orpheline'),

  // Évaluation
  qualitePonte: integer('qualite_ponte'), // 1-5
  douceur: integer('douceur'), // 1-5
  prolificite: integer('prolificite'), // 1-5

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 4.2 Colonnes à ajouter sur table `ruches`

```typescript
// Données reine courante (mises à jour par le handler)
reinePresente: boolean('reine_presente').default(true),
reineCouleur: couleurReineEnum('reine_couleur'),
reineAnnee: integer('reine_annee'),
reineRace: text('reine_race'),
reineOrigine: origineReineEnum('reine_origine'),
reineDateIntroduction: timestamp('reine_date_introduction'),
reineQualitePonte: integer('reine_qualite_ponte'),
reineDouceur: integer('reine_douceur'),
reineProlificite: integer('reine_prolificite'),
```

### 4.3 Schéma Zod

```typescript
export const reineSchema = z.discriminatedUnion('sousAction', [
  z.object({
    sousAction: z.literal('marquage'),
    couleur: z.enum(['blanc', 'jaune', 'rouge', 'vert', 'bleu']),
    annee: z.number().int().min(2000).max(2099).optional(),
    clippage: z.boolean().default(false),
  }),
  z.object({
    sousAction: z.literal('changement'),
    origine: z.enum(['elevage_personnel', 'achat', 'cellule_royale_naturelle', 'essaim', 'autre']),
    race: z.string().optional(),
    fournisseur: z.string().optional(),
    prix: z.number().min(0).optional(),
  }),
  z.object({
    sousAction: z.literal('perte'),
    action: z.enum(['introduction_reine', 'reunion_colonie', 'attente_cellule', 'rien']),
  }),
  z.object({
    sousAction: z.literal('evaluation'),
    qualitePonte: z.number().int().min(1).max(5),
    douceur: z.number().int().min(1).max(5),
    prolificite: z.number().int().min(1).max(5),
  }),
]);
```

### 4.4 Handler Reine — `server/services/interventions/reine.ts`

```
Marquage → INSERT evenements_reine + UPDATE ruches (couleur, année, clippage)
Changement → INSERT evenements_reine + UPDATE ruches (race, origine, date) + INSERT transaction comptable si prix > 0
Perte → INSERT evenements_reine + UPDATE ruches (reinePresente = false, statut → 'orpheline')
           + Si action = 'reunion_colonie' → déclencher flow empilement
           + Alerte "Colonie orpheline — action requise"
Évaluation → INSERT evenements_reine + UPDATE ruches (qualité, douceur, prolificité)
              + Alerte si qualitePonte ≤ 2 "Remplacement reine recommandé"
```

### 4.5 Cycle international des couleurs

```typescript
// Dernier chiffre de l'année → couleur
const CYCLE_COULEUR: Record<number, string> = {
  1: 'blanc',
  6: 'blanc', // Blanc = 1 ou 6
  2: 'jaune',
  7: 'jaune', // Jaune = 2 ou 7
  3: 'rouge',
  8: 'rouge', // Rouge = 3 ou 8
  4: 'vert',
  9: 'vert', // Vert  = 4 ou 9
  5: 'bleu',
  0: 'bleu', // Bleu  = 5 ou 0
};

// Auto-calcul : si marquage avec couleur 'blanc' → année probable = 2021 ou 2026
// Afficher suggestion : "Année probable : 2026 (cycle blanc)"
```

### 4.6 Âge reine calculé + Alerte

```typescript
// Âge = année courante - anneeMarquage
// Afficher sur la fiche ruche : "Reine 🔵 2024 — 2 ans"
// Alerte automatique si âge > 3 ans → "Remplacement recommandé" (priorité moyenne)
```

### 4.7 UI — FormReine.vue

4 boutons sous-action (comme Varroa/Sanitaire) :

- 👑 **Marquage** : 5 boutons couleur (pastilles colorées cliquables) + toggle clippage + année auto-suggérée
- 🔄 **Changement** : select origine + input race + input fournisseur + input prix
- ❌ **Perte / Orpheline** : 4 boutons action (introduction reine, réunion, attente, rien)
- ⭐ **Évaluation** : 3 barres de notation 1-5 étoiles (ponte, douceur, prolificité)

### 4.8 Fiche ruche enrichie — Section Reine

Ajouter dans `app/pages/ruches/[id].vue` une section dédiée :

- Pastille couleur + année + âge calculé
- Race + origine
- Scores évaluation (3 barres visuelles)
- Historique des reines (timeline des événements_reine)
- Lignée : "Reine actuelle introduite le XX/XX/XXXX, issue de [élevage perso / achat chez XXX]"

---

## 5. CHANTIER B — INTERVENTIONS AVANCÉES

### 5.1 Interventions groupées (multi-ruches)

**Le problème** : Un apiculteur qui traite 50 ruches au varroa doit aujourd'hui saisir 50 fois la même intervention. C'est rédhibitoire.

**La solution** : Permettre de sélectionner N ruches (ou un rucher entier) et appliquer la même intervention à toutes.

#### API : `POST /api/interventions/bulk-group`

```typescript
const bulkGroupSchema = z.object({
  rucheIds: z.array(z.string().uuid()).min(1).max(200),
  dateVisite: z.string().datetime(),
  meteo: z.object({...}).optional(),
  categoriesActivees: z.array(z.enum([...CATEGORIES_INTERVENTION])).min(1),
  donnees: z.record(z.string(), z.unknown()),
  // Les mêmes données sont appliquées à chaque ruche
});

// Pattern d'exécution :
// 1. Valider ownership de toutes les ruches
// 2. Transaction unique
// 3. Pour chaque rucheId :
//    - INSERT hub visite
//    - Exécuter les handlers (mêmes données)
//    - Collecter les résultats
// 4. Retourner le résumé { total, succes, erreurs }
```

#### UI : Sélecteur multi-ruches

Enrichir le wizard `interventions/nouvelle.vue` :

- Étape 1 modifiée : au lieu de sélectionner UNE ruche, proposer :
  - **"Une ruche"** → select dropdown (flow existant)
  - **"Plusieurs ruches"** → checkboxes groupées par rucher avec "Tout sélectionner" par rucher
  - **"Tout un rucher"** → select rucher → auto-sélection de toutes les ruches actives
- Badge compteur : "12 ruches sélectionnées"
- Le reste du wizard est identique (catégories → formulaires → résumé)
- Au résumé, afficher : "Cette intervention sera appliquée à 12 ruches"

#### Composant : `app/components/interventions/RucheMultiSelect.vue`

```
- Props : ruchers avec leurs ruches
- Émit : @update:selected (string[])
- UI : Accordéons par rucher (ExpandableCard)
  - Header : nom rucher + badge "X/Y sélectionnées" + checkbox "Tout"
  - Body : grille de chips ruches avec numéro + statut badge
  - Chip sélectionné : fond honey-light, bordure honey
```

### 5.2 Templates d'intervention sauvegardés

**Le problème** : Les visites de routine suivent souvent le même schéma (ex: "Visite de printemps" = Contrôle + Pesée + Commentaire).

**La solution** : Sauvegarder des combinaisons de catégories comme templates réutilisables.

#### Table `templates_intervention`

```typescript
export const templatesIntervention = pgTable('templates_intervention', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  description: text('description'),
  categories: jsonb('categories').notNull(), // CategorieIntervention[]
  icone: text('icone'), // Lucide icon name
  couleur: text('couleur'), // Tailwind color class
  ordre: integer('ordre').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### Templates par défaut (seed)

```typescript
const TEMPLATES_DEFAUT = [
  {
    nom: 'Visite de printemps',
    categories: ['controle', 'pesee', 'commentaire'],
    icone: 'Sun',
    couleur: 'text-yellow-500',
  },
  { nom: 'Traitement varroa', categories: ['varroa'], icone: 'Bug', couleur: 'text-red-500' },
  {
    nom: 'Récolte complète',
    categories: ['recolte', 'pesee', 'materiel'],
    icone: 'Jar',
    couleur: 'text-amber-500',
  },
  {
    nom: 'Visite sanitaire',
    categories: ['controle', 'sanitaire', 'commentaire'],
    icone: 'HeartPulse',
    couleur: 'text-rose-500',
  },
  {
    nom: 'Préparation hivernage',
    categories: ['controle', 'pesee', 'nourrissement', 'varroa'],
    icone: 'Snowflake',
    couleur: 'text-sky-500',
  },
  {
    nom: 'Suivi reine',
    categories: ['controle', 'reine'],
    icone: 'Crown',
    couleur: 'text-amber-600',
  },
];
```

#### UI dans le wizard

Dans l'étape 2 (sélection catégories), ajouter AU-DESSUS de la grille 14 icônes :

- Section "Templates rapides" :
  - Ligne scrollable horizontale de pills
  - Click sur un template → pré-sélectionne les catégories correspondantes dans la grille
  - Bouton "+" en fin de ligne → modal création template
  - Long press → options (renommer, supprimer)

#### API

```
GET    /api/templates-intervention        → Liste
POST   /api/templates-intervention        → Création
PUT    /api/templates-intervention/[id]   → Modifier
DELETE /api/templates-intervention/[id]   → Supprimer
```

---

## 6. CHANTIER C — APP MOBILE NATIVE CAPACITOR

### 6.1 Pourquoi c'est critique

- **Crédibilité** : "Disponible sur l'App Store" = perception pro vs "c'est juste un site web"
- **GPS natif** : Précision haute pour géolocalisation ruchers (Geolocation API native)
- **Caméra native** : Photos de cadres haute résolution (Camera API native)
- **Push natifs** : FCM (Android) / APNs (iOS) — fiables contrairement à Web Push sur iOS
- **Mode terrain** : L'apiculteur utilise son téléphone avec des gants, au milieu des abeilles

### 6.2 Architecture

```
apiculture-360/
├── nuxt.config.ts              # Build mode 'spa' pour Capacitor
├── capacitor.config.ts         # Config Capacitor
├── android/                    # Projet Android Studio (auto-généré)
├── ios/                        # Projet Xcode (auto-généré)
└── app/                        # Code existant (partagé web + mobile)
    ├── plugins/
    │   └── capacitor.client.ts # Init plugins Capacitor
    ├── composables/
    │   ├── useNativeCamera.ts  # Camera API
    │   ├── useNativeGps.ts     # Geolocation API
    │   └── useNativePush.ts    # Push Notifications
    └── utils/
        └── platform.ts         # isPlatform('ios'), isPlatform('android'), isPlatform('web')
```

### 6.3 Configuration Capacitor

```typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apiculture360.app',
  appName: 'Apiculture 360°',
  webDir: '.output/public', // Build Nuxt SPA
  server: {
    // En dev, pointer vers le serveur Nuxt local
    url: process.env.CAPACITOR_DEV_URL || undefined,
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      // Photos stockées dans le dossier app
    },
    Geolocation: {
      // GPS haute précision
    },
  },
  ios: {
    scheme: 'Apiculture360',
  },
  android: {
    buildOptions: {
      keystorePath: undefined, // Configurer pour release
    },
  },
};

export default config;
```

### 6.4 Nuxt config — Mode SPA pour Capacitor

```typescript
// nuxt.config.ts — ajouter un profil de build mobile
// Commande : NUXT_SSR=false npm run build
// Ou : nuxt.config.ts avec condition sur process.env.CAPACITOR
{
  ssr: process.env.CAPACITOR === 'true' ? false : true,
  // En mode SPA, toutes les pages sont rendues côté client
}
```

### 6.5 Composables natifs

#### `useNativeCamera.ts`

```typescript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isPlatform } from '~/utils/platform';

export function useNativeCamera() {
  async function takePhoto() {
    if (isPlatform('web')) {
      // Fallback : input file classique
      return openFileInput();
    }
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    });
    return image.base64String;
  }

  async function pickFromGallery() {
    if (isPlatform('web')) return openFileInput();
    const image = await Camera.getPhoto({
      quality: 80,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
    });
    return image.base64String;
  }

  return { takePhoto, pickFromGallery };
}
```

#### `useNativeGps.ts`

```typescript
import { Geolocation } from '@capacitor/geolocation';
import { isPlatform } from '~/utils/platform';

export function useNativeGps() {
  async function getCurrentPosition() {
    if (isPlatform('web')) {
      // Fallback : Web Geolocation API
      return new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          reject,
        ),
      );
    }
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }

  return { getCurrentPosition };
}
```

#### `useNativePush.ts`

```typescript
import { PushNotifications } from '@capacitor/push-notifications';
import { isPlatform } from '~/utils/platform';

export function useNativePush() {
  async function register() {
    if (isPlatform('web')) return; // Web Push géré séparément

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive === 'granted') {
      await PushNotifications.register();
    }

    PushNotifications.addListener('registration', async (token) => {
      // Envoyer le token FCM/APNs au serveur
      await $fetch('/api/notifications/register-device', {
        method: 'POST',
        body: { token: token.value, platform: isPlatform('ios') ? 'ios' : 'android' },
      });
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      // Afficher notification in-app
    });
  }

  return { register };
}
```

### 6.6 Store submissions

**App Store (iOS)** :

- Nécessite un Apple Developer Account (99$/an)
- Screenshots 6.7" et 5.5"
- Description FR + EN
- Catégorie : Productivité ou Business
- Privacy policy URL obligatoire

**Google Play (Android)** :

- Google Play Developer Account (25$ one-time)
- Feature graphic 1024×500
- Description FR + EN
- Catégorie : Productivité
- Data safety form

### 6.7 Packages Capacitor à installer

```json
{
  "@capacitor/core": "^6",
  "@capacitor/cli": "^6",
  "@capacitor/camera": "^6",
  "@capacitor/geolocation": "^6",
  "@capacitor/push-notifications": "^6",
  "@capacitor/app": "^6",
  "@capacitor/haptics": "^6",
  "@capacitor/status-bar": "^6",
  "@capacitor/splash-screen": "^6",
  "@capacitor/keyboard": "^6",
  "@capacitor/ios": "^6",
  "@capacitor/android": "^6"
}
```

---

## 7. CHANTIER D — INTELLIGENCE MÉTIER & ANALYTICS

> **C'est ici qu'on creuse l'écart définitif.** Beekube fait du CRUD basique. Nous, on transforme les données en décisions.

### 7.1 Score de santé prédictif par colonie

Le score de santé actuel (`server/utils/santeScore.ts`) est basique : il regarde la dernière inspection. Le score prédictif utilise l'historique complet.

#### Nouveau calcul : `server/utils/santePredictive.ts`

```typescript
interface ScorePredictif {
  score: number; // 0-100
  tendance: 'hausse' | 'stable' | 'baisse';
  risques: Risque[];
  recommandations: string[];
  confiance: number; // 0-1 (basé sur la quantité de données)
}

interface Risque {
  type: 'varroa' | 'famine' | 'orpheline' | 'essaimage' | 'faiblesse';
  probabilite: number; // 0-1
  horizon: string; // "7 jours", "30 jours"
  facteurs: string[];
}

// Facteurs du score prédictif :
// 1. Dernière force colonie (poids 30%)
// 2. Tendance pesée sur 30 jours (poids 20%)
//    - Perte régulière = risque famine
//    - Gain rapide au printemps = bonne dynamique
// 3. Taux varroa dernier comptage (poids 25%)
//    - VPH > 2% = risque élevé
//    - Chute/jour croissante = tendance négative
// 4. Âge reine (poids 10%)
//    - > 3 ans = risque baisse performance
// 5. Fréquence interventions (poids 5%)
//    - Aucune visite > 30 jours = incertitude élevée → score confiance bas
// 6. Météo prévue (poids 10%)
//    - Gel prévu + réserves basses = risque famine

// Tendance = comparaison score actuel vs score il y a 30 jours
```

#### API : `GET /api/ruches/[id]/prediction`

Retourne le score prédictif + risques + recommandations pour une ruche.

#### API : `GET /api/ruchers/[id]/predictions`

Retourne les scores prédictifs agrégés pour toutes les ruches d'un rucher, triées par risque décroissant.

#### UI — Card "Intelligence" sur fiche ruche

- Jauge circulaire score 0-100 avec gradient (rouge→orange→vert)
- Flèche tendance (↗ hausse, → stable, ↘ baisse)
- Liste des risques avec probabilité en % et horizon temporel
- Recommandations actionables : "Effectuer un comptage varroa", "Nourrir la colonie", "Vérifier la reine"
- Indicateur confiance : "Score basé sur 12 observations" ou "Données insuffisantes — effectuez un contrôle"

### 7.2 Dashboard analytique avancé — `app/pages/analytics.vue`

Nouvelle page dédiée aux analytics (lien sidebar), accessible plan Pro+.

#### Section 1 — Rentabilité

```typescript
// API : GET /api/analytics/rentabilite?annee=2026

interface AnalyticsRentabilite {
  // Par ruche
  rentabiliteParRuche: {
    rucheId: string;
    numero: string;
    rucher: string;
    productionKg: number;
    coutDirect: number; // nourrissement + traitements + matériel
    chiffreAffaires: number; // ventes liées
    marge: number;
    margePercent: number;
  }[];

  // Par rucher
  rentabiliteParRucher: {
    rucherId: string;
    nom: string;
    nbRuches: number;
    productionTotale: number;
    coutTotal: number;
    chiffreAffaires: number;
    marge: number;
    coutParKg: number;
  }[];

  // Par produit
  rentabiliteParProduit: {
    produit: string; // type miel, pollen, propolis
    quantiteKg: number;
    prixMoyenKg: number;
    chiffreAffaires: number;
    partCA: number; // % du CA total
  }[];

  // Synthèse
  seuilRentabilite: number; // En kg — à partir de combien de kg on est rentable
  coutMoyenParKg: number;
  productionMoyenneParRuche: number;
}
```

#### Section 2 — Prévisionnel trésorerie 12 mois

```typescript
// API : GET /api/analytics/previsionnel

interface Previsionnel {
  mois: {
    mois: string; // "2026-04"
    recettesEstimees: number;
    chargesEstimees: number;
    soldePrevu: number;
    cumulPrevu: number;
  }[];
  // Basé sur :
  // - Historique N-1 des ventes mensuelles
  // - Charges récurrentes (abonnements, assurances)
  // - Charges saisonnières (traitements printemps/automne, nourrissement hiver)
  // - Production estimée (moyenne 3 dernières années × prix moyen)
}
```

#### Section 3 — Comparaison annuelle

```typescript
// API : GET /api/analytics/comparaison?annees=2025,2026

// Production N vs N-1 par mois (graphique superposé)
// Mortalité N vs N-1
// CA N vs N-1
// Rendement moyen par ruche N vs N-1
```

#### UI Dashboard Analytics

- **Layout** : Page full-width, 4 sections en scroll vertical
- **Section héro** : 4 KPIs géants (CA, Marge, Production, Rendement/ruche) avec comparaison N-1
- **Rentabilité** : Tableau sortable par ruche avec heatmap marge (rouge si négatif, vert si positif). Toggle vue par ruche / par rucher / par produit.
- **Prévisionnel** : ECharts area chart 12 mois avec ligne recettes, ligne charges, zone marge. Drag pour ajuster les estimations manuellement.
- **Comparaison** : ECharts line chart superposé N vs N-1, toggle Production / CA / Mortalité
- **Accès** : Plan Pro et Expert uniquement → modal upgrade pour Découverte/Starter

### 7.3 Suggestions saisonnières intelligentes

```typescript
// server/utils/suggestions.ts

interface SuggestionSaisonniere {
  titre: string;
  description: string;
  priorite: 'haute' | 'moyenne' | 'info';
  categorie: CategorieIntervention;
  moisApplicable: number[]; // [3, 4] = mars-avril
  conditions?: {
    latitude?: { min: number; max: number }; // Basé sur position rucher
    dernierTraitement?: number; // Jours depuis dernier traitement
  };
}

const SUGGESTIONS: SuggestionSaisonniere[] = [
  // PRINTEMPS (Mars-Avril)
  {
    titre: 'Visite de printemps',
    description:
      "Vérifiez la reprise de ponte, les réserves et la force des colonies après l'hiver",
    priorite: 'haute',
    categorie: 'controle',
    moisApplicable: [3, 4],
  },
  {
    titre: "Pesée de sortie d'hiver",
    description: 'Pesez vos ruches pour évaluer les réserves restantes. Nourrissez si < 12 kg',
    priorite: 'haute',
    categorie: 'pesee',
    moisApplicable: [2, 3],
  },
  {
    titre: 'Traitement varroa oxalique',
    description: "Fenêtre optimale pour le traitement à l'acide oxalique (hors couvain)",
    priorite: 'haute',
    categorie: 'varroa',
    moisApplicable: [1, 2],
    conditions: { dernierTraitement: 90 }, // Si pas traité depuis 3 mois
  },

  // ÉTÉ (Mai-Juillet)
  {
    titre: 'Surveillance essaimage',
    description: "Période d'essaimage : contrôlez les cellules royales tous les 7-10 jours",
    priorite: 'haute',
    categorie: 'controle',
    moisApplicable: [4, 5, 6],
  },
  {
    titre: 'Pose des hausses',
    description:
      'La miellée commence, ajoutez des hausses quand les cadres de corps sont couverts à 80%',
    priorite: 'moyenne',
    categorie: 'materiel',
    moisApplicable: [4, 5],
  },

  // AUTOMNE (Août-Octobre)
  {
    titre: 'Traitement varroa post-récolte',
    description: 'Appliquez le traitement varroa dans les 48h après la dernière récolte',
    priorite: 'haute',
    categorie: 'varroa',
    moisApplicable: [7, 8, 9],
  },
  {
    titre: 'Nourrissement automnal',
    description: "Complétez les réserves pour l'hiver : objectif 18-20 kg de réserves",
    priorite: 'haute',
    categorie: 'nourrissement',
    moisApplicable: [9, 10],
  },

  // HIVER (Novembre-Février)
  {
    titre: 'Comptage varroa sur plancher',
    description: "Posez le tiroir 3 jours pour évaluer l'infestation hivernale",
    priorite: 'moyenne',
    categorie: 'varroa',
    moisApplicable: [11, 12, 1],
  },
];
```

#### API : `GET /api/suggestions`

Retourne les suggestions filtrées par :

- Mois actuel
- Position GPS des ruchers (latitude → nord/sud France)
- Historique des interventions (ne pas suggérer ce qui a déjà été fait)
- État des colonies (ne pas suggérer de poser des hausses si colonie faible)

#### UI — Widget dashboard "Suggestions du moment"

- ExpandableCard dans le dashboard
- 3-5 suggestions max, triées par priorité
- Chaque suggestion = card cliquable → ouvre le wizard intervention pré-rempli avec la catégorie suggérée
- Badge "Saisonnier" ou "Basé sur vos données"

### 7.4 Corrélation météo-production

```typescript
// API : GET /api/analytics/meteo-production?rucherId=xxx&annee=2026

// Croise les données météo (températures moyennes, précipitations) avec la production
// Objectif : identifier les conditions optimales de miellée
// Graphique : axe X = semaines, axe Y gauche = kg récoltés, axe Y droite = température
// Overlay : périodes de pluie (bandes grises), miellées (bandes vertes)
```

---

## 8. CHANTIER E — PARITÉ + DÉPASSEMENT BEEKUBE

### 8.1 Sync calendrier externe (Google Calendar / Apple Calendar)

**Parité Beekube** : Ils proposent OAuth Google Calendar + flux ICS.

**Notre approche** : Flux ICS universel (compatible TOUS les calendriers, pas juste Google).

#### API : `GET /api/calendrier/ics`

```typescript
// Génère un flux iCalendar (.ics) avec :
// - Interventions passées et futures
// - Rappels traitements varroa (date fin prévue)
// - Rappels inspections dues (tous les X jours configurables)
// - Dates de transhumance (retour prévu)

// Format iCal standard RFC 5545
// L'utilisateur copie l'URL et la colle dans Google Calendar / Apple Calendar / Outlook
// L'URL contient un token unique : /api/calendrier/ics?token=xxx
// Refresh automatique toutes les 4h par le client calendrier
```

#### Table `tokens_calendrier`

```typescript
export const tokensCalendrier = pgTable('tokens_calendrier', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  actif: boolean('actif').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

#### UI : Page Paramètres → Section Calendrier

- Bouton "Générer un lien de synchronisation"
- Affiche l'URL ICS avec bouton copier
- Instructions pour Google Calendar / Apple Calendar / Outlook
- Bouton "Révoquer" pour invalider le token

### 8.2 Export XLSX (parité Beekube)

Beekube propose XLSX, JSON, SQLite. On a déjà CSV et FEC.

#### API : `GET /api/export/xlsx?type=ruches|interventions|production|finances`

```typescript
// Utiliser la librairie exceljs (serverless-compatible)
// 4 types d'exports :
// 1. Ruches : toutes les ruches avec rucher, statut, reine, dernière visite, score santé
// 2. Interventions : historique complet avec catégories, détails, ruche, date
// 3. Production : récoltes par lot, rucher, type, quantité, humidité
// 4. Finances : ventes + achats avec TVA, par mois

// Chaque export = un fichier .xlsx avec :
// - Entête avec logo + nom exploitation + date export
// - Colonnes formatées (largeur auto, entêtes gras, alternance couleur lignes)
// - Feuille récapitulative avec totaux
```

#### Package : `exceljs`

### 8.3 Couleurs de ruche personnalisables

```typescript
// Colonne à ajouter sur table ruches :
couleurPersonnalisee: text('couleur_personnalisee'), // hex color, ex: '#FF6B35'

// UI : dans RucheForm.vue, ajouter un color picker (8 couleurs prédéfinies + custom)
// Couleurs prédéfinies : Blanc, Jaune, Bleu, Vert, Rouge, Orange, Violet, Rose

// Impact visuel :
// - RucheCard : bande latérale colorée
// - Carte Leaflet : marker coloré
// - Liste : pastille de couleur à côté du numéro
```

### 8.4 Logo exploitation sur factures et registre

```typescript
// Colonne à ajouter sur table profils :
logoUrl: text('logo_url'), // URL Supabase Storage

// UI : Page Paramètres → section Exploitation
// - Zone d'upload avec preview (max 2 MB, JPG/PNG)
// - Crop/resize côté client avant upload
// - Stockage : Supabase Storage bucket 'logos'

// Impact :
// - Facture PDF (finances/facture/[id].vue) : logo en haut à gauche
// - Registre d'élevage (exports/registre.vue) : logo en entête
// - Bilan annuel (exports/bilan.vue) : logo en entête
```

### 8.5 Ce qu'on a et qu'ils n'auront pas

Ces features restent nos **avantages compétitifs uniques** :

| Feature                                      | Apiculture 360° | Beekube Premium |
| -------------------------------------------- | :-------------: | :-------------: |
| Score prédictif IA par colonie               |       ✅        |       ❌        |
| Suggestions saisonnières intelligentes       |       ✅        |       ❌        |
| Rentabilité par ruche/rucher/produit         |       ✅        |       ❌        |
| Prévisionnel trésorerie 12 mois              |       ✅        |       ❌        |
| Interventions groupées (50 ruches en 1 clic) |       ✅        |       ❌        |
| Templates d'intervention                     |       ✅        |       ❌        |
| Suivi lignée reine structuré                 |       ✅        |       ❌        |
| Facturation multi-taux TVA conforme          |       ✅        |       ❌        |
| Export FEC comptable                         |       ✅        |       ❌        |
| Registre d'élevage réglementaire             |       ✅        |       ❌        |
| Multi-users avec rôles                       |       ✅        |       ❌        |
| App native iOS + Android                     |       ✅        |  ❌ (web only)  |
| Corrélation météo-production                 |       ✅        |       ❌        |
| Mode offline structuré                       |       ✅        |       ❌        |

---

## 9. CONVENTIONS DU PROJET — RAPPEL

### Mêmes conventions que Phase 2 (voir prompt Phase 2 section 4)

Points critiques :

- `<script setup lang="ts">`, Nuxt UI v3 couleurs sémantiques, charte boutons Session 12
- `useFetch` key = string, mutations = `$fetch`, erreurs = `getApiErrorMessage()`
- Schema Drizzle : UUID, user_id cascade, created_at/updated_at, RLS
- Env vars : préfixe `NUXT_`
- ExpandableCard pour sections collapsibles
- PageHeader avec breadcrumbs
- Touch targets 44×44px minimum, CTA terrain 56px

---

## 10. CHECKLIST D'IMPLÉMENTATION

### PHASE A — Module Reine (1 semaine)

- [ ] Ajouter 4 enums (type_evenement_reine, couleur_reine, origine_reine, action_orpheline) dans schema.ts
- [ ] Créer table `evenements_reine`
- [ ] Ajouter 9 colonnes reine sur table `ruches`
- [ ] `npm run db:push` + SQL RLS + index
- [ ] Créer `reineSchema` Zod (discriminatedUnion 4 sous-actions)
- [ ] Créer `server/services/interventions/reine.ts`
- [ ] Mettre à jour `bulk.post.ts` pour intégrer le handler reine
- [ ] Créer `FormReine.vue` (4 sous-actions)
- [ ] Mettre à jour `InterventionGrid.vue` → 14 icônes (ajouter 👑 Reine)
- [ ] Mettre à jour `app/types/interventions.ts` → 14 catégories
- [ ] Enrichir `app/pages/ruches/[id].vue` — section Reine
- [ ] Fiche ruche : afficher pastille couleur + âge + scores évaluation

### PHASE B — Interventions avancées (1 semaine)

- [ ] Créer table `templates_intervention` + RLS
- [ ] API CRUD templates (4 routes)
- [ ] Seed templates par défaut (6)
- [ ] Créer `RucheMultiSelect.vue`
- [ ] Créer `POST /api/interventions/bulk-group`
- [ ] Modifier wizard `nouvelle.vue` : étape 1 → sélection simple OU multiple
- [ ] Ajouter section templates dans étape 2 du wizard
- [ ] Composable `useTemplatesIntervention.ts`

### PHASE C — Capacitor (1-2 semaines)

- [ ] Installer packages Capacitor (@capacitor/core, cli, camera, geolocation, push, app, ios, android)
- [ ] Créer `capacitor.config.ts`
- [ ] Configurer Nuxt build SPA (CAPACITOR=true)
- [ ] `npx cap init` + `npx cap add ios` + `npx cap add android`
- [ ] Créer `app/utils/platform.ts`
- [ ] Créer `useNativeCamera.ts`, `useNativeGps.ts`, `useNativePush.ts`
- [ ] Créer `app/plugins/capacitor.client.ts`
- [ ] Remplacer les appels camera/GPS dans les composants existants par les composables natifs
- [ ] API `POST /api/notifications/register-device`
- [ ] Build + test iOS Simulator
- [ ] Build + test Android Emulator
- [ ] Préparer assets Store (screenshots, descriptions, icônes)

### PHASE D — Intelligence métier (2 semaines)

- [ ] Créer `server/utils/santePredictive.ts`
- [ ] API `GET /api/ruches/[id]/prediction`
- [ ] API `GET /api/ruchers/[id]/predictions`
- [ ] Card prédictive sur fiche ruche
- [ ] Créer page `app/pages/analytics.vue`
- [ ] API `GET /api/analytics/rentabilite`
- [ ] API `GET /api/analytics/previsionnel`
- [ ] API `GET /api/analytics/comparaison`
- [ ] API `GET /api/analytics/meteo-production`
- [ ] Composants ECharts : rentabilité heatmap, prévisionnel area chart, comparaison N/N-1
- [ ] Créer `server/utils/suggestions.ts` (suggestions saisonnières)
- [ ] API `GET /api/suggestions`
- [ ] Widget dashboard "Suggestions du moment"
- [ ] Restriction plan Pro+ sur la page analytics

### PHASE E — Parité + dépassement Beekube (1 semaine)

- [ ] Créer table `tokens_calendrier` + RLS
- [ ] API `GET /api/calendrier/ics` (génération flux iCal RFC 5545)
- [ ] UI paramètres : section sync calendrier
- [ ] API `GET /api/export/xlsx` (4 types) avec exceljs
- [ ] Colonne `couleur_personnalisee` sur ruches + UI color picker
- [ ] Colonne `logo_url` sur profils + upload Supabase Storage + UI paramètres
- [ ] Intégrer logo dans facture PDF, registre, bilan

### VALIDATION FINALE

- [ ] `npm run typecheck` → 0 erreurs
- [ ] `npm run build` → PASS (web)
- [ ] `CAPACITOR=true npm run build` → PASS (SPA)
- [ ] `npm run test` → tous PASS
- [ ] `npm run lint` → 0 erreurs
- [ ] Build iOS → Xcode PASS
- [ ] Build Android → Gradle PASS

---

## 11. TESTS ET VALIDATION

### Critères

- Typecheck : 0 erreurs TS
- Build web : PASS
- Build SPA (Capacitor) : PASS
- ESLint : 0 erreurs
- Tests existants : tous PASS

### Validation manuelle critique

**Module Reine :**

1. Marquage reine bleue → fiche ruche affiche pastille 🔵 + année
2. Changement reine achetée 35€ → transaction comptable créée
3. Perte reine → statut `'orpheline'` + alerte
4. Évaluation ponte ≤ 2 → alerte remplacement

**Interventions avancées :** 5. Sélectionner 20 ruches → traitement varroa → 20 interventions créées 6. Template "Visite de printemps" → pré-sélectionne contrôle+pesée+commentaire 7. Créer template perso → apparaît dans la liste

**Intelligence :** 8. Score prédictif : ruche avec varroa élevé + perte poids → score bas + risque affiché 9. Rentabilité : ruche avec 0 production → marge négative en rouge 10. Suggestion mars : "Visite de printemps" apparaît

**Capacitor :** 11. Photo depuis caméra native sur iOS/Android 12. GPS haute précision sur création rucher 13. Push notification reçue sur appareil

**Beekube parité :** 14. Flux ICS importé dans Google Calendar → événements visibles 15. Export XLSX ruches → fichier formaté correct dans Excel 16. Couleur ruche → visible sur carte + cards 17. Logo → affiché sur facture PDF

---

## ANNEXE — POSITIONNEMENT FINAL VS CONCURRENCE

```
BEEKUBE (Gratuit + Premium confort)
├── CRUD basique interventions
├── Photos
├── Sync Google Agenda
├── Export XLSX/JSON
└── Couleurs ruches

APICULTURE 360° (Freemium + 3 plans pro)
├── TOUT ce que Beekube fait (parité Phase E)
├── 14 sous-catégories d'intervention structurées
├── Interventions groupées (50 ruches en 1 clic)
├── Templates d'intervention personnalisables
├── Module Reine complet (lignée, marquage, évaluation)
├── Score prédictif IA par colonie
├── Suggestions saisonnières intelligentes
├── Rentabilité par ruche/rucher/produit
├── Prévisionnel trésorerie 12 mois
├── Corrélation météo-production
├── Comptabilité complète + TVA multi-taux
├── Facturation PDF conforme
├── Export FEC + registre d'élevage
├── Multi-users avec rôles
├── App native iOS + Android
├── Mode offline structuré
└── QR Code par ruche
```

**Le message marketing** : _"Beekube vous aide à noter vos visites. Apiculture 360° vous aide à prendre les bonnes décisions."_

---

_Fin du prompt Phase 3. Référence unique pour les 5 chantiers : Reine, Interventions avancées, Capacitor, Intelligence métier, Parité Beekube._
