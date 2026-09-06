/**
 * La cadence de frappe de Maya — à quelle vitesse sa réponse se révèle.
 *
 * POURQUOI CE MODULE EXISTE. La formule vivait à l'intérieur du handler SSE
 * (`server/api/ia/copilote.post.ts`), au milieu d'une boucle d'émission. Une
 * arithmétique pure enfouie dans une route ne se teste pas : on ne peut pas
 * l'appeler sans monter un serveur, ouvrir un flux et chronométrer. Elle a donc
 * été réglée trois fois à l'aveugle, sans qu'aucun banc ne dise ce qu'elle
 * garantit. Sortie ici, elle s'appelle et se vérifie en une ligne.
 *
 * CE QUE LA CADENCE DOIT TENIR, ET C'EST UN COMPROMIS À DEUX BOUTS :
 *
 *  · Une réponse conversationnelle de dix mots doit se POSER. Révélée d'un bloc,
 *    elle donne l'impression d'un copier-coller, pas de quelqu'un qui répond.
 *  · Une fiche de savoir de trois cents mots ne doit pas s'éterniser. Au pas
 *    d'une phrase courte, elle mettrait dix secondes — on part faire autre chose.
 *
 * D'où un pas BORNÉ des deux côtés, et une durée totale plafonnée : les longues
 * réponses accélèrent, les courtes gardent leur rythme.
 */

/** Pas minimum entre deux mots. En dessous, la révélation redevient un bloc. */
export const PAS_MIN_MS = 9;

/**
 * Pas maximum. Relevé de 24 à 32 ms : la frappe restait trop vive à la lecture.
 * Au-delà de ~40 ms on bascule dans l'autre défaut — on attend le mot suivant.
 */
export const PAS_MAX_MS = 32;

/** Durée visée pour révéler une réponse entière. Relevée de 3 s à 4 s. */
export const DUREE_CIBLE_MS = 4000;

/**
 * Nombre de mots d'un texte.
 *
 * `split(/(\s+)/)` alterne mot / séparateur — d'où le `/ 2` : un vrai mot sur
 * deux. C'est la MÊME découpe que celle utilisée pour émettre, et c'est
 * volontaire : compter autrement qu'on n'émet ferait dériver la durée réelle de
 * la durée calculée.
 */
export function compterMots(texte: string): number {
  if (!texte) return 1;
  return Math.max(1, Math.ceil(texte.split(/(\s+)/).length / 2));
}

/**
 * Millisecondes à attendre entre deux mots, pour un texte de `nbMots` mots.
 *
 * Le résultat est toujours dans `[PAS_MIN_MS, PAS_MAX_MS]` : c'est ce qui borne
 * la révélation par le bas (jamais instantanée) comme par le haut (jamais
 * interminable).
 */
export function cadenceFrappe(nbMots: number): number {
  // `Math.max(1, NaN)` vaut NaN, et NaN traverse tout le calcul sans être borné :
  // on obtenait `setTimeout(fn, NaN)`, que le navigateur traite comme 0 — donc
  // plus d'effet de frappe du tout, silencieusement. Le banc l'a trouvé avant
  // l'expédition ; le garde est ici plutôt que dans l'appelant, parce que c'est
  // la fonction qui promet une valeur dans ses bornes.
  const mots = Number.isFinite(nbMots) ? Math.max(1, Math.floor(nbMots)) : 1;
  return Math.min(PAS_MAX_MS, Math.max(PAS_MIN_MS, Math.round(DUREE_CIBLE_MS / mots)));
}

/**
 * Durée totale de révélation, en millisecondes.
 *
 * Sert au séquencement des BLOCS riches : ils se posent au fil du texte plutôt
 * que d'apparaître tous d'un coup à la fin, et il faut donc savoir de combien de
 * temps on dispose.
 */
export function dureeRevelation(nbMots: number): number {
  const mots = Number.isFinite(nbMots) ? Math.max(1, Math.floor(nbMots)) : 1;
  return cadenceFrappe(mots) * mots;
}

/**
 * À quels mots poser les blocs riches (statistiques, tableaux, graphes).
 *
 * LE DÉFAUT QUE CETTE FONCTION CORRIGE. Les blocs partaient en UN SEUL
 * événement, après tout le texte : la réponse s'écrivait tranquillement, puis
 * trois figures surgissaient d'un coup sous les yeux. « Pas digeste à lire »,
 * et c'est exact — le regard vient de finir une phrase, il reçoit d'un bloc ce
 * qu'il faudrait parcourir.
 *
 * Les blocs se répartissent donc SUR la frappe, à intervalles réguliers : Maya
 * illustre au fil de ce qu'elle écrit, au lieu de tout poser à la fin.
 *
 * Renvoie les indices de mot (1-based) auxquels émettre chaque bloc, en ordre
 * strictement croissant. Le dernier tombe avant le dernier mot : rien n'arrive
 * après que la phrase est finie.
 *
 * Cas limite assumé : plus de blocs que de mots (« Voici. » suivi de quatre
 * figures). Les jalons saturent alors au dernier mot et plusieurs blocs partent
 * ensemble — c'est le seul comportement sensé, et il reste rare.
 */
export function jalonsBlocs(nbMots: number, nbBlocs: number): number[] {
  const mots = Number.isFinite(nbMots) ? Math.max(1, Math.floor(nbMots)) : 1;
  const n = Number.isFinite(nbBlocs) ? Math.max(0, Math.floor(nbBlocs)) : 0;
  if (n === 0) return [];

  const jalons: number[] = [];
  for (let i = 0; i < n; i++) {
    // (i+1)/(n+1) : répartition régulière qui laisse une marge des deux côtés —
    // jamais sur le tout premier mot, jamais après le dernier.
    const brut = Math.round((mots * (i + 1)) / (n + 1));
    const precedent = jalons[i - 1] ?? 0;
    jalons.push(Math.min(mots, Math.max(precedent + 1, brut, 1)));
  }
  return jalons;
}
