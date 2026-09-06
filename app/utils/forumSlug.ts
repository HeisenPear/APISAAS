// L'URL d'un sujet de forum — RÈGLE PURE, partagée client et serveur.
//
// ⚠️ CETTE URL EST INDEXÉE, DONC ELLE SURVIT À TOUT. Un fil de forum se
// partage par lien, se retrouve par un moteur de recherche, et se cite dans
// d'autres fils. Le jour où la règle de fabrication change, tous les liens
// existants pointent dans le vide — et ce n'est pas rattrapable côté produit,
// exactement comme les QR imprimés de `app/utils/urlQr.ts`. D'où : une seule
// fabrique, ici, et un `slug` ÉCRIT EN BASE à la création. Le titre peut être
// corrigé ensuite sans casser l'adresse.

/**
 * ⚠️ 80, PARCE QU'UN SLUG N'EST PAS UN TITRE. Au-delà, l'URL devient
 * illisible dans un message et se fait tronquer par les clients mail. La coupe
 * se fait sur un MOT ENTIER : « varroa-traitement-acide-oxaliq » est pire que
 * plus court, un lecteur croit à une faute.
 */
export const LONGUEUR_MAX_SLUG = 80;

/**
 * Ce qu'on met quand il ne reste rien à mettre.
 *
 * ⚠️ UN SLUG VIDE N'EST PAS UNE URL DÉGRADÉE, C'EST UNE AUTRE PAGE. `/forum/`
 * est la LISTE des sujets ; `/forum/` avec un slug vide y mène aussi. Un titre
 * entièrement fait d'émojis, de ponctuation ou d'idéogrammes — « 🐝🐝🐝 »,
 * « ??? » — donne exactement ça après nettoyage. Le fil serait créé, stocké,
 * et inatteignable : son auteur cliquerait sur son propre sujet et retomberait
 * sur la liste, sans erreur nulle part.
 */
export const SLUG_DE_SECOURS = 'sujet';

/**
 * Le slug d'un titre. Fonction pure, déterministe, sans effet de bord.
 *
 * Ne garantit PAS l'unicité — c'est le rôle de `slugCandidat`, parce que
 * l'unicité se mesure contre la base et ne peut pas vivre dans une fonction
 * pure.
 */
export function slugDeTitre(titre: string): string {
  const nettoye = titre
    .normalize('NFD')
    // Retire les diacritiques : « traité » et « traite » donnent le même slug.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // Tout ce qui n'est pas [a-z0-9] devient une césure — apostrophes droites
    // ET typographiques comprises, dont le français est plein.
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!nettoye) return SLUG_DE_SECOURS;
  if (nettoye.length <= LONGUEUR_MAX_SLUG) return nettoye;

  // Coupe sur un mot entier quand c'est possible ; sinon coupe net plutôt que
  // de rendre un slug plus long que la limite qu'on vient d'annoncer.
  const coupe = nettoye.slice(0, LONGUEUR_MAX_SLUG);
  const dernierTiret = coupe.lastIndexOf('-');
  const retenu = dernierTiret > 0 ? coupe.slice(0, dernierTiret) : coupe;
  return retenu.replace(/-+$/g, '') || SLUG_DE_SECOURS;
}

/**
 * Le n-ième candidat pour un slug de base : `varroa`, `varroa-2`, `varroa-3`…
 *
 * Le serveur essaie les candidats dans l'ordre jusqu'à ce que l'insertion
 * passe. Le suffixe est un RANG, pas un identifiant : il reste lisible, et
 * deux sujets du même titre gardent des URL qu'un humain peut distinguer.
 *
 * ⚠️ LE SUFFIXE PEUT DÉPASSER `LONGUEUR_MAX_SLUG`, ET C'EST VOULU. Raccourcir
 * la base pour faire tenir le suffixe changerait le slug du PREMIER sujet
 * selon qu'un homonyme existe ou non — donc rendrait la fabrique dépendante de
 * l'état de la base, ce qu'elle ne doit pas être. Quelques caractères de trop
 * valent mieux qu'une URL qui bouge.
 */
export function slugCandidat(base: string, rang: number): string {
  return rang <= 0 ? base : `${base}-${rang + 1}`;
}
