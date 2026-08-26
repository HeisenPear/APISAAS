import { test, expect } from '@playwright/test';
import { ECRANS_APIGO, ORDRE_ECRANS } from '../../app/config/ecrans-apigo';

/**
 * L'acte II de /maya — « En images ».
 *
 * POURQUOI UN VRAI NAVIGATEUR, alors que l'arithmétique de la scène est déjà
 * testée à l'unité (`sceneDefilement`) et sa lisibilité à la source
 * (`mayaLisibilite`).
 *
 * Parce qu'aucun des deux ne peut voir ce qui casse RÉELLEMENT une scène
 * épinglée, et que les deux modes de panne sont MUETS :
 *
 *  · un ancêtre qui porte `overflow: hidden` — et `position: sticky` cesse
 *    silencieusement de coller. Aucune erreur : le cadre défile avec la page et
 *    les quatre écrans se succèdent en une fraction de seconde ;
 *  · une hauteur de conteneur mal réglée — la scène sature sur le dernier écran
 *    et l'on défile plusieurs écrans dans le vide.
 *
 * ⚠️ ET UN TROISIÈME, PROPRE À CET ACTE : la maquette est le PROPOS. Un
 * chapitre dont la colonne d'illustration disparaît reste lisible ; ici, une
 * colonne d'écran vide laisse quatre paragraphes qui décrivent des captures que
 * personne ne voit. On vérifie donc que l'écran est là, et qu'il change.
 */
test.use({ reducedMotion: 'no-preference' });

/** Les titres attendus, LUS DANS LE CATALOGUE — jamais recopiés ici. */
const TITRES = ORDRE_ECRANS.map((id) => ECRANS_APIGO[id].titre);

