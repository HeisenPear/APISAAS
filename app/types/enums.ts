/**
 * Constantes d'enums utilisables cote client.
 *
 * Les valeurs sont identiques aux pgEnum du schema Drizzle
 * (server/database/schema.ts) mais reexportees en tant que
 * tableaux readonly TypeScript pour eviter tout import serveur.
 */

export const TYPE_RUCHE = [
  'dadant_10',
  'dadant_12',
  'langstroth',
  'warre',
  'voirnot',
  'kenyane',
  'autre',
] as const;
export type TypeRuche = (typeof TYPE_RUCHE)[number];

export const STATUT_COLONIE = [
  'active',
  'faible',
  'orpheline',
  'essaimee',
  'morte',
  'vendue',
  'fusionnee',
] as const;
export type StatutColonie = (typeof STATUT_COLONIE)[number];

export const QUALITE_REINE = [
  'excellente',
  'bonne',
  'moyenne',
  'faible',
  'absente',
  'inconnue',
] as const;
export type QualiteReine = (typeof QUALITE_REINE)[number];

export const RACE_ABEILLE = [
  'noire',
  'buckfast',
  'carnica',
  'italienne',
  'caucasienne',
  'hybride',
  'inconnue',
] as const;
export type RaceAbeille = (typeof RACE_ABEILLE)[number];

export const CATEGORIE_STOCK = [
  'cadres',
  'hausses',
  'corps',
  'nourrissement',
  'traitement',
  'conditionnement',
  'equipement',
  'outillage',
  'autre',
] as const;
export type CategorieStock = (typeof CATEGORIE_STOCK)[number];

export const TYPE_TRANSACTION = ['vente', 'achat'] as const;
export type TypeTransaction = (typeof TYPE_TRANSACTION)[number];

export const STATUT_FACTURE = ['brouillon', 'envoyee', 'payee', 'en_retard', 'annulee'] as const;
export type StatutFacture = (typeof STATUT_FACTURE)[number];

export const PLAN = ['decouverte', 'starter', 'pro', 'expert'] as const;
export type Plan = (typeof PLAN)[number];
