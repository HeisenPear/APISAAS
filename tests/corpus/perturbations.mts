// ═══════════════════════════════════════════════════════════════════════════
// LE PERTURBATEUR — mesurer L'ANTICIPATION, pas la répétition.
//
// ⚠️ LE DÉFAUT D'UN CORPUS ÉCRIT À LA MAIN EST QU'IL SE MESURE LUI-MÊME.
//
// Cent-deux questions rédigées par la même personne, qui connaît le moteur,
// finissent par ressembler à ce que le moteur sait déjà lire. Le score monte,
// la capacité ne bouge pas — et personne ne peut le voir, puisque l'instrument
// et l'objet mesuré ont la même origine.
//
// Or de vrais apiculteurs n'écrivent pas comme ça. Ils tapent d'un pouce sur un
// téléphone, au rucher, gants aux mains : sans accents, sans ponctuation, avec
// une lettre en trop, en coupant la phrase, en tutoyant, en criant en
// majuscules. Ces variations n'ont RIEN d'exotique — elles sont le cas normal.
//
// Chaque transformation ci-dessous est DÉTERMINISTE : elle s'applique aux 102
// questions et produit autant de mesures nouvelles, gratuitement, qu'aucune
// main n'a écrites. C'est ce qui les rend honnêtes : on ne peut pas les
// « optimiser » sans améliorer vraiment la robustesse.
//
// DEUX RÉGIMES, ET LA DISTINCTION EST TOUT :
//
//  · PRÉSERVE LE SENS — retirer les accents ne change pas ce qui est demandé.
//    Cliquet à 100 % : la moindre perte est une régression, pas une nuance.
//  · ÉRODE LE SENS — tronquer une phrase à la moitié en retire une partie.
//    On ne peut pas exiger 100 % : on MESURE, et le cliquet tient le niveau
//    atteint. Prétendre le contraire produirait un banc qu'on désactive.
// ═══════════════════════════════════════════════════════════════════════════

export interface Perturbation {
  nom: string;
  /** Le sens survit-il à la transformation ? Décide du régime de cliquet. */
  preserveLeSens: boolean;
  /** Pourquoi de vraies personnes écrivent comme ça. */
  pourquoi: string;
  appliquer: (q: string) => string;
}

/** Enlève les accents — le clavier de téléphone, ou la flemme. */
const sansAccents = (q: string): string => q.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Intervertit deux lettres voisines au milieu du mot le plus long.
 *
 * ⚠️ DÉTERMINISTE PAR CONSTRUCTION : on choisit le mot le plus long (et, à
 * égalité, le premier), et la position exacte du milieu. Aucun tirage au sort —
 * un banc dont le résultat change d'une exécution à l'autre ne peut pas porter
 * de cliquet, et on finit par le désactiver au lieu de le lire.
 */
function inversionDeLettres(q: string): string {
  const mots = q.split(' ');
  let cible = -1;
  for (let i = 0; i < mots.length; i++) {
    if (mots[i]!.length >= 5 && (cible === -1 || mots[i]!.length > mots[cible]!.length)) cible = i;
  }
  if (cible === -1) return q;
  const m = mots[cible]!;
  const p = Math.floor(m.length / 2) - 1;
  mots[cible] = m.slice(0, p) + m[p + 1] + m[p] + m.slice(p + 2);
  return mots.join(' ');
}

/** Double la voyelle du milieu — le doigt qui appuie trop longtemps. */
function lettreEnTrop(q: string): string {
  const mots = q.split(' ');
  let cible = -1;
  for (let i = 0; i < mots.length; i++) {
    if (mots[i]!.length >= 5 && (cible === -1 || mots[i]!.length > mots[cible]!.length)) cible = i;
  }
  if (cible === -1) return q;
  const m = mots[cible]!;
  const p = Math.floor(m.length / 2);
  return mots.map((x, i) => (i === cible ? m.slice(0, p) + m[p] + m.slice(p) : x)).join(' ');
}

export const PERTURBATIONS: Perturbation[] = [
  {
    nom: 'sans accents',
    preserveLeSens: true,
    pourquoi: 'Le clavier de téléphone au rucher, ou simplement l’habitude.',
    appliquer: sansAccents,
  },
  {
    nom: 'sans ponctuation',
    preserveLeSens: true,
    pourquoi: 'Personne ne met de point d’interrogation en dictant.',
    appliquer: (q) => q.replace(/[?!.,;:]/g, '').replace(/\s+/g, ' ').trim(),
  },
  {
    nom: 'tout en minuscules',
    preserveLeSens: true,
    pourquoi: 'La saisie rapide, sans majuscule de début de phrase.',
    appliquer: (q) => q.toLowerCase(),
  },
  {
    nom: 'TOUT EN MAJUSCULES',
    preserveLeSens: true,
    pourquoi: 'Le verrouillage majuscules resté allumé — plus fréquent qu’on ne croit.',
    appliquer: (q) => q.toUpperCase(),
  },
  {
    nom: 'apostrophe droite',
    preserveLeSens: true,
    pourquoi: 'Selon le clavier, l’apostrophe est typographique ou droite.',
    appliquer: (q) => q.replace(/[’‘]/g, "'"),
  },
  {
    nom: 'espaces doublés',
    preserveLeSens: true,
    pourquoi: 'La dictée vocale sépare parfois deux fois.',
    appliquer: (q) => q.replace(/ /g, '  '),
  },
  {
    nom: 'lettre en trop',
    preserveLeSens: true,
    pourquoi: 'Le doigt qui appuie une fois de trop sur une voyelle.',
    appliquer: lettreEnTrop,
  },
  {
    nom: 'lettres inversées',
    preserveLeSens: true,
    pourquoi: 'La faute de frappe la plus courante au monde.',
    appliquer: inversionDeLettres,
  },
  {
    nom: 'sans accents ni ponctuation',
    preserveLeSens: true,
    pourquoi: 'Les deux ensemble — le cas le plus fréquent en dictée.',
    appliquer: (q) => sansAccents(q).replace(/[?!.,;:]/g, '').trim(),
  },
  {
    nom: 'tronquée aux deux tiers',
    preserveLeSens: false,
    pourquoi: 'L’envoi avant d’avoir fini, ou la dictée coupée par le bruit.',
    appliquer: (q) => {
      const mots = q.split(' ');
      return mots.slice(0, Math.max(2, Math.ceil((mots.length * 2) / 3))).join(' ');
    },
  },
];