test.describe('/maya — acte II « En images »', () => {
  test('le catalogue est bien celui qu’on croit (garde-fou du banc)', async () => {
    /**
     * Sans ce cas, un `ORDRE_ECRANS` vide rendrait toutes les boucles ci-dessous
     * sans objet, et le fichier afficherait des verts sans avoir rien mesuré.
     * Ce dépôt s'est déjà fait prendre trois fois par un balayage vide.
     */
    expect(TITRES.length).toBe(4);
    expect(TITRES.every((t) => t.length > 8)).toBe(true);
  });

  test('le cadre reste collé et les quatre écrans se succèdent', async ({ page }) => {
    await page.goto('/maya');
    // Le défilement doux fausse toute mesure : `scrollTo` s'anime et l'on
    // mesure avant l'arrivée.
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

    const scene = page.locator('#en-images');
    await scene.scrollIntoViewIfNeeded();

    const { haut, hauteur, champ } = await scene.evaluate((el) => ({
      haut: el.getBoundingClientRect().top + window.scrollY,
      hauteur: el.getBoundingClientRect().height,
      champ: window.innerHeight,
    }));

    expect(hauteur, 'la scène doit être plus haute que l’écran pour épingler').toBeGreaterThan(
      champ * 2,
    );

    const collant = scene.locator('.collant');
    const course = hauteur - champ;

    for (const [i, part] of [0.05, 0.3, 0.55, 0.8, 0.99].entries()) {
      await page.evaluate((y) => window.scrollTo(0, y), haut + course * part);
      // 560 ms de transition sur l'écran, plus une marge : on lit un état posé.
      await page.waitForTimeout(680);

      const hautCollant = await collant.evaluate((el) => Math.round(el.getBoundingClientRect().top));
      expect(
        Math.abs(hautCollant),
        `à ${Math.round(part * 100)} % de la scène, le cadre collant est à ${hautCollant} px du ` +
          'haut au lieu de 0. `position: sticky` ne prend pas — chercher un ancêtre ' +
          'avec overflow: hidden/auto.',
      ).toBeLessThanOrEqual(2);

      const attendu = TITRES[Math.min(i, TITRES.length - 1)]!;
      await expect(scene.locator('.temps-actif .titre')).toHaveText(attendu);
    }
  });

  test('l’écran actif est visible, et c’est le BON', async ({ page }) => {
    /**
     * ⚠️ LE CAS QUI GARDE LE PROPOS DE L'ACTE. Une scène peut épingler
     * parfaitement, faire défiler ses quatre récits, et ne rien montrer : il
     * suffit que la colonne d'écran soit à zéro largeur, masquée par une règle
     * responsive, ou que les quatre maquettes restent superposées à opacité 0.
     * Les récits parleraient alors de captures invisibles.
     *
     * ⚠️ ET IL A D'ABORD ÉTÉ ÉCRIT DE TRAVERS. Il comparait les BOÎTES de deux
     * écrans successifs pour prouver qu'ils changent — or les quatre écrans
     * vivent dans une pile CSS (`grid-area: 1/1`), donc toutes les cases font
     * la taille de la plus haute, par construction. Le banc mesurait 520×267
     * deux fois et criait « la scène ne change pas » sur une scène qui
     * changeait. On vise donc l'IDENTITÉ (`data-ecran`, dérivé du catalogue) et
     * la boîte de la MAQUETTE elle-même, pas celle de son conteneur.
     */
    await page.goto('/maya');
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

    const scene = page.locator('#en-images');
    await scene.scrollIntoViewIfNeeded();
    const { haut, hauteur, champ } = await scene.evaluate((el) => ({
      haut: el.getBoundingClientRect().top + window.scrollY,
      hauteur: el.getBoundingClientRect().height,
      champ: window.innerHeight,
    }));
    const course = hauteur - champ;

    const vus: string[] = [];
    for (const [i, part] of [0.05, 0.3, 0.55, 0.8].entries()) {
      await page.evaluate((y) => window.scrollTo(0, y), haut + course * part);
      await page.waitForTimeout(680);

      const actif = scene.locator('.ecran-actif');
      await expect(actif).toHaveCount(1);

      // L'identité, dérivée du catalogue : jamais une chaîne recopiée ici.
      await expect(actif).toHaveAttribute('data-ecran', ORDRE_ECRANS[i]!);
      vus.push(ORDRE_ECRANS[i]!);

      // Et la maquette elle-même est bien rendue — pas seulement son conteneur.
      const maquette = actif.locator('> *').first();
      const boite = await maquette.boundingBox();
      expect(boite, 'la maquette active n’a aucune boîte : la colonne est vide').not.toBeNull();
      expect(boite!.width, 'maquette trop étroite pour être une capture').toBeGreaterThan(200);
      expect(boite!.height, 'maquette trop plate pour être une capture').toBeGreaterThan(100);
    }

    // Quatre écrans DISTINCTS ont défilé : sans ça, une scène bloquée sur le
    // premier passerait tous les contrôles ci-dessus.
    expect(new Set(vus).size, `écrans vus : ${vus.join(', ')}`).toBe(4);
  });

  test('le dernier écran est atteint — la scène ne sature pas avant la fin', async ({ page }) => {
    await page.goto('/maya');
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

    const scene = page.locator('#en-images');
    await scene.scrollIntoViewIfNeeded();
    const { haut, hauteur, champ } = await scene.evaluate((el) => ({
      haut: el.getBoundingClientRect().top + window.scrollY,
      hauteur: el.getBoundingClientRect().height,
      champ: window.innerHeight,
    }));

    await page.evaluate((y) => window.scrollTo(0, y), haut + (hauteur - champ));
    await page.waitForTimeout(680);

    await expect(scene.locator('.temps-actif .titre')).toHaveText(TITRES[3]!);
    // Le compteur ne doit JAMAIS afficher un cinquième écran sur quatre.
    await expect(scene.locator('.compteur-actif')).toHaveText('4');
  });

  test('la page d’accueil mène ici, et n’y a plus les quatre écrans', async ({ page }) => {
    /**
     * Les deux moitiés du déménagement, vérifiées ensemble : la bande de
     * l'accueil pointe bien vers l'acte, ET l'accueil ne porte plus les quatre
     * maquettes. Garder les deux aurait fait deux copies des mêmes promesses
     * commerciales, ce que ce dépôt paie cher à chaque fois.
     */
    await page.goto('/');
    const renvoi = page.locator('a[href="/maya#en-images"]');
    await expect(renvoi).toHaveCount(1);

    // Le titre de l'écran « facture » ne doit plus exister sur l'accueil : il a
    // déménagé. (On vise un texte du catalogue, pas une chaîne recopiée.)
    await expect(page.getByText(ECRANS_APIGO.facturation.titre)).toHaveCount(0);
  });
});
