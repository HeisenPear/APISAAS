# Apiculture 360° — État du projet

> **Dernière mise à jour** : 20 février 2026
> **Stack** : Nuxt 3 + Supabase + Drizzle ORM + Vercel
> **Déploiement** : https://apisaas-360.vercel.app
> **Repo** : HeisenPear/APISAAS

---

## Légende

| Icone | Signification                    |
| ----- | -------------------------------- |
| ✅    | Fait et fonctionnel              |
| 🔶    | Partiellement fait / à améliorer |
| ❌    | Pas encore fait                  |
| 💡    | Idée / feature à ajouter         |

---

## Vue d'ensemble rapide

| Module               | Pages | API | État global    |
| -------------------- | ----- | --- | -------------- |
| Auth & Onboarding    | ✅    | ✅  | Complet        |
| Dashboard            | ✅    | ✅  | Complet        |
| Ruchers              | ✅    | ✅  | Complet        |
| Ruches               | ✅    | ✅  | Complet        |
| Inspections          | ✅    | ✅  | Complet        |
| Interventions        | ✅    | ✅  | Complet        |
| Production & Lots    | ✅    | ✅  | Complet        |
| Stocks               | ✅    | ✅  | Complet        |
| Finances             | ✅    | ✅  | Complet        |
| Clients              | ✅    | ✅  | Complet        |
| Calendrier           | ✅    | —   | Complet        |
| Météo                | ✅    | ✅  | Complet        |
| Paramètres           | ❌    | ✅  | Page manquante |
| Alertes              | ✅    | ✅  | Complet        |
| Mode offline / PWA   | ❌    | —   | Non démarré    |
| Stripe / Abonnements | ❌    | ❌  | Non démarré    |
| Multi-utilisateurs   | ❌    | ❌  | Non démarré    |

---

## Pages — Détail complet

---

### 🔐 AUTH

#### `/login` ✅

- Formulaire email + mot de passe
- Gestion erreurs Supabase
- Lien vers register / reset
- Redirect auto si déjà connecté

#### `/register` ✅

- Inscription email + mot de passe + prénom/nom
- Redirect vers onboarding après inscription

#### `/reset-password` ✅

- Envoi lien reset par email
- Formulaire nouveau mot de passe

#### `/confirm` ✅

- Page de confirmation email Supabase

**Ce qui reste :**

- 💡 Connexion Google OAuth (bouton déjà prévu dans les specs)
- 💡 Magic link (connexion sans mot de passe)
- 💡 Page "vérification email en attente" plus claire

---

### 🚀 ONBOARDING

#### `/onboarding` ✅

- Wizard multi-étapes : prénom, nom exploitation, type (pro/amateur/coopérative)
- Redirect dashboard après complétion
- Vérifie si déjà onboardé

**Ce qui reste :**

- 💡 Ajouter une étape "créer ton premier rucher" pour avoir de la donnée dès le départ
- 💡 Vidéo de bienvenue ou tour guidé interactif (style Intercom)

---

### 📊 DASHBOARD

#### `/dashboard` ✅

- KPIs : ruches actives, production saison, CA, alertes
- Graphique production mensuelle (ECharts area chart)
- Score de santé global avec jauge SVG + breakdown par rucher + ruches en alerte
- Activité récente (inspections + récoltes + transactions)
- Widget météo (Open-Meteo)
- Widget alertes
- Bouton "Nouvelle intervention" → `/interventions/nouvelle`
- Salutation personnalisée (Bonjour/Bonsoir + prénom)
- Date du jour

**Ce qui reste :**

- 🔶 Widget alertes : placeholder seulement, pas de vraies alertes dynamiques
- 🔶 Widget météo : fonctionne mais position GPS fixe (non liée à un rucher)
- 💡 Graphique donut statut colonies (actives / faibles / mortes)
- 💡 Widgets déplaçables (drag & drop)
- 💡 Sélecteur de période (semaine / mois / saison / année)
- 💡 Prochaines interventions planifiées
- 💡 Comparatif saison N vs N-1

---

### 🏡 RUCHERS

#### `/ruchers` ✅

