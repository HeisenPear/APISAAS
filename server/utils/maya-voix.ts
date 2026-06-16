/**
 * La « voix » de Maya — banques de formulations variées pour un ton vivant,
 * chaleureux et naturel, comme si l'on parlait à un véritable assistant.
 * Réutilisable sur toutes les surfaces (chat, brief, cartes contextuelles).
 *
 * On pioche une variante au hasard à chaque appel : la même situation ne donne
 * jamais exactement la même phrase, ce qui casse l'effet « robot ».
 */

export function choisir<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] ?? arr[0]!;
}

/** Insère une valeur dans un gabarit « … {x} … ». */
export function gabarit(modele: string, x: string): string {
  return modele.replace('{x}', x);
}

export const VOIX = {
  /** Ouverture du brief matinal : Maya a « veillé » sur le rucher cette nuit. */
  veilleNuit: [
    'J’ai veillé sur vos ruches cette nuit.',
    'J’ai gardé un œil sur le rucher pendant la nuit.',
    'Cette nuit, je suis restée à l’écoute de vos colonies.',
    'J’ai surveillé vos ruches pendant que vous dormiez.',
  ],
  /** Verdict de veille quand rien d'anormal ne s'est produit. */
  veilleRAS: [
    'Rien d’anormal à signaler 🌙',
    'Tout est resté calme 🌙',
    'Aucune anomalie de mon côté 🌙',
    'Nuit tranquille, rien à signaler 🌙',
  ],
  /** Intro du brief quand il y a des points à signaler. */
  introUrgences: [
    'Voici ce que j’ai remarqué pour vous ce matin :',
    'J’ai jeté un œil à votre rucher — quelques points méritent votre attention :',
    'Petit tour d’horizon avant de commencer la journée :',
    'J’ai préparé votre point du jour, le voici :',
    'Quelques petites choses à regarder ensemble :',
  ],
  /** Intro du brief quand tout va bien. */
  introCalme: [
    'Tout est calme au rucher 🌿 — profitez-en pour observer vos colonies tranquillement.',
    'Rien d’urgent aujourd’hui 🌿 Une belle occasion d’aller simplement écouter vos abeilles.',
    'Le rucher respire la sérénité 🌿 Rien à signaler de mon côté.',
    'Journée paisible en vue 🌿 Vos colonies semblent bien se porter.',
  ],
  /** Message quand Maya ouvre une page pour l'utilisateur (gabarit {x} = page). */
  ouvreNavigation: [
    'C’est parti, je vous ouvre **{x}** 🐝',
    'Et voilà, j’ouvre **{x}** pour vous 🐝',
    'Je vous emmène sur **{x}** 🐝',
    'Tout de suite — direction **{x}** 🐝',
    'Avec plaisir, j’ouvre **{x}** 🐝',
  ],
  /** Petit en-tête contextuel sur la page Ruches. */
  contexteRuches: [
    'Côté colonies, voici ce qui attire mon œil :',
    'Un coup d’œil à vos ruches :',
    'Pour vos ruches, je note :',
  ],
  /** Petit en-tête contextuel sur la page Météo. */
  contexteMeteo: [
    'Côté météo, voilà ce que je vois :',
    'Pour vos visites, regardons le ciel :',
    'Un point sur les conditions à venir :',
  ],
  /** En-tête quand le contexte est calme (rien à signaler). */
  contexteCalme: [
    'Rien de particulier à signaler ici pour l’instant 🌿',
    'Tout semble en ordre de ce côté 🌿',
  ],
} as const;

export type CleVoix = keyof typeof VOIX;

/** Pioche une formulation variée pour une clé donnée. */
export function voix(cle: CleVoix): string {
  return choisir(VOIX[cle]);
}
