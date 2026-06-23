import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

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

/**
 * Type d'un article en stock :
 *  - `materiel`      : matériel acheté pour l'exploitation (cadres, hausses, outils, traitements…)
 *  - `produit_vente` : produit destiné à la vente (miel, pollen, pots conditionnés…)
 */
export const typeStockEnum = pgEnum('type_stock', ['materiel', 'produit_vente']);

/**
 * Mode de tarification d'un produit à vendre :
 *  - `format` : prix fixe par unité/format vendu  → total = quantité × prixUnitaire
 *  - `poids`  : prix par unité de mesure (kg/L)   → total = quantité × contenance × prixUnitaire
 *
 * Exemple : 10 seaux de 25 kg vendus 10 €/kg
 *   mode `poids`, contenance 25, uniteContenance 'kg', prixUnitaire 10
 *   → 10 × 25 × 10 = 2500 €
 */
export const modePrixEnum = pgEnum('mode_prix', ['format', 'poids']);

export const typeTransactionEnum = pgEnum('type_transaction', ['vente', 'achat']);

export const statutFactureEnum = pgEnum('statut_facture', [
  'brouillon',
  'envoyee',
  'payee',
  'en_retard',
  'annulee',
]);

export const planEnum = pgEnum('plan', ['decouverte', 'starter', 'pro', 'expert']);

export const roleMembreEnum = pgEnum('role_membre', ['admin', 'apiculteur', 'comptable']);

export const statutInvitationEnum = pgEnum('statut_invitation', [
  'en_attente',
  'acceptee',
  'refusee',
]);

/**
 * Catégories de produits apicoles pour la facturation — TVA française (CGI)
 * 5,5% : produits alimentaires (Art. 278-0 bis A CGI)
 * 10%  : animaux vivants + médicaments vétérinaires (Art. 278 bis CGI)
 * 20%  : matériel, équipements, boissons alcoolisées (Art. 278 CGI)
 */
// ─── Phase 2 — Enums interventions spécialisées ─────
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

export const categorieVenteEnum = pgEnum('categorie_vente', [
  // TVA 5,5% — Produits alimentaires
  'miel',
  'gelee_royale',
  'pollen',
  'propolis_alimentaire',
  'pain_abeille',
  'cire_alimentaire',
  'vinaigre_miel',
  // TVA 10% — Animaux vivants & médicaments vétérinaires
  'essaim',
  'reine',
  'ruche_peuplee',
  'nourrissement',
  'traitement_veterinaire',
  // TVA 20% — Matériel & autres
  'materiel_apicole',
  'equipement_apiculteur',
  'cire_technique',
  'conditionnement',
  'hydromel',
  'propolis_teinture',
  'cosmetique',
  'autre',
]);

// ─── Phase 3 — Enums module Reine ────────────
/** Types d'événements liés à la reine */
export const typeEvenementReineEnum = pgEnum('type_evenement_reine', [
  'introduction',
  'marquage',
  'clipping',
  'remplacement',
  'perte',
  'ponte_vue',
  'cellule_royale_trouvee',
  'elevage',
]);

/** Couleurs de marquage COLOSS (rotation annuelle) */
export const couleurReineEnum = pgEnum('couleur_reine', [
  'blanc', // années finissant en 1 ou 6
  'jaune', // années finissant en 2 ou 7
  'rouge', // années finissant en 3 ou 8
  'vert', // années finissant en 4 ou 9
  'bleu', // années finissant en 5 ou 0
]);

/** Origine de la reine */
export const origineReineEnum = pgEnum('origine_reine', [
  'elevage_propre',
  'achat',
  'capture_essaim',
  'inconnue',
]);

/** Action entreprise suite à orphélinité */
export const actionOrphelineEnum = pgEnum('action_orpheline', [
  'attente',
  'introduction_reine',
  'fusion',
  'abandon',
]);

// ─────────────────────────────────────────────
// TABLES
// ─────────────────────────────────────────────

/** Profils utilisateurs — PK = auth.users.id */
export const profils = pgTable('profils', {
  id: uuid('id').primaryKey(), // = auth.users.id
  email: text('email').notNull().unique(),
  nom: text('nom'),
  prenom: text('prenom'),
  telephone: text('telephone'),
  adresse: text('adresse'),
  codePostal: text('code_postal'),
  ville: text('ville'),
  siret: text('siret'),
  napi: text('napi'),
  plan: planEnum('plan').default('decouverte').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  onboardingComplete: boolean('onboarding_complete').default(false).notNull(),
  preferences: jsonb('preferences').$type<Record<string, unknown>>(),
  /** URL du logo apiculteur — affiché dans les factures PDF */
  logoUrl: text('logo_url'),
  /** Option TVA sur les débits — mention obligatoire n°4 facturation électronique 2026 */
  optionTvaDebits: boolean('option_tva_debits').default(false).notNull(),
  /** Trial Pro 14 jours */
  trialActive: boolean('trial_active').default(false).notNull(),
  trialStartedAt: timestamp('trial_started_at', { withTimezone: true }),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  trialUsed: boolean('trial_used').default(false).notNull(),
  /**
   * Timestamp du dernier événement Stripe webhook appliqué.
   * Permet d'ignorer les webhooks reçus dans le désordre (event.created
   * antérieur à ce timestamp = obsolète, on skip). Évite que
   * customer.subscription.updated arrivé après coup vienne écraser un
   * checkout.session.completed plus récent.
   */
  lastStripeEventAt: timestamp('last_stripe_event_at', { withTimezone: true }),
  /** GDS — Groupement de Défense Sanitaire */
  gdsDepartement: text('gds_departement'),
  gdsCotisationAnnee: integer('gds_cotisation_annee'),
  gdsAJour: boolean('gds_a_jour').default(false),
  /** Analytics produit — présence : dernière activité et page en cours */
  derniereActiviteAt: timestamp('derniere_activite_at', { withTimezone: true }),
  dernierePage: text('derniere_page'),
  /** Préférences de notifications push par type d'alerte */
  pushNotifPrefs: jsonb('push_notif_prefs').$type<Record<string, boolean>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Membres d'equipe — partage d'exploitation entre utilisateurs */
export const membres = pgTable('membres', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profils.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: roleMembreEnum('role').default('apiculteur').notNull(),
  statut: statutInvitationEnum('statut').default('en_attente').notNull(),
  invitedAt: timestamp('invited_at', { withTimezone: true }).defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Ruchers */
export const ruchers = pgTable(
  'ruchers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
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
    environnement: text('environnement'),
    notesAcces: text('notes_acces'),
    photoUrl: text('photo_url'),
    actif: boolean('actif').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('idx_ruchers_user').on(t.userId),
  }),
);

/** Ruches */
export const ruches = pgTable(
  'ruches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    rucherId: uuid('rucher_id')
      .notNull()
      .references(() => ruchers.id, { onDelete: 'cascade' }),
    numero: text('numero').notNull(),
    type: typeRucheEnum('type').notNull(),
    statut: statutColonieEnum('statut').default('active').notNull(),
    raceAbeille: raceAbeilleEnum('race_abeille').default('inconnue'),
    qualiteReine: qualiteReineEnum('qualite_reine').default('inconnue'),
    dateInstallation: timestamp('date_installation', { withTimezone: true }),
    origineEssaim: text('origine_essaim'),
    marquageReine: text('marquage_reine'),
    nombreCadres: integer('nombre_cadres'),
    nombreHausses: integer('nombre_hausses'),
    notes: text('notes'),
    photoUrl: text('photo_url'),
    /** Couleur personnalisée pour identification visuelle (hex) */
    couleurPersonnalisee: text('couleur_personnalisee'),
    // ── Reine (Phase 3) ──────────────────────
    reinePresente: boolean('reine_presente'),
    reineCouleur: couleurReineEnum('reine_couleur'),
    reineAnnee: integer('reine_annee'), // année de naissance/introduction
    reineRace: raceAbeilleEnum('reine_race').default('inconnue'),
    reineOrigine: origineReineEnum('reine_origine').default('inconnue'),
    reineDateIntroduction: timestamp('reine_date_introduction', { withTimezone: true }),
    reineQualitePonte: integer('reine_qualite_ponte'), // 1-5
    reineDouceur: integer('reine_douceur'), // 1-5
    reineProlificite: integer('reine_prolificite'), // 1-5
    photos: jsonb('photos').$type<PhotoEntry[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // Toutes les listes/compteurs filtrent par user_id (+ statut pour les quotas)
    userStatutIdx: index('idx_ruches_user_statut').on(t.userId, t.statut),
    rucherIdx: index('idx_ruches_rucher').on(t.rucherId),
  }),
);

