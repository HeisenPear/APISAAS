// ─── Catégories d'intervention Phase 2 ──────────────────

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

// ─── Metadata par catégorie ─────────────────────────────

export interface CategorieMeta {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
}

export const CATEGORIES_META: Record<CategorieIntervention, CategorieMeta> = {
  materiel: {
    label: 'Matériel',
    icon: 'i-lucide-wrench',
    color: 'stone-500',
    bgColor: 'bg-stone-100',
    textColor: 'text-stone-600',
    description: 'Ajouter ou retirer du matériel',
  },
  controle: {
    label: 'Contrôle',
    icon: 'i-lucide-search',
    color: 'blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    description: 'Inspection de la colonie',
  },
  recolte: {
    label: 'Récolte',
    icon: 'i-lucide-droplets',
    color: 'amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    description: 'Enregistrer une récolte',
  },
  nourrissement: {
    label: 'Nourrissement',
    icon: 'i-lucide-utensils',
    color: 'orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    description: 'Nourrir la colonie',
  },
  essaimage: {
    label: 'Essaimage naturel',
    icon: 'i-lucide-wind',
    color: 'yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
    description: 'Essaim parti naturellement',
  },
  division: {
    label: 'Essaim artificiel',
    icon: 'i-lucide-scissors',
    color: 'purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    description: 'Diviser la colonie',
  },
  deplacement: {
    label: 'Déplacer',
    icon: 'i-lucide-truck',
    color: 'green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    description: 'Changer de rucher',
  },
  varroa: {
    label: 'Varroa',
    icon: 'i-lucide-bug',
    color: 'red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    description: 'Comptage ou traitement',
  },
  pesee: {
    label: 'Pesée',
    icon: 'i-lucide-scale',
    color: 'sky-500',
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-600',
    description: 'Peser la ruche',
  },
  commentaire: {
    label: 'Commentaire',
    icon: 'i-lucide-message-square',
    color: 'stone-400',
    bgColor: 'bg-stone-50',
    textColor: 'text-stone-500',
    description: 'Note libre',
  },
  empilement: {
    label: 'Empiler',
    icon: 'i-lucide-layers',
    color: 'indigo-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    description: 'Fusionner deux colonies',
  },
  sanitaire: {
    label: 'Sanitaire',
    icon: 'i-lucide-heart-pulse',
    color: 'rose-500',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-600',
    description: 'Mortalité et nettoyage',
  },
  transvasement: {
    label: 'Transvasement',
    icon: 'i-lucide-repeat',
    color: 'teal-500',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-600',
    description: "Changer l'essaim de ruche",
  },
};

// ─── Compatibilité legacy (pages existantes) ───────────

/** @deprecated Utiliser CATEGORIES_META */
export const INTERVENTION_META = CATEGORIES_META;
/** @deprecated Utiliser CATEGORIES_INTERVENTION */
export const TYPES_INTERVENTION = CATEGORIES_INTERVENTION;
/** @deprecated Utiliser CategorieIntervention */
export type TypeIntervention = CategorieIntervention;
/** @deprecated Payload JSONB n'est plus utilisé en Phase 2 */
export type DonneesIntervention = Record<string, unknown>;
/** @deprecated Utiliser CategorieMeta */
export type InterventionMeta = CategorieMeta & { type: string };

// ─── Legacy Donnees* types (utilisés par les Form*.vue actuels, seront supprimés au Rush 5)

/** @deprecated Sera remplacé par FormMaterielData */
export interface DonneesMateriel {
  action: 'ajout' | 'retrait' | 'remplacement';
  elements: Array<{ type: string; quantite: number }>;
}

/** @deprecated Sera remplacé par FormControleData */
export interface DonneesControle {
  reine_vue: boolean | null;
  couvain_present: boolean | null;
  cellules_royales: boolean | null;
  reserves_presentes: boolean | null;
  force_colonie: 1 | 2 | 3 | 4;
  comportement: 'calme' | 'agitee' | 'agressive';
}

