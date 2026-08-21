/**
 * Réaction des alvéoles au curseur : le calcul, isolé pour être tenu.
 *
 * Il vit à part du composant parce qu'il a produit DEUX défauts visibles, et
 * qu'aucun des deux ne se voyait à la lecture — seulement à la main, sur la
 * page d'accueil, et à ce moment-là on dit « ça ne ressemble à rien » sans
 * pouvoir nommer ce qui cloche.
 *
 * Tout est exprimé dans le repère du viewBox (0→24), jamais en pixels d'écran :
 * la mark est posée à 26 px dans un fil d'ariane et à 260 px sur la landing, et
 * la physique doit être la même aux deux tailles.
 */

/**
 * Amplitude du jeu d'échelle entre alvéoles.
 *
 * ⚠️ CE N'EST PAS UN GONFLEMENT ABSOLU, et la nuance est toute la correction.
 *
 * Le rayon N'A PAS DE PLACE pour grossir. Au repos, deux alvéoles voisines sont
 * séparées de 0,945 unité et leur bord extérieur est déjà DANS le trait de
 * l'hexagone de fond. Un gonflement uniforme de 34 % — ce qu'il y avait ici —
 * les faisait déborder de 1,1 unité et se chevaucher de 2,8. Vu à l'écran :
 * « les alvéoles sont trop grosses, elles se chevauchent et sortent ».
 *
 * On applique donc l'écart à la MOYENNE des influences : l'alvéole visée gagne
 * exactement ce que ses voisines cèdent, et l'encombrement total du rayon ne
 * bouge pas. Le geste devient celui d'un nid d'abeilles qui fléchit, plutôt que
 * d'un logo qui enfle.
 *
 * 0,18 est le maximum admissible, trouvé en balayant le curseur sur une grille
 * dense : au delà, une paire finit toujours par se toucher quelque part.
 */
export const AMPLITUDE = 0.18;

/** Portée de l'influence, en unités du viewBox. */
export const RAYON = 6.5;

/**
 * Déplacement maximal d'une alvéole vers le curseur, en unités du viewBox.
 *
 * Même contrainte que l'amplitude : 1,05 déplaçait une alvéole d'un sixième de
 * l'entraxe et suffisait à lui seul à provoquer le chevauchement. 0,18 tient
 * dans l'écart disponible avec de la marge.
 */
export const MAGNETISME = 0.18;

/** En deçà, on rend la main au scintillement plutôt que de figer le rayon. */
export const SEUIL_REPOS = 0.03;

/**
 * Cloche gaussienne : 1 au contact, décroissance douce, ~0 au-delà de la portée.
 */
export function influenceA(distance: number): number {
  return Math.exp(-((distance / RAYON) ** 2));
}

/**
 * Distance à laquelle l'attirance est la plus forte, et sa valeur brute.
 *
 * Le produit `d × influence(d)` s'annule aux deux bouts — pas d'attirance quand
 * on est dessus, plus d'attirance quand on est loin — et culmine entre les
 * deux, à `RAYON / √2`. On normalise par ce pic pour que `MAGNETISME` se lise
 * comme ce qu'il est : le déplacement maximal, en unités du viewBox.
 */
const DISTANCE_PIC = RAYON / Math.SQRT2;
const PIC = DISTANCE_PIC * influenceA(DISTANCE_PIC);

/**
 * Déplacement d'une alvéole vers le curseur.
 *
 * ⚠️ ON MULTIPLIE PAR LE VECTEUR, PAS PAR SA DIRECTION.
 *
 * La version précédente normalisait : `(dx / d) × MAGNETISME × influence`. Le
 * quotient `dx / d` reste de norme 1 quelle que soit la distance — y compris
 * quand elle tend vers zéro. Résultat : au moment précis où le curseur arrive
 * SUR le centre d'une alvéole, l'influence vaut 1, la direction vaut toujours 1,
 * et l'alvéole se déplace du magnétisme MAXIMAL — 1,05 unité, soit une douzaine
 * de pixels à la taille de la landing. Pire, la direction bascule d'un bord à
 * l'autre au moindre sous-pixel : l'alvéole tremble exactement là où l'on vise.
 *
 * Mesuré avant correction : curseur pile au centre du rayon, l'alvéole centrale
 * gonflait bien… en se déplaçant de 11,8 px. Elle ne devait pas bouger du tout.
 *
 * En gardant le vecteur, l'attirance s'annule d'elle-même au centre : il n'y a
 * plus de direction à suivre quand on y est déjà.
 */
export function deplacementVers(dx: number, dy: number, influence: number): [number, number] {
  const facteur = (MAGNETISME / PIC) * influence;
  return [dx * facteur, dy * facteur];
}

/**
 * Échelles des sept alvéoles, à partir de leurs influences.
 *
 * Chacune s'écarte de la MOYENNE, jamais de 1 : la somme des écarts est nulle,
 * donc ce qu'une alvéole prend, les autres le rendent. C'est ce qui garantit
 * que le rayon ne déborde jamais de son hexagone, quelle que soit la position
 * du curseur — propriété qu'aucun réglage de gonflement absolu ne peut offrir,
 * la géométrie du logo ne laissant que 0,945 unité entre deux voisines.
 *
 * Curseur loin : toutes les influences valent ~0, la moyenne aussi, toutes les
 * échelles reviennent à 1. Le repos est donc exact, pas approché.
 */
export function echellesDepuisInfluences(influences: number[]): number[] {
  if (influences.length === 0) return [];
  const moyenne = influences.reduce((t, v) => t + v, 0) / influences.length;
  return influences.map((i) => 1 + AMPLITUDE * (i - moyenne));
}