/** Interventions */
export const interventions = pgTable(
  'interventions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    rucheId: uuid('ruche_id').references(() => ruches.id, { onDelete: 'cascade' }),
    rucherId: uuid('rucher_id').references(() => ruchers.id, { onDelete: 'set null' }),
    dateVisite: timestamp('date_visite', { withTimezone: true }).notNull(),
    type: text('type'),
    meteo: jsonb('meteo').$type<{
      temperature?: number;
      vent?: string;
      ciel?: string;
      humidite?: number;
      conditions?: string;
    }>(),
    forceColonie: integer('force_colonie'), // 1-5
    couvain: integer('couvain'), // 1-5
    reserves: integer('reserves'), // 1-5
    comportement: text('comportement'),
    reineVue: boolean('reine_vue'),
    celluleRoyale: boolean('cellule_royale'),
    signeEssaimage: boolean('signe_essaimage'),
    varroa: integer('varroa'),
    traitementApplique: text('traitement_applique'),
    maladieObservee: text('maladie_observee'),
    actionsRealisees: jsonb('actions_realisees').$type<string[]>(),
    nourrissementType: text('nourrissement_type'),
    nourrissementQuantite: decimal('nourrissement_quantite', { precision: 8, scale: 2 }),
    nourrissementUnite: text('nourrissement_unite'), // 'kg', 'g', 'litres', 'ml'
    categoriesActivees: jsonb('categories_activees').$type<string[]>().default([]),
    couvainPresent: boolean('couvain_present'),
    notes: text('notes'),
    photos: jsonb('photos').$type<PhotoEntry[]>().default([]),
    dureeMinutes: integer('duree_minutes'),
    donnees: jsonb('donnees'),
    syncedAt: timestamp('synced_at', { withTimezone: true }),
    offlineId: text('offline_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // Listes globales et alertes « visite requise » (tri par date)
    userDateIdx: index('idx_interventions_user_date').on(t.userId, t.dateVisite),
    // Timeline / historique d'une ruche
    rucheDateIdx: index('idx_interventions_ruche_date').on(t.rucheId, t.dateVisite),
  }),
);

/** Recoltes */
export const recoltes = pgTable(
  'recoltes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    rucherId: uuid('rucher_id').references(() => ruchers.id, { onDelete: 'set null' }),
    rucheId: uuid('ruche_id').references(() => ruches.id, { onDelete: 'set null' }),
    inspectionId: uuid('inspection_id').references(() => interventions.id, {
      onDelete: 'set null',
    }),
    dateRecolte: timestamp('date_recolte', { withTimezone: true }).notNull(),
    typeProduit: text('type_produit').default('miel'), // 'miel', 'pollen', 'propolis'
    typeMiel: text('type_miel'),
    quantiteKg: decimal('quantite_kg', { precision: 8, scale: 2 }),
    humidite: decimal('humidite', { precision: 4, scale: 1 }),
    nombreHausses: integer('nombre_hausses'),
    numeroLot: text('numero_lot'),
    notes: text('notes'),
    photos: jsonb('photos').$type<PhotoEntry[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // Dashboard production + analytics (agrégats par période)
    userDateIdx: index('idx_recoltes_user_date').on(t.userId, t.dateRecolte),
    rucheIdx: index('idx_recoltes_ruche').on(t.rucheId),
  }),
);

/** Stocks */
export const stocks = pgTable(
  'stocks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    nom: text('nom').notNull(),
    /** Matériel acheté vs produit à vendre — défaut materiel pour rétro-compat */
    type: typeStockEnum('type').default('materiel').notNull(),
    categorie: categorieStockEnum('categorie').notNull(),
    /** Catégorie produit pour la facturation — détermine le taux de TVA applicable */
    categorieVente: categorieVenteEnum('categorie_vente'),
    /** Taux de TVA applicable (%) — auto-calculé depuis categorieVente, surchargeable */
    tauxTva: decimal('taux_tva', { precision: 4, scale: 1 }),
    quantite: decimal('quantite', { precision: 10, scale: 2 }).default('0').notNull(),
    unite: text('unite'),
    /** Mode de tarification (produit à vendre) — format = prix/unité, poids = prix/kg-L × contenance */
    modePrix: modePrixEnum('mode_prix').default('format').notNull(),
    /** Contenance d'une unité (ex: 25 pour un seau de 25 kg). Requis si modePrix = poids */
    contenance: decimal('contenance', { precision: 10, scale: 3 }),
    /** Unité de la contenance (kg, L, g…) */
    uniteContenance: text('unite_contenance'),
    seuilAlerte: decimal('seuil_alerte', { precision: 10, scale: 2 }),
    prixUnitaire: decimal('prix_unitaire', { precision: 8, scale: 2 }),
    fournisseur: text('fournisseur'),
    emplacement: text('emplacement'),
    notes: text('notes'),
    /** Champs spécifiques miel — Décret 2003-587 (norme française) */
    typeMiel: text('type_miel'),
    presentation: text('presentation'),
    conditionnement: text('conditionnement'),
    anneeRecolte: integer('annee_recolte'),
    numLot: text('num_lot'),
    origineGeo: text('origine_geo'),
    photos: jsonb('photos').$type<PhotoEntry[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('idx_stocks_user').on(t.userId),
  }),
);

/** Catalogue de produits pré-créés (presets) pour ajouter rapidement un stock */
export const produitsCatalogue = pgTable(
  'produits_catalogue',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    nom: text('nom').notNull(),
    categorie: categorieStockEnum('categorie').notNull(),
    categorieVente: categorieVenteEnum('categorie_vente'),
    tauxTva: decimal('taux_tva', { precision: 4, scale: 1 }),
    uniteTypique: text('unite_typique'),
    modePrix: modePrixEnum('mode_prix').default('format').notNull(),
    conditionnement: text('conditionnement'),
    contenance: decimal('contenance', { precision: 10, scale: 3 }),
    uniteContenance: text('unite_contenance'),
    icon: text('icon'),
    groupe: text('groupe'),
    estDefaut: boolean('est_defaut').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('idx_produits_catalogue_user').on(t.userId),
  }),
);

/** Mouvements de stock */
export const mouvementsStock = pgTable(
  'mouvements_stock',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    stockId: uuid('stock_id')
      .notNull()
      .references(() => stocks.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // entree, sortie, ajustement
    quantite: decimal('quantite', { precision: 10, scale: 2 }).notNull(),
    motif: text('motif'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    stockIdx: index('idx_mouvements_stock_stock').on(t.stockId),
  }),
);

