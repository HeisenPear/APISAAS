/**
 * ATTENDRE QUE LA FEUILLE DE STYLE SOIT VRAIMENT POSÉE, AVANT DE MESURER.
 *
 * ⚠️ EXTRAIT DE L'AUDIT POUR ÊTRE TESTABLE — même raison que `sonde-mise-en-page`.
 *    Le défaut qu'il corrige était PROBABILISTE : une seule exécution verte ne
 *    prouve rien, et c'est précisément ce qui l'a laissé vivre.
 *
 * LE DÉFAUT. Sans JavaScript, l'audit navigue en `domcontentloaded` (`load`
 * attendrait des tuiles OpenStreetMap qui ne viennent jamais). Or
 * `domcontentloaded` ne signale que l'analyse du HTML. Ce qui force d'ordinaire
 * le navigateur à attendre le CSSOM, c'est un script placé après la feuille —
 * et ici les scripts de la page sont gelés. Plus rien n'attend.
 *
 * MESURÉ, pas supposé : douze chargements de `/transhumance` à 360 px, même
 * code, même serveur → feuille posée 7 fois, ABSENTE 5 fois. Dans ces cas-là
 * l'en-tête desktop, pourtant `hidden lg:flex`, calculait `display: block`.
 *
 * Le faux positif n'était que la moitié visible. L'autre moitié est muette et
 * bien pire : sur une page sans style il n'y a NI débordement, NI
 * chevauchement, NI contraste. Les 201 scénarios du produit rendaient donc
 * « propre » environ deux fois sur cinq sans avoir rien regardé — une porte qui
 * dit oui sans avoir vu.
 *
 * TROIS CHOIX QUI COMPTENT :
 *   · on attend DEPUIS NODE, par `page.evaluate` successifs — jamais un
 *     écouteur ni un minuteur posés dans la page : sans JavaScript ils ne se
 *     déclencheraient pas (même famille que `requestAnimationFrame`, qui ne se
 *     résout jamais ici) ;
 *   · DEUX conditions, parce qu'une seule ment : `link.sheet` dit que la
 *     ressource est analysée, le compte de règles dit qu'il y a une vraie
 *     feuille derrière — un `<link>` vers un 404 donne un `sheet` vide et
 *     satisferait la première ;
 *   · au bout du délai on JETTE. Le scénario est déclaré non mesurable au lieu
 *     d'être compté propre : devant une page qu'on ne sait pas mesurer, on
 *     refuse.
 */

/** Seuil de règles au-delà duquel on tient la feuille pour vraiment posée. */
export const REGLES_MINIMUM = 100;

/** L'état du CSS de la page, lu en une fois. Exporté pour le contrôle. */
export const LIRE_ETAT_CSS = () => {
  const liens = [...document.querySelectorAll('link[rel="stylesheet"]')];
  const posees = liens.filter((l) => {
    try {
      return !!l.sheet;
    } catch {
      // Feuille d'une autre origine : illisible, donc réputée posée.
      return true;
    }
  }).length;
  let regles = 0;
  for (const f of document.styleSheets) {
    try {
      regles += f.cssRules.length;
    } catch {
      regles += 1;
    }
  }
  return { liens: liens.length, posees, regles };
};

/** La feuille est-elle posée pour de bon ? */
export function feuillePosee(etat) {
  return etat.posees === etat.liens && etat.regles > REGLES_MINIMUM;
}

/**
 * Bloque jusqu'à ce que la feuille de style soit posée. Jette si le délai
 * passe — déclarer une page non mesurable vaut mieux que la déclarer propre.
 */
export async function attendreLaFeuilleDeStyle(page, quoi, limiteMs = 10000) {
  const echeance = Date.now() + limiteMs;
  let dernier = null;
  while (Date.now() < echeance) {
    dernier = await page.evaluate(LIRE_ETAT_CSS);
    if (feuillePosee(dernier)) return dernier;
    await page.waitForTimeout(25);
  }
  throw new Error(
    `feuille de style absente après ${limiteMs} ms sur ${quoi} ` +
      `(${dernier?.posees}/${dernier?.liens} liens posés, ${dernier?.regles} règles) — ` +
      'mesurer ici reviendrait à déclarer propre une page sans style',
  );
}
