// Surveillance frelon COMMUNAUTAIRE (inspiré de GeoNest / Pollinis + validation
// type Waze) — métadonnées partagées client + serveur.

export type FrelonEspece = 'asiatique' | 'europeen' | 'indetermine';
export type FrelonType = 'nid_primaire' | 'nid_secondaire' | 'individu' | 'piege';
/** Cycle de vie communautaire d'un signalement. */
export type FrelonStatut = 'a_verifier' | 'confirme' | 'rejete' | 'detruit';
/** Vote d'un membre de la communauté sur un signalement. */
export type FrelonVote = 'confirme' | 'infirme' | 'detruit';
/** Quantité de frelons observés (pression de prédation). */
export type FrelonPression = 'faible' | 'modere' | 'fort' | 'infestation';
/** Niveau d'alerte agrégé par rucher (proximité × pression). */
export type NiveauMenace = 'aucun' | 'faible' | 'modere' | 'fort' | 'infestation';

export interface FrelonOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  couleur: string;
}

export const FRELON_ESPECES: readonly FrelonOption<FrelonEspece>[] = [
  {
    value: 'asiatique',
    label: 'Frelon asiatique (Vespa velutina)',
    description: 'Prédateur des abeilles — pattes jaunes, thorax noir',
    couleur: '#b45309',
  },
  {
    value: 'europeen',
    label: 'Frelon européen (Vespa crabro)',
    description: 'Espèce protégée, peu agressive envers les ruches',
    couleur: '#a8732a',
  },
  { value: 'indetermine', label: 'Indéterminé', couleur: '#a8a29e' },
] as const;

export const FRELON_TYPES: readonly FrelonOption<FrelonType>[] = [
  {
    value: 'nid_primaire',
    label: 'Nid primaire',
    description: 'Petit nid de printemps (≈ balle de tennis), bas et accessible',
    couleur: '#f59e0b',
  },
  {
    value: 'nid_secondaire',
    label: 'Nid secondaire',
    description: "Gros nid d'été/automne, souvent en hauteur dans un arbre",
    couleur: '#b45309',
  },
  {
    value: 'individu',
    label: 'Individu(s)',
    description: 'Frelons observés en chasse devant les ruches',
    couleur: '#d97706',
  },
  {
    value: 'piege',
    label: 'Piège',
    description: 'Piège de surveillance/sélectif posé',
    couleur: '#7a9676',
  },
] as const;

export const FRELON_STATUTS: readonly FrelonOption<FrelonStatut>[] = [
  {
    value: 'a_verifier',
    label: 'À vérifier',
    description: 'En attente de confirmations',
    couleur: '#f59e0b',
  },
  {
    value: 'confirme',
    label: 'Confirmé',
    description: 'Validé par la communauté',
    couleur: '#dc2626',
  },
  { value: 'detruit', label: 'Détruit', description: 'Neutralisé', couleur: '#16a34a' },
  {
    value: 'rejete',
    label: 'Rejeté',
    description: 'Infirmé par la communauté',
    couleur: '#a8a29e',
  },
] as const;

export const FRELON_VOTES: readonly FrelonOption<FrelonVote>[] = [
  {
    value: 'confirme',
    label: 'Je confirme',
    description: 'Le nid est bien là',
    couleur: '#dc2626',
  },
  {
    value: 'infirme',
    label: 'Pas de nid ici',
    description: 'Signalement erroné',
    couleur: '#a8a29e',
  },
  {
    value: 'detruit',
    label: 'Détruit',
    description: 'Le nid a été neutralisé',
    couleur: '#16a34a',
  },
] as const;

export const FRELON_PRESSIONS: readonly FrelonOption<FrelonPression>[] = [
  {
    value: 'faible',
    label: 'Faible',
    description: 'Quelques individus isolés',
    couleur: '#7a9676',
  },
  { value: 'modere', label: 'Modérée', description: 'Présence régulière', couleur: '#f59e0b' },
  {
    value: 'fort',
    label: 'Forte',
    description: 'Prédation visible devant les ruches',
    couleur: '#d97706',
  },
  {
    value: 'infestation',
    label: 'Infestation',
    description: 'De nombreux frelons en continu',
    couleur: '#dc2626',
  },
] as const;

/** Métadonnées d'affichage du niveau d'alerte agrégé par rucher. */
export const NIVEAUX_MENACE: Record<NiveauMenace, { label: string; couleur: string }> = {
  aucun: { label: 'Aucune', couleur: '#a8a29e' },
  faible: { label: 'Faible', couleur: '#7a9676' },
  modere: { label: 'Modérée', couleur: '#f59e0b' },
  fort: { label: 'Forte', couleur: '#d97706' },
  infestation: { label: 'Infestation', couleur: '#dc2626' },
};

const find = <T extends string>(opts: readonly FrelonOption<T>[], v: string) =>
  opts.find((o) => o.value === v);

export const labelEspece = (v: string) => find(FRELON_ESPECES, v)?.label ?? v;
export const labelType = (v: string) => find(FRELON_TYPES, v)?.label ?? v;
export const labelStatut = (v: string) => find(FRELON_STATUTS, v)?.label ?? v;
export const couleurStatut = (v: string) => find(FRELON_STATUTS, v)?.couleur ?? '#a8a29e';
export const couleurType = (v: string) => find(FRELON_TYPES, v)?.couleur ?? '#a8a29e';
export const labelPression = (v: string) => find(FRELON_PRESSIONS, v)?.label ?? v;
export const couleurPression = (v: string) => find(FRELON_PRESSIONS, v)?.couleur ?? '#a8a29e';
