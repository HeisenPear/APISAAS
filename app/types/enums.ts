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

/**
 * Catégories de produits apicoles pour la facturation — TVA française
 * 5,5% : Art. 278-0 bis A CGI | 10% : Art. 278 bis CGI | 20% : Art. 278 CGI
 */
export const CATEGORIE_VENTE = [
  'miel',
  'gelee_royale',
  'pollen',
  'propolis_alimentaire',
  'pain_abeille',
  'cire_alimentaire',
  'vinaigre_miel',
  'essaim',
  'reine',
  'ruche_peuplee',
  'nourrissement',
  'traitement_veterinaire',
  'materiel_apicole',
  'equipement_apiculteur',
  'cire_technique',
  'conditionnement',
  'hydromel',
  'propolis_teinture',
  'cosmetique',
  'autre',
] as const;
export type CategorieVente = (typeof CATEGORIE_VENTE)[number];

/** TVA par catégorie de vente (droit fiscal français) */
export const TVA_PAR_CATEGORIE_VENTE: Record<CategorieVente, number> = {
  // 5,5% — Produits alimentaires (Art. 278-0 bis A CGI)
  miel: 5.5,
  gelee_royale: 5.5,
  pollen: 5.5,
  propolis_alimentaire: 5.5,
  pain_abeille: 5.5,
  cire_alimentaire: 5.5,
  vinaigre_miel: 5.5,
  // 10% — Animaux vivants + médicaments vétérinaires (Art. 278 bis CGI)
  essaim: 10,
  reine: 10,
  ruche_peuplee: 10,
  nourrissement: 10,
  traitement_veterinaire: 10,
  // 20% — Taux normal (Art. 278 CGI)
  materiel_apicole: 20,
  equipement_apiculteur: 20,
  cire_technique: 20,
  conditionnement: 20,
  hydromel: 20,
  propolis_teinture: 20,
  cosmetique: 20,
  autre: 20,
};

export const TYPE_TRANSACTION = ['vente', 'achat'] as const;
export type TypeTransaction = (typeof TYPE_TRANSACTION)[number];

export const STATUT_FACTURE = ['brouillon', 'envoyee', 'payee', 'en_retard', 'annulee'] as const;
export type StatutFacture = (typeof STATUT_FACTURE)[number];

export const PLAN = ['decouverte', 'starter', 'pro', 'expert'] as const;
export type Plan = (typeof PLAN)[number];
