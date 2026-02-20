# Module Interventions — Spécification Fonctionnelle & Technique

> **Apiculture 360°** · SaaS Gestion Apicole
> Stack : Nuxt 3 Nitro + Supabase + Drizzle ORM + Vercel
> Version : 2.0 · Février 2026
> **Aligné sur le schéma DB du CLAUDE_CODE_PROMPT.md**

---

## 1. Vue d'ensemble

Le module **"Ajouter une intervention"** est le cœur opérationnel du SaaS. Il permet à l'apiculteur d'enregistrer toute action effectuée sur une ou plusieurs ruches lors d'une visite au rucher.

### Principes de conception

- **Une intervention = une visite** : L'apiculteur sélectionne une ou plusieurs ruches, puis compose son intervention en activant les catégories pertinentes (multi-sélection possible).
- **Interface grille d'icônes** : Accès rapide à 14 catégories d'actions, chacune avec son formulaire contextuel.
- **Mode terrain prioritaire** : Gros boutons tactiles, saisie rapide, fonctionnement offline complet.
- **Horodatage automatique** : Date, heure, géolocalisation GPS, météo auto-remplis.

---

## 2. Catégories d'intervention

### 2.1 🔧 Matériel

**Objectif** : Enregistrer l'ajout, le retrait ou la modification d'équipement sur la ruche.

| Champ                | Type           | Valeurs                                                                                                                                 |
| -------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Action               | `select`       | `ajout` · `retrait` · `remplacement`                                                                                                    |
| Éléments             | `multi_select` | Cadres · Cadres à mâle · Partitions · Nourrisseurs · Corps de ruche · Hausses · Grilles à reine · Grilles à propolis · Trappes à pollen |
| Quantité par élément | `number`       | Entier positif                                                                                                                          |
| Notes                | `text`         | Optionnel, texte libre                                                                                                                  |

**Logique métier** :

- La sélection d'éléments met à jour automatiquement l'inventaire matériel de la ruche (nombre de cadres, hausses, etc. dans la fiche ruche).
- Un `retrait` décrémente le stock de la ruche et peut optionnellement réintégrer le matériel dans le stock global.
- Historique complet des modifications matérielles accessible depuis la timeline de la ruche.

**Tables impactées** : `mouvements_materiel` (nouvelle), `ruches` (mise à jour `nombre_cadres`, `nombre_hausses`), `mouvements_stock` (optionnel).

---

### 2.2 🔍 Contrôle (Inspection)

**Objectif** : Évaluation sanitaire et comportementale de la colonie.

#### Checklist (Oui / Non / Non vérifié)

| Question                            | Champ DB          | Type              |
| ----------------------------------- | ----------------- | ----------------- |
| Avez-vous vu la reine ?             | `reine_vue`       | `boolean \| null` |
| Avez-vous vu du couvain ?           | `couvain_present` | `boolean \| null` |
| Avez-vous vu des cellules royales ? | `cellule_royale`  | `boolean`         |
| Est-ce qu'il y a des réserves ?     | `reserves`        | `integer (1-5)`   |

#### Évaluations

| Critère             | Type            | Valeurs                          |
| ------------------- | --------------- | -------------------------------- |
| Force de la colonie | `integer` (1-5) | 1 ★ Faible → 5 ★★★★★ Excellente  |
| Comportement        | `text`          | `calme` · `agitee` · `agressive` |

**Logique métier** :

- La force de la colonie alimente le badge santé visible sur la fiche ruche.
- Un comportement `agressive` peut déclencher une alerte de suivi.
- Les cellules royales détectées génèrent une notification d'essaimage potentiel.
- Données historisées pour graphiques d'évolution santé dans la fiche ruche.

**Table existante** : `inspections` — les champs `forceColonie`, `couvain`, `reserves`, `comportement`, `reineVue`, `celluleRoyale`, `signeEssaimage` couvrent déjà cette catégorie.

---

### 2.3 🍯 Récolte

**Objectif** : Enregistrer une récolte de produits de la ruche.

| Champ                     | Type      | Valeurs                                                                                                           |
| ------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| Type de produit           | `enum`    | `miel` · `pollen` · `propolis`                                                                                    |
| Quantité                  | `decimal` | Nombre décimal positif                                                                                            |
| Unité                     | `enum`    | `kg` · `g` · `litres`                                                                                             |
| Type de miel (si miel)    | `select`  | Acacia · Toutes fleurs · Châtaignier · Lavande · Tilleul · Colza · Tournesol · Bruyère · Sapin · Montagne · Autre |
| Taux d'humidité (si miel) | `decimal` | Pourcentage (%)                                                                                                   |
| Numéro de lot             | `string`  | Auto-généré ou manuel (traçabilité)                                                                               |
| Notes qualité             | `text`    | Optionnel                                                                                                         |

**Logique métier** :

- La récolte crée automatiquement une entrée dans le module **Production** avec traçabilité lot.
- Le stock de produits finis est incrémenté.
- Les données alimentent le dashboard de production (rendement par ruche, par rucher, par saison).
- Le numéro de lot suit le format : `[ANNEE]-[RUCHER_CODE]-[SEQUENCE]` (ex: `2026-RUC01-003`).

**Table existante** : `recoltes` — ajouter une FK `inspection_id` optionnelle pour lier à la visite, et élargir avec `type_produit` au-delà du miel.

---

### 2.4 🥄 Nourrissement

**Objectif** : Enregistrer un apport nutritionnel à la colonie.

| Champ                    | Type      | Valeurs                                                                         |
| ------------------------ | --------- | ------------------------------------------------------------------------------- |
| Type de nourriture       | `enum`    | `sirop_sucre` · `sirop_glucose` · `candi` · `pate_proteique` · `miel` · `autre` |
| Quantité                 | `decimal` | Nombre décimal positif                                                          |
| Unité                    | `enum`    | `kg` · `g` · `litres` · `ml`                                                    |
| Concentration (si sirop) | `select`  | `50_50` · `60_40` · `70_30` · Personnalisé                                      |
| Notes                    | `text`    | Optionnel                                                                       |

**Logique métier** :

- Décrémente automatiquement le stock de nourriture si le produit est suivi dans l'inventaire.
- Alerte si le stock de nourriture passe sous le seuil minimum.
- Historique de nourrissement visible dans la timeline ruche (utile pour suivi saisonnier).

