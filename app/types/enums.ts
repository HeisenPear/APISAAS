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
  // 5,5% — Alimentation animale (Art. 278-0 bis A CGI)
  nourrissement: 5.5,
  // 10% — Animaux vivants + médicaments vétérinaires (Art. 278 bis CGI)
  essaim: 10,
  reine: 10,
  ruche_peuplee: 10,
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

/**
 * Mapping unifié type de produit → catégorie stock + TVA.
 * Source unique de vérité pour le sélecteur visuel du formulaire stock.
 */
export interface TypeProduitItem {
  value: CategorieVente;
  label: string;
  catStock: CategorieStock;
  tva: number;
}

export interface TypeProduitGroup {
  group: string;
  icon: string;
  color: 'emerald' | 'blue' | 'stone';
  items: TypeProduitItem[];
}

export const TYPES_PRODUIT: TypeProduitGroup[] = [
  {
    group: 'Produits de la ruche',
    icon: 'i-lucide-droplets',
    color: 'emerald',
    items: [
      { value: 'miel', label: 'Miel', catStock: 'conditionnement', tva: 5.5 },
      { value: 'gelee_royale', label: 'Gelée royale', catStock: 'conditionnement', tva: 5.5 },
      { value: 'pollen', label: 'Pollen', catStock: 'conditionnement', tva: 5.5 },
      { value: 'propolis_alimentaire', label: 'Propolis', catStock: 'conditionnement', tva: 5.5 },
      { value: 'pain_abeille', label: "Pain d'abeille", catStock: 'conditionnement', tva: 5.5 },
      {
        value: 'cire_alimentaire',
        label: 'Cire alimentaire',
        catStock: 'conditionnement',
        tva: 5.5,
      },
      { value: 'vinaigre_miel', label: 'Vinaigre de miel', catStock: 'conditionnement', tva: 5.5 },
    ],
  },
  {
    group: 'Nourrissement',
    icon: 'i-lucide-candy',
    color: 'emerald',
    items: [
      { value: 'nourrissement', label: 'Nourrissement', catStock: 'nourrissement', tva: 5.5 },
    ],
  },
  {
    group: 'Élevage',
    icon: 'i-lucide-bug',
    color: 'blue',
    items: [
      { value: 'essaim', label: 'Essaim', catStock: 'autre', tva: 10 },
      { value: 'reine', label: 'Reine', catStock: 'autre', tva: 10 },
      { value: 'ruche_peuplee', label: 'Ruche peuplée', catStock: 'autre', tva: 10 },
    ],
  },
  {
    group: 'Traitements',
    icon: 'i-lucide-shield',
    color: 'blue',
    items: [
      {
        value: 'traitement_veterinaire',
        label: 'Traitement vétérinaire',
        catStock: 'traitement',
        tva: 10,
      },
    ],
  },
  {
    group: 'Ruches & Cadres',
    icon: 'i-lucide-box',
    color: 'stone',
    items: [
      { value: 'materiel_apicole', label: 'Cadres', catStock: 'cadres', tva: 20 },
      { value: 'materiel_apicole', label: 'Hausses', catStock: 'hausses', tva: 20 },
      { value: 'materiel_apicole', label: 'Corps de ruche', catStock: 'corps', tva: 20 },
    ],
  },
  {
    group: 'Équipement',
    icon: 'i-lucide-hard-hat',
    color: 'stone',
    items: [
      { value: 'materiel_apicole', label: 'Matériel apicole', catStock: 'equipement', tva: 20 },
      {
        value: 'equipement_apiculteur',
        label: 'Équipement apiculteur',
        catStock: 'equipement',
        tva: 20,
      },
    ],
  },
  {
    group: 'Conditionnement',
    icon: 'i-lucide-package',
    color: 'stone',
    items: [
      {
        value: 'conditionnement',
        label: 'Pots, étiquettes…',
        catStock: 'conditionnement',
        tva: 20,
      },
    ],
  },
  {
    group: 'Produits transformés',
    icon: 'i-lucide-flask-conical',
    color: 'stone',
    items: [
      { value: 'hydromel', label: 'Hydromel', catStock: 'conditionnement', tva: 20 },
      {
        value: 'propolis_teinture',
        label: 'Propolis teinture',
        catStock: 'conditionnement',
        tva: 20,
      },
      { value: 'cosmetique', label: 'Cosmétique', catStock: 'conditionnement', tva: 20 },
      { value: 'cire_technique', label: 'Cire technique', catStock: 'conditionnement', tva: 20 },
    ],
  },
  {
    group: 'Autre',
    icon: 'i-lucide-circle-dot',
    color: 'stone',
    items: [{ value: 'autre', label: 'Autre', catStock: 'autre', tva: 20 }],
  },
];

/** Famille de filtre pour le segmented control */
export type FamilleStock = 'tous' | 'produits' | 'elevage' | 'materiel';

/** Mapping catégorie vente → famille pour le filtre segmenté */
export const FAMILLE_PAR_CATEGORIE_VENTE: Record<CategorieVente, FamilleStock> = {
  miel: 'produits',
  gelee_royale: 'produits',
  pollen: 'produits',
  propolis_alimentaire: 'produits',
  pain_abeille: 'produits',
  cire_alimentaire: 'produits',
  vinaigre_miel: 'produits',
  nourrissement: 'produits',
  essaim: 'elevage',
  reine: 'elevage',
  ruche_peuplee: 'elevage',
  traitement_veterinaire: 'elevage',
  materiel_apicole: 'materiel',
  equipement_apiculteur: 'materiel',
  cire_technique: 'produits',
  conditionnement: 'materiel',
  hydromel: 'produits',
  propolis_teinture: 'produits',
  cosmetique: 'produits',
  autre: 'materiel',
};

export const TYPE_TRANSACTION = ['vente', 'achat'] as const;
export type TypeTransaction = (typeof TYPE_TRANSACTION)[number];

export const STATUT_FACTURE = ['brouillon', 'envoyee', 'payee', 'en_retard', 'annulee'] as const;
export type StatutFacture = (typeof STATUT_FACTURE)[number];

export const PLAN = ['decouverte', 'starter', 'pro', 'expert'] as const;
export type Plan = (typeof PLAN)[number];
