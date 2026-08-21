/**
 * Ce qui PEUT suivre — le maillon qui manquait entre le constat et l'action.
 *
 * `santePredictive.ts` produit déjà deux listes : les RISQUES (ce qui est vrai
 * aujourd'hui : « Réserves insuffisantes ») et les SUGGESTIONS (ce qu'il faut
 * faire : « Nourrir la colonie »). Entre les deux, il manquait la raison :
 * qu'est-ce qui peut arriver si on ne fait rien.
 *
 * ─── LA RÈGLE DE LANGAGE, ET ELLE N'EST PAS NÉGOCIABLE ───────────────────────
 *
 * Maya ne dit JAMAIS qu'une chose VA arriver. Elle dit qu'elle PEUT arriver.
 *
 * Ce n'est pas de la prudence rédactionnelle : c'est une question d'honnêteté.
 * Une projection à trente jours calculée sur trois visites n'autorise pas le
 * futur de l'indicatif. Annoncer « votre colonie va essaimer » serait affirmer
 * ce qu'on ne sait pas — et le jour où ça n'arrive pas, l'apiculteur cesse de
 * croire tout le reste, y compris les alertes qui, elles, étaient justes.
 *
 * La règle est vérifiée par banc (`mayaConsequences.test.ts`) : toute phrase
 * doit porter une forme atténuée, et aucune ne peut contenir un marqueur de
 * certitude au futur. Un garde, pas une bonne intention.
 *
 * ─── LE COUPLAGE, ASSUMÉ ET SURVEILLÉ ────────────────────────────────────────
 *
 * La table s'accroche aux libellés que `predictSante` produit. Si un libellé
 * change là-bas, la correspondance cesse en SILENCE : plus de conséquence, et
 * personne ne s'en aperçoit. D'où un banc qui exécute le moteur pour lui faire
 * cracher tous ses risques, et exige que chacun trouve sa conséquence.
 */

export interface Consequence {
  /** Le risque, tel que le moteur le nomme. */
  risque: string;
  /** Ce qui peut suivre si rien n'est fait. Toujours au conditionnel ou avec « peut ». */
  consequence: string;
}

/**
 * Motif → conséquence. Ordonné : le varroa CRITIQUE avant le varroa ÉLEVÉ,
 * sinon le second motif attraperait le premier.
 */
const TABLE: Array<{ motif: RegExp; consequence: string }> = [
  {
    motif: /varroa critique/i,
    consequence:
      'sans traitement, l’infestation peut continuer à progresser et affaiblir la colonie ' +
      'avant l’hivernage',
  },
  {
    motif: /varroa élevé/i,
    consequence: 'la charge peut continuer à monter si rien n’est fait',
  },
  {
    motif: /colonie faible/i,
    consequence: 'une colonie faible peut peiner à se développer et à se défendre',
  },
  {
    motif: /reine non observée/i,
    consequence:
      'si la ponte s’est interrompue, la population peut décliner faute de renouvellement',
  },
  {
    motif: /réserves insuffisantes/i,
    consequence: 'sans apport, la colonie peut manquer de nourriture',
  },
  {
    motif: /essaimage/i,
    consequence: 'la colonie peut partir, et emporter une bonne part des butineuses',
  },
  {
    motif: /maladie observée/i,
    consequence: 'l’atteinte peut s’étendre au reste du rucher',
  },
  {
    motif: /pas de visite depuis/i,
    consequence: 'un souci peut s’installer sans être repéré entre deux passages',
  },
  {
    motif: /aucune inspection/i,
    consequence: 'sans historique, une dérive peut passer inaperçue — et je ne peux rien projeter',
  },
];

/**
 * Associe à chaque risque ce qui peut en découler.
 *
 * Un risque sans correspondance est IGNORÉ plutôt que comblé par une phrase
 * passe-partout : mieux vaut ne rien dire que dire une généralité qui a l'air
 * d'un diagnostic. Le banc garantit par ailleurs qu'aucun risque du moteur ne
 * tombe dans ce cas.
 */
export function consequencesDe(risques: readonly string[]): Consequence[] {
  const out: Consequence[] = [];
  for (const risque of risques) {
    const trouve = TABLE.find((t) => t.motif.test(risque));
    if (trouve) out.push({ risque, consequence: trouve.consequence });
  }
  return out;
}

/**
 * Marqueurs de CERTITUDE au futur — interdits dans une projection.
 *
 * Exporté pour que le banc mesure exactement ce que le code interdit, au lieu
 * de recopier sa propre liste et de diverger.
 */
export const MARQUEURS_CERTITUDE =
  /\b(va|vont|sera|seront|aura|auront|vas|allez|perdrez|finira|finiront|deviendra|deviendront)\b/i;

/** Formes atténuées — au moins une doit être présente. */
export const MARQUEURS_ATTENUATION =
  /\b(peut|peuvent|pourrait|pourraient|risque|risquent|probable|possible|si)\b/i;
