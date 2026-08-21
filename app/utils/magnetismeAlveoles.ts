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

/** Gonflement maximal d'une alvéole, juste sous le curseur. */
export const AMPLITUDE = 0.34;

/** Portée de l'influence, en unités du viewBox. */
export const RAYON = 6.5;

/** Déplacement maximal d'une alvéole vers le curseur, en unités du viewBox. */
export const MAGNETISME = 1.05;

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
