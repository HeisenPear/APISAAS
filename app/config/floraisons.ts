/**
 * Configuration partagée de la carte des floraisons collaborative.
 * Source unique des libellés/couleurs : la carte, la liste et le formulaire
 * lisent tous ici (comme `~/config/frelon` pour la carte des frelons).
 */

export type FloraisonStade = 'demarrage' | 'pleine' | 'fin' | 'terminee';
export type FloraisonIntensite = 'faible' | 'moyenne' | 'forte';

interface StadeMeta {
  value: FloraisonStade;
  label: string;
  /** Ce que l'apiculteur doit en faire — la carte sert à décider, pas à contempler. */
  conseil: string;
  couleur: string;
}

/** Ordonné dans le sens du cycle : c'est l'ordre affiché partout. */
export const STADES: StadeMeta[] = [
  {
    value: 'demarrage',
    label: 'Démarrage',
    conseil: 'Les premières fleurs s’ouvrent — préparez les hausses.',
    couleur: '#e0b34a',
  },
  {
    value: 'pleine',
    label: 'Pleine floraison',
    conseil: 'C’est maintenant que ça rentre — posez les hausses.',
    couleur: '#f5a623',
  },
  {
    value: 'fin',
    label: 'Fin de floraison',
    conseil: 'La miellée s’essouffle — pensez à la récolte.',
    couleur: '#b87959',
  },
  {
    value: 'terminee',
    label: 'Terminée',
    conseil: 'C’est fini sur ce secteur.',
    couleur: '#9c9689',
  },
];

const PAR_STADE = new Map(STADES.map((s) => [s.value, s]));

export function couleurStade(stade: FloraisonStade): string {
  return PAR_STADE.get(stade)?.couleur ?? '#9c9689';
}

export function labelStade(stade: FloraisonStade): string {
  return PAR_STADE.get(stade)?.label ?? stade;
}

export function conseilStade(stade: FloraisonStade): string {
  return PAR_STADE.get(stade)?.conseil ?? '';
}

export const INTENSITES: Array<{ value: FloraisonIntensite; label: string; poids: number }> = [
  { value: 'faible', label: 'Faible', poids: 1 },
  { value: 'moyenne', label: 'Moyenne', poids: 2 },
  { value: 'forte', label: 'Forte', poids: 3 },
];

export function labelIntensite(i: FloraisonIntensite | null): string {
  return INTENSITES.find((x) => x.value === i)?.label ?? '—';
}

/**
 * Emoji de repli quand l'espèce n'est pas au référentiel (saisie libre).
 * Reconnaissance par mot-clé, sans accent ni casse.
 */
const EMOJIS_PAR_MOT: Array<[RegExp, string]> = [
  [/colza/, '🌼'],
  [/acacia|robinier/, '🌳'],
  [/chataign|chatain/, '🌰'],
  [/tilleul/, '🌿'],
  [/tournesol/, '🌻'],
  [/lavande/, '💜'],
  [/bruyere/, '🌾'],
  [/sarrasin/, '🍯'],
  [/romarin|thym/, '🌿'],
  [/pissenlit/, '🌼'],
  [/saule/, '🌱'],
  [/noisetier/, '🌰'],
  [/erable/, '🍁'],
  [/aubepine|prunellier/, '🤍'],
  [/ronce|mure/, '🫐'],
  [/trefle/, '🍀'],
  [/verge.?d.?or|solidage/, '🌟'],
  [/lierre/, '🍃'],
  [/fruitier|pommier|cerisier|poirier/, '🌸'],
];

export function emojiEspece(espece: string, emojiReferentiel?: string | null): string {
  if (emojiReferentiel) return emojiReferentiel;
  const n = espece
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  for (const [motif, emoji] of EMOJIS_PAR_MOT) {
    if (motif.test(n)) return emoji;
  }
  return '🌸';
}