- Liste des ruchers en cards avec stats (nb ruches, production, dernière visite)
- Carte Leaflet avec tous les ruchers géolocalisés
- Panel latéral au clic sur un marqueur
- Bouton "Nouveau rucher"

#### `/ruchers/nouveau` ✅

- Formulaire complet : nom, adresse, commune, département, GPS, environnement, notes accès
- Géocodage automatique de l'adresse → coordonnées GPS

#### `/ruchers/[id]` ✅

- Header avec nom + localisation + boutons Modifier/Supprimer
- Stats bar : total ruches, actives, production saison, dernière visite
- Informations détaillées
- Liste des ruches du rucher (avec lien vers fiche ruche)
- Mini-carte Leaflet positionnée
- **Score de santé du rucher** avec jauge + breakdown par ruche ← (ajouté session 8)
- Formulaire d'édition inline
- Modale ajout de ruche rapide
- Suppression avec confirmation

**Ce qui reste :**

- 💡 Graphique production par ruche dans ce rucher
- 💡 Historique des interventions sur le rucher
- 💡 Export PDF fiche rucher
- 💡 Associer une flore / culture à proximité (colza, tournesol, châtaignier…)
- 💡 Rayon de butinage sur la carte (cercle de 3km)

---

### 🐝 RUCHES

#### `/ruches` ✅

- Liste avec filtres (rucher, statut, type, recherche texte)
- Cards avec statut coloré, type, rucher d'appartenance
- Pagination

#### `/ruches/nouveau` ✅

- Formulaire : numéro, type, statut, race, qualité reine, date installation, origine essaim, marquage reine, cadres, hausses, notes

#### `/ruches/[id]` ✅

- Header avec badge statut + qualité reine
- Lien vers le rucher parent
- Cards infos : type, statut, race, reine
- Informations détaillées (installation, marquage, cadres…)
- Timeline historique (inspections + récoltes) avec pagination
- **Score de santé individuel** avec jauge + détail des facteurs (force, couvain, réserves, varroa, reine) ← (ajouté session 8)
- Actions rapides : nouvelle intervention, enregistrer récolte
- Lien rucher
- Dates création / mise à jour
- Édition inline + suppression

**Ce qui reste :**

- 💡 Photo de la ruche (upload Supabase Storage)
- 💡 Graphique évolution du score de santé dans le temps
- 💡 Historique du statut (tracer les changements de statut)
- 💡 Comparaison avec ruches du même rucher
- 💡 Bouton "Transférer vers un autre rucher"

---

### 🔬 INSPECTIONS

> ⚠️ Module distinct des Interventions — concerne les contrôles formels de la colonie

#### `/inspections` ✅

- Liste chronologique avec filtres (rucher, type, date)
- Cards avec type, date, ruche concernée
- Pagination

#### `/inspections/nouvelle` ✅

- Formulaire wizard : sélection ruche → formulaire complet
- Champs : force colonie, couvain, réserves, reine vue, varroa, comportement, signe essaimage, maladie observée, météo

#### `/inspections/[id]` ✅

- Détail de l'inspection avec tous les champs
- Boutons édition / suppression

**Ce qui reste :**

- 💡 Mode terrain simplifié (gros boutons, saisie vocale)
- 💡 Comparaison avec l'inspection précédente (delta)
- 💡 Export CSV de toutes les inspections
- 💡 Calendrier des inspections à venir (rappels)
- 💡 Graphique varroa dans le temps par ruche

---

### ⚡ INTERVENTIONS

> ⚠️ Actions physiques sur les ruches (traitement, récolte, nourrissement, etc.)

#### `/interventions` ✅

- Liste groupée par mois
- Filtres : rucher, type, recherche texte
- Pagination

#### `/interventions/nouvelle` ✅

- Wizard 3 étapes :
  1. Sélection ruche (grid avec toutes les ruches)
  2. Sélection type(s) d'intervention (multi-sélection parmi 14 catégories)
  3. Formulaire contextuel par type + date + météo + notes générales
- 14 types : contrôle, matériel, récolte, nourrissement, essaimage, division, déplacement, varroa, pesée, commentaire, empilement, sanitaire, transvasement, reine

#### `/interventions/[id]` ✅

- Détail de l'intervention
- Édition / suppression