/** Clients */
export const clients = pgTable(
  'clients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    type: text('type'), // particulier, professionnel, revendeur
    nom: text('nom').notNull(),
    prenom: text('prenom'),
    entreprise: text('entreprise'),
    email: text('email'),
    telephone: text('telephone'),
    adresse: text('adresse'),
    codePostal: text('code_postal'),
    ville: text('ville'),
    siret: text('siret'),
    /** SIREN 9 chiffres — mention obligatoire facturation électronique 2026 (décret n° 2022-1299) */
    siren: text('siren'),
    /** Adresse de livraison si différente de l'adresse de facturation */
    adresseLivraison: text('adresse_livraison'),
    codePostalLivraison: text('code_postal_livraison'),
    villeLivraison: text('ville_livraison'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('idx_clients_user').on(t.userId),
  }),
);

/** Transactions (ventes / achats) */
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
    type: typeTransactionEnum('type').notNull(),
    numero: text('numero'),
    dateTransaction: timestamp('date_transaction', { withTimezone: true }).notNull(),
    dateEcheance: timestamp('date_echeance', { withTimezone: true }),
    statut: statutFactureEnum('statut').default('brouillon').notNull(),
    sousTotal: decimal('sous_total', { precision: 10, scale: 2 }),
    tva: decimal('tva', { precision: 10, scale: 2 }),
    /** Remise en pourcentage (0-100) appliquée au sous-total HT avant TVA */
    remise: decimal('remise', { precision: 5, scale: 2 }),
    total: decimal('total', { precision: 10, scale: 2 }),
    pdfUrl: text('pdf_url'),
    notes: text('notes'),
    lignes: jsonb('lignes').$type<LigneBL[]>().default([]),
    categorie: text('categorie'),
    /** Mention obligatoire n°3 — facturation électronique 2026 (décret n° 2022-1299) */
    categorieOperation: text('categorie_operation'),
    /** Achat récurrent auto-reconduit */
    isRecurring: boolean('is_recurring').default(false),
    recurringInterval: text('recurring_interval'),
    nextRecurringDate: timestamp('next_recurring_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // Dashboard finances + quota factures/mois (filtre type + période)
    userTypeDateIdx: index('idx_transactions_user_type_date').on(
      t.userId,
      t.type,
      t.dateTransaction,
    ),
  }),
);

/** Entrée photo stockée en JSONB (url signée + métadonnées) */
export interface PhotoEntry {
  url: string;
  path: string;
  name: string;
  size: number;
  uploadedAt: string;
  caption?: string;
}

/** Type d'une ligne de bon de livraison (aussi utilisé dans transactions.lignes) */
export interface LigneBL {
  description: string;
  quantite: number;
  prixUnitaire?: number;
  tauxTva?: number;
  total?: number;
  stockId?: string;
  /** Tarification : 'format' (prix/unité) ou 'poids' (prix/kg-L × contenance) */
  modePrix?: 'format' | 'poids';
  /** Contenance d'une unité (ex: 25 pour un seau de 25 kg) — utilisé si modePrix = 'poids' */
  contenance?: number;
  /** Unité de la contenance (kg, L…) — purement informatif sur la ligne */
  uniteContenance?: string;
  typeMiel?: string;
  presentation?: string;
  numLot?: string;
  origineGeo?: string;
  anneeRecolte?: number;
}

/** Bons de livraison */
export const bonsLivraison = pgTable('bons_livraison', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  numero: text('numero').notNull(),
  dateCreation: timestamp('date_creation', { withTimezone: true }).notNull(),
  dateLivraison: timestamp('date_livraison', { withTimezone: true }),
  /** brouillon | livre | facture | annule */
  statut: text('statut').notNull().default('brouillon'),
  lignes: jsonb('lignes').$type<LigneBL[]>().default([]),
  /** FK vers transactions si converti en facture */
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  notes: text('notes'),
  adresseLivraison: text('adresse_livraison'),
  codePostalLivraison: text('code_postal_livraison'),
  villeLivraison: text('ville_livraison'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Alertes */
export const alertes = pgTable(
  'alertes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    titre: text('titre').notNull(),
    message: text('message'),
    priorite: text('priorite'), // basse, moyenne, haute, critique
    lue: boolean('lue').default(false).notNull(),
    actionUrl: text('action_url'),
    referenceType: text('reference_type'),
    referenceId: uuid('reference_id'),
    /** Timestamp de résolution automatique — la condition qui a généré l'alerte n'existe plus */
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // Badge alertes non lues + liste (filtre lue/resolved par user)
    userLueIdx: index('idx_alertes_user_lue').on(t.userId, t.lue),
  }),
);

// ─────────────────────────────────────────────
// TABLES PHASE 2 — Interventions spécialisées
// ─────────────────────────────────────────────

/** Pesées de ruches */
export const pesees = pgTable(
  'pesees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    rucheId: uuid('ruche_id')
      .notNull()
      .references(() => ruches.id, { onDelete: 'cascade' }),
    inspectionId: uuid('inspection_id').references(() => interventions.id, {
      onDelete: 'set null',
    }),
    poidsKg: decimal('poids_kg', { precision: 6, scale: 1 }).notNull(),
    typePesee: typePeseeEnum('type_pesee').notNull(),
    poidsEstimeTotal: decimal('poids_estime_total', { precision: 6, scale: 1 }),
    variationKg: decimal('variation_kg', { precision: 6, scale: 1 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    rucheIdx: index('idx_pesees_ruche').on(t.rucheId),
  }),
);

/** Comptages varroa (plancher, VPH, suppression couvain mâle) */
export const comptagesVarroa = pgTable(
  'comptages_varroa',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    rucheId: uuid('ruche_id')
      .notNull()
      .references(() => ruches.id, { onDelete: 'cascade' }),
    inspectionId: uuid('inspection_id').references(() => interventions.id, {
      onDelete: 'set null',
    }),
    typeComptage: typeComptageVarroaEnum('type_comptage').notNull(),
    nombreVarroas: integer('nombre_varroas').notNull(),
    dureeComptageJours: integer('duree_comptage_jours'),
    chuteParJour: decimal('chute_par_jour', { precision: 6, scale: 2 }),
    nombreAbeillesEchantillon: integer('nombre_abeilles_echantillon'),
    tauxVph: decimal('taux_vph', { precision: 5, scale: 2 }),
    nombreCadresRetires: integer('nombre_cadres_retires'),
    observations: text('observations'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    rucheIdx: index('idx_comptages_varroa_ruche').on(t.rucheId),
  }),
);

/** Traitements varroa (produit, dosage, dates, lot) */
export const traitementsVarroa = pgTable(
  'traitements_varroa',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    rucheId: uuid('ruche_id')
      .notNull()
      .references(() => ruches.id, { onDelete: 'cascade' }),
    inspectionId: uuid('inspection_id').references(() => interventions.id, {
      onDelete: 'set null',
    }),
    typeTraitement: text('type_traitement').notNull(),
    dosage: text('dosage'),
    dateDebut: timestamp('date_debut', { withTimezone: true }).notNull(),
    dateFinPrevue: timestamp('date_fin_prevue', { withTimezone: true }),
    dateFinReelle: timestamp('date_fin_reelle', { withTimezone: true }),
    numeroLotProduit: text('numero_lot_produit').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    rucheIdx: index('idx_traitements_varroa_ruche').on(t.rucheId),
  }),
);

