/**
 * Scène épinglée : le sujet reste fixe pendant que le récit avance.
 *
 * C'est le geste des pages produit d'Apple, et il n'a rien de sorcier. Un
 * conteneur très haut, un enfant en `position: sticky` : l'enfant se fige au
 * milieu de l'écran, et le défilement continue de courir DERRIÈRE lui. Il ne
 * reste plus qu'à savoir où l'on en est dans cette course — c'est tout ce que
 * ce fichier calcule.
 *
 * Le calcul vit ici, séparé du composant, parce que ses deux modes de panne
 * sont silencieux : une progression qui sature trop tôt fige le récit sur la
 * dernière étape pendant un écran entier, et un découpage mal borné fait
 * clignoter une étape fantôme au moment exact où l'on atteint le bas. Ni l'un
 * ni l'autre ne lève quoi que ce soit dans la console.
 */

/** Ramène une valeur dans [min, max]. */
function borner(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Où en est-on dans l'épinglage, de 0 (il commence) à 1 (il se termine) ?
 *
 * `haut` est le `getBoundingClientRect().top` du CONTENEUR, donc négatif dès
 * qu'on est entré dedans. La course utile n'est pas la hauteur du conteneur
 * mais `hauteur - champ` : quand son bas atteint le bas de l'écran, l'enfant
 * collant se décolle et la scène est finie.
 */
export function progressionScene(haut: number, hauteur: number, champ: number): number {
  const course = hauteur - champ;
  if (course <= 0) return 0;
  return borner(-haut / course, 0, 1);
}

/**
 * Quelle étape est active, sur `nombre` étapes réparties également ?
 *
 * ⚠️ LE CAS QUI COMPTE EST progression = 1. Un `Math.floor(1 * 4)` rend 4,
 * c'est-à-dire une cinquième étape sur quatre : le composant afficherait du
 * vide au dernier pixel de la scène. On borne donc au dernier rang.
 */
export function etapeActive(progression: number, nombre: number): number {
  if (nombre <= 0) return 0;
  const brut = Math.floor(borner(progression, 0, 1) * nombre);
  return borner(brut, 0, nombre - 1);
}

/**
 * Progression LOCALE à l'étape courante, de 0 à 1.
 *
 * Sert aux mouvements internes d'une étape — un texte qui finit d'arriver, une
 * jauge qui se remplit — sans lier le composant à l'arithmétique des bornes.
 */
export function progressionEtape(progression: number, nombre: number): number {
  if (nombre <= 0) return 0;
  const p = borner(progression, 0, 1);
  const rang = etapeActive(p, nombre);
  return borner(p * nombre - rang, 0, 1);
}