/** @deprecated Sera remplacé par FormRecolteData */
export interface DonneesRecolte {
  type_produit: 'miel' | 'pollen' | 'propolis';
  quantite: number;
  unite: 'kg' | 'g' | 'litres';
  type_miel?: string;
  taux_humidite?: number;
  numero_lot: string;
  notes_qualite?: string;
}

/** @deprecated Sera remplacé par FormNourrissementData */
export interface DonneesNourrissement {
  type_nourriture: 'sirop_sucre' | 'sirop_glucose' | 'candi' | 'pate_proteique' | 'miel' | 'autre';
  quantite: number;
  unite: 'kg' | 'g' | 'litres' | 'ml';
  concentration?: string;
}

/** @deprecated */
export interface DonneesEssaimage {
  essaim_recupere: boolean;
  ruche_destination_id?: string;
  nouvelle_ruche?: boolean;
  localisation_recuperation?: string;
}

/** @deprecated */
export interface DonneesDivision {
  nombre_divisions: number;
  ruches_destination_ids: string[];
  cadres_par_division: number;
  reine_dans_division: boolean;
}

/** @deprecated */
export interface DonneesDeplacement {
  rucher_destination_id: string;
  emplacement?: string;
  motif: 'transhumance' | 'reorganisation' | 'vente' | 'autre';
  date_retour_prevue?: string;
}

/** @deprecated */
export interface DonneesVarroa {
  sous_action: 'comptage_plancher' | 'traitement' | 'suppression_couvain_male' | 'comptage_vph';
  nombre_varroas?: number;
  duree_comptage_jours?: number;
  chute_par_jour?: number;
  type_traitement?: string;
  dosage?: string;
  date_debut?: string;
  date_fin_prevue?: string;
  numero_lot_produit?: string;
  nombre_cadres_retires?: number;
  nombre_abeilles_echantillon?: number;
  taux_vph?: number;
}

/** @deprecated */
export interface DonneesPesee {
  poids_kg: number;
  type_pesee: 'totale' | 'cote_droit' | 'cote_gauche' | 'arriere';
  poids_estime_total?: number;
  variation_kg?: number;
}

/** @deprecated */
export interface DonneesCommentaire {
  texte?: string;
  tags?: string[];
}

/** @deprecated */
export interface DonneesEmpilement {
  ruche_destination_id: string;
  methode_reunion: 'papier_journal' | 'directe' | 'autre';
  devenir_ruche_source: 'stockage' | 'destruction' | 'reutilisation';
}

/** @deprecated */
export interface DonneesSanitaire {
  sous_action: 'essaim_mort' | 'nettoyer_ruche' | 'nettoyer_plancher' | 'retrait_couvain';
  cause_probable?: string;
  declaration_gdsa?: boolean;
  type_nettoyage?: string;
  produit_utilise?: string;
  type_couvain?: string;
  nombre_cadres?: number;
}

/** @deprecated */
export interface DonneesTransvasement {
  ruche_destination_id: string;
  cadres_transferes: number;
  devenir_ruche_source: 'stockage' | 'destruction' | 'reutilisation_immediate';
  lieu_stockage_id?: string;
  origine: 'sauvage' | 'transvasement' | 'recuperation_particulier' | 'achat' | 'autre';
}

/** @deprecated Hors scope Phase 2 */
export interface DonneesRendezVousPro {
  type_rdv: string;
  statut: 'planifie' | 'realise' | 'annule';
  interlocuteur?: string;
  lieu?: string;
  notes?: string;
}

/** @deprecated Hors scope Phase 2 */
export interface DonneesReine {
  sous_action: 'marquage' | 'changement' | 'perte' | 'evaluation';
  couleur?: string;
  annee_marquage?: number;
  clippage?: boolean;
  origine?: string;
  race?: string;
  fournisseur?: string;
  prix?: number;
  date_introduction?: string;
  action_orpheline?: string;
  qualite_ponte?: number;
  douceur?: number;
  prolificite?: number;
}

