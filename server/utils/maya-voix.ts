/**
 * La « voix » de Maya — banques de formulations variées pour un ton VIVANT,
 * chaleureux et complice, comme un vrai échange entre deux passionnés. Tutoiement
 * partout, aucun emoji (c'est le ton qui porte la chaleur, pas les icônes).
 *
 * On pioche une variante à chaque appel : la même situation ne donne jamais
 * exactement la même phrase, ce qui casse net l'effet « robot ». Réutilisable sur
 * toutes les surfaces (chat, brief, cartes).
 *
 * Les tirages peuvent être SEEDÉS (seedVoix) pour être déterministes sur une
 * période — ex. (userId + jour) — afin que le brief du matin ne change pas à
 * chaque navigation. En conversation (chat), on laisse au contraire varier.
 */

let _seed = 0;

/** Fixe la graine des tirages (déterminisme). resetVoix() pour repasser en aléatoire. */
export function seedVoix(cle: string): void {
  let h = 2166136261;
  for (let i = 0; i < cle.length; i++) {
    h ^= cle.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  _seed = h >>> 0 || 1;
}

/** Repasse en tirage aléatoire (variation d'un message à l'autre en conversation). */
export function resetVoix(): void {
  _seed = 0;
}

export function choisir<T>(arr: readonly T[]): T {
  if (arr.length === 0) return arr[0]!;
  if (_seed) {
    // LCG déterministe : avance la graine puis pioche — stable pour une graine donnée.
    _seed = (Math.imul(_seed, 1103515245) + 12345) >>> 0;
    return arr[_seed % arr.length] ?? arr[0]!;
  }
  return arr[Math.floor(Math.random() * arr.length)] ?? arr[0]!;
}

/** Insère une valeur dans un gabarit « … {x} … ». */
export function gabarit(modele: string, x: string): string {
  return modele.replace('{x}', x);
}

export const VOIX = {
  // ── Brief matinal ──────────────────────────────────────────────────────────
  /** Ouverture du brief : Maya a « veillé » sur le rucher cette nuit. */
  veilleNuit: [
    'J’ai veillé sur tes ruches cette nuit.',
    'J’ai gardé un œil sur le rucher pendant que tu dormais.',
    'Cette nuit, je suis restée à l’écoute de tes colonies.',
    'Petite garde de nuit terminée — je te fais le point.',
    'J’ai surveillé le rucher pendant la nuit, comme d’habitude.',
  ],
  /** Verdict de veille quand rien d'anormal. */
  veilleRAS: [
    'Rien d’anormal à signaler.',
    'Tout est resté bien calme.',
    'Aucune fausse note de mon côté.',
    'Nuit tranquille, rien à te remonter.',
    'Le rucher a passé une nuit paisible.',
  ],
  /** Intro du brief quand il y a des points à signaler. */
  introUrgences: [
    'Voici ce que j’ai repéré pour toi ce matin :',
    'J’ai jeté un œil au rucher — deux ou trois choses méritent ton attention :',
    'Petit tour d’horizon avant d’attaquer la journée :',
    'Je t’ai préparé le point du jour, le voilà :',
    'Quelques petites choses à regarder ensemble :',
  ],
  /** Intro du brief quand tout va bien. */
  introCalme: [
    'Tout est calme au rucher — profites-en pour observer tes colonies tranquillement.',
    'Rien d’urgent aujourd’hui : une belle occasion d’aller simplement écouter tes abeilles.',
    'Le rucher respire la sérénité, rien à signaler de mon côté.',
    'Journée paisible en vue — tes colonies ont l’air de bien se porter.',
  ],

  // ── Navigation & en-têtes de page ──────────────────────────────────────────
  /** Maya ouvre une page (gabarit {x} = page). */
  ouvreNavigation: [
    'C’est parti, je t’ouvre **{x}**.',
    'Et hop, j’ouvre **{x}** pour toi.',
    'Je t’emmène sur **{x}**.',
    'Tout de suite — direction **{x}**.',
    'Avec plaisir, j’ouvre **{x}**.',
  ],
  // Une voix par page où Maya s'invite. Clés en `contexte_<page>` : elles sont
  // construites par `voix(\`contexte_${contexte}\`)` dans maya-brief.ts, donc
  // toute page ajoutée au moteur DOIT avoir sa ligne ici, sinon la clé n'existe
  // pas et le typage la refuse — le garde est volontaire.
  contexte_ruches: [
    'Côté colonies, voici ce qui attire mon œil :',
    'Un coup d’œil à tes ruches :',
    'Pour tes ruches, je note ceci :',
  ],
  contexte_meteo: [
    'Côté météo, voilà ce que je vois :',
    'Pour tes visites, regardons le ciel :',
    'Un point sur les conditions qui arrivent :',
  ],
  contexte_alertes: [
    'Voici ce que je surveille de près :',
    'Ce qui mérite ton attention en priorité :',
    'Je garderais un œil là-dessus :',
  ],
  contexte_stocks: [
    'Côté réserves, un petit réappro s’impose :',
    'Pour tes stocks, je note ceci :',
    'Avant la panne sèche, regarde ça :',
  ],
  contexte_calendrier: [
    'Ce qui a une échéance à ne pas manquer :',
    'À caler dans ton agenda :',
    'Voilà ce qui presse un peu :',
  ],
  contexteCalme: [
    'Rien de particulier à signaler ici pour l’instant.',
    'Tout semble en ordre de ce côté.',
  ],

  // ── Salutations ────────────────────────────────────────────────────────────
  /** Réponse à « salut / coucou / hey ». */
  salut: [
    'Salut ! Content de te voir. On regarde quoi — tes ruches, un point santé, une question d’apiculture ?',
    'Hé, coucou ! Dis-moi, par quoi on commence aujourd’hui ?',
    'Salut ! Je suis là. Un point sur le rucher, une intervention à noter, une question qui te trotte ?',
    'Coucou ! Prête à donner un coup de main — tu veux regarder quoi ?',
  ],
  /** Réponse à « merci ». */
  remerciement: [
    'Avec plaisir, vraiment. Je reste dans les parages si tu as besoin.',
    'Mais de rien ! N’hésite pas, je suis là pour ça.',
    'Quand tu veux ! File t’occuper de tes abeilles, je garde un œil sur le reste.',
    'C’est tout naturel. Reviens dès qu’une question te vient.',
  ],
  /** Réponse à « au revoir / bonne journée ». */
  adieu: [
    'Belle journée au rucher ! On se reparle vite.',
    'À très vite — prends soin de tes colonies.',
    'Bonne journée ! Je reste là si besoin.',
    'À bientôt, et bon boulot au milieu des abeilles.',
  ],
  /** Réponse à un compliment (« super », « génial »). */
  compliment: [
    'Ça me fait plaisir ! Dis-moi dès que tu as besoin d’un coup de main.',
    'Trop bien — on continue quand tu veux.',
    'Content que ça t’aide ! Je reste dispo pour la suite.',
    'Avec plaisir. La prochaine, c’est quand tu veux.',
  ],

  // ── Savoir (ouvertures d'une réponse « connaissance ») ────────────────────
  /** Petite ouverture complice avant une réponse d'apiculture. */
  ouvertureSavoir: [
    'Bonne question —',
    'Alors,',
    'Tiens, sujet intéressant.',
    'Ah, ça c’est un vrai sujet.',
    'Volontiers.',
    'Bonne idée d’en parler —',
  ],

  // ── Flux d'intervention (invites) ─────────────────────────────────────────
  /** « Sur quelle ruche ? » — une, plusieurs, ou un rucher entier. */
  demandeRuche: [
    'Avec plaisir — sur quelle(s) ruche(s) je note ça ? Une, plusieurs, ou un rucher entier : dis-moi.',
    'Ça marche. Sur quelle ruche ? Tu peux aussi viser plusieurs ruches ou tout un rucher d’un coup.',
    'C’est comme si c’était fait — quelle ruche ? Ou plusieurs, ou un rucher complet, comme tu veux.',
    'Parfait. Sur laquelle je le mets ? Un numéro, un nom, plusieurs ruches ou tout un rucher.',
  ],
  /** Choisir le type d'intervention. */
  choisirType: [
    'Avec plaisir — quel type d’intervention tu veux noter ? Choisis ci-dessous, je te guide.',
    'On y va. C’est quoi comme intervention ? Dis-moi et je m’occupe des détails.',
    'Ça marche. Quel type d’intervention ? Sélectionne juste en dessous.',
  ],

  // ── Fallback (jamais un mur) ───────────────────────────────────────────────
  fallbackDoux: [
    'Hmm, je ne suis pas sûre de t’avoir bien suivi.',
    'Là, tu m’as un peu perdue —',
    'Je n’ai pas tout saisi, mais on va y arriver.',
    'Pas certaine d’avoir bien compris —',
  ],
} as const;

export type CleVoix = keyof typeof VOIX;

/** Pioche une formulation variée pour une clé donnée. */
export function voix(cle: CleVoix): string {
  return choisir(VOIX[cle]);
}
