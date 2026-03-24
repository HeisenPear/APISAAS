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
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  /** Trial Pro 14 jours */
  trialActive: boolean('trial_active').default(false).notNull(),
  trialStartedAt: timestamp('trial_started_at', { withTimezone: true }),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  trialUsed: boolean('trial_used').default(false).notNull(),
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
export const ruchers = pgTable('ruchers', {
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
});

/** Ruches */
export const ruches = pgTable('ruches', {
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Interventions */
export const interventions = pgTable('interventions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
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
  photos: jsonb('photos').$type<string[]>().default([]),
  dureeMinutes: integer('duree_minutes'),
  donnees: jsonb('donnees'),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
  offlineId: text('offline_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Recoltes */
export const recoltes = pgTable('recoltes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucherId: uuid('rucher_id').references(() => ruchers.id, { onDelete: 'set null' }),
  rucheId: uuid('ruche_id').references(() => ruches.id, { onDelete: 'set null' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id, { onDelete: 'set null' }),
  dateRecolte: timestamp('date_recolte', { withTimezone: true }).notNull(),
  typeProduit: text('type_produit').default('miel'), // 'miel', 'pollen', 'propolis'
  typeMiel: text('type_miel'),
  quantiteKg: decimal('quantite_kg', { precision: 8, scale: 2 }),
  humidite: decimal('humidite', { precision: 4, scale: 1 }),
  nombreHausses: integer('nombre_hausses'),
  numeroLot: text('numero_lot'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Stocks */
export const stocks = pgTable('stocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  nom: text('nom').notNull(),
  categorie: categorieStockEnum('categorie').notNull(),
  /** Catégorie produit pour la facturation — détermine le taux de TVA applicable */
  categorieVente: categorieVenteEnum('categorie_vente'),
  /** Taux de TVA applicable (%) — auto-calculé depuis categorieVente, surchargeable */
  tauxTva: decimal('taux_tva', { precision: 4, scale: 1 }),
  quantite: decimal('quantite', { precision: 10, scale: 2 }).default('0').notNull(),
  unite: text('unite'),
  seuilAlerte: decimal('seuil_alerte', { precision: 10, scale: 2 }),
  prixUnitaire: decimal('prix_unitaire', { precision: 8, scale: 2 }),
  fournisseur: text('fournisseur'),
  emplacement: text('emplacement'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Mouvements de stock */
export const mouvementsStock = pgTable('mouvements_stock', {
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
});

/** Clients */
export const clients = pgTable('clients', {
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
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Transactions (ventes / achats) */
export const transactions = pgTable('transactions', {
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
  total: decimal('total', { precision: 10, scale: 2 }),
  pdfUrl: text('pdf_url'),
  notes: text('notes'),
  lignes: jsonb('lignes')
    .$type<
      Array<{
        description: string;
        quantite: number;
        prixUnitaire: number;
        total: number;
        tauxTva?: number;
      }>
    >()
    .default([]),
  categorie: text('categorie'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Alertes */
export const alertes = pgTable('alertes', {
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// TABLES PHASE 2 — Interventions spécialisées
// ─────────────────────────────────────────────

/** Pesées de ruches */
export const pesees = pgTable('pesees', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id, { onDelete: 'set null' }),
  poidsKg: decimal('poids_kg', { precision: 6, scale: 1 }).notNull(),
  typePesee: typePeseeEnum('type_pesee').notNull(),
  poidsEstimeTotal: decimal('poids_estime_total', { precision: 6, scale: 1 }),
  variationKg: decimal('variation_kg', { precision: 6, scale: 1 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Comptages varroa (plancher, VPH, suppression couvain mâle) */
export const comptagesVarroa = pgTable('comptages_varroa', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id, { onDelete: 'set null' }),
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
});

/** Traitements varroa (produit, dosage, dates, lot) */
export const traitementsVarroa = pgTable('traitements_varroa', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profils.id, { onDelete: 'cascade' }),
  rucheId: uuid('ruche_id')
    .notNull()
    .references(() => ruches.id, { onDelete: 'cascade' }),
  inspectionId: uuid('inspection_id').references(() => interventions.id, { onDelete: 'set null' }),
  typeTraitement: text('type_traitement').notNull(),
  dosage: text('dosage'),
  dateDebut: timestamp('date_debut', { withTimezone: true }).notNull(),
  dateFinPrevue: timestamp('date_fin_prevue', { withTimezone: true }),
  dateFinReelle: timestamp('date_fin_reelle', { withTimezone: true }),
  numeroLotProduit: text('numero_lot_produit').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

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
    .references(() => ruches.id),
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
    .references(() => ruches.id),
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
    .references(() => ruches.id),
  inspectionId: uuid('inspection_id').references(() => interventions.id, { onDelete: 'set null' }),
  dateEssaimage: timestamp('date_essaimage', { withTimezone: true }).notNull(),
  essaimRecupere: boolean('essaim_recupere').notNull(),
  rucheDestinationId: uuid('ruche_destination_id').references(() => ruches.id),
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
    .references(() => ruches.id),
  rucheDestinationId: uuid('ruche_destination_id')
    .notNull()
    .references(() => ruches.id),
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