**Table existante** : `inspections` — les champs `nourrissementType` et `nourrissementQuantite` couvrent le cas de base. Enrichir avec `nourrissement_unite` et `nourrissement_concentration` (voir section 3).

---

### 2.5 🐝 Essaimage (naturel)

**Objectif** : Enregistrer un essaimage naturel et sa gestion.

| Champ                              | Type       | Valeurs                                          |
| ---------------------------------- | ---------- | ------------------------------------------------ |
| Date de l'essaimage                | `datetime` | Date et heure                                    |
| Essaim récupéré ?                  | `boolean`  | Oui / Non (toggle switch)                        |
| Ruche de destination (si récupéré) | `select`   | Liste des ruches disponibles ou "Nouvelle ruche" |
| Localisation récupération          | `text`     | Description du lieu                              |
| Notes                              | `text`     | Optionnel                                        |

**Logique métier** :

- Si essaim récupéré → propose de créer une nouvelle ruche ou d'affecter à une ruche vide.
- La ruche source voit son statut mis à jour (perte de force potentielle).
- Notification d'essaimage envoyée si l'apiculteur n'est pas sur place.
- Statistique d'essaimage par saison dans les rapports.

**Nouvelle table** : `essaimages`

---

### 2.6 ✂️ Essaim artificiel (Division)

**Objectif** : Enregistrer une division manuelle de colonie.

| Champ                          | Type       | Valeurs                                                           |
| ------------------------------ | ---------- | ----------------------------------------------------------------- |
| Nombre de divisions            | `integer`  | 1 à 10                                                            |
| Ruches de destination          | `select[]` | Sélection multiple parmi ruches vides ou "Créer nouvelles ruches" |
| Cadres transférés par division | `integer`  | Nombre de cadres déplacés                                         |
| Reine dans la division ?       | `boolean`  | Oui / Non                                                         |
| Notes                          | `text`     | Optionnel                                                         |

**Logique métier** :

- Crée automatiquement N nouvelles ruches (ou affecte à des ruches existantes vides).
- La ruche source voit son nombre de cadres décrémenté.
- Les nouvelles ruches héritent du rucher de la ruche source par défaut.
- Traçabilité : lien parent-enfant entre ruche source et ruches divisées.

**Nouvelle table** : `divisions`

---

### 2.7 🚚 Déplacer la ruche

**Objectif** : Transférer une ruche d'un rucher à un autre.