// ─── Éléments matériel ──────────────────────────────────

export const ELEMENTS_MATERIEL = [
  'cadres',
  'cadres_male',
  'partitions',
  'nourrisseurs',
  'corps',
  'hausses',
  'grille_reine',
  'grille_propolis',
  'trappe_pollen',
] as const;

export type ElementMateriel = (typeof ELEMENTS_MATERIEL)[number];

export const ELEMENTS_MATERIEL_LABELS: Record<ElementMateriel, string> = {
  cadres: 'Cadres',
  cadres_male: 'Cadres mâles',
  partitions: 'Partitions',
  nourrisseurs: 'Nourrisseurs',
  corps: 'Corps',
  hausses: 'Hausses',
  grille_reine: 'Grille à reine',
  grille_propolis: 'Grille à propolis',
  trappe_pollen: 'Trappe à pollen',
};

// ─── Types nourrissement ────────────────────────────────

export const TYPES_NOURRISSEMENT = [
  'sirop_sucre',
  'sirop_glucose',
  'candi',
  'pate_proteique',
  'miel',
  'autre',
] as const;

export type TypeNourrissement = (typeof TYPES_NOURRISSEMENT)[number];

export const TYPES_NOURRISSEMENT_LABELS: Record<TypeNourrissement, string> = {
  sirop_sucre: 'Sirop de sucre',
  sirop_glucose: 'Sirop de glucose',
  candi: 'Candi',
  pate_proteique: 'Pâte protéique',
  miel: 'Miel',
  autre: 'Autre',
};

// ─── Sous-actions varroa ────────────────────────────────

export const SOUS_ACTIONS_VARROA = [
  'comptage_plancher',
  'traitement',
  'suppression_couvain',
  'vph',
] as const;

export type SousActionVarroa = (typeof SOUS_ACTIONS_VARROA)[number];

export const SOUS_ACTIONS_VARROA_META: Record<SousActionVarroa, { label: string; icon: string }> = {
  comptage_plancher: { label: 'Comptage plancher', icon: 'i-lucide-clipboard-list' },
  traitement: { label: 'Traitement', icon: 'i-lucide-syringe' },
  suppression_couvain: { label: 'Suppression couvain', icon: 'i-lucide-scissors' },
  vph: { label: 'VPH (lavage)', icon: 'i-lucide-flask-conical' },
};

// ─── Types événements sanitaires ────────────────────────

export const TYPES_EVENEMENT_SANITAIRE = [
  'essaim_mort',
  'nettoyer_ruche',
  'nettoyer_plancher',
  'retrait_couvain',
] as const;

export type TypeEvenementSanitaire = (typeof TYPES_EVENEMENT_SANITAIRE)[number];

export const TYPES_EVENEMENT_SANITAIRE_LABELS: Record<TypeEvenementSanitaire, string> = {
  essaim_mort: 'Essaim mort',
  nettoyer_ruche: 'Nettoyer la ruche',
  nettoyer_plancher: 'Nettoyer le plancher',
  retrait_couvain: 'Retrait de couvain',
};

// ─── Données formulaires par catégorie ──────────────────

export interface FormMaterielData {
  elements: Array<{ element: ElementMateriel; quantite: number }>;
}

export interface FormControleData {
  reineVue: boolean | null;
  couvainPresent: boolean | null;
  celluleRoyale: boolean | null;
  reserves: boolean | null;
  forceColonie: 1 | 2 | 3 | 4;
  comportement: 'calme' | 'agitee' | 'agressive';
}

export interface FormRecolteData {
  typeProduit: 'miel' | 'pollen' | 'propolis';
}

export interface FormNourrissementData {
  type: TypeNourrissement;
  quantite: number;
  unite: 'kg' | 'g' | 'litres' | 'ml';
}

