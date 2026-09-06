import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

/**
 * UNE SCÈNE ÉPINGLÉE QUI N'ÉPINGLE PAS DOIT CESSER DE CACHER SES TEMPS.
 *
 * ⚠️ LE DÉFAUT QUE CE BANC VERROUILLE NE SE VOIT PAS À L'ŒIL, ET C'EST TOUT LE
 * PROBLÈME : il ne se voit qu'À L'OREILLE.
 *
 * Une scène épinglée montre un temps à la fois, donc elle marque les autres
 * `aria-hidden` — parfaitement juste tant qu'un seul est visible. Sauf qu'il
 * existe DEUX modes où ils le sont tous :
 *
 *   · « réduire les animations » — le composable ne branche aucun écouteur,
 *     `etape` reste à 0, et le CSS remet les temps à la suite ;
 *   · sous le seuil d'empilement (téléphone) — le CSS les remet à la suite
 *     aussi, mais le JavaScript continue de tourner et `etape` change au
 *     défilement.
 *
 * Dans ces deux modes, `aria-hidden="i !== etape"` masquait à un lecteur
 * d'écran TROIS CONTENUS SUR QUATRE parfaitement visibles. Un apiculteur qui
 * lit la page à la voix n'en entendait qu'un quart. Aucune erreur, aucun
 * avertissement, aucun test : la page a l'air normale, elle est simplement
 * amputée pour ceux qui ne la regardent pas.
 *
 * Et pour l'acte « En images », c'était pire : ses temps contiennent un LIEN.
 * `aria-hidden` sur un conteneur focusable est interdit par la spécification
 * ARIA, et `pointer-events: none` arrête la souris, pas le clavier — on tabulait
 * donc sur trois liens invisibles. D'où `inert`, qui retire des DEUX à la fois.
 *
 * LA RÈGLE EST STRUCTURELLE, pas une liste : tout composant qui utilise
 * `useSceneEpinglee` et qui lie `aria-hidden` doit gater cette liaison sur
 * `empile`. Une troisième scène ajoutée demain tombera dessus au lieu de
 * rejouer le défaut.
 */

const DOSSIER = 'app/components/landing/maya';

/** Les composants qui pilotent une scène épinglée — trouvés, pas recopiés. */
const SCENES = readdirSync(DOSSIER)
  .filter((f) => f.endsWith('.vue'))
  .filter((f) => readFileSync(`${DOSSIER}/${f}`, 'utf-8').includes('useSceneEpinglee('))
  .sort();

