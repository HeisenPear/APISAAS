import { test, expect } from '@playwright/test';

/**
 * La scène épinglée de /maya — « Comment elle raisonne ».
 *
 * POURQUOI CE BANC EXISTE, alors que l'arithmétique est déjà testée à l'unité.
 *
 * `sceneDefilement.ts` prouve que les nombres sont bons. Il ne peut RIEN dire
 * de ce qui casse vraiment une scène épinglée, parce que ce qui la casse ne
 * vit pas dans le calcul :
 *
 *  · un ancêtre qui porte `overflow: hidden` — et `position: sticky` cesse
 *    silencieusement de coller. Aucune erreur, aucun avertissement : la mark
 *    défile simplement avec la page, et les quatre temps se succèdent en une
 *    fraction de seconde au lieu de quatre écrans ;
 *
 *  · une hauteur de conteneur mal réglée — la scène sature sur le dernier
 *    temps et l'on défile un écran entier dans le vide.
 *
 * Les deux se voient à l'œil et par aucun banc unitaire. D'où un vrai
 * navigateur, un vrai défilement, et des mesures.
 *
 * ⚠️ `reducedMotion: 'no-preference'` est POSÉ, pas supposé. Sous « réduire les
 * animations », le composable ne branche aucun écouteur et la scène redevient
 * un empilement — comportement voulu, mais qui ferait échouer ce banc sur une
 * machine réglée ainsi. On teste ici le mode animé, explicitement.
 */
test.use({ reducedMotion: 'no-preference' });

const TEMPS_ATTENDUS = [
  'Vos données, pas les nôtres.',
  'À des seuils qui ont un nom.',
  'Seulement ce qui a franchi un seuil.',
  'Elle prépare. Vous signez.',
];

test.describe('/maya — la scène épinglée', () => {
  test('la mark reste collée et les quatre temps se succèdent', async ({ page }) => {
    await page.goto('/maya');

    /**
     * Le défilement doux de la page fausse toute mesure : `scrollTo` s'anime,
     * et l'on mesure avant l'arrivée. Ça m'a fait lire une scène « qui sature »
     * là où elle marchait parfaitement. On le coupe pour mesurer.
     */
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

    const scene = page.locator('#raisonne');
    await scene.scrollIntoViewIfNeeded();

    const { haut, hauteur, champ } = await scene.evaluate((el) => ({
      haut: el.getBoundingClientRect().top + window.scrollY,
      hauteur: el.getBoundingClientRect().height,
      champ: window.innerHeight,
    }));

    // Sans course utile, il n'y a pas de scène du tout.
    expect(hauteur, 'la scène doit être plus haute que l’écran pour épingler').toBeGreaterThan(
      champ * 2,
    );

    const collant = scene.locator('.collant');
    const course = hauteur - champ;

    // Cinq points de mesure, un par temps plus la toute fin.
    for (const [i, part] of [0.05, 0.3, 0.55, 0.8, 0.99].entries()) {
      await page.evaluate((y) => window.scrollTo(0, y), haut + course * part);
      // Le temps de la transition (520 ms) plus une marge : on veut lire un
      // état posé, pas un état en vol.
      await page.waitForTimeout(650);

      const hautCollant = await collant.evaluate((el) =>
        Math.round(el.getBoundingClientRect().top),
      );
      expect(
        Math.abs(hautCollant),
        `à ${Math.round(part * 100)} % de la scène, l’enfant collant est à ${hautCollant} px du ` +
          'haut au lieu de 0. `position: sticky` ne prend pas — chercher un ancêtre ' +
          'avec overflow: hidden/auto.',
      ).toBeLessThanOrEqual(2);

      const attendu = TEMPS_ATTENDUS[Math.min(i, TEMPS_ATTENDUS.length - 1)]!;
      await expect(scene.locator('.temps-actif .temps-titre')).toHaveText(attendu);
    }
  });

  test('le dernier temps est bien atteint — la scène ne sature pas avant la fin', async ({
    page,
  }) => {
    await page.goto('/maya');
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

    const scene = page.locator('#raisonne');
    await scene.scrollIntoViewIfNeeded();
    const { haut, hauteur, champ } = await scene.evaluate((el) => ({
      haut: el.getBoundingClientRect().top + window.scrollY,
      hauteur: el.getBoundingClientRect().height,
      champ: window.innerHeight,
    }));

    await page.evaluate((y) => window.scrollTo(0, y), haut + (hauteur - champ));
    await page.waitForTimeout(650);

    await expect(scene.locator('.temps-actif .temps-titre')).toHaveText(TEMPS_ATTENDUS[3]!);
    // Le compteur ne doit JAMAIS afficher un cinquième temps sur quatre : c'est
    // le débordement que `etapeActive` borne, vu ici de bout en bout.
    await expect(scene.locator('.compteur-actif')).toHaveText('4');
  });

  test('le titre du héros n’est pas resté prisonnier de son masque', async ({ page }) => {
    /**
     * L'entrée ligne à ligne masque le titre en l'attendant. Si la révélation
     * ne part pas — observateur absent, piège de spécificité, directive posée
     * sur la ligne au lieu du masque — le titre reste sous son masque POUR
     * TOUJOURS, sans la moindre erreur. C'est le mode de panne le plus coûteux
     * de toute cette mécanique : un h1 invisible sur la page qui vend Maya.
     *
     * ⚠️ CE BANC A DÉJÀ ÉTÉ ÉCRIT FAUX, et l'erreur mérite d'être connue.
     *
     * La première version attendait `opacity: 1` puis mesurait. Or AVANT que la
     * directive ne soit montée, la ligne est déjà opaque : la condition était
     * vraie à l'instant zéro, l'attente rendait la main immédiatement, et la
     * mesure tombait en plein vol — à 19,8 px des 67 px de course. Un banc qui
     * valide son sujet avant qu'il n'existe ne prouve rien, et échoue au
     * hasard. On attend donc que le mouvement soit FINI, et on l'attend sur ce
     * qui bouge vraiment.
     */
    await page.goto('/maya');

    const lignes = page.locator('h1.hero-titre .rev-ligne > span');
    await expect(lignes).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      const ligne = lignes.nth(i);

      // 1. La mécanique a bien démarré. Sans ce contrôle, une page dont la
      //    directive ne ferait RIEN passerait le banc : le titre y est
      //    naturellement visible. On vérifie qu'il l'est APRÈS révélation.
      await expect(ligne).toHaveClass(/\brev-on\b/, { timeout: 6000 });

      // 2. Le mouvement est terminé — `transform` est la propriété qui porte
      //    la sortie du masque, c'est donc elle qu'on attend.
      await expect(ligne).toHaveCSS('transform', 'none', { timeout: 6000 });
      await expect(ligne).toHaveCSS('opacity', '1');

      // 3. Et la ligne est bien à l'intérieur de son masque.
      const mesure = await ligne.evaluate((el) => {
        const l = el.getBoundingClientRect();
        const m = el.parentElement!.getBoundingClientRect();
        return {
          dedans: l.bottom <= m.bottom + 2 && l.top >= m.top - 2,
          depasseEnBas: +(l.bottom - m.bottom).toFixed(1),
          depasseEnHaut: +(m.top - l.top).toFixed(1),
        };
      });
      expect(
        mesure.dedans,
        `la ligne ${i + 1} du titre est hors de son masque — dépasse de ` +
          `${mesure.depasseEnBas} px en bas, ${mesure.depasseEnHaut} px en haut`,
      ).toBe(true);
    }
  });
});