**Ce qui reste :**

- 💡 Planifier une intervention future (date future → apparaît dans calendrier)
- 💡 Mode terrain : interface simplifiée pour saisie au rucher
- 💡 Interventions groupées (même action sur plusieurs ruches d'un coup)
- 💡 Templates d'intervention (ex: "Traitement printemps" pré-remplit les champs)
- 💡 Rappels automatiques (ex: 14 jours après traitement varroa → alerte contrôle)

---

### 🍯 PRODUCTION

#### `/production` ✅

- Dashboard production : KPIs (production totale, miel brut vs transformé, lots actifs)
- Graphique production par mois (ECharts)
- Liste des dernières récoltes
- Stats par type de miel

#### `/production/recoltes` ✅

- Liste de toutes les récoltes avec filtres
- Formulaire ajout récolte : ruche, date, quantité kg, type miel, numéro lot, notes
- Suppression

#### `/production/recoltes/[id]` ✅

- Détail d'une récolte
- Édition

#### `/production/tracabilite` ✅

- Suivi des lots de production
- Traçabilité miel : de la ruche au pot

#### `/production/lots/[numero]` ✅

- Fiche lot détaillée

**Ce qui reste :**

- 💡 Impression étiquettes pot de miel (format PDF avec QR code lot)
- 💡 Densité / brix (refractomètre)
- 💡 Miellerie : gestion des opérations (extraction, mise en pot, stockage)
- 💡 Objectifs de production par rucher (ex: 30kg/ruche/saison)
- 💡 Comparaison par année

---

### 📦 STOCKS

#### `/stocks` ✅

- Inventaire complet des produits (matériel apicole, intrants, miel)
- Cards avec niveau de stock, unité, seuil d'alerte
- Formulaire ajout produit
- Mouvements de stock (entrée / sortie / ajustement)

#### `/stocks/alertes` ✅

- Liste des produits sous le seuil d'alerte
- Lien vers commande / réapprovisionnement

**Ce qui reste :**

- 💡 Commandes fournisseurs (PO tracking)
- 💡 Lien stock → achat automatique (déjà partiellement fait pour les achats)
- 💡 Valorisation du stock (prix moyen pondéré)
- 💡 Historique des mouvements par produit (graphique)
- 💡 Code barre / QR code sur les produits

---

### 💶 FINANCES

#### `/finances` ✅

- Dashboard financier : CA, charges, résultat, marge
- Graphique revenus vs charges (ECharts)
- Tableau rentabilité par produit

#### `/finances/ventes` ✅

- Liste des ventes / factures
- Création vente avec sélection client, lignes de produits, TVA, remise
- Génération facture PDF (window.print + @media print)
- Statuts : brouillon, envoyée, payée, en retard

#### `/finances/facture/[id]` ✅

- Vue facture complète
- Impression / téléchargement PDF
- Changement de statut

#### `/finances/achats` ✅

- Liste des charges / dépenses
- Ajout achat : fournisseur, catégorie, montant, date
- Lien automatique avec stocks (achat → mouvement stock entrant)

#### `/finances/rapports` ✅

- Export CSV comptabilité
- Résumé par période

**Ce qui reste :**

- 🔶 Envoi facture par email (Brevo non intégré)
- 💡 Relances automatiques impayés (J+15, J+30)
- 💡 Devis (avant facture)
- 💡 Avoirs / factures d'annulation
- 💡 Connexion comptable (export FEC, Quadratus, Sage)
- 💡 Déclaration TVA pré-remplie
- 💡 Bilan annuel exportable (P&L)
- 💡 Intégration bancaire (import relevé CSV)

---

### 👥 CLIENTS

#### `/clients` ✅

- Liste clients avec recherche
- Création client : nom, prénom/raison sociale, email, téléphone, adresse, SIRET

#### `/clients/[id]` ✅

- Fiche client complète
- Historique des factures du client
- Édition / suppression

**Ce qui reste :**

- 💡 Import clients depuis CSV
- 💡 Segmentation (particulier / professionnel / restauration / épicerie…)
- 💡 Historique des achats + récurrence
- 💡 Envoi newsletter (intégration Brevo)
- 💡 Portail client (le client voit ses factures en ligne)

---

### 📅 CALENDRIER

#### `/calendrier` ✅

- Grille mensuelle 7 colonnes (Lun → Dim), 42 cellules (6 semaines)
- Navigation mois précédent / suivant / aujourd'hui
- Événements : interventions (ambre) + inspections (bleu ciel)
- Max 3 événements affichés par case, "+N autres" ouvre un modal
- Modal détail journée : liste complète avec liens vers les fiches
- `totalEvenements` ce mois affiché en sous-titre
- Fetch depuis `/api/interventions` et `/api/inspections` (limit 100), filtrage côté client

**Ce qui reste :**

- 💡 Filtrage par rucher dans le calendrier
- 💡 Vue hebdomadaire
- 💡 Planifier une intervention future (date future)
- 💡 Rappels push notification (PWA)
- 💡 Calendrier floraison par région (base de données florale)
- 💡 Export iCal / Google Calendar
- 💡 Synchronisation calendrier téléphone (CalDAV)

---

### 🌤️ MÉTÉO

#### `/meteo` ✅

- Sélecteur rucher (uniquement ruchers géolocalisés)
- Conditions actuelles : température, icône météo, vent, humidité, pluie
- Indicateur conditions visite (>15°C, vent <20 km/h, pas de pluie)
- Prévisions 7 jours : tempMax/Min, pluie, vent, badge "Idéal" si conditions optimales
- Légende : aujourd'hui (ambre), jours idéaux (vert)
- Source : Open-Meteo (gratuit, sans clé API)
- Widget dashboard mis à jour (données réelles via `useMeteo`)

**Ce qui reste :**

- 💡 Corrélation météo / production (graphique)
- 💡 Alerte SMS/push si gelée prévue (protéger les ruches)
- 💡 Journal météo rucher (historique des conditions lors des visites)
- 💡 Historique météo (au-delà des 7 jours)

---

### 🔔 ALERTES

#### `/alertes` ✅

- Stats : total, non lues, critiques, hautes
- Filtres : tout/non lues/lues + filtres priorité (critique/haute/moyenne)
- Liste avec : icône priorité colorée, titre, message, badge, date
- Actions : marquer comme lu, supprimer, lien vers l'élément concerné
- "Tout marquer lu" en masse
- "Générer les alertes" : génération automatique de 4 types :
  - `visite_requise` : ruche non visitée depuis 21+ jours
  - `sante_critique` : score de santé < 40
  - `stock_bas` : stock sous le seuil d'alerte
  - `facture_retard` : facture envoyée dont l'échéance est dépassée
- Pagination (20 par page)
- Déduplication (pas de doublons si déjà existante)

**Ce qui reste :**

- 💡 Alertes push (PWA notifications)
- 💡 Alertes email (Brevo)
- 💡 Alertes SMS (Brevo ou Twilio)
- 💡 Règles personnalisables (seuils configurables par utilisateur)
- 🔶 Cron job Vercel pour génération automatique (vercel.json préconfiguré, route manquante)

---

### ⚙️ PARAMÈTRES

#### `/parametres` ❌ — **Page non créée**

**Ce qui existe déjà :**

- API `GET/PUT /api/profils/me` (profil utilisateur)
- API `PUT /api/profils/onboarding` (données exploitation)

**Ce qui est prévu :**

- Profil personnel (prénom, nom, email, avatar)
- Informations exploitation (nom, SIRET, adresse, logo)
- Paramètres de facturation (mentions légales, IBAN, TVA)
- Gestion abonnement Stripe (voir plan, changer, annuler)
- Notifications (activer/désactiver email, push)
- Préférences (langue, format date, unités)

**Idées supplémentaires :**

- 💡 Page exploitation dédiée (pour les mentions factures)
- 💡 Gestion utilisateurs (multi-users, inviter collaborateur)
- 💡 API key pour intégrations tierces
- 💡 Audit log (qui a fait quoi et quand)

---

## Infrastructure & transversal

### Backend API ✅

- Toutes les routes CRUD des modules fonctionnels
- Auth Supabase avec `requireAuth()` sur toutes les routes protégées
- Validation Zod sur les inputs
- Score de santé partagé (`server/utils/santeScore.ts`)
- RLS Supabase actif (chaque user voit seulement ses données)

### Design system ✅

- Sidebar noire Apple avec logo Apigo
- `UiPageHeader`, `UiEmptyState`, `UiLoadingSkeleton`, `UiStatsGrid`, `UiKpiCard`
- `UiSanteScoreCard` — score de santé réutilisable
- Couleurs "Warm Precision" : Honey #F5A623, Surface #FAFAF8
- Animations 250ms ease-out

### Tests 🔶

- 15/15 tests Vitest passent
- Pas de tests E2E Playwright
- Couverture partielle

### Déploiement ✅

- Vercel auto-deploy sur push main
- Variables d'environnement configurées
- Tables Supabase créées (drizzle-kit push)

---

## Roadmap priorisée

### Sprint 7 — Alertes + Météo + Calendrier ✅ COMPLET

1. Page `/alertes` ✅ — liste, filtres, génération auto, mark as read, delete
2. Page `/meteo` ✅ — météo par rucher, prévisions 7j, indicateur conditions visite
3. Page `/calendrier` ✅ — vue mensuelle avec interventions/inspections

### Sprint 8 — Mode offline + PWA + Exports ← NEXT

1. Service Worker + manifest PWA
2. Sync IndexedDB offline
3. Export CSV / PDF global (ruches, inspections, finances)
4. Page `/parametres` complète

### Sprint 9 — Stripe + Multi-users

1. Intégration Stripe (plans Découverte / Starter / Pro / Expert)
2. Portail abonnement
3. Multi-utilisateurs (inviter un collaborateur sur une exploitation)
4. Rôles (propriétaire / apiculteur / comptable)

### Sprint 10 — Mobile & polish

1. Capacitor (iOS + Android)
2. Mode terrain (interface simplifiée pour saisie avec gants)
3. Saisie vocale (Web Speech API)
4. Notifications push
5. Optimisations performance

---

## Idées de features non planifiées

### Fonctionnalités métier

- 💡 **Traçabilité sanitaire** : suivi DDPP, déclarations obligatoires, DLC
- 💡 **Carte florale** : afficher les zones de floraison à proximité des ruchers
- 💡 **Pesée connectée** : intégration balances IoT (API webhook)
- 💡 **Transhumance** : planification et suivi des déplacements de ruchers
- 💡 **Partage de rucher** : partager l'accès à un rucher avec un voisin ou un stagiaire
- 💡 **Comparatif apiculteurs** : benchmarks anonymisés (production moyenne par région)
- 💡 **Assistant IA** : analyse automatique des inspections et recommandations

### UX / Interface

- 💡 **Dark mode** : thème sombre pour utilisation nocturne
- 💡 **Raccourcis clavier** : navigation rapide (déjà une command palette en place)
- 💡 **Widgets personnalisables** : drag & drop sur le dashboard
- 💡 **Tutoriels intégrés** : onboarding contextuel (tooltip sur chaque module)
- 💡 **Mode impression** : fiche ruche / fiche rucher imprimable

### Business

- 💡 **Marketplace** : vendre sa production directement via la plateforme
- 💡 **Coopératives** : gestion multi-exploitation (GAEC, GIE)
- 💡 **API publique** : permettre aux fabricants de matériel de s'intégrer
- 💡 **Rapport annuel PDF** : bilan complet de la saison (pour la chambre d'agriculture)

---

## Fichiers clés à connaître

| Fichier                      | Rôle                                          |
| ---------------------------- | --------------------------------------------- |
| `CLAUDE_CODE_PROMPT.md`      | Specs complètes du projet (référence absolue) |
| `docs/HISTORIQUE_TRAVAIL.md` | Journal de toutes les sessions de dev         |
| `docs/ETAT_PROJET.md`        | Ce fichier — état page par page               |
| `CHANGELOG.md`               | Changelog des versions                        |
| `server/database/schema.ts`  | Schéma Drizzle (source de vérité DB)          |
| `server/utils/santeScore.ts` | Algorithme score de santé des colonies        |
| `app/components/ui/`         | Design system custom                          |
| `app/composables/`           | Logique métier réutilisable                   |
