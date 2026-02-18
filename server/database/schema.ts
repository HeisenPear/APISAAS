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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Inspections / Interventions */
export const inspections = pgTable('inspections', {
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
  dateRecolte: timestamp('date_recolte', { withTimezone: true }).notNull(),
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
// RELATIONS
// ─────────────────────────────────────────────

export const profilsRelations = relations(profils, ({ many }) => ({
  ruchers: many(ruchers),
  ruches: many(ruches),
  inspections: many(inspections),
  recoltes: many(recoltes),
  stocks: many(stocks),
  mouvementsStock: many(mouvementsStock),
  clients: many(clients),
  transactions: many(transactions),
  alertes: many(alertes),
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
  inspections: many(inspections),
  recoltes: many(recoltes),
}));

export const inspectionsRelations = relations(inspections, ({ one }) => ({
  user: one(profils, {
    fields: [inspections.userId],
    references: [profils.id],
  }),
  ruche: one(ruches, {
    fields: [inspections.rucheId],
    references: [ruches.id],
  }),
  rucher: one(ruchers, {
    fields: [inspections.rucherId],
    references: [ruchers.id],
  }),
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