export interface FormEssaimageData {
  essaimRecupere: boolean;
}

export interface FormDivisionData {
  nombreDivisions: number;
}

export interface FormDeplacementData {
  rucherDestinationId: string;
}

export interface FormVarroaData {
  sousAction: SousActionVarroa;
  // Comptage plancher
  nombreVarroas?: number;
  dureeJours?: number;
  // Traitement
  typeTraitement?: string;
  dateDebut?: string;
  numeroLotProduit?: string;
  dosage?: string;
  dateFinPrevue?: string;
  // Suppression couvain
  nombreCadres?: number;
  // VPH
  nombreAbeilles?: number;
}

export interface FormPeseeData {
  poidsKg: number;
  typePesee: 'totale' | 'cote_droit' | 'cote_gauche' | 'arriere';
}

export interface FormCommentaireData {
  texte: string;
}

export interface FormEmpilementData {
  rucheDestinationId: string;
}

export interface FormSanitaireData {
  typeEvenement: TypeEvenementSanitaire;
  causeProbable?: string;
  declarationGdsa?: boolean;
  typeNettoyage?: string;
  produitUtilise?: string;
  typeCouvain?: string;
  nombreCadres?: number;
}

export interface FormTransvasementData {
  rucheDestinationId: string;
  cadresTransferes: number;
  devenirRucheSource: 'stockage' | 'destruction' | 'reutilisation' | 'reutilisation_immediate';
  lieuStockage?: string;
}

// ─── Payload bulk API ───────────────────────────────────

export interface BulkInterventionPayload {
  rucheId: string;
  dateVisite: string;
  dureeMinutes?: number;
  notes?: string;
  photos?: string[];
  meteo?: {
    temperature?: number;
    vent?: string;
    ciel?: string;
    humidite?: number;
    conditions?: string;
  };
  categories: {
    materiel?: FormMaterielData;
    controle?: FormControleData;
    recolte?: FormRecolteData;
    nourrissement?: FormNourrissementData;
    essaimage?: FormEssaimageData;
    division?: FormDivisionData;
    deplacement?: FormDeplacementData;
    varroa?: FormVarroaData;
    pesee?: FormPeseeData;
    commentaire?: FormCommentaireData;
    empilement?: FormEmpilementData;
    sanitaire?: FormSanitaireData;
    transvasement?: FormTransvasementData;
  };
}

export interface BulkGroupInterventionPayload {
  rucheIds: string[];
  dateVisite?: string;
  dureeMinutes?: number;
  notes?: string;
  meteo?: {
    temperature?: number;
    vent?: string;
    ciel?: string;
    humidite?: number;
    conditions?: string;
  };
  categories: Record<string, Record<string, unknown>>;
}

// ─── Intervention complète (API response) ───────────────

export interface Intervention {
  id: string;
  userId: string;
  rucheId: string;
  rucherId: string | null;
  dateVisite: string;
  type: string | null;
  categoriesActivees: CategorieIntervention[];
  meteo?: {
    temperature?: number;
    vent?: string;
    ciel?: string;
    humidite?: number;
    conditions?: string;
  } | null;
  // Contrôle (colonnes directes)
  forceColonie?: number | null;
  couvain?: number | null;
  couvainPresent?: boolean | null;
  reserves?: number | null;
  comportement?: string | null;
  reineVue?: boolean | null;
  celluleRoyale?: boolean | null;
  signeEssaimage?: boolean | null;
  // Nourrissement (colonnes directes)
  nourrissementType?: string | null;
  nourrissementQuantite?: string | null;
  nourrissementUnite?: string | null;
  // Général
  notes?: string | null;
  photos?: string[];
  dureeMinutes?: number | null;
  donnees?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterventionWithContext extends Intervention {
  rucheNumero?: string;
  rucherNom?: string;
  ruche?: { id: string; numero: string; type: string; statut: string; rucherId: string };
  rucher?: { id: string; nom: string; commune: string | null };
}
