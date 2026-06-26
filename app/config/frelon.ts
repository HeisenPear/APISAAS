// Surveillance frelon (inspiré de GeoNest / Pollinis) — métadonnées partagées
// client + serveur (libellés, couleurs, options de formulaire).

export type FrelonEspece = 'asiatique' | 'europeen' | 'indetermine';
export type FrelonType = 'nid_primaire' | 'nid_secondaire' | 'individu' | 'piege';
export type FrelonStatut = 'signale' | 'confirme' | 'detruit';

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
  { value: 'signale', label: 'Signalé', description: 'À vérifier', couleur: '#f59e0b' },
  { value: 'confirme', label: 'Confirmé', description: 'Présence avérée', couleur: '#dc2626' },
  { value: 'detruit', label: 'Détruit', description: 'Neutralisé', couleur: '#16a34a' },
] as const;

const find = <T extends string>(opts: readonly FrelonOption<T>[], v: string) =>
  opts.find((o) => o.value === v);

export const labelEspece = (v: string) => find(FRELON_ESPECES, v)?.label ?? v;
export const labelType = (v: string) => find(FRELON_TYPES, v)?.label ?? v;
export const labelStatut = (v: string) => find(FRELON_STATUTS, v)?.label ?? v;
export const couleurStatut = (v: string) => find(FRELON_STATUTS, v)?.couleur ?? '#a8a29e';
export const couleurType = (v: string) => find(FRELON_TYPES, v)?.couleur ?? '#a8a29e';