/** Mouvements de matériel sur ruches (cadres, hausses, etc.) */
export const mouvementsMateriel = pgTable('mouvements_materiel', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id, { onDelete: 'set null' }),
  action: actionMaterielEnum('action').notNull(),
  element: text('element').notNull(),
  quantite: integer('quantite').notNull(),
  notes: text('notes'),
  stockId: uuid('stock_id').references(() => stocks.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Déplacements de ruches entre ruchers */
export const deplacementsRuches = pgTable('deplacements_ruches', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id, { onDelete: 'set null' }),
  rucherSourceId: uuid('rucher_source_id')
    .notNull()
    .references(() => ruchers.id),
  rucherDestinationId: uuid('rucher_destination_id')
    .notNull()
    .references(() => ruchers.id),
  dateDeplacement: timestamp('date_deplacement', { withTimezone: true }).notNull(),
  motif: motifDeplacementEnum('motif').default('reorganisation'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Divisions (essaims artificiels) — table parent */
export const divisions = pgTable('divisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheSourceId: uuid('ruche_source_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id, { onDelete: 'set null' }),
  nombreDivisions: integer('nombre_divisions').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Ruches filles créées par une division */
export const divisionsRuches = pgTable('divisions_ruches', {
  id: uuid('id').defaultRandom().primaryKey(),
  divisionId: uuid('division_id')
    .notNull()
    .references(() => divisions.id, { onDelete: 'cascade' }),
  rucheDestinationId: uuid('ruche_destination_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Essaimages naturels */
export const essaimages = pgTable('essaimages', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheSourceId: uuid('ruche_source_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id, { onDelete: 'set null' }),
  dateEssaimage: timestamp('date_essaimage', { withTimezone: true }).notNull(),
  essaimRecupere: boolean('essaim_recupere').notNull(),
  rucheDestinationId: uuid('ruche_destination_id').references(() => ruches.id, {
    onDelete: 'set null',
  }),
  nouvelleRucheCree: boolean('nouvelle_ruche_cree').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Empilements (fusion de deux colonies) */
export const empilements = pgTable('empilements', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheSourceId: uuid('ruche_source_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  rucheDestinationId: uuid('ruche_destination_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Événements sanitaires (mortalité, nettoyage, retrait couvain) */
export const evenementsSanitaires = pgTable('evenements_sanitaires', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id, { onDelete: 'set null' }),
  typeEvenement: typeEvenementSanitaireEnum('type_evenement').notNull(),
  causeProbable: causeMortaliteEnum('cause_probable'),
  dateConstat: timestamp('date_constat', { withTimezone: true }),
  declarationGdsa: boolean('declaration_gdsa'),
  typeNettoyage: text('type_nettoyage'),
  produitUtilise: text('produit_utilise'),
  typeCouvain: text('type_couvain'),
  nombreCadres: integer('nombre_cadres'),
  notes: text('notes'),
  photos: jsonb('photos').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Transvasements (changement de ruche d'un essaim) */
export const transvasements = pgTable('transvasements', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheSourceId: uuid('ruche_source_id')
    .notNull()
    .references(() => ruches.id),
  rucheDestinationId: uuid('ruche_destination_id')
    .notNull()
    .references(() => ruches.id),
  inspectionId: uuid('inspection_id').references(() => interventions.id, { onDelete: 'set null' }),
  cadresTransferes: integer('cadres_transferes').notNull(),
  devenirRucheSource: devenirRucheEnum('devenir_ruche_source').notNull(),
  lieuStockage: text('lieu_stockage'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// TABLES PHASE 3
// ─────────────────────────────────────────────

/** Historique des événements liés à la reine */
export const evenementsReine = pgTable('evenements_reine', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  interventionId: uuid('intervention_id').references(() => interventions.id, {
    onDelete: 'set null',
  }),
  typeEvenement: typeEvenementReineEnum('type_evenement').notNull(),
  dateEvenement: timestamp('date_evenement', { withTimezone: true }).notNull(),
  couleur: couleurReineEnum('couleur'),
  origine: origineReineEnum('origine'),
  actionOrpheline: actionOrphelineEnum('action_orpheline'),
  qualitePonte: integer('qualite_ponte'), // 1-5
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Templates d'interventions réutilisables (checklists) */
export const templatesIntervention = pgTable('templates_intervention', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  description: text('description'),
  categories: jsonb('categories').$type<string[]>().default([]),
  /** Données pré-remplies pour le formulaire d'intervention */
  donneesDefaut: jsonb('donnees_defaut').$type<Record<string, unknown>>().default({}),
  actif: boolean('actif').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Tokens ICS pour export calendrier (lien unique, public) */
export const tokensCalendrier = pgTable('tokens_calendrier', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  /** Scope : 'interventions' | 'recoltes' | 'traitements' | 'all' */
  scope: text('scope').default('all').notNull(),
  actif: boolean('actif').default(true).notNull(),
  derniereUtilisation: timestamp('derniere_utilisation', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────

export const profilsRelations = relations(profils, ({ many }) => ({
  ruchers: many(ruchers),
  ruches: many(ruches),
  interventions: many(interventions),
  recoltes: many(recoltes),
  stocks: many(stocks),
  mouvementsStock: many(mouvementsStock),
  clients: many(clients),
  transactions: many(transactions),
  alertes: many(alertes),
  membresOwned: many(membres),
  pesees: many(pesees),
  comptagesVarroa: many(comptagesVarroa),
  traitementsVarroa: many(traitementsVarroa),
  mouvementsMateriel: many(mouvementsMateriel),
  deplacementsRuches: many(deplacementsRuches),
  divisions: many(divisions),
  essaimages: many(essaimages),
  empilements: many(empilements),
  evenementsSanitaires: many(evenementsSanitaires),
  transvasements: many(transvasements),
  evenementsReine: many(evenementsReine),
  templatesIntervention: many(templatesIntervention),
  tokensCalendrier: many(tokensCalendrier),
}));

export const ruchersRelations = relations(ruchers, ({ one, many }) => ({
  user: one(profils, {
    fields: [ruchers.userId],
    references: [profils.id],
  }),
  ruches: many(ruches),
  recoltes: many(recoltes),
}));

export const ruchesRelations = relations(ruches, ({ one, many }) => ({
  user: one(profils, {
    fields: [ruches.userId],
    references: [profils.id],
  }),
  rucher: one(ruchers, {
    fields: [ruches.rucherId],
    references: [ruchers.id],
  }),
  interventions: many(interventions),
  recoltes: many(recoltes),
  pesees: many(pesees),
  comptagesVarroa: many(comptagesVarroa),
  traitementsVarroa: many(traitementsVarroa),
  mouvementsMateriel: many(mouvementsMateriel),
  deplacementsRuches: many(deplacementsRuches),
  evenementsSanitaires: many(evenementsSanitaires),
  evenementsReine: many(evenementsReine),
}));

export const interventionsRelations = relations(interventions, ({ one, many }) => ({
  user: one(profils, {
    fields: [interventions.userId],
    references: [profils.id],
  }),
  ruche: one(ruches, {
    fields: [interventions.rucheId],
    references: [ruches.id],
  }),
  rucher: one(ruchers, {
    fields: [interventions.rucherId],
    references: [ruchers.id],
  }),
  pesees: many(pesees),
  comptagesVarroa: many(comptagesVarroa),
  traitementsVarroa: many(traitementsVarroa),
  mouvementsMateriel: many(mouvementsMateriel),
  deplacementsRuches: many(deplacementsRuches),
  divisions: many(divisions),
  essaimages: many(essaimages),
  empilements: many(empilements),
  evenementsSanitaires: many(evenementsSanitaires),
  transvasements: many(transvasements),
  recoltes: many(recoltes),
  evenementsReine: many(evenementsReine),
}));

export const recoltesRelations = relations(recoltes, ({ one }) => ({
  user: one(profils, {
    fields: [recoltes.userId],
    references: [profils.id],
  }),
  rucher: one(ruchers, {
    fields: [recoltes.rucherId],
    references: [ruchers.id],
  }),
  ruche: one(ruches, {
    fields: [recoltes.rucheId],
    references: [ruches.id],
  }),
  intervention: one(interventions, {
    fields: [recoltes.inspectionId],
    references: [interventions.id],
  }),
}));

export const stocksRelations = relations(stocks, ({ one, many }) => ({
  user: one(profils, {
    fields: [stocks.userId],
    references: [profils.id],
  }),
  mouvements: many(mouvementsStock),
}));

export const mouvementsStockRelations = relations(mouvementsStock, ({ one }) => ({
  stock: one(stocks, {
    fields: [mouvementsStock.stockId],
    references: [stocks.id],
  }),
  user: one(profils, {
    fields: [mouvementsStock.userId],
    references: [profils.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(profils, {
    fields: [clients.userId],
    references: [profils.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(profils, {
    fields: [transactions.userId],
    references: [profils.id],
  }),
  client: one(clients, {
    fields: [transactions.clientId],
    references: [clients.id],
  }),
}));

export const alertesRelations = relations(alertes, ({ one }) => ({
  user: one(profils, {
    fields: [alertes.userId],
    references: [profils.id],
  }),
}));

export const membresRelations = relations(membres, ({ one }) => ({
  owner: one(profils, {
    fields: [membres.ownerId],
    references: [profils.id],
    relationName: 'membresOwned',
  }),
  user: one(profils, {
    fields: [membres.userId],
    references: [profils.id],
    relationName: 'membresJoined',
  }),
}));

// ─── Relations Phase 2 ──────────────────────

export const peseesRelations = relations(pesees, ({ one }) => ({
  user: one(profils, { fields: [pesees.userId], references: [profils.id] }),
  ruche: one(ruches, { fields: [pesees.rucheId], references: [ruches.id] }),
  intervention: one(interventions, {
    fields: [pesees.inspectionId],
    references: [interventions.id],
  }),
}));

export const comptagesVarroaRelations = relations(comptagesVarroa, ({ one }) => ({
  user: one(profils, { fields: [comptagesVarroa.userId], references: [profils.id] }),
  ruche: one(ruches, { fields: [comptagesVarroa.rucheId], references: [ruches.id] }),
  intervention: one(interventions, {
    fields: [comptagesVarroa.inspectionId],
    references: [interventions.id],
  }),
}));

export const traitementsVarroaRelations = relations(traitementsVarroa, ({ one }) => ({
  user: one(profils, { fields: [traitementsVarroa.userId], references: [profils.id] }),
  ruche: one(ruches, { fields: [traitementsVarroa.rucheId], references: [ruches.id] }),
  intervention: one(interventions, {
    fields: [traitementsVarroa.inspectionId],
    references: [interventions.id],
  }),
}));

export const mouvementsMaterielRelations = relations(mouvementsMateriel, ({ one }) => ({
  user: one(profils, { fields: [mouvementsMateriel.userId], references: [profils.id] }),
  ruche: one(ruches, { fields: [mouvementsMateriel.rucheId], references: [ruches.id] }),
  intervention: one(interventions, {
    fields: [mouvementsMateriel.inspectionId],
    references: [interventions.id],
  }),
  stock: one(stocks, { fields: [mouvementsMateriel.stockId], references: [stocks.id] }),
}));

export const deplacementsRuchesRelations = relations(deplacementsRuches, ({ one }) => ({
  user: one(profils, { fields: [deplacementsRuches.userId], references: [profils.id] }),
  ruche: one(ruches, { fields: [deplacementsRuches.rucheId], references: [ruches.id] }),
  intervention: one(interventions, {
    fields: [deplacementsRuches.inspectionId],
    references: [interventions.id],
  }),
  rucherSource: one(ruchers, {
    fields: [deplacementsRuches.rucherSourceId],
    references: [ruchers.id],
    relationName: 'deplacementsSource',
  }),
  rucherDestination: one(ruchers, {
    fields: [deplacementsRuches.rucherDestinationId],
    references: [ruchers.id],
    relationName: 'deplacementsDestination',
  }),
}));

export const divisionsRelations = relations(divisions, ({ one, many }) => ({
  user: one(profils, { fields: [divisions.userId], references: [profils.id] }),
  rucheSource: one(ruches, { fields: [divisions.rucheSourceId], references: [ruches.id] }),
  intervention: one(interventions, {
    fields: [divisions.inspectionId],
    references: [interventions.id],
  }),
  ruchesFilles: many(divisionsRuches),
}));

export const divisionsRuchesRelations = relations(divisionsRuches, ({ one }) => ({
  division: one(divisions, { fields: [divisionsRuches.divisionId], references: [divisions.id] }),
  rucheDestination: one(ruches, {
    fields: [divisionsRuches.rucheDestinationId],
    references: [ruches.id],
  }),
}));

export const essaimagesRelations = relations(essaimages, ({ one }) => ({
  user: one(profils, { fields: [essaimages.userId], references: [profils.id] }),
  rucheSource: one(ruches, {
    fields: [essaimages.rucheSourceId],
    references: [ruches.id],
    relationName: 'essaimagesSource',
  }),
  rucheDestination: one(ruches, {
    fields: [essaimages.rucheDestinationId],
    references: [ruches.id],
    relationName: 'essaimagesDestination',
  }),
  intervention: one(interventions, {
    fields: [essaimages.inspectionId],
    references: [interventions.id],
  }),
}));

export const empilementsRelations = relations(empilements, ({ one }) => ({
  user: one(profils, { fields: [empilements.userId], references: [profils.id] }),
  rucheSource: one(ruches, {
    fields: [empilements.rucheSourceId],
    references: [ruches.id],
    relationName: 'empilementsSource',
  }),
  rucheDestination: one(ruches, {
    fields: [empilements.rucheDestinationId],
    references: [ruches.id],
    relationName: 'empilementsDestination',
  }),
  intervention: one(interventions, {
    fields: [empilements.inspectionId],
    references: [interventions.id],
  }),
}));

export const evenementsSanitairesRelations = relations(evenementsSanitaires, ({ one }) => ({
  user: one(profils, { fields: [evenementsSanitaires.userId], references: [profils.id] }),
  ruche: one(ruches, { fields: [evenementsSanitaires.rucheId], references: [ruches.id] }),
  intervention: one(interventions, {
    fields: [evenementsSanitaires.inspectionId],
    references: [interventions.id],
  }),
}));

export const transvasementsRelations = relations(transvasements, ({ one }) => ({
  user: one(profils, { fields: [transvasements.userId], references: [profils.id] }),
  rucheSource: one(ruches, {
    fields: [transvasements.rucheSourceId],
    references: [ruches.id],
    relationName: 'transvasementsSource',
  }),
  rucheDestination: one(ruches, {
    fields: [transvasements.rucheDestinationId],
    references: [ruches.id],
    relationName: 'transvasementsDestination',
  }),
  intervention: one(interventions, {
    fields: [transvasements.inspectionId],
    references: [interventions.id],
  }),
}));

// ─── Relations Phase 3 ──────────────────────

export const evenementsReineRelations = relations(evenementsReine, ({ one }) => ({
  user: one(profils, { fields: [evenementsReine.userId], references: [profils.id] }),
  ruche: one(ruches, { fields: [evenementsReine.rucheId], references: [ruches.id] }),
  intervention: one(interventions, {
    fields: [evenementsReine.interventionId],
    references: [interventions.id],
  }),
}));

export const templatesInterventionRelations = relations(templatesIntervention, ({ one }) => ({
  user: one(profils, { fields: [templatesIntervention.userId], references: [profils.id] }),
}));

export const tokensCalendrierRelations = relations(tokensCalendrier, ({ one }) => ({
  user: one(profils, { fields: [tokensCalendrier.userId], references: [profils.id] }),
}));

// ─────────────────────────────────────────────
// PHASE 4 — ENUMS
// ─────────────────────────────────────────────

export const statutHausseEnum = pgEnum('statut_hausse', [
  'disponible',
  'en_service',
  'en_stock',
  'hors_service',
]);

export const statutCampagneEnum = pgEnum('statut_campagne', [
  'brouillon',
  'ouverte',
  'fermee',
  'en_traitement',
  'terminee',
]);

export const statutCommandeEnum = pgEnum('statut_commande', [
  'en_attente',
  'validee',
  'payee',
  'annulee',
]);

export const typeOrganisationEnum = pgEnum('type_organisation', [
  'gdsa',
  'syndicat',
  'cuma',
  'gie',
  'gaec',
  'association',
  'autre',
]);

// ─────────────────────────────────────────────
// PHASE 4 — TABLE: HAUSSES
// ─────────────────────────────────────────────

export const hausses = pgTable('hausses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id').references(() => ruches.id, { onDelete: 'set null' }),
  numero: text('numero').notNull(),
  type: typeRucheEnum('type').notNull(),
  nombreCadres: integer('nombre_cadres').default(10),
  statut: statutHausseEnum('statut').default('disponible').notNull(),
  anneeAcquisition: integer('annee_acquisition'),
  qrCodeData: text('qr_code_data'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// PHASE 4 — TABLE: ORGANISATIONS
// ─────────────────────────────────────────────

export const organisations = pgTable('organisations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  type: typeOrganisationEnum('type').notNull(),
  siret: text('siret'),
  adresse: text('adresse'),
  codePostal: text('code_postal'),
  ville: text('ville'),
  email: text('email'),
  telephone: text('telephone'),
  logoUrl: text('logo_url'),
  cgvUrl: text('cgv_url'),
  stripeAccountId: text('stripe_account_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// PHASE 4 — TABLE: CAMPAGNES COMMANDE
// ─────────────────────────────────────────────

export const campagnesCommande = pgTable('campagnes_commande', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  description: text('description'),
  dateOuverture: timestamp('date_ouverture').notNull(),
  dateFermeture: timestamp('date_fermeture').notNull(),
  statut: statutCampagneEnum('statut').default('brouillon').notNull(),
  tokenPublic: text('token_public').notNull().unique(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// PHASE 4 — TABLE: PRODUITS CAMPAGNE
// ─────────────────────────────────────────────

export const produitsCampagne = pgTable('produits_campagne', {
  id: uuid('id').primaryKey().defaultRandom(),
  campagneId: uuid('campagne_id')
    .notNull()
    .references(() => campagnesCommande.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  description: text('description'),
  prixUnitaireHt: decimal('prix_unitaire_ht', { precision: 10, scale: 2 }).notNull(),
  tauxTva: decimal('taux_tva', { precision: 4, scale: 1 }).notNull(),
  unite: text('unite').default('piece'),
  /** Mode de tarification — format = prix/unité, poids = prix/kg-L × contenance */
  modePrix: modePrixEnum('mode_prix').default('format').notNull(),
  /** Contenance d'une unité (ex: 25 pour un seau de 25 kg) */
  contenance: decimal('contenance', { precision: 10, scale: 3 }),
  uniteContenance: text('unite_contenance'),
  stockDisponible: integer('stock_disponible'),
  quantiteMin: integer('quantite_min').default(1),
  quantiteMax: integer('quantite_max'),
  categorie: text('categorie'),
  photoUrl: text('photo_url'),
  ordre: integer('ordre').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// PHASE 4 — TABLE: COMMANDES GROUPEES
// ─────────────────────────────────────────────

export const commandesGroupees = pgTable('commandes_groupees', {
  id: uuid('id').primaryKey().defaultRandom(),
  campagneId: uuid('campagne_id')
    .notNull()
    .references(() => campagnesCommande.id),
  membreId: uuid('membre_id').references(() => profils.id),
  nomInvite: text('nom_invite'),
  emailInvite: text('email_invite'),
  telephoneInvite: text('telephone_invite'),
  statut: statutCommandeEnum('statut').default('en_attente').notNull(),
  totalHt: decimal('total_ht', { precision: 10, scale: 2 }),
  totalTva: decimal('total_tva', { precision: 10, scale: 2 }),
  totalTtc: decimal('total_ttc', { precision: 10, scale: 2 }),
  lignes: jsonb('lignes').notNull(),
  modePaiement: text('mode_paiement'),
  paiementRef: text('paiement_ref'),
  saisieAdmin: boolean('saisie_admin').default(false),
  tokenQr: text('token_qr'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Sprint 1 — Conformité Administrative ────────────────────

/** Déclarations NAPI annuelles */
export const declarationsNapi = pgTable('declarations_napi', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  annee: integer('annee').notNull(),
  dateDeclaration: timestamp('date_declaration', { withTimezone: true }).notNull(),
  nombreTotalColonies: integer('nombre_total_colonies').notNull(),
  nombreRuchesProduction: integer('nombre_ruches_production').default(0),
  nombreRuchettes: integer('nombre_ruchettes').default(0),
  nombreNuclei: integer('nombre_nuclei').default(0),
  ruchersData: jsonb('ruchers_data')
    .notNull()
    .$type<{ rucherId: string; nom: string; commune: string; nbColonies: number }[]>(),
  recepisseUrl: text('recepisse_url'),
  numeroRecepisse: text('numero_recepisse'),
  statut: text('statut').default('brouillon').notNull(), // brouillon | enregistre | recepisse_recu
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Vétérinaires sanitaires */
export const veterinaires = pgTable('veterinaires', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  nomComplet: text('nom_complet').notNull(),
  cabinet: text('cabinet'),
  telephone: text('telephone'),
  email: text('email'),
  adresse: text('adresse'),
  numeroOrdre: text('numero_ordre'),
  estPrincipal: boolean('est_principal').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Ordonnances vétérinaires */
export const ordonnances = pgTable('ordonnances', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  veterinaireId: uuid('veterinaire_id').references(() => veterinaires.id, { onDelete: 'set null' }),
  datePrescription: timestamp('date_prescription', { withTimezone: true }).notNull(),
  medicament: text('medicament').notNull(),
  substance: text('substance'),
  posologie: text('posologie'),
  dureeTraitementJours: integer('duree_traitement_jours'),
  delaiAttenteAvantRecolteJours: integer('delai_attente_avant_recolte_jours').notNull(),
  ruchesConcernees: jsonb('ruches_concernees').$type<string[]>(),
  documentUrl: text('document_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Visites sanitaires */
export const visitesSanitaires = pgTable('visites_sanitaires', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  veterinaireId: uuid('veterinaire_id').references(() => veterinaires.id, { onDelete: 'set null' }),
  dateVisite: timestamp('date_visite', { withTimezone: true }).notNull(),
  rucherId: uuid('rucher_id').references(() => ruchers.id, { onDelete: 'set null' }),
  observations: text('observations'),
  recommandations: text('recommandations'),
  rapportUrl: text('rapport_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Mortalités significatives */
export const mortalites = pgTable('mortalites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucherId: uuid('rucher_id').references(() => ruchers.id, { onDelete: 'set null' }),
  dateConstatee: timestamp('date_constatee', { withTimezone: true }).notNull(),
  type: text('type').notNull(), // hiver, printemps, ete, automne, aiguë
  nombreColonies: integer('nombre_colonies').notNull(),
  causeSuspectee: text('cause_suspectee'),
  declarationTraces: boolean('declaration_traces').default(false).notNull(),
  declarationAssurance: boolean('declaration_assurance').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Sprint 2 — Transhumance & Miellées ────────────────────

/** Emplacements potentiels (différents des ruchers actifs) */
export const emplacements = pgTable('emplacements', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  adresse: text('adresse'),
  commune: text('commune'),
  codePostal: text('code_postal'),
  altitudeMetres: integer('altitude_metres'),
  capaciteMaxRuches: integer('capacite_max_ruches'),
  mielleesPrincipales: text('miellees_principales').array(),
  proprietaireTerrain: text('proprietaire_terrain'),
  proprietaireTelephone: text('proprietaire_telephone'),
  accordSigne: boolean('accord_signe').default(false).notNull(),
  loyerAnnuelEuros: decimal('loyer_annuel_euros', { precision: 10, scale: 2 }),
  loyerEnMielKg: decimal('loyer_en_miel_kg', { precision: 8, scale: 2 }),
  accesDifficulte: text('acces_difficulte'), // facile | moyen | difficile
  notes: text('notes'),
  estActif: boolean('est_actif').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Plans de transhumance */
export const plansTranshumance = pgTable('plans_transhumance', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  annee: integer('annee').notNull(),
  rucherOrigineId: uuid('rucher_origine_id').references(() => ruchers.id, { onDelete: 'set null' }),
  emplacementDestinationId: uuid('emplacement_destination_id').references(() => emplacements.id, {
    onDelete: 'set null',
  }),
  datePrevue: timestamp('date_prevue', { withTimezone: true }).notNull(),
  dateRetourPrevue: timestamp('date_retour_prevue', { withTimezone: true }),
  dateRealisee: timestamp('date_realisee', { withTimezone: true }),
  miellee: text('miellee'),
  nombreRuchesPrevues: integer('nombre_ruches_prevues').notNull(),
  nombreRuchesRealisees: integer('nombre_ruches_realisees'),
  coutCarburantEuros: decimal('cout_carburant_euros', { precision: 10, scale: 2 }),
  dureeMinutes: integer('duree_minutes'),
  distanceKm: decimal('distance_km', { precision: 8, scale: 1 }),
  productionKg: decimal('production_kg', { precision: 10, scale: 2 }),
  notes: text('notes'),
  statut: text('statut').default('planifie').notNull(), // planifie | en_cours | realise | annule
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Référentiel floraisons (public — pas de RLS) */
export const floraisonsReferentiel = pgTable('floraisons_referentiel', {
  id: uuid('id').defaultRandom().primaryKey(),
  nom: text('nom').notNull(),
  nomLatin: text('nom_latin'),
  typeMiel: text('type_miel'),
  regionPrincipale: text('region_principale'),
  moisDebut: integer('mois_debut').notNull(),
  jourDebutTypique: integer('jour_debut_typique').notNull(),
  dureeJoursTypique: integer('duree_jours_typique').notNull(),
  altitudeMin: integer('altitude_min'),
  altitudeMax: integer('altitude_max'),
  latitudeMin: decimal('latitude_min', { precision: 6, scale: 3 }),
  latitudeMax: decimal('latitude_max', { precision: 6, scale: 3 }),
  potentielProductionKgRuche: decimal('potentiel_production_kg_ruche', { precision: 5, scale: 2 }),
  remarques: text('remarques'),
  emoji: text('emoji'),
});

// ─── Sprint 3 — Élevage de reines & Sélection ────────────────────

/** Lignées génétiques */
export const lignees = pgTable('lignees', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  race: text('race').notNull(), // buckfast | carnica | noire | italienne | caucasienne | hybride
  origine: text('origine'),
  dateCreation: timestamp('date_creation', { withTimezone: true }).notNull(),
  notes: text('notes'),
  estActive: boolean('est_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Reines (table dédiée élevage — distinct des colonnes reine dans ruches) */
export const reinesElevage = pgTable('reines_elevage', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id').references(() => ruches.id, { onDelete: 'set null' }),
  ligneeId: uuid('lignee_id').references(() => lignees.id, { onDelete: 'set null' }),
  reineMereId: uuid('reine_mere_id'), // self-ref, added post-create
  identifiant: text('identifiant'),
  couleurMarquage: text('couleur_marquage'), // blanc|jaune|rouge|vert|bleu
  anneeNaissance: integer('annee_naissance'),
  dateIntroduction: timestamp('date_introduction', { withTimezone: true }),
  origine: text('origine'), // elevage_propre | achat | capture_essaim
  fournisseur: text('fournisseur'),
  estInsemine: boolean('est_insemine').default(false).notNull(),
  stationFecondation: text('station_fecondation'),
  estActive: boolean('est_active').default(true).notNull(),
  dateRemplacement: timestamp('date_remplacement', { withTimezone: true }),
  causeRemplacement: text('cause_remplacement'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Sessions de greffage */
export const sessionsGreffage = pgTable('sessions_greffage', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  dateGreffage: timestamp('date_greffage', { withTimezone: true }).notNull(),
  reineMereId: uuid('reine_mere_id').references(() => reinesElevage.id, { onDelete: 'set null' }),
  rucheEleveuse: text('ruche_eleveuse'), // nom libre
  nombreCellulesGreffees: integer('nombre_cellules_greffees').notNull(),
  nombreCellulesAcceptees: integer('nombre_cellules_acceptees'),
  nombreCellulesNaissance: integer('nombre_cellules_naissance'),
  dateNaissancePrevue: timestamp('date_naissance_prevue', { withTimezone: true }),
  dateMiseNucleiPrevue: timestamp('date_mise_nuclei_prevue', { withTimezone: true }),
  technique: text('technique'), // doolittle | cupule_artificielle | transfert
  notes: text('notes'),
  estTerminee: boolean('est_terminee').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Tests de performance */
export const testsPerformance = pgTable('tests_performance', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  reineId: uuid('reine_id')
    .notNull()
    .references(() => reinesElevage.id, { onDelete: 'cascade' }),
  saison: integer('saison').notNull(),
  productiviteMielKg: decimal('productivite_miel_kg', { precision: 8, scale: 2 }),
  douceur: integer('douceur'),
  tenueCadre: integer('tenue_cadre'),
  hygienismePinTestPct: integer('hygienisme_pin_test_pct'),
  resistanceVarroaPctInfestation: decimal('resistance_varroa_pct_infestation', {
    precision: 5,
    scale: 2,
  }),
  tendanceEssaimage: integer('tendance_essaimage'),
  hivernage: integer('hivernage'),
  vigueurPrintemps: integer('vigueur_printemps'),
  ponteQualite: integer('ponte_qualite'),
  indexComposite: decimal('index_composite', { precision: 5, scale: 2 }),
  observations: text('observations'),
  dateEvaluation: timestamp('date_evaluation', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// PHASE 4 — RELATIONS
// ─────────────────────────────────────────────

export const haussesRelations = relations(hausses, ({ one }) => ({
  user: one(profils, { fields: [hausses.userId], references: [profils.id] }),
  ruche: one(ruches, { fields: [hausses.rucheId], references: [ruches.id] }),
}));

export const organisationsRelations = relations(organisations, ({ one, many }) => ({
  owner: one(profils, { fields: [organisations.ownerId], references: [profils.id] }),
  campagnes: many(campagnesCommande),
}));

export const campagnesCommandeRelations = relations(campagnesCommande, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [campagnesCommande.organisationId],
    references: [organisations.id],
  }),
  produits: many(produitsCampagne),
  commandes: many(commandesGroupees),
}));

export const produitsCampagneRelations = relations(produitsCampagne, ({ one }) => ({
  campagne: one(campagnesCommande, {
    fields: [produitsCampagne.campagneId],
    references: [campagnesCommande.id],
  }),
}));

export const commandesGroupeesRelations = relations(commandesGroupees, ({ one }) => ({
  campagne: one(campagnesCommande, {
    fields: [commandesGroupees.campagneId],
    references: [campagnesCommande.id],
  }),
  membre: one(profils, { fields: [commandesGroupees.membreId], references: [profils.id] }),
}));

// ============================================================================
// SECURITE — Audit log & detection d'anomalies
// ============================================================================

/**
 * Journal d'audit des actions sensibles (RGPD, securite, conformite).
 *
 * Toute action a fort impact y est tracee :
 *   - auth.login / auth.login_failed / auth.logout
 *   - auth.password_changed / auth.email_changed
 *   - account.deleted / account.exported
 *   - mfa.enrolled / mfa.disabled / mfa.verified
 *   - admin.user_deleted / admin.user_listed
 *   - billing.subscription_created / billing.subscription_canceled
 *
 * userId peut etre null pour les actions sur compte deja supprime ou pour
 * les tentatives anonymes (login_failed sur email inexistant).
 */
export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profils.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // ex: 'auth.login', 'account.deleted'
  resourceType: text('resource_type'), // ex: 'user', 'subscription'
  resourceId: text('resource_id'), // id de la ressource concernee
  ip: text('ip'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'), // contexte additionnel (ancien email, plan, etc.)
  success: boolean('success').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Historique des connexions reussies — sert a detecter les anomalies
 * (nouvelle IP, nouveau pays, nouveau navigateur) et a notifier l'user.
 */
export const connexions = pgTable('connexions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  ip: text('ip').notNull(),
  userAgent: text('user_agent'),
  // Hash de IP+UA — permet de detecter une nouvelle combinaison sans
  // stocker l'historique complet ni faire de match exact sur IP (peut
  // changer entre les requetes du meme user, WiFi vs 4G)
  fingerprint: text('fingerprint').notNull(),
  pays: text('pays'), // resolu via header CF-IPCountry si Cloudflare en front
  notified: boolean('notified').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Tentatives de login echouees — base pour l'account lockout progressif.
 * Cle = email lower-cased (pas userId, car le user peut ne pas exister).
 */
export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  emailKey: text('email_key').notNull(), // email lowercase
  ip: text('ip'),
  success: boolean('success').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// ANALYTICS PRODUIT — comportement utilisateur
// ─────────────────────────────────────────────

export const typeEvenementActiviteEnum = pgEnum('type_evenement_activite', ['page', 'action']);

/**
 * Journal d'activité produit (analytics 1ère partie).
 *
 * Deux natures d'événements :
 *   - 'page'   : navigation — `nom` = chemin de la route (ex: '/ruches').
 *   - 'action' : action métier clé — `nom` = identifiant d'événement
 *                (ex: 'intervention:created', 'vente:created').
 *
 * Volontairement minimaliste et RGPD-friendly : on ne stocke que le chemin et
 * le type d'action, jamais le contenu métier. Sert à comprendre l'usage du
 * produit (pages populaires, parcours, adoption des fonctionnalités).
 */
export const evenementsActivite = pgTable(
  'evenements_activite',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    type: typeEvenementActiviteEnum('type').notNull(),
    /** Chemin de page (type 'page') ou nom d'action (type 'action') */
    nom: text('nom').notNull(),
    /** Titre lisible de la page, si disponible */
    titre: text('titre'),
    /** Durée passée sur la page précédente, en millisecondes */
    dureeMs: integer('duree_ms'),
    /** Identifiant de session client (sessionStorage) — regroupe une visite */
    sessionId: text('session_id'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('idx_evenements_activite_user').on(t.userId),
    createdIdx: index('idx_evenements_activite_created').on(t.createdAt),
    typeNomIdx: index('idx_evenements_activite_type_nom').on(t.type, t.nom),
  }),
);

// ─────────────────────────────────────────────
// DEMANDES DE DÉMO — prise de rdv prospects (public)
// ─────────────────────────────────────────────

/** Cycle de vie d'une demande de démo, côté admin. */
export const statutDemandeDemoEnum = pgEnum('statut_demande_demo', [
  'nouveau',
  'contacte',
  'planifie',
  'realise',
  'annule',
]);

/**
 * Demandes de démo soumises depuis le parcours public « Réserver une démo ».
 *
 * Aucune relation à `profils` : un prospect n'a pas (encore) de compte. La table
 * n'est jamais lue/écrite par un client Supabase — uniquement par le serveur
 * (connexion directe `db`, qui bypass RLS). RLS est donc activée SANS policy :
 * verrouillage total côté anon/authenticated.
 */
export const demandesDemo = pgTable(
  'demandes_demo',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    prenom: text('prenom').notNull(),
    nom: text('nom').notNull(),
    email: text('email').notNull(),
    telephone: text('telephone').notNull(),
    /** Objectif & besoins exprimés par le prospect */
    objectif: text('objectif').notNull(),
    /** Créneau SOUHAITÉ (préférence, pas une réservation ferme) */
    creneauPeriode: text('creneau_periode'), // 'cette_semaine' | 'semaine_prochaine' | 'flexible'
    creneauJour: text('creneau_jour'), // 'lundi'…'vendredi' | null
    creneauMoment: text('creneau_moment'), // 'matin' | 'apres_midi' | null
    statut: statutDemandeDemoEnum('statut').default('nouveau').notNull(),
    /** Notes internes de l'admin (qualification, compte-rendu d'appel…) */
    notes: text('notes'),
    /** Date du rdv une fois confirmé avec le prospect */
    rdvAt: timestamp('rdv_at', { withTimezone: true }),
    /** D'où vient la demande : 'landing' | 'demo_page' | … */
    source: text('source'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statutIdx: index('idx_demandes_demo_statut').on(t.statut),
    createdIdx: index('idx_demandes_demo_created').on(t.createdAt),
    // Anti-double-réservation : un seul rdv actif par créneau (les annulés libèrent).
    rdvActifIdx: uniqueIndex('idx_demandes_demo_rdv_actif')
      .on(t.rdvAt)
      .where(sql`statut <> 'annule' AND rdv_at IS NOT NULL`),
  }),
);

// ─── Codes promo / sponsoring ────────────────────────────────────────────────

export const typeSponsoringEnum = pgEnum('type_sponsoring', ['ambassadeur', 'syndicat', 'magasin']);

/**
 * Codes de réduction sponsoring. Chaque code est le miroir d'un coupon Stripe
 * (percent_off, duration repeating sur N mois) + d'un promotion code Stripe (le
 * code que le client saisit au paiement). On stocke en plus le sponsor et son
 * type pour tracer les acquisitions par partenaire. Géré côté serveur (admin) ;
 * jamais lu/écrit par un client Supabase → RLS activée sans policy.
 */
export const codesPromo = pgTable(
  'codes_promo',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(),
    sponsorNom: text('sponsor_nom').notNull(),
    typeSponsoring: typeSponsoringEnum('type_sponsoring').notNull(),
    reductionPourcent: integer('reduction_pourcent').notNull(),
    dureeMois: integer('duree_mois').notNull(),
    stripeCouponId: text('stripe_coupon_id').notNull(),
    stripePromotionCodeId: text('stripe_promotion_code_id').notNull(),
    maxRedemptions: integer('max_redemptions'),
    actif: boolean('actif').default(true).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    codeIdx: index('idx_codes_promo_code').on(t.code),
    typeIdx: index('idx_codes_promo_type').on(t.typeSponsoring),
  }),
);

/**
 * Acquisitions via code promo : une ligne par checkout payé avec un code.
 * Renseignée par le webhook Stripe (checkout.session.completed). Unicité sur
 * stripe_session_id pour garantir l'idempotence (Stripe peut rejouer l'event).
 */
export const acquisitionsPromo = pgTable(
  'acquisitions_promo',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    codePromoId: uuid('code_promo_id')
      .notNull()
      .references(() => codesPromo.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profils.id, { onDelete: 'cascade' }),
    plan: text('plan').notNull(),
    montantRemiseCents: integer('montant_remise_cents').default(0).notNull(),
    stripeSessionId: text('stripe_session_id').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    codeIdx: index('idx_acquisitions_promo_code').on(t.codePromoId),
    userIdx: index('idx_acquisitions_promo_user').on(t.userId),
  }),
);