| Champ                      | Type       | Valeurs                                               |
| -------------------------- | ---------- | ----------------------------------------------------- |
| Rucher de destination      | `select`   | Liste des ruchers de l'apiculteur                     |
| Emplacement dans le rucher | `text`     | Optionnel (numéro d'emplacement, description)         |
| Date du déplacement        | `datetime` | Date et heure effectifs                               |
| Motif                      | `select`   | `transhumance` · `reorganisation` · `vente` · `autre` |
| Notes                      | `text`     | Optionnel                                             |

**Logique métier** :

- Met à jour le `rucher_id` de la ruche dans la base de données.
- L'historique des déplacements est conservé (timeline de la ruche).
- Le compteur de ruches du rucher source et destination sont mis à jour.
- Si déplacement pour transhumance → possibilité de marquer la date de retour prévisionnelle.

**Nouvelle table** : `deplacements_ruches`

---

### 2.8 🦟 Varroa

**Objectif** : Suivi complet du parasite Varroa destructor.

| Sous-action                     | Champs spécifiques                                                                                                                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Comptage sur plancher**       | `nombre_varroas` (integer) · `duree_comptage_jours` (integer, défaut 3) · Résultat calculé : chute/jour                                                                                                   |
| **Traitement**                  | `type_traitement` (enum : Acide oxalique · Acide formique · Thymol · Amitraz · Apivar · Apistan · Autre) · `dosage` (text) · `date_debut` (date) · `date_fin_prevue` (date) · `numero_lot_produit` (text) |
| **Suppression couvain de mâle** | `nombre_cadres` (integer) · `observations` (text)                                                                                                                                                         |
| **Comptage VPH/100 AB**         | `nombre_varroas` (integer) · `nombre_abeilles_echantillon` (integer, défaut 300) · Résultat calculé : taux VPH = (varroas / abeilles) × 100                                                               |

**Logique métier** :

- Le taux de varroa alimente le **score santé** de la ruche et les **alertes automatiques**.
- Seuils d'alerte configurables : par défaut > 3 varroas/jour (plancher) ou > 2% VPH (phorétique).
- Les traitements sont suivis avec dates début/fin pour le **registre d'élevage réglementaire**.
- Traçabilité obligatoire : numéro de lot du produit de traitement (conformité sanitaire).
- Rappel automatique quand un traitement arrive à échéance.
- Historique varroa visible en graphique dans la fiche ruche (courbe d'évolution).

**Tables** : `inspections` existante (champ `varroa` basique) + nouvelles tables `comptages_varroa` et `traitements_varroa` pour le suivi détaillé.

---

### 2.9 ⚖️ Peser la ruche

**Objectif** : Suivi pondéral de la ruche pour évaluer les réserves et la dynamique de la colonie.

| Champ             | Type      | Valeurs                                             |
| ----------------- | --------- | --------------------------------------------------- |
| Poids mesuré      | `decimal` | En kg (précision 0.1 kg)                            |
| Type de pesée     | `enum`    | `totale` · `cote_droit` · `cote_gauche` · `arriere` |
| Balance connectée | `boolean` | Si oui, import automatique (phase future)           |
| Notes             | `text`    | Optionnel                                           |

**Logique métier** :

- Calcul automatique de la **variation de poids** depuis la dernière pesée.
- Estimation du poids total si pesée partielle (côté ou arrière) avec coefficient multiplicateur configurable (défaut ×2 pour côté, ×2 pour arrière).
- Graphique d'évolution du poids dans la fiche ruche (courbe temporelle).
- Alerte si perte de poids rapide (> 2 kg en 7 jours → réserves insuffisantes).
- Intégration future avec balances connectées (API webhook).

**Nouvelle table** : `pesees`

---

### 2.10 💬 Commentaires

**Objectif** : Notes libres pour toute observation non catégorisée.

| Champ          | Type           | Valeurs                                   |
| -------------- | -------------- | ----------------------------------------- |
| Commentaire    | `text`         | Zone de texte riche (max 2000 caractères) |
| Photos jointes | `file[]`       | 0 à 5 images (upload Supabase Storage)    |
| Tags           | `multi_select` | Tags personnalisables par l'apiculteur    |

**Logique métier** :

- Apparaît dans la timeline de la ruche avec les photos.
- Recherche full-text dans les commentaires depuis la barre de recherche globale (⌘K).
- Les tags permettent un filtrage rapide dans l'historique.

**Table existante** : `inspections` — les champs `notes` et `photos` couvrent ce cas. Enrichir avec un champ `tags` (voir section 3).

---

### 2.11 📦 Empiler la ruche

**Objectif** : Fusionner deux colonies en empilant une ruche sur une autre.

| Champ                  | Type                 | Valeurs                                                                |
| ---------------------- | -------------------- | ---------------------------------------------------------------------- |
| Ruche de destination   | `select` + recherche | Sélection parmi les ruches du même rucher (priorité) puis tous ruchers |
| Méthode de réunion     | `enum`               | `papier_journal` · `directe` · `autre`                                 |
| Ruche source : devenir | `enum`               | `stockage` · `destruction` · `reutilisation`                           |
| Notes                  | `text`               | Optionnel                                                              |

**Logique métier** :

- La ruche source change de statut : `fusionnee` (déjà dans `statutColonieEnum`).
- Le matériel de la ruche source (cadres, hausses) est transféré à la ruche destination.
- Lien de traçabilité entre les deux ruches (historique de fusion).
- Le nombre de cadres/hausses de la ruche destination est incrémenté.
- La ruche source est retirée du compteur actif du rucher.

**Nouvelle table** : `empilements`

---

### 2.12 🏥 Sanitaire (Morte / Dort)

**Objectif** : Gestion de l'état sanitaire critique et de la mortalité.

| Sous-action              | Champs spécifiques                                                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Essaim mort**          | `cause_probable` (enum : Varroa · Famine · Pesticides · Maladie · Pillage · Froid · Inconnue · Autre) · `date_constat` (date) · `declaration_gdsa` (boolean) · `photos` (file[]) |
| **Nettoyer la ruche**    | `type_nettoyage` (enum : Grattage · Flambage · Désinfection · Autre) · `produit_utilise` (text)                                                                                  |
| **Nettoyer le plancher** | `type_nettoyage` (enum : Grattage · Remplacement · Nettoyage eau · Flambage)                                                                                                     |
| **Retrait de couvain**   | `type_couvain` (enum : Couvain mâle · Couvain malade · Couvain mort) · `nombre_cadres` (integer) · `motif` (text)                                                                |

**Logique métier** :

- **Essaim mort** : Change le statut de la ruche à `morte` (déjà dans `statutColonieEnum`). Décrémente le compteur de colonies actives. Génère une entrée dans le rapport annuel de mortalité. Propose la déclaration au GDSA (Groupement de Défense Sanitaire Apicole).
- **Nettoyage** : Enregistré dans l'historique sanitaire. Peut être lié à une préparation pour réutilisation.
- **Retrait de couvain** : Utile pour lutte anti-varroa biologique. Met à jour le nombre de cadres de la ruche.

**Nouvelle table** : `evenements_sanitaires`

---

### 2.13 🔄 Introduction essaim sauvage / Transvasement

**Objectif** : Transférer un essaim d'une ruche à une autre (récupération d'essaim sauvage, transvasement, changement de ruche).

| Champ                          | Type      | Valeurs                                                                           |
| ------------------------------ | --------- | --------------------------------------------------------------------------------- |
| Ruche de destination           | `select`  | Ruche existante vide ou "Créer nouvelle ruche"                                    |
| Cadres transférés              | `integer` | Nombre de cadres (ajoutés à la destination)                                       |
| Ruche source : devenir         | `select`  | `stockage` (lieu à préciser) · `destruction` · `reutilisation_immediate`          |
| Lieu de stockage (si stockage) | `select`  | Liste des lieux de stockage définis par l'apiculteur                              |
| Origine de l'essaim            | `enum`    | `sauvage` · `transvasement` · `recuperation_chez_particulier` · `achat` · `autre` |
| Notes                          | `text`    | Optionnel                                                                         |

**Logique métier** :

- La colonie est transférée intégralement (historique, données sanitaires) vers la ruche destination.
- La ruche source devient inactive ou est remisée.
- Le matériel vide (corps, toit, plancher) est ajouté au stock matériel ou affecté à un lieu de stockage.
- Traçabilité : lien entre ruche source et destination.

**Nouvelle table** : `transvasements`

---

### 2.14 👑 Reine

**Objectif** : Gestion complète de la reine de la colonie.

| Sous-action             | Champs spécifiques                                                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Marquage**            | `couleur` (enum : Blanc · Jaune · Rouge · Vert · Bleu — cycle international) · `annee` (auto-calculée selon couleur) · `clippage` (boolean)                                                                                                     |
| **Changement de reine** | `origine` (enum : Élevage personnel · Achat · Cellule royale naturelle · Autre) · `race` (enum : Buckfast · Noire · Carnica · Italienne · Caucasienne · Hybride · Autre) · `fournisseur` (text) · `prix` (decimal) · `date_introduction` (date) |
| **Perte / Orpheline**   | `date_constat` (date) · `action` (enum : Introduction nouvelle reine · Réunion avec autre colonie · Attente cellule royale · Rien)                                                                                                              |
| **Évaluation**          | `qualite_ponte` (1-5) · `douceur` (1-5) · `prolificite` (1-5)                                                                                                                                                                                   |

**Logique métier** :

- La couleur de marquage suit le cycle international (Blanc=1/6, Jaune=2/7, Rouge=3/8, Vert=4/9, Bleu=5/0 — basé sur le dernier chiffre de l'année).
- L'âge de la reine est calculé automatiquement et affiché sur la fiche ruche.
- Alerte si reine > 3 ans (remplacement recommandé).
- Le changement de reine met à jour la fiche ruche (race, date de naissance, qualité).
- Historique complet des reines par ruche (lignée).
- Le coût d'achat d'une reine est enregistré en comptabilité (charge).

**Nouvelle table** : `evenements_reine`

---

## 3. Architecture technique — Alignée sur le schéma CLAUDE_CODE_PROMPT.md

### 3.1 Stratégie : enrichir l'existant + tables dédiées

Le schéma DB du CLAUDE_CODE_PROMPT.md définit déjà des tables qui couvrent plusieurs catégories d'intervention :

| Catégorie d'intervention | Table existante | Couverture                                                                                           |
| ------------------------ | --------------- | ---------------------------------------------------------------------------------------------------- |
| **Contrôle**             | `inspections`   | ✅ Complète (forceColonie, couvain, reserves, comportement, reineVue, celluleRoyale, signeEssaimage) |
| **Récolte**              | `recoltes`      | ✅ Quasi-complète (manque pollen/propolis)                                                           |
| **Nourrissement**        | `inspections`   | ⚠️ Partielle (nourrissementType, nourrissementQuantite — manque unité, concentration)                |
| **Varroa basique**       | `inspections`   | ⚠️ Partielle (comptage varroa + traitement simple — manque suivi détaillé)                           |
| **Commentaire**          | `inspections`   | ⚠️ Partielle (notes, photos — manque tags)                                                           |
| **Matériel**             | —               | ❌ À créer                                                                                           |
| **Essaimage**            | —               | ❌ À créer                                                                                           |
| **Division**             | —               | ❌ À créer                                                                                           |
| **Déplacement**          | —               | ❌ À créer                                                                                           |
| **Pesée**                | —               | ❌ À créer                                                                                           |
| **Empilement**           | —               | ❌ À créer                                                                                           |
| **Sanitaire**            | —               | ❌ À créer                                                                                           |
| **Transvasement**        | —               | ❌ À créer                                                                                           |
| **Reine**                | —               | ❌ À créer (la fiche ruche a `qualiteReine` et `marquageReine` mais pas l'historique)                |

**Approche retenue** : Enrichir `inspections` (hub visite) + `recoltes` (enrichir) + **10 nouvelles tables dédiées** avec colonnes explicites (pas de JSONB `donnees` fourre-tout). Chaque table suit les conventions existantes : UUID, `created_at`/`updated_at`, RLS par `user_id`.

---

### 3.2 Modifications du schéma existant

#### 3.2.1 Table `inspections` — Enrichissements

La table `inspections` devient le **hub visite**. Elle porte déjà les données de Contrôle, Nourrissement basique et Varroa basique. On ajoute :

```typescript
// Colonnes à AJOUTER à la table inspections existante

// Enrichissement nourrissement
nourrissementUnite: text('nourrissement_unite'),           // 'kg', 'g', 'litres', 'ml'
nourrissementConcentration: text('nourrissement_concentration'), // '50_50', '60_40', '70_30'

// Enrichissement commentaires
tags: jsonb('tags').default([]),                            // string[] — tags personnalisés

// Catégories activées pendant cette visite (pour reconstruire la grille)
categoriesActivees: jsonb('categories_activees').default([]), // string[] — ex: ['controle','nourrissement','pesee']

// Couvain enrichi (le champ existant `couvain` est un integer 1-5)
couvainPresent: boolean('couvain_present'),                 // Distinction présence vs qualité
```

> **Note** : Les champs existants `actionsRealisees` (JSONB), `notes`, `photos`, `meteo`, `nourrissementType`, `nourrissementQuantite`, `varroa`, `traitementApplique`, `maladieObservee` restent inchangés.

#### 3.2.2 Table `recoltes` — Enrichissements

```typescript
// Colonnes à AJOUTER à la table recoltes existante

inspectionId: uuid('inspection_id').references(() => inspections.id),  // Lien optionnel vers la visite
typeProduit: text('type_produit').default('miel'),          // 'miel', 'pollen', 'propolis'
unite: text('unite').default('kg'),                         // 'kg', 'g', 'litres'
notesQualite: text('notes_qualite'),
```

> **Note** : Le champ existant `typeMiel` reste pour la sous-catégorie miel. `typeProduit` couvre l'élargissement pollen/propolis.

#### 3.2.3 Enums existants — Enrichissement

```typescript
// Ajouter 'empilee' au statut colonie existant
export const statutColonieEnum = pgEnum('statut_colonie', [
  'active',
  'faible',
  'orpheline',
  'essaimee',
  'morte',
  'vendue',
  'fusionnee',
  'empilee', // ← AJOUT
]);
```

---

### 3.3 Nouvelles tables dédiées

Toutes suivent les conventions du CLAUDE_CODE_PROMPT.md : UUID PK, `user_id` FK avec cascade, `created_at`/`updated_at`, RLS activé.

#### 3.3.1 `pesees` — Suivi pondéral

```typescript
export const typePeseeEnum = pgEnum('type_pesee', [
  'totale',
  'cote_droit',
  'cote_gauche',
  'arriere',
]);

export const pesees = pgTable('pesees', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => inspections.id), // Lien optionnel vers visite

  poidsKg: decimal('poids_kg', { precision: 6, scale: 1 }).notNull(),
  typePesee: typePeseeEnum('type_pesee').notNull(),
  poidsEstimeTotal: decimal('poids_estime_total', { precision: 6, scale: 1 }), // Calculé si partielle
  variationKg: decimal('variation_kg', { precision: 6, scale: 1 }), // Calculé vs dernière pesée
  balanceConnectee: boolean('balance_connectee').default(false),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

#### 3.3.2 `comptages_varroa` — Monitoring Varroa

```typescript
export const typeComptageVarroaEnum = pgEnum('type_comptage_varroa', [
  'plancher',
  'vph',
  'suppression_couvain_male',
]);

export const comptagesVarroa = pgTable('comptages_varroa', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => inspections.id),

  typeComptage: typeComptageVarroaEnum('type_comptage').notNull(),
  nombreVarroas: integer('nombre_varroas').notNull(),

  // Comptage plancher
  dureeComptageJours: integer('duree_comptage_jours'), // Défaut 3
  chuteParJour: decimal('chute_par_jour', { precision: 6, scale: 2 }), // Calculé

  // VPH
  nombreAbeillesEchantillon: integer('nombre_abeilles_echantillon'), // Défaut 300
  tauxVph: decimal('taux_vph', { precision: 5, scale: 2 }), // Calculé

  // Suppression couvain mâle
  nombreCadresRetires: integer('nombre_cadres_retires'),

  observations: text('observations'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

#### 3.3.3 `traitements_varroa` — Suivi réglementaire traitements

```typescript
export const traitementsVarroa = pgTable('traitements_varroa', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => inspections.id),

  typeTraitement: text('type_traitement').notNull(), // Acide oxalique, formique, Apivar, etc.
  dosage: text('dosage'),
  dateDebut: timestamp('date_debut').notNull(),
  dateFinPrevue: timestamp('date_fin_prevue'),
  dateFinReelle: timestamp('date_fin_reelle'),
  numeroLotProduit: text('numero_lot_produit').notNull(), // Traçabilité réglementaire
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

#### 3.3.4 `evenements_reine` — Historique reine

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

export const evenementsReine = pgTable('evenements_reine', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => inspections.id),

  typeEvenement: typeEvenementReineEnum('type_evenement').notNull(),

  // Marquage
  couleur: couleurReineEnum('couleur'),
  anneeMarquage: integer('annee_marquage'),
  clippage: boolean('clippage'),

  // Changement
  origineReine: text('origine_reine'), // elevage_personnel, achat, cellule_royale, autre
  race: raceAbeilleEnum('race'), // Réutilise l'enum existant !
  fournisseur: text('fournisseur'),
  prix: decimal('prix', { precision: 8, scale: 2 }),
  dateIntroduction: timestamp('date_introduction'),

  // Perte / Orpheline
  actionOrpheline: text('action_orpheline'), // introduction_nouvelle, reunion, attente_cellule, rien

  // Évaluation
  qualitePonte: integer('qualite_ponte'), // 1-5
  douceur: integer('douceur'), // 1-5
  prolificite: integer('prolificite'), // 1-5

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

#### 3.3.5 `mouvements_materiel` — Équipement sur ruche

```typescript
export const actionMaterielEnum = pgEnum('action_materiel', ['ajout', 'retrait', 'remplacement']);

export const mouvementsMateriel = pgTable('mouvements_materiel', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => inspections.id),

  action: actionMaterielEnum('action').notNull(),
  element: text('element').notNull(), // cadres, hausses, partitions, nourrisseurs, etc.
  quantite: integer('quantite').notNull(),
  notes: text('notes'),

  // Lien optionnel vers stock global (si réintégration)
  stockId: uuid('stock_id').references(() => stocks.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

#### 3.3.6 `deplacements_ruches` — Transferts entre ruchers

```typescript
export const motifDeplacementEnum = pgEnum('motif_deplacement', [
  'transhumance',
  'reorganisation',
  'vente',
  'autre',
]);

export const deplacementsRuches = pgTable('deplacements_ruches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => inspections.id),

  rucherSourceId: uuid('rucher_source_id')
    .notNull()
    .references(() => ruchers.id),
  rucherDestinationId: uuid('rucher_destination_id')
    .notNull()
    .references(() => ruchers.id),
  emplacement: text('emplacement'),
  dateDeplacement: timestamp('date_deplacement').notNull(),
  motif: motifDeplacementEnum('motif').notNull(),
  dateRetourPrevue: timestamp('date_retour_prevue'), // Si transhumance
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

#### 3.3.7 `divisions` — Division de colonies

```typescript
export const divisions = pgTable('divisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheSourceId: uuid('ruche_source_id')
    .notNull()
    .references(() => ruches.id),
  inspectionId: uuid('inspection_id').references(() => inspections.id),

  nombreDivisions: integer('nombre_divisions').notNull(),
  cadresParDivision: integer('cadres_par_division').notNull(),
  reineDansDivision: boolean('reine_dans_division'),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Table de liaison : chaque division vers sa ruche destination
export const divisionsRuches = pgTable('divisions_ruches', {
  id: uuid('id').primaryKey().defaultRandom(),
  divisionId: uuid('division_id')
    .notNull()
    .references(() => divisions.id, { onDelete: 'cascade' }),
  rucheDestinationId: uuid('ruche_destination_id')
    .notNull()
    .references(() => ruches.id),
  cadresTransferes: integer('cadres_transferes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

#### 3.3.8 `essaimages` — Essaimages naturels

```typescript
export const essaimages = pgTable('essaimages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheSourceId: uuid('ruche_source_id')
    .notNull()
    .references(() => ruches.id),
  inspectionId: uuid('inspection_id').references(() => inspections.id),

  dateEssaimage: timestamp('date_essaimage').notNull(),
  essaimRecupere: boolean('essaim_recupere').notNull(),
  rucheDestinationId: uuid('ruche_destination_id').references(() => ruches.id), // Si récupéré
  nouvelleRucheCree: boolean('nouvelle_ruche_cree').default(false),
  localisationRecuperation: text('localisation_recuperation'),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

#### 3.3.9 `empilements` — Fusions de colonies

```typescript
export const methodeReunionEnum = pgEnum('methode_reunion', ['papier_journal', 'directe', 'autre']);

export const devenirRucheEnum = pgEnum('devenir_ruche', [
  'stockage',
  'destruction',
  'reutilisation',
  'reutilisation_immediate',
]);

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
  inspectionId: uuid('inspection_id').references(() => inspections.id),

  methodeReunion: methodeReunionEnum('methode_reunion').notNull(),
  devenirRucheSource: devenirRucheEnum('devenir_ruche_source').notNull(),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

#### 3.3.10 `evenements_sanitaires` — Mortalité et nettoyage

```typescript
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

export const evenementsSanitaires = pgTable('evenements_sanitaires', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => inspections.id),

  typeEvenement: typeEvenementSanitaireEnum('type_evenement').notNull(),

  // Essaim mort
  causeProbable: causeMortaliteEnum('cause_probable'),
  dateConstat: timestamp('date_constat'),
  declarationGdsa: boolean('declaration_gdsa'),
  photos: jsonb('photos').default([]),

  // Nettoyage
  typeNettoyage: text('type_nettoyage'), // grattage, flambage, desinfection, remplacement, etc.
  produitUtilise: text('produit_utilise'),

  // Retrait couvain
  typeCouvain: text('type_couvain'), // couvain_male, couvain_malade, couvain_mort
  nombreCadres: integer('nombre_cadres'),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

#### 3.3.11 `transvasements` — Transferts d'essaims

```typescript
export const origineEssaimEnum = pgEnum('origine_essaim', [
  'sauvage',
  'transvasement',
  'recuperation_particulier',
  'achat',
  'autre',
]);

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
  inspectionId: uuid('inspection_id').references(() => inspections.id),

  cadresTransferes: integer('cadres_transferes').notNull(),
  devenirRucheSource: devenirRucheEnum('devenir_ruche_source').notNull(), // Réutilise l'enum d'empilements
  lieuStockage: text('lieu_stockage'),
  origine: origineEssaimEnum('origine').notNull(),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

### 3.4 Récapitulatif du mapping Catégorie → Tables

| #   | Catégorie     | Table(s) utilisée(s)                                      | Opération                       |
| --- | ------------- | --------------------------------------------------------- | ------------------------------- |
| 1   | Matériel      | `mouvements_materiel` + `ruches` + `mouvements_stock`     | INSERT + UPDATE                 |
| 2   | Contrôle      | `inspections` (existante)                                 | INSERT/UPDATE                   |
| 3   | Récolte       | `recoltes` (existante enrichie)                           | INSERT                          |
| 4   | Nourrissement | `inspections` (colonnes enrichies) + `mouvements_stock`   | UPDATE + INSERT                 |
| 5   | Essaimage     | `essaimages` + `ruches`                                   | INSERT + UPDATE                 |
| 6   | Division      | `divisions` + `divisions_ruches` + `ruches`               | INSERT + INSERT + UPDATE/INSERT |
| 7   | Déplacement   | `deplacements_ruches` + `ruches`                          | INSERT + UPDATE                 |
| 8   | Varroa        | `comptages_varroa` / `traitements_varroa` + `inspections` | INSERT + UPDATE                 |
| 9   | Pesée         | `pesees`                                                  | INSERT                          |
| 10  | Commentaire   | `inspections` (notes, photos, tags)                       | UPDATE                          |
| 11  | Empilement    | `empilements` + `ruches`                                  | INSERT + UPDATE                 |
| 12  | Sanitaire     | `evenements_sanitaires` + `ruches`                        | INSERT + UPDATE                 |
| 13  | Transvasement | `transvasements` + `ruches`                               | INSERT + UPDATE                 |
| 14  | Reine         | `evenements_reine` + `ruches`                             | INSERT + UPDATE                 |

---

### 3.5 Schéma de validation Zod

```typescript
// server/utils/validation/interventions.ts

import { z } from 'zod';

// ─── Base commune pour toute action liée à une visite ───
const baseInterventionSchema = z.object({
  rucheId: z.string().uuid(),
  inspectionId: z.string().uuid().optional(), // Lien vers visite parente
  notes: z.string().max(2000).optional(),
});

// ─── Contrôle (dans inspections) ────────────────────────
export const controleSchema = z.object({
  rucheId: z.string().uuid(),
  dateVisite: z.string().datetime(),
  type: z.string(),
  meteo: z
    .object({
      temp: z.number().optional(),
      vent: z.string().optional(),
      ciel: z.string().optional(),
      humidite: z.number().optional(),
    })
    .optional(),
  forceColonie: z.number().int().min(1).max(5).optional(),
  couvain: z.number().int().min(0).max(5).optional(),
  reserves: z.number().int().min(1).max(5).optional(),
  comportement: z.enum(['calme', 'agressive', 'nerveuse']).optional(),
  reineVue: z.boolean().optional(),
  celluleRoyale: z.boolean().optional(),
  signeEssaimage: z.boolean().optional(),
  varroa: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

// ─── Pesée ──────────────────────────────────────────────
export const peseeSchema = baseInterventionSchema.extend({
  poidsKg: z.number().positive(),
  typePesee: z.enum(['totale', 'cote_droit', 'cote_gauche', 'arriere']),
});

// ─── Comptage Varroa ────────────────────────────────────
export const comptageVarroaSchema = baseInterventionSchema.extend({
  typeComptage: z.enum(['plancher', 'vph', 'suppression_couvain_male']),
  nombreVarroas: z.number().int().min(0),
  dureeComptageJours: z.number().int().min(1).default(3).optional(),
  nombreAbeillesEchantillon: z.number().int().min(1).default(300).optional(),
  nombreCadresRetires: z.number().int().min(1).optional(),
});

// ─── Traitement Varroa ──────────────────────────────────
export const traitementVarroaSchema = baseInterventionSchema.extend({
  typeTraitement: z.string().min(1),
  dosage: z.string().optional(),
  dateDebut: z.string().datetime(),
  dateFinPrevue: z.string().datetime().optional(),
  numeroLotProduit: z.string().min(1),
});

// ─── Mouvement matériel ─────────────────────────────────
export const mouvementMaterielSchema = baseInterventionSchema.extend({
  action: z.enum(['ajout', 'retrait', 'remplacement']),
  element: z.string().min(1),
  quantite: z.number().int().positive(),
});

// ─── Division ───────────────────────────────────────────
export const divisionSchema = z.object({
  rucheSourceId: z.string().uuid(),
  nombreDivisions: z.number().int().min(1).max(10),
  cadresParDivision: z.number().int().min(1),
  reineDansDivision: z.boolean().optional(),
  ruchesDestination: z.array(z.string().uuid()).min(1),
});

// ─── Essaimage ──────────────────────────────────────────
export const essaimageSchema = z.object({
  rucheSourceId: z.string().uuid(),
  dateEssaimage: z.string().datetime(),
  essaimRecupere: z.boolean(),
  rucheDestinationId: z.string().uuid().optional(),
  nouvelleRucheCree: z.boolean().optional(),
  localisationRecuperation: z.string().optional(),
});

// ─── Déplacement ────────────────────────────────────────
export const deplacementSchema = z.object({
  rucheId: z.string().uuid(),
  rucherDestinationId: z.string().uuid(),
  dateDeplacement: z.string().datetime(),
  motif: z.enum(['transhumance', 'reorganisation', 'vente', 'autre']),
  emplacement: z.string().optional(),
  dateRetourPrevue: z.string().datetime().optional(),
});

// ─── Empilement ─────────────────────────────────────────
export const empilementSchema = z.object({
  rucheSourceId: z.string().uuid(),
  rucheDestinationId: z.string().uuid(),
  methodeReunion: z.enum(['papier_journal', 'directe', 'autre']),
  devenirRucheSource: z.enum(['stockage', 'destruction', 'reutilisation']),
});

// ─── Évènement sanitaire ────────────────────────────────
export const evenementSanitaireSchema = baseInterventionSchema.extend({
  typeEvenement: z.enum(['essaim_mort', 'nettoyer_ruche', 'nettoyer_plancher', 'retrait_couvain']),
  causeProbable: z
    .enum(['varroa', 'famine', 'pesticides', 'maladie', 'pillage', 'froid', 'inconnue', 'autre'])
    .optional(),
  declarationGdsa: z.boolean().optional(),
  typeNettoyage: z.string().optional(),
  typeCouvain: z.string().optional(),
  nombreCadres: z.number().int().optional(),
});

// ─── Transvasement ──────────────────────────────────────
export const transvasementSchema = z.object({
  rucheSourceId: z.string().uuid(),
  rucheDestinationId: z.string().uuid(),
  cadresTransferes: z.number().int().min(0),
  devenirRucheSource: z.enum(['stockage', 'destruction', 'reutilisation_immediate']),
  origine: z.enum(['sauvage', 'transvasement', 'recuperation_particulier', 'achat', 'autre']),
});

// ─── Évènement reine ────────────────────────────────────
export const evenementReineSchema = baseInterventionSchema.extend({
  typeEvenement: z.enum(['marquage', 'changement', 'perte', 'evaluation']),
  couleur: z.enum(['blanc', 'jaune', 'rouge', 'vert', 'bleu']).optional(),
  anneeMarquage: z.number().int().optional(),
  clippage: z.boolean().optional(),
  origineReine: z.string().optional(),
  race: z.string().optional(),
  fournisseur: z.string().optional(),
  prix: z.number().optional(),
  qualitePonte: z.number().int().min(1).max(5).optional(),
  douceur: z.number().int().min(1).max(5).optional(),
  prolificite: z.number().int().min(1).max(5).optional(),
});
```

---

### 3.6 Routes API Nitro

```
server/api/
├── inspections/                    # Table existante (hub visite + contrôle)
│   ├── index.get.ts                # Liste (filtres: ruche, rucher, type, date)
│   ├── index.post.ts               # Créer une visite
│   ├── [id].get.ts                 # Détail (avec données liées)
│   ├── [id].put.ts                 # Modifier
│   ├── [id].delete.ts              # Supprimer (soft delete)
│   └── sync.post.ts                # Sync offline → serveur
│
├── recoltes/                       # Table existante
│   ├── index.get.ts
│   ├── index.post.ts
│   └── [id].put.ts
│
├── pesees/
│   ├── index.get.ts                # + évolution par ruche (graphique)
│   └── index.post.ts
│
├── varroa/
│   ├── comptages/
│   │   ├── index.get.ts            # + évolution par ruche (graphique)
│   │   └── index.post.ts
│   └── traitements/
│       ├── index.get.ts            # + registre élevage
│       ├── index.post.ts
│       └── [id].put.ts             # Clôturer un traitement (date fin réelle)
│
├── materiel/
│   ├── index.get.ts                # Historique mouvements par ruche
│   └── index.post.ts
│
├── reine/
│   ├── index.get.ts                # Historique par ruche
│   └── index.post.ts
│
├── deplacements/
│   ├── index.get.ts
│   └── index.post.ts
│
├── divisions/
│   ├── index.get.ts
│   └── index.post.ts               # Crée division + ruches destination
│
├── essaimages/
│   ├── index.get.ts
│   └── index.post.ts
│
├── empilements/
│   └── index.post.ts               # + mise à jour statut ruche source
│
├── sanitaire/
│   ├── index.get.ts
│   └── index.post.ts               # + mise à jour statut ruche si mort
│
├── transvasements/
│   └── index.post.ts               # + transfert colonie
│
└── interventions/
    ├── stats.get.ts                # Statistiques agrégées (cross-tables)
    └── bulk.post.ts                # Visite multi-catégories (orchestrateur)
```

> **Route clé** : `POST /api/interventions/bulk` — Orchestre une visite complète en créant la `inspection` parente + les enregistrements dans les tables enfants selon les catégories activées. Transaction PostgreSQL unique.

---

### 3.7 Composants Vue (Design System "Warm Precision")

```
components/interventions/
├── InterventionGrid.vue          # Grille 14 icônes (point d'entrée principal)
├── InterventionModal.vue         # Modal/Sheet bottom de saisie
├── InterventionTimeline.vue      # Timeline dans fiche ruche (agrège toutes tables)
│
├── forms/
│   ├── FormMateriel.vue          # Multi-select éléments + quantités
│   ├── FormControle.vue          # Checklist + sliders force + comportement
│   ├── FormRecolte.vue           # Type produit + quantité + lot
│   ├── FormNourrissement.vue     # Type + quantité + unité + concentration
│   ├── FormEssaimage.vue         # Toggle récupéré + ruche destination
│   ├── FormDivision.vue          # Nombre divisions + ruches destination
│   ├── FormDeplacement.vue       # Sélecteur rucher destination
│   ├── FormVarroa.vue            # Tabs sous-actions (comptage / traitement)
│   ├── FormPesee.vue             # Poids + type pesée + variation calculée
│   ├── FormCommentaire.vue       # Texte libre + photos + tags
│   ├── FormEmpilement.vue        # Sélecteur ruche destination + méthode
│   ├── FormSanitaire.vue         # Tabs sous-actions (mort / nettoyage / retrait)
│   ├── FormTransvasement.vue     # Destination + cadres + origine
│   └── FormReine.vue             # Tabs sous-actions (marquage / changement / perte / éval)
│
├── cards/
│   ├── InterventionCard.vue      # Card résumé dans timeline
│   └── InterventionBadge.vue     # Badge type avec icône et couleur
│
└── terrain/
    ├── InterventionGridTerrain.vue   # Grille gros boutons mode terrain
    └── FormTerrainWrapper.vue        # Formulaires simplifiés + saisie vocale
```

---

### 3.8 Row Level Security — Nouvelles tables

```sql
-- Appliquer RLS sur TOUTES les nouvelles tables (même pattern que l'existant)
-- Exemple pour pesees, à reproduire pour chaque table :

ALTER TABLE pesees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own pesees" ON pesees
  FOR ALL USING (user_id = auth.uid());

-- Tables à couvrir :
-- pesees, comptages_varroa, traitements_varroa, evenements_reine,
-- mouvements_materiel, deplacements_ruches, divisions, divisions_ruches,
-- essaimages, empilements, evenements_sanitaires, transvasements
```

---

### 3.9 Sync Offline

Le mécanisme offline existant dans `inspections` (`offlineId`, `syncedAt`) s'applique à la visite parente. Les tables enfants héritent du contexte de sync via leur `inspection_id`.

**Stratégie** :

1. En mode offline, toutes les données de la visite sont stockées en **IndexedDB** (une seule entrée par visite, incluant les sous-catégories).
2. Au retour de connexion, `POST /api/interventions/bulk` envoie tout en une seule requête.
3. Le serveur crée l'inspection + tous les enregistrements enfants dans une **transaction unique**.
4. En cas de conflit (`offlineId` déjà existant), le serveur retourne les données existantes sans écraser.

---

## 4. UX & Parcours utilisateur

### 4.1 Flux principal

```
[Sélection ruche(s)]
        ↓
[Grille 14 icônes — "Que souhaitez-vous enregistrer ?"]
        ↓
[Activation catégories (multi-sélection possible)]
        ↓
[Formulaire contextuel par catégorie activée]
        ↓
[Résumé intervention + Ajout commentaire/photos]
        ↓
[Validation → Sauvegarde → Retour fiche ruche avec timeline mise à jour]
```

### 4.2 Iconographie & couleurs par catégorie

| Catégorie     | Icône            | Couleur badge     | Emoji fallback |
| ------------- | ---------------- | ----------------- | -------------- |
| Matériel      | `wrench`         | `stone-500`       | 🔧             |
| Contrôle      | `search`         | `blue-500`        | 🔍             |
| Récolte       | `jar`            | `amber-500`       | 🍯             |
| Nourrissement | `utensils`       | `orange-500`      | 🥄             |
| Essaimage     | `wind`           | `yellow-500`      | 🐝             |
| Division      | `scissors`       | `purple-500`      | ✂️             |
| Déplacement   | `truck`          | `green-500`       | 🚚             |
| Varroa        | `bug`            | `red-500`         | 🦟             |
| Pesée         | `scale`          | `sky-500`         | ⚖️             |
| Commentaire   | `message-square` | `stone-400`       | 💬             |
| Empilement    | `layers`         | `indigo-500`      | 📦             |
| Sanitaire     | `heart-pulse`    | `rose-500`        | 🏥             |
| Transvasement | `repeat`         | `teal-500`        | 🔄             |
| Reine         | `crown`          | `honey` (#F5A623) | 👑             |

### 4.3 Comportement mode terrain

- Icônes de la grille : minimum **64×64px**, espacement **16px**.
- Formulaires : **un champ visible à la fois** (wizard vertical scroll).
- Boutons de validation : **56px hauteur**, pleine largeur.
- Saisie vocale disponible sur tous les champs texte.
- **Fonctionnement 100% offline** : données stockées en IndexedDB, sync automatique au retour de connexion.

---

## 5. Alertes automatiques déclenchées par les interventions

| Déclencheur                           | Alerte                             | Priorité   |
| ------------------------------------- | ---------------------------------- | ---------- |
| Contrôle : cellules royales = Oui     | Essaimage potentiel imminent       | 🔴 Haute   |
| Contrôle : force colonie = 1          | Colonie en danger                  | 🔴 Haute   |
| Varroa : chute/jour > 3 (plancher)    | Seuil varroa dépassé               | 🔴 Haute   |
| Varroa : VPH > 2%                     | Seuil varroa phorétique dépassé    | 🔴 Haute   |
| Varroa : traitement arrive à échéance | Retirer traitement varroa          | 🟡 Moyenne |
| Pesée : perte > 2 kg en 7 jours       | Perte de poids anormale            | 🟡 Moyenne |
| Reine : âge > 3 ans                   | Remplacement reine recommandé      | 🟡 Moyenne |
| Sanitaire : essaim mort               | Colonie perdue — actions suggérées | 🔵 Info    |
| Nourrissement : stock < seuil         | Stock nourriture bas               | 🟡 Moyenne |
| Dernière inspection > 15 jours        | Inspection due                     | 🟡 Moyenne |

---

## 6. Impacts sur les autres modules

| Module impacté       | Type d'intervention source                                 | Action automatique                                     |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| **Fiche ruche**      | Tous                                                       | Timeline mise à jour, badges santé, compteurs matériel |
| **Dashboard**        | Tous                                                       | KPIs recalculés (production, santé, activité)          |
| **Production**       | Récolte                                                    | Nouvelle entrée lot, stock produit fini incrémenté     |
| **Stocks**           | Matériel, Nourrissement                                    | Mouvements de stock créés automatiquement              |
| **Comptabilité**     | Récolte (vente), Reine (achat), Varroa (traitement)        | Transactions catégorisées                              |
| **Alertes**          | Contrôle, Varroa, Pesée, Reine, Sanitaire                  | Alertes créées selon seuils                            |
| **Registre élevage** | Varroa (traitement), Sanitaire                             | Entrées réglementaires                                 |
| **Rapports**         | Sanitaire (mortalité), Récolte                             | Statistiques annuelles                                 |
| **Calendrier**       | Varroa (fin traitement), Déplacement (retour transhumance) | Événements planifiés                                   |

---

## 7. Évolutions futures (hors MVP)

- **Interventions groupées** : Appliquer la même intervention à N ruches en un clic (ex: traitement varroa sur tout le rucher).
- **Templates d'intervention** : Sauvegarder des combinaisons fréquentes (ex: "Visite de printemps" = Contrôle + Pesée + Commentaire).
- **Interventions planifiées** : Créer des interventions futures avec rappel (ex: retirer traitement dans 42 jours).
- **Import balances connectées** : Webhook pour pesées automatiques.
- **Reconnaissance photo IA** : Détection automatique de maladies/varroa sur photos de cadres.
- **Partage entre apiculteurs** : Interventions visibles par les collaborateurs avec rôles.

---

## 8. Checklist d'implémentation (ordre recommandé)

1. ☐ Migrer le schéma : enrichir `inspections` + `recoltes` + créer les 12 nouvelles tables
2. ☐ Appliquer RLS sur toutes les nouvelles tables
3. ☐ Implémenter les schémas Zod de validation
4. ☐ Créer les routes API par catégorie
5. ☐ Implémenter `POST /api/interventions/bulk` (orchestrateur multi-catégories)
6. ☐ Créer `InterventionGrid.vue` (grille 14 icônes)
7. ☐ Créer les 14 formulaires catégoriels
8. ☐ Implémenter `InterventionTimeline.vue` (agrège toutes tables)
9. ☐ Implémenter les side-effects (mise à jour `ruches`, `mouvements_stock`, `alertes`)
10. ☐ Ajouter le mode terrain (gros boutons + offline IndexedDB)
11. ☐ Implémenter la sync offline (`bulk.post.ts` avec gestion conflits)
12. ☐ Tests E2E par catégorie d'intervention
