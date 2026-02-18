// ─── Types d'intervention ────────────────────────────────
export const TYPES_INTERVENTION = [
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
  'reine',
] as const;

export type TypeIntervention = (typeof TYPES_INTERVENTION)[number];

// ─── Metadata par type ──────────────────────────────────
export interface InterventionMeta {
  type: TypeIntervention;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export const INTERVENTION_META: Record<TypeIntervention, InterventionMeta> = {
  materiel: {
    type: 'materiel',
    label: 'Materiel',
    icon: 'i-lucide-wrench',
    color: 'stone-500',
    bgColor: 'bg-stone-100',
    textColor: 'text-stone-600',
  },
  controle: {
    type: 'controle',
    label: 'Controle',
    icon: 'i-lucide-search',
    color: 'blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  recolte: {
    type: 'recolte',
    label: 'Recolte',
    icon: 'i-lucide-droplets',
    color: 'amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  nourrissement: {
    type: 'nourrissement',
    label: 'Nourrissement',
    icon: 'i-lucide-utensils',
    color: 'orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  essaimage: {
    type: 'essaimage',
    label: 'Essaimage',
    icon: 'i-lucide-wind',
    color: 'yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600',
  },
  division: {
    type: 'division',
    label: 'Division',
    icon: 'i-lucide-scissors',
    color: 'purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  deplacement: {
    type: 'deplacement',
    label: 'Deplacement',
    icon: 'i-lucide-truck',
    color: 'green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
  },
  varroa: {
    type: 'varroa',
    label: 'Varroa',
    icon: 'i-lucide-bug',
    color: 'red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
  },
  pesee: {
    type: 'pesee',
    label: 'Pesee',
    icon: 'i-lucide-scale',
    color: 'sky-500',
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-600',
  },
  commentaire: {
    type: 'commentaire',
    label: 'Commentaire',
    icon: 'i-lucide-message-square',
    color: 'stone-400',
    bgColor: 'bg-stone-50',
    textColor: 'text-stone-500',
  },
  empilement: {
    type: 'empilement',
    label: 'Empilement',
    icon: 'i-lucide-layers',
    color: 'indigo-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
  sanitaire: {
    type: 'sanitaire',
    label: 'Sanitaire',
    icon: 'i-lucide-heart-pulse',
    color: 'rose-500',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-600',
  },
  transvasement: {
    type: 'transvasement',
    label: 'Transvasement',
    icon: 'i-lucide-repeat',
    color: 'teal-500',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-600',
  },
  reine: {
    type: 'reine',
    label: 'Reine',
    icon: 'i-lucide-crown',
    color: 'amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
};

// ─── Donnees JSONB par type ─────────────────────────────

export interface DonneesMateriel {
  action: 'ajout' | 'retrait' | 'remplacement';
  elements: Array<{
    type: string;
    quantite: number;
  }>;
}

export interface DonneesControle {
  reine_vue: boolean | null;
  couvain_present: boolean | null;
  cellules_royales: boolean | null;
  reserves_presentes: boolean | null;
  force_colonie: 1 | 2 | 3 | 4;
  comportement: 'calme' | 'agitee' | 'agressive';
}

export interface DonneesRecolte {
  type_produit: 'miel' | 'pollen' | 'propolis';
  quantite: number;
  unite: 'kg' | 'g' | 'litres';
  type_miel?: string;
  taux_humidite?: number;
  numero_lot: string;
  notes_qualite?: string;
}

export interface DonneesNourrissement {
  type_nourriture: 'sirop_sucre' | 'sirop_glucose' | 'candi' | 'pate_proteique' | 'miel' | 'autre';
  quantite: number;
  unite: 'kg' | 'g' | 'litres' | 'ml';
  concentration?: string;
}

export interface DonneesEssaimage {
  essaim_recupere: boolean;
  ruche_destination_id?: string;
  nouvelle_ruche?: boolean;
  localisation_recuperation?: string;
}

export interface DonneesDivision {
  nombre_divisions: number;
  ruches_destination_ids: string[];
  cadres_par_division: number;
  reine_dans_division: boolean;
}

export interface DonneesDeplacement {
  rucher_destination_id: string;
  emplacement?: string;
  motif: 'transhumance' | 'reorganisation' | 'vente' | 'autre';
  date_retour_prevue?: string;
}

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

export interface DonneesPesee {
  poids_kg: number;
  type_pesee: 'totale' | 'cote_droit' | 'cote_gauche' | 'arriere';
  poids_estime_total?: number;
  variation_kg?: number;
}

export interface DonneesCommentaire {
  texte?: string;
  tags?: string[];
}

export interface DonneesEmpilement {
  ruche_destination_id: string;
  methode_reunion: 'papier_journal' | 'directe' | 'autre';
  devenir_ruche_source: 'stockage' | 'destruction' | 'reutilisation';
}

export interface DonneesSanitaire {
  sous_action: 'essaim_mort' | 'nettoyer_ruche' | 'nettoyer_plancher' | 'retrait_couvain';
  cause_probable?: string;
  declaration_gdsa?: boolean;
  type_nettoyage?: string;
  produit_utilise?: string;
  type_couvain?: string;
  nombre_cadres?: number;
}

export interface DonneesTransvasement {
  ruche_destination_id: string;
  cadres_transferes: number;
  devenir_ruche_source: 'stockage' | 'destruction' | 'reutilisation_immediate';
  lieu_stockage_id?: string;
  origine: 'sauvage' | 'transvasement' | 'recuperation_particulier' | 'achat' | 'autre';
}

export interface DonneesReine {
  sous_action: 'marquage' | 'changement' | 'perte' | 'evaluation';
  couleur?: 'blanc' | 'jaune' | 'rouge' | 'vert' | 'bleu';
  annee_marquage?: number;
  clippage?: boolean;
  origine?: string;
  race?: string;
  fournisseur?: string;
  prix?: number;
  date_introduction?: string;
  action_orpheline?: 'introduction_nouvelle' | 'reunion' | 'attente_cellule' | 'rien';
  qualite_ponte?: number;
  douceur?: number;
  prolificite?: number;
}

// ─── Union discriminee ──────────────────────────────────
export type DonneesIntervention =
  | DonneesMateriel
  | DonneesControle
  | DonneesRecolte
  | DonneesNourrissement
  | DonneesEssaimage
  | DonneesDivision
  | DonneesDeplacement
  | DonneesVarroa
  | DonneesPesee
  | DonneesCommentaire
  | DonneesEmpilement
  | DonneesSanitaire
  | DonneesTransvasement
  | DonneesReine;

// ─── Intervention complete ──────────────────────────────
export interface Intervention {
  id: string;
  userId: string;
  rucheId: string;
  rucherId: string | null;
  dateVisite: string;
  type: string;
  meteo?: {
    temperature?: number;
    vent?: string;
    ciel?: string;
    humidite?: number;
    conditions?: string;
  } | null;
  donnees: DonneesIntervention | null;
  commentaire?: string | null;
  photos?: string[];
  dureeMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterventionWithContext extends Intervention {
  rucheNumero?: string;
  rucherNom?: string;
  ruche?: { id: string; numero: string; type: string; statut: string; rucherId: string };
  rucher?: { id: string; nom: string; commune: string | null };
  // Legacy inspection fields
  forceColonie?: number | null;
  comportement?: string | null;
  reineVue?: boolean | null;
  reserves?: string | null;
}