describe('les scènes épinglées ne cachent rien quand elles s’empilent', () => {
  it('le balayage trouve bien des scènes (garde-fou)', () => {
    /**
     * Sans ce cas, un renommage de composable ou un changement de dossier
     * viderait `SCENES` et toutes les règles ci-dessous passeraient à vide —
     * la quatrième fois que ce dépôt se ferait prendre par un balayage vide.
     */
    expect(SCENES.length, `scènes trouvées : ${SCENES.join(', ') || 'aucune'}`).toBeGreaterThanOrEqual(
      2,
    );
  });

  it.each(SCENES)('%s — le seuil d’empilement est PASSÉ au composable', (fichier) => {
    /**
     * Sans troisième argument, `seuilEmpilement` vaut 0 : le composable croit
     * que la scène épingle à toutes les largeurs, et `empile` reste faux sur un
     * téléphone où le CSS, lui, a tout remis à la suite.
     */
    const source = readFileSync(`${DOSSIER}/${fichier}`, 'utf-8');
    const appel = /useSceneEpinglee\(\s*[^,]+,\s*[^,]+,\s*(\d+)\s*\)/.exec(source);
    expect(
      appel,
      'useSceneEpinglee doit recevoir le seuil d’empilement en troisième argument',
    ).not.toBeNull();
    expect(Number(appel![1]), 'un seuil de 0 revient à ne pas en avoir').toBeGreaterThan(0);
  });

  it.each(SCENES)('%s — le seuil dit la MÊME chose que le CSS', (fichier) => {
    /**
     * ⚠️ DEUX CHIFFRES POUR UNE SEULE DÉCISION : c'est la faute que ce dépôt
     * traque partout. Le CSS décide de l'empilement avec un `@media
     * (max-width: N)`, le composable avec `innerWidth < seuil`. S'ils
     * divergent, il existe une bande de largeurs où le CSS empile pendant que
     * le composable croit encore épingler — et l'`aria-hidden` revient, sur
     * cette bande-là seulement. Un défaut qui n'apparaît qu'entre 768 et
     * 1023 px ne se trouve jamais par hasard.
     *
     * `max-width: N` s'applique jusqu'à N inclus, donc le seuil JS doit être
     * N + 1 : à N + 1 px exactement, le CSS n'empile plus et le JS non plus.
     */
    const source = readFileSync(`${DOSSIER}/${fichier}`, 'utf-8');
    const seuil = Number(/useSceneEpinglee\(\s*[^,]+,\s*[^,]+,\s*(\d+)\s*\)/.exec(source)![1]);
    const largeurs = [...source.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].map((m) =>
      Number(m[1]),
    );
    expect(largeurs.length, 'aucun point de rupture trouvé dans la feuille').toBeGreaterThan(0);
    expect(
      largeurs,
      `seuil JS ${seuil} → on attend un @media (max-width: ${seuil - 1}px) ; trouvés : ${largeurs.join(', ')}`,
    ).toContain(seuil - 1);
  });

  it.each(SCENES)('%s — aucun aria-hidden qui ne soit gaté sur `empile`', (fichier) => {
    const source = readFileSync(`${DOSSIER}/${fichier}`, 'utf-8');
    const gabarit = source.slice(source.indexOf('<template>'), source.lastIndexOf('</template>'));

    /**
     * On ne regarde QUE les liaisons dynamiques. Un `aria-hidden="true"` en dur
     * sur une icône ou un décor est juste et doit le rester — c'est du contenu
     * qui n'a rien à dire, à toutes les largeurs.
     */
    const liaisons = [...gabarit.matchAll(/:aria-hidden="([^"]+)"/g)].map((m) => m[1]!);
    expect(liaisons.length, 'ce composant ne lie aucun aria-hidden : règle sans objet').toBeGreaterThan(
      0,
    );

    const nonGatees = liaisons.filter((expr) => !expr.includes('empile'));
    expect(
      nonGatees,
      'ces aria-hidden masqueront des contenus VISIBLES sur téléphone et sous ' +
        '« réduire les animations » : gate-les sur `empile`',
    ).toEqual([]);
  });

  it.each(SCENES)('%s — un temps qui contient un lien est aussi `inert`', (fichier) => {
    /**
     * `aria-hidden` retire de l'arbre d'accessibilité mais PAS du parcours au
     * clavier. Un conteneur `aria-hidden` qui garde un élément focusable viole
     * la spécification ARIA, et l'utilisateur tabule dans le vide : le focus
     * part sur un lien qu'il ne voit pas et que rien n'annonce.
     *
     * La règle ne s'applique qu'aux scènes dont les temps contiennent vraiment
     * quelque chose de focusable — et on le CONSTATE plutôt que de le supposer,
     * pour que l'ajout d'un lien demain réveille le cas.
     */
    const source = readFileSync(`${DOSSIER}/${fichier}`, 'utf-8');
    const gabarit = source.slice(source.indexOf('<template>'), source.lastIndexOf('</template>'));
    const focusable = /<(NuxtLink|button|a\s|input|select|textarea)/.test(gabarit);

    if (!focusable) {
      expect(gabarit, 'ce composant a gagné un élément focusable : la règle s’applique').not.toMatch(
        /<(NuxtLink|button|a\s|input|select|textarea)/,
      );
      return;
    }
    const inerts = [...gabarit.matchAll(/:inert="([^"]+)"/g)].map((m) => m[1]!);
    expect(
      inerts.length,
      'des temps focusables sans `inert` : on tabulera sur des liens invisibles',
    ).toBeGreaterThan(0);
    for (const expr of inerts) {
      expect(expr, '`inert` doit suivre exactement la même condition qu’`aria-hidden`').toContain(
        'empile',
      );
    }
  });
});
